// UI sound effects for the E interaction, all synthesized (no asset files):
// each is rendered once via OfflineAudioContext, cached as a buffer, then
// played through audio.js's master bus so the portal's master volume applies.
import { unlock, getMasterBus } from './audio.js'
import {
  CONFIRM_POP_GAIN,
  CONFIRM_POP_SYNTH_NOTES_HZ,
  CONFIRM_POP_SYNTH_NOTE_GAP_S,
  CONFIRM_POP_SYNTH_ATTACK_S,
  CONFIRM_POP_SYNTH_DECAY_S,
  BUTTON_CLICK_GAIN,
  BUTTON_CLICK_SYNTH_FREQ_HZ,
  BUTTON_CLICK_SYNTH_ATTACK_S,
  BUTTON_CLICK_SYNTH_DECAY_S,
  BUTTON_CLICK_SYNTH_NOISE_GAIN,
  BUTTON_CLICK_SYNTH_NOISE_DECAY_S,
  ACTION_FAIL_GAIN,
  ACTION_FAIL_SYNTH_NOTES_HZ,
  ACTION_FAIL_SYNTH_NOTE_GAP_S,
  ACTION_FAIL_SYNTH_ATTACK_S,
  ACTION_FAIL_SYNTH_DECAY_S,
} from '../data/interact.js'

const cache = new Map() // name -> Promise<AudioBuffer>

function cached(name, ctx, render) {
  if (!cache.has(name)) cache.set(name, render(ctx))
  return cache.get(name)
}

// Fire-and-forget: a fresh source node per call so overlapping plays never
// fight each other. Never throws — a failed render just stays silent.
function play(name, render, level) {
  const ctx = unlock()
  if (!ctx) return
  cached(name, ctx, render)
    .then((buffer) => {
      if (!buffer) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.value = level
      source.connect(gain)
      gain.connect(getMasterBus())
      source.start(0)
    })
    .catch(() => cache.delete(name))
}

// A run of enveloped notes (attack/decay), one oscillator per note.
function renderNotes(ctx, { notes, gap, attack, decay, type, peak }) {
  const totalS = gap * (notes.length - 1) + attack + decay + 0.05
  const rate = ctx.sampleRate
  const offline = new OfflineAudioContext(1, Math.ceil(totalS * rate), rate)
  notes.forEach((freq, i) => {
    const start = i * gap
    const top = start + attack
    const end = top + decay
    const osc = offline.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const gain = offline.createGain()
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, top)
    gain.gain.exponentialRampToValueAtTime(0.001, end)
    osc.connect(gain)
    gain.connect(offline.destination)
    osc.start(start)
    osc.stop(end + 0.05)
  })
  return offline.startRendering()
}

const renderConfirmPop = (ctx) =>
  renderNotes(ctx, {
    notes: CONFIRM_POP_SYNTH_NOTES_HZ,
    gap: CONFIRM_POP_SYNTH_NOTE_GAP_S,
    attack: CONFIRM_POP_SYNTH_ATTACK_S,
    decay: CONFIRM_POP_SYNTH_DECAY_S,
    type: 'triangle',
    peak: 0.9,
  })

const renderActionFail = (ctx) =>
  renderNotes(ctx, {
    notes: ACTION_FAIL_SYNTH_NOTES_HZ,
    gap: ACTION_FAIL_SYNTH_NOTE_GAP_S,
    attack: ACTION_FAIL_SYNTH_ATTACK_S,
    decay: ACTION_FAIL_SYNTH_DECAY_S,
    type: 'square',
    peak: 0.7,
  })

// Quick high sine tick layered with a short bandpass noise burst.
function renderButtonClick(ctx) {
  const toneEnd = BUTTON_CLICK_SYNTH_ATTACK_S + BUTTON_CLICK_SYNTH_DECAY_S
  const totalS = Math.max(toneEnd, BUTTON_CLICK_SYNTH_NOISE_DECAY_S) + 0.02
  const rate = ctx.sampleRate
  const offline = new OfflineAudioContext(1, Math.ceil(totalS * rate), rate)

  const osc = offline.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = BUTTON_CLICK_SYNTH_FREQ_HZ
  const toneGain = offline.createGain()
  toneGain.gain.setValueAtTime(0, 0)
  toneGain.gain.linearRampToValueAtTime(1, BUTTON_CLICK_SYNTH_ATTACK_S)
  toneGain.gain.exponentialRampToValueAtTime(0.001, toneEnd)

  const noiseLength = Math.ceil(BUTTON_CLICK_SYNTH_NOISE_DECAY_S * rate)
  const noiseBuffer = offline.createBuffer(1, noiseLength, rate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noiseLength; i++) data[i] = Math.random() * 2 - 1
  const noise = offline.createBufferSource()
  noise.buffer = noiseBuffer
  const filter = offline.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = BUTTON_CLICK_SYNTH_FREQ_HZ * 3
  filter.Q.value = 1.5
  const noiseGain = offline.createGain()
  noiseGain.gain.setValueAtTime(BUTTON_CLICK_SYNTH_NOISE_GAIN, 0)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, BUTTON_CLICK_SYNTH_NOISE_DECAY_S)

  osc.connect(toneGain)
  toneGain.connect(offline.destination)
  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(offline.destination)
  osc.start(0)
  osc.stop(toneEnd + 0.02)
  noise.start(0)
  return offline.startRendering()
}

// Low-passed noise burst with a falling thump underneath: the TNT blast.
function renderExplosion(ctx) {
  const totalS = 1.6
  const rate = ctx.sampleRate
  const offline = new OfflineAudioContext(1, Math.ceil(totalS * rate), rate)
  const n = Math.ceil(totalS * rate)
  const nb = offline.createBuffer(1, n, rate)
  const d = nb.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const noise = offline.createBufferSource()
  noise.buffer = nb
  const lp = offline.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(3500, 0)
  lp.frequency.exponentialRampToValueAtTime(120, totalS)
  const ng = offline.createGain()
  ng.gain.setValueAtTime(1, 0)
  ng.gain.exponentialRampToValueAtTime(0.001, totalS)
  noise.connect(lp)
  lp.connect(ng)
  ng.connect(offline.destination)
  noise.start(0)
  const osc = offline.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(110, 0)
  osc.frequency.exponentialRampToValueAtTime(30, 0.5)
  const og = offline.createGain()
  og.gain.setValueAtTime(1, 0)
  og.gain.exponentialRampToValueAtTime(0.001, 0.7)
  osc.connect(og)
  og.connect(offline.destination)
  osc.start(0)
  osc.stop(0.75)
  return offline.startRendering()
}

// Short highpassed hiss: a fuse catching.
function renderFuse(ctx) {
  const totalS = 0.5
  const rate = ctx.sampleRate
  const offline = new OfflineAudioContext(1, Math.ceil(totalS * rate), rate)
  const n = Math.ceil(totalS * rate)
  const nb = offline.createBuffer(1, n, rate)
  const d = nb.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const noise = offline.createBufferSource()
  noise.buffer = nb
  const hp = offline.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000
  const g = offline.createGain()
  g.gain.setValueAtTime(0.6, 0)
  g.gain.exponentialRampToValueAtTime(0.001, totalS)
  noise.connect(hp)
  hp.connect(g)
  g.connect(offline.destination)
  noise.start(0)
  return offline.startRendering()
}

// Pre-renders every buffer so the first play doesn't wait. Safe to call at
// boot, before any gesture (only producing sound needs one).
export function preload() {
  const ctx = unlock()
  if (!ctx) return
  cached('confirm', ctx, renderConfirmPop)
  cached('click', ctx, renderButtonClick)
  cached('fail', ctx, renderActionFail)
  cached('boom', ctx, renderExplosion)
  cached('fuse', ctx, renderFuse)
}

export const playExplosion = () => play('boom', renderExplosion, 0.9)
export const playFuse = () => play('fuse', renderFuse, 0.5)

// "The hold actually did something" — played by interact.js on every confirmed hold.
export const playConfirmPop = () => play('confirm', renderConfirmPop, CONFIRM_POP_GAIN)
// Any HUD button press — call first in the onClick handler.
export const playButtonClick = () => play('click', renderButtonClick, BUTTON_CLICK_GAIN)
// A blocked action — played by showActionResult(text, false).
export const playActionFail = () => play('fail', renderActionFail, ACTION_FAIL_GAIN)
