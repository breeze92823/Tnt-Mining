import { inputState } from './input.js'
import { player } from './playerState.js'
import { safeDistance } from './cameraCollision.js'
import { shakeOffset, step as stepShake } from './cameraShake.js'

// Third-person follow with right-drag orbit + wheel zoom. Position and
// look-at ease at different rates so the rig reads as a follow cam rather
// than a rigid mount.
const START_PITCH = 0.32 // radians above the horizon
const state = {
  yaw: 0, // radians; 0 puts the camera on +Z looking toward -Z
  pitch: START_PITCH,
  distance: 13,
}

const MIN_PITCH = -0.1
const MAX_PITCH = 1.2
const MIN_DIST = 3
const MAX_DIST = 60
const LIFT_STEP = 0.1 // radians tried per step when the boom is blocked
const MAX_LIFT_PITCH = 1.5
const ORBIT_SENS = 0.005
const ZOOM_SENS = 0.01
const POSITION_SMOOTHING = 12
const LOOK_SMOOTHING = 20
// A same-frame jump bigger than this is a teleport (a respawn): snap.
const TELEPORT_DISTANCE = 15

// Driven by the Bloxity `camera_sensitivity` setting (0.1-5.0, default 1).
let sensitivity = 1
export function setCameraSensitivity(value) {
  sensitivity = value
}

const target = { x: 0, y: 0, z: 0 }
const lookAt = { x: 0, y: 0, z: 0 }
const lastPlayerPos = { x: 0, y: 0, z: 0 }
let initialised = false

export function getYaw() {
  return state.yaw
}

// Snaps the orbit to sit directly behind the player, e.g. right after spawn.
export function syncYawToPlayer() {
  state.yaw = player.facing + Math.PI
}

// Points the orbit directly (radians / metres); used by the dev console hook.
export function setView({ yaw = state.yaw, pitch = state.pitch, distance = state.distance }) {
  state.yaw = yaw
  state.pitch = pitch
  state.distance = distance
}

// Shake offset added on top of the follow pose last frame; taken off again
// before smoothing so the shake never feeds back into the follow.
const applied = { x: 0, y: 0, z: 0 }

export function update(camera, dt) {
  camera.position.x -= applied.x
  camera.position.y -= applied.y
  camera.position.z -= applied.z
  state.yaw -= inputState.look.dx * ORBIT_SENS * sensitivity
  state.pitch += inputState.look.dy * ORBIT_SENS * sensitivity
  inputState.look.dx = 0
  inputState.look.dy = 0
  state.pitch = Math.min(Math.max(state.pitch, MIN_PITCH), MAX_PITCH)

  state.distance += inputState.zoom * ZOOM_SENS
  inputState.zoom = 0
  state.distance = Math.min(Math.max(state.distance, MIN_DIST), MAX_DIST)

  const jump = Math.hypot(
    player.position.x - lastPlayerPos.x,
    player.position.y - lastPlayerPos.y,
    player.position.z - lastPlayerPos.z,
  )
  const teleported = initialised && jump > TELEPORT_DISTANCE
  lastPlayerPos.x = player.position.x
  lastPlayerPos.y = player.position.y
  lastPlayerPos.z = player.position.z
  if (teleported) {
    state.yaw = player.facing + Math.PI
    state.pitch = START_PITCH
  }

  target.x = player.position.x
  target.y = player.position.y + player.dims.height * 0.6
  target.z = player.position.z

  // If the boom would end up in the ground (e.g. the walls of a dug pit),
  // tilt it upward until it clears at full length rather than collapsing onto
  // the player; shorten it only when even the steepest tilt is blocked.
  let pitch = state.pitch
  let cp = Math.cos(pitch)
  let dirX = Math.sin(state.yaw) * cp
  let dirY = Math.sin(pitch)
  let dirZ = Math.cos(state.yaw) * cp
  let boom = safeDistance(target, dirX, dirY, dirZ, state.distance)
  if (boom < state.distance) {
    let bestBoom = boom
    let bestPitch = pitch
    for (let p = pitch + LIFT_STEP; p <= MAX_LIFT_PITCH + 1e-6; p += LIFT_STEP) {
      const c = Math.cos(p)
      const x = Math.sin(state.yaw) * c
      const y = Math.sin(p)
      const z = Math.cos(state.yaw) * c
      const b = safeDistance(target, x, y, z, state.distance)
      if (b > bestBoom) {
        bestBoom = b
        bestPitch = p
        if (b >= state.distance) break
      }
    }
    pitch = bestPitch
    boom = bestBoom
    cp = Math.cos(pitch)
    dirX = Math.sin(state.yaw) * cp
    dirY = Math.sin(pitch)
    dirZ = Math.cos(state.yaw) * cp
  }
  const desiredX = target.x + dirX * boom
  const desiredY = target.y + dirY * boom
  const desiredZ = target.z + dirZ * boom

  if (!initialised || teleported) {
    camera.position.set(desiredX, desiredY, desiredZ)
    lookAt.x = target.x
    lookAt.y = target.y
    lookAt.z = target.z
    initialised = true
  } else {
    const tPos = dt > 0 ? 1 - Math.exp(-POSITION_SMOOTHING * dt) : 1
    camera.position.x += (desiredX - camera.position.x) * tPos
    camera.position.y += (desiredY - camera.position.y) * tPos
    camera.position.z += (desiredZ - camera.position.z) * tPos

    const tLook = dt > 0 ? 1 - Math.exp(-LOOK_SMOOTHING * dt) : 1
    lookAt.x += (target.x - lookAt.x) * tLook
    lookAt.y += (target.y - lookAt.y) * tLook
    lookAt.z += (target.z - lookAt.z) * tLook
  }

  camera.lookAt(lookAt.x, lookAt.y, lookAt.z)

  stepShake(dt)
  applied.x = shakeOffset.x
  applied.y = shakeOffset.y
  applied.z = shakeOffset.z
  camera.position.x += applied.x
  camera.position.y += applied.y
  camera.position.z += applied.z
  camera.rotateX(shakeOffset.pitch)
  camera.rotateY(shakeOffset.yaw)
  camera.rotateZ(shakeOffset.roll)
}
