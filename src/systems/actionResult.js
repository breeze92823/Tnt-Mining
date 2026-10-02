import { playActionFail } from './sfx.js'

// Trigger for the top-center ActionResult popup (components/hud/ActionResult.jsx)
// — a framework-free singleton, since calls come from systems code far outside
// React. `id` increments on every call so Hud.jsx's poll can detect a fresh
// trigger even when back-to-back messages share the same text.
export const actionResultState = {
  text: '',
  success: true,
  id: 0,
}

// success=false also plays the failure buzz.
export function showActionResult(text, success = true) {
  actionResultState.text = text
  actionResultState.success = success
  actionResultState.id++
  if (!success) playActionFail()
}
