// Blast-power gain popup tunables, ported from Laser-Escape's data/actionPopups.js.
// Every left-click gain spawns one: the public/ui/action_popup.png badge with a
// "+N" readout near the player. It springs in with an elastic pop, then sweeps
// up to the top-centre of the screen and fades. Simulated by
// systems/actionPopups.js, drawn by components/hud/ActionPopups.jsx.

export const ACTION_POPUP_POOL_SIZE = 14
// Seconds from spawn to fully gone.
export const ACTION_POPUP_LIFETIME = 0.95
export const ACTION_POPUP_FADE_IN = 0.09

// Pop-in: fraction of the lifetime spent springing up from POP_SCALE_FROM with an
// elastic overshoot, hopping HOP (NDC units) upward before it sweeps away.
export const ACTION_POPUP_POP_T = 0.24
export const ACTION_POPUP_POP_SCALE_FROM = 0.25
export const ACTION_POPUP_POP_OVERSHOOT = 2.4
export const ACTION_POPUP_HOP = 0.05
// Normalized lifetime point at which the badge starts fading out.
export const ACTION_POPUP_FADE_OUT_START = 0.55

// Random scatter at spawn, in NDC units (the viewport spans 2 x 2).
export const ACTION_POPUP_SPREAD_X = 0.16
export const ACTION_POPUP_SPREAD_Y = 0.12

// Sweep target: NDC Y it lands on (1 = top edge) and the fraction of the
// horizontal gap to screen centre it closes.
export const ACTION_POPUP_TARGET_Y = 0.88
export const ACTION_POPUP_CENTER_PULL = 1

// Badge width (CSS px, height auto) and "+N" font size (CSS px).
export const ACTION_POPUP_IMAGE_SIZE = 120
export const ACTION_POPUP_FONT_SIZE = 40

export const ACTION_POPUP_IMAGE_URL = '/ui/action_popup.png'
