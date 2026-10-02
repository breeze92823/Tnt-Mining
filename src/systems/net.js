// Progress saving and leaderboards. Framework-free (no React import) — the ONLY module that
// talks to the Colyseus server (../Tnt-Mining-backend's LobbyRoom). Like systems/bloxity.js,
// every path through here is built so a slow, asleep or absent server leaves the game fully
// playable solo: nothing blocks gameplay and the scene never waits on a socket.
//
// Sends the live stats the boards rank (`stats`) and, for a signed-in player, the durable
// save (`saveProgress`); restores it from `progress` on join; and exposes the `leaderboard`
// push that components/world/Leaderboards.jsx renders.
import {
  subscribeAuth,
  authState,
  getStableUserId,
  getDisplayName,
  getEquippedAvatar,
  getProportions,
  onAvatarChanged,
} from './bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { player } from './playerState.js'
import { useGameStore, blastPower, progressSnapshot, hydrateProgress, setProgressKnown } from '../store/useGameStore.js'
import {
  SERVER_URL,
  ROOM_NAME,
  JOIN_TIMEOUT_MS,
  MOVE_SEND_INTERVAL_MS,
  RETRY_BACKOFF_MS,
  STATS_RESEND_DEBOUNCE_MS,
  PROGRESS_RESEND_DEBOUNCE_MS,
  PROGRESS_KNOWN_TIMEOUT_MS,
  USERNAME_WAIT_MS,
} from '../data/net.js'

// --- Public state -----------------------------------------------------------
//   'idle'       — not started / torn down / no server configured
//   'connecting' — a join attempt is in flight
//   'solo'       — between retry attempts; playing single-player right now
//   'online'     — attached to a room
export const netState = { status: 'idle', error: null }

function setStatus(status) {
  netState.status = status
}

// --- Leaderboards -----------------------------------------------------------
// Server push: { damage|rebirths|money: [{ id, name, value }] }, best first. `id` equals our
// sessionId on our own row, so a board can highlight it.
let lastLeaderboard = null
const leaderboardListeners = new Set()

// Replays the latest payload immediately if one has already arrived.
export function subscribeLeaderboard(fn) {
  leaderboardListeners.add(fn)
  if (lastLeaderboard) fn(lastLeaderboard, selfId)
  return () => leaderboardListeners.delete(fn)
}

// --- Remote players ---------------------------------------------------------
// sessionId -> the OTHER player's live PlayerState schema instance. Colyseus patches its fields
// in place, so a consumer reads e.g. `p.x` every frame; only add/remove needs a callback.
const remotePlayers = new Map()
const rosterListeners = new Set()

function notifyRoster(kind, sessionId, p) {
  for (const l of rosterListeners) {
    try {
      l[kind](sessionId, p)
    } catch {
      // A broken subscriber must not wedge the netcode.
    }
  }
}

// Replays the current roster immediately, so a component mounting after we're already online
// doesn't miss whoever is already here.
export function subscribeRoster(onAdd, onRemove) {
  const entry = { onAdd, onRemove }
  rosterListeners.add(entry)
  for (const [sessionId, p] of remotePlayers) onAdd(sessionId, p)
  return () => rosterListeners.delete(entry)
}

function clearRemotePlayers() {
  for (const sessionId of remotePlayers.keys()) notifyRoster('onRemove', sessionId)
  remotePlayers.clear()
}

// --- Avatar + position relay ------------------------------------------------
// Same recipe components/Player.jsx renders the LOCAL player from: the base character dressed
// with the signed-in player's equipped hat/back and proportions. Sent as an opaque JSON string
// the server never parses, so components/RemotePlayers.jsx can rebuild an identical look.
function avatarPayload() {
  return {
    equipped: authState.user && !DEV_MODE ? getEquippedAvatar() : null,
    proportions: getProportions(),
  }
}

let lastSentAvatar = ''

function sendAvatarNow() {
  if (!room) return
  const payload = JSON.stringify(avatarPayload())
  if (payload === lastSentAvatar) return
  lastSentAvatar = payload
  send('setAvatar', { avatar: payload })
}

// Local position/facing/gait, throttled out over `move`. Called every frame from
// components/GameLoop.jsx. A no-op while offline.
let moveAccumMs = 0
let lastSentMove = null
const MOVE_EPS = 0.01

export function reportLocal(delta) {
  if (!room) return
  moveAccumMs += delta * 1000
  if (moveAccumMs < MOVE_SEND_INTERVAL_MS) return
  moveAccumMs = 0

  const gs = useGameStore.getState()
  const next = {
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    yaw: player.facing,
    moveBlend: Math.min(1, Math.hypot(player.velocity.x, player.velocity.z) / player.moveSpeed),
    grounded: player.grounded,
    bending: player.bending,
    slot: gs.slot == null ? -1 : gs.slot,
    tnt: gs.tntEquipped,
  }
  const last = lastSentMove
  if (
    last &&
    Math.abs(next.x - last.x) < MOVE_EPS &&
    Math.abs(next.y - last.y) < MOVE_EPS &&
    Math.abs(next.z - last.z) < MOVE_EPS &&
    Math.abs(next.yaw - last.yaw) < MOVE_EPS &&
    Math.abs(next.moveBlend - last.moveBlend) < MOVE_EPS &&
    next.grounded === last.grounded &&
    next.bending === last.bending &&
    next.slot === last.slot &&
    next.tnt === last.tnt
  ) {
    return
  }
  lastSentMove = next
  send('move', next)
}

// --- Connection state -------------------------------------------------------
let sdkModule = null
let client = null
let room = null
let selfId = ''
let started = false
let stopped = true
let connecting = false
let attempt = 0
let retryTimer = 0

async function loadSdk() {
  if (!sdkModule) sdkModule = await import('@colyseus/sdk')
  return sdkModule
}

function send(type, payload) {
  if (!room) return
  try {
    room.send(type, payload)
  } catch {
    // Socket mid-close — the next attach re-seeds everything anyway.
  }
}

// --- Stats + progress -------------------------------------------------------
function sendStatsNow() {
  const s = useGameStore.getState()
  send('stats', { money: s.money, damage: blastPower(s), rebirths: s.rebirths })
}

// The ROOM decides whether this session may persist (its userIds map), so a save sent just
// after a logout lands as a harmless no-op there.
function sendProgressNow() {
  send('saveProgress', progressSnapshot())
}

// Whether the saved doc for the CURRENT identity has been dealt with (applied, or the server
// said there is none). Saves wait on it, or the starting values would overwrite a returning
// player's save. Unlike a timeout this can't lose data: with no answer from the server there
// is simply nothing saved.
let progressLoaded = false
// Applied at most once per IDENTITY: the first `progress` under the current sign-in is the
// real load. A later reattach under the SAME identity would otherwise clobber what the player
// did locally during a blip.
let hydratedFromServer = false

function applyProgress(d) {
  if (hydratedFromServer) return
  hydratedFromServer = true
  progressLoaded = true
  try {
    hydrateProgress(d) // also settles the tutorial step; a playtime-only doc keeps the local values
  } catch (err) {
    console.warn('[net] could not apply saved progress', err)
    setProgressKnown()
  }
  lastProgSnap = JSON.stringify(progressSnapshot()) // what we just loaded isn't a change to save
  lastSnap = ''
  scheduleStats()
}

let statsTimer = 0
let progressTimer = 0
let lastSnap = ''
let lastProgSnap = ''

function scheduleStats() {
  if (statsTimer) return
  statsTimer = setTimeout(() => {
    statsTimer = 0
    sendStatsNow()
  }, STATS_RESEND_DEBOUNCE_MS)
}

// The store changes on far more than it saves (selection, panels), so compare snapshots and
// only send real changes.
function onStateChange() {
  const s = useGameStore.getState()
  const snap = `${s.money}|${blastPower(s)}|${s.rebirths}`
  if (snap !== lastSnap) {
    lastSnap = snap
    scheduleStats()
  }
  if (!getStableUserId() || !progressLoaded || progressTimer) return
  const prog = JSON.stringify(progressSnapshot())
  if (prog === lastProgSnap) return
  lastProgSnap = prog
  progressTimer = setTimeout(() => {
    progressTimer = 0
    sendProgressNow()
  }, PROGRESS_RESEND_DEBOUNCE_MS)
}

// --- Identity sync (login/logout mid-session) -------------------------------
// Join options only carry what was true the instant the socket opened; Bloxity auth routinely
// settles later or changes without a reload.
let lastIdentity = { userId: '', username: '' }

function sendIdentityNow() {
  if (!room) return
  const userId = getStableUserId()
  const username = getDisplayName()
  if (userId === lastIdentity.userId && username === lastIdentity.username) return
  // Flush this session's progress under the OLD id before the room forgets it.
  if (lastIdentity.userId && lastIdentity.userId !== userId && progressLoaded) sendProgressNow()
  // A freshly-signed-in id gets its saved doc hydrated, like a brand-new join.
  if (userId !== lastIdentity.userId) {
    hydratedFromServer = false
    progressLoaded = false
  }
  lastIdentity = { userId, username }
  send('identify', { userId, username })
}

function waitForAuth(ms) {
  if (authState.ready) return Promise.resolve()
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      off()
      resolve()
    }
    const off = subscribeAuth((s) => {
      if (s.ready) finish()
    })
    const t = setTimeout(finish, ms)
  })
}

function withTimeout(promise, ms, label) {
  let t
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(label)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

// --- Connect / attach / retry ---------------------------------------------
async function connect() {
  if (stopped || connecting || room) return
  connecting = true
  clearTimeout(retryTimer)
  retryTimer = 0
  setStatus('connecting')

  try {
    const mod = await loadSdk()
    if (stopped) return
    if (!client) client = new mod.Client(SERVER_URL)

    const joined = await withTimeout(
      client.joinOrCreate(ROOM_NAME, {
        username: getDisplayName(),
        userId: getStableUserId(), // '' for a guest
        avatar: JSON.stringify(avatarPayload()),
      }),
      JOIN_TIMEOUT_MS,
      'join timed out',
    )

    if (stopped) {
      try {
        joined.leave()
      } catch {
        /* nothing to clean up */
      }
      return
    }
    attachRoom(joined)
  } catch (err) {
    connecting = false
    attempt += 1
    netState.error = String((err && err.message) || err)
    if (!stopped) scheduleRetry()
  }
}

function scheduleRetry() {
  if (stopped || room || retryTimer) return
  setStatus('solo')
  const i = Math.min(Math.max(attempt - 1, 0), RETRY_BACKOFF_MS.length - 1)
  retryTimer = setTimeout(() => {
    retryTimer = 0
    connect()
  }, RETRY_BACKOFF_MS[i])
}

function attachRoom(joined) {
  room = joined
  connecting = false
  attempt = 0
  selfId = joined.sessionId
  netState.error = null

  room.onLeave(() => handleLeave())
  room.onError((code, message) => {
    netState.error = message || `error ${code}`
  })
  // The saved doc for our Bloxity user id, sent once right after join.
  room.onMessage('progress', applyProgress)
  // A brand-new account has no save: keep the local values and start saving them.
  room.onMessage('noProgress', () => {
    progressLoaded = true
    hydratedFromServer = true
    setProgressKnown() // a brand-new account: the tutorial starts now
    onStateChange()
  })
  room.onMessage('leaderboard', (data) => {
    lastLeaderboard = data || {}
    for (const fn of leaderboardListeners) {
      try {
        fn(lastLeaderboard, selfId)
      } catch {
        // A broken subscriber must not wedge the netcode.
      }
    }
  })

  // Called unconditionally: room.state can still be an empty shell right after joinOrCreate()
  // resolves, and getStateCallbacks() defers registration until the `players` map arrives.
  const $ = sdkModule.getStateCallbacks(room)
  $(room.state).players.onAdd((p, sessionId) => {
    if (sessionId === selfId) return
    remotePlayers.set(sessionId, p)
    notifyRoster('onAdd', sessionId, p)
  })
  $(room.state).players.onRemove((_p, sessionId) => {
    if (sessionId === selfId) return
    remotePlayers.delete(sessionId)
    notifyRoster('onRemove', sessionId)
  })

  // A fresh session starts every server field at its default, so re-state ours right away
  // instead of waiting for the next change.
  sendStatsNow()
  lastSentAvatar = ''
  sendAvatarNow()
  lastSentMove = null
  moveAccumMs = MOVE_SEND_INTERVAL_MS // send on the very next reportLocal()
  lastIdentity = { userId: getStableUserId(), username: getDisplayName() }
  setStatus('online')
}

function handleLeave() {
  clearRemotePlayers()
  room = null
  selfId = ''
  connecting = false
  if (stopped) return
  attempt = 0
  scheduleRetry()
}

// --- Lifecycle --------------------------------------------------------------
let offs = []

export function init() {
  if (started) return
  started = true
  stopped = false
  // Ceiling on the new-vs-returning signal, so a slow join or save lookup never stalls a new
  // player's tutorial for good (a late `progress` still applies, see hydrateProgress).
  setTimeout(setProgressKnown, PROGRESS_KNOWN_TIMEOUT_MS)
  // No server configured for this build: stay 'idle' forever, with no save to wait for. Every
  // export below already no-ops without a room.
  if (!SERVER_URL) {
    setProgressKnown()
    return
  }

  lastProgSnap = JSON.stringify(progressSnapshot())
  offs = [
    useGameStore.subscribe(onStateChange),
    // subscribeAuth also fires on friends/balance loads; sendIdentityNow()'s own diff check
    // filters those out.
    subscribeAuth(() => {
      sendIdentityNow()
      sendAvatarNow() // signing in/out flips avatarPayload()'s equipped gate
    }),
    onAvatarChanged(() => sendAvatarNow()),
  ]
  waitForAuth(USERNAME_WAIT_MS).then(() => {
    // A guest has no save to wait for: no need to ride out the full timeout.
    if (!getStableUserId()) setProgressKnown()
    if (!stopped) connect()
  })
}

// Best-effort save for a closing tab (room.send is fire-and-forget), so the debounce window
// doesn't lose the last few seconds.
export function flushProgress() {
  if (getStableUserId() && progressLoaded) sendProgressNow()
}

export function teardown() {
  stopped = true
  started = false
  clearTimeout(retryTimer)
  clearTimeout(statsTimer)
  clearTimeout(progressTimer)
  retryTimer = statsTimer = progressTimer = 0
  for (const off of offs) off?.()
  offs = []
  // Final best-effort save, but never before the saved doc has loaded, or the starting values
  // would overwrite it.
  flushProgress()
  if (room) {
    try {
      // Don't let the SDK reconnect a socket we are deliberately closing.
      if (room.reconnection) room.reconnection.enabled = false
      room.leave()
    } catch {
      /* page is going away */
    }
  }
  clearRemotePlayers()
  room = null
  connecting = false
  setStatus('idle')
}
