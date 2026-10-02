// "Press E" interaction tunables (ported from Laser-Escape; see Interact.md).

export const INTERACT_KEY = 'KeyE'

// How long E must be held to confirm an interaction. A zone can override it
// with its own `holdMs` (0 = fires on the first frame E is down).
export const HOLD_MS = 2000

// Metres: default trigger radius for proximityZone().
export const DEFAULT_RANGE = 3

// Sound tunables (systems/sfx.js). 0..1, multiplied on top of the master bus.
export const CONFIRM_POP_GAIN = 0.135 // the "hold completed" pop
export const BUTTON_CLICK_GAIN = 0.075
export const ACTION_FAIL_GAIN = 0.14

// Synthesized UI sounds, rendered once via OfflineAudioContext (no asset files).
// Confirm pop: a quick rising two-note blip (pitched high so it cuts through).
export const CONFIRM_POP_SYNTH_NOTES_HZ = [1400, 2100]
export const CONFIRM_POP_SYNTH_NOTE_GAP_S = 0.045
export const CONFIRM_POP_SYNTH_ATTACK_S = 0.004
export const CONFIRM_POP_SYNTH_DECAY_S = 0.12

// Button click: high sine tick plus a short bandpass noise burst.
export const BUTTON_CLICK_SYNTH_FREQ_HZ = 1050
export const BUTTON_CLICK_SYNTH_ATTACK_S = 0.002
export const BUTTON_CLICK_SYNTH_DECAY_S = 0.045
export const BUTTON_CLICK_SYNTH_NOISE_GAIN = 0.22
export const BUTTON_CLICK_SYNTH_NOISE_DECAY_S = 0.02

// Action failed: two short descending square-wave notes (A3 -> E3).
export const ACTION_FAIL_SYNTH_NOTES_HZ = [220, 164.81]
export const ACTION_FAIL_SYNTH_NOTE_GAP_S = 0.09
export const ACTION_FAIL_SYNTH_ATTACK_S = 0.004
export const ACTION_FAIL_SYNTH_DECAY_S = 0.16
