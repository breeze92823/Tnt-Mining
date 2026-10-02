import { forwardRef, useImperativeHandle, useRef } from 'react'

// Top-centre popup reporting the result of an interaction (systems/
// actionResult.js's showActionResult): green on success, red on failure. A
// black bar fading to transparent at both edges with the message on top. Pops
// in with a slight overshoot, holds, then shrinks out (hud.css
// `hud-action-result-pop`). Driven imperatively via `show(text, success)` on
// Hud.jsx's ~10Hz poll — never a per-frame re-render.
const ActionResult = forwardRef(function ActionResult(_props, ref) {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const textRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      show(text, success = true) {
        const root = rootRef.current
        const bar = barRef.current
        const label = textRef.current
        if (!root || !bar || !label) return
        label.textContent = text
        label.style.color = success ? '#4ade80' : '#f87171'
        root.style.display = ''
        // Restart the one-shot animation even if it's mid-run for a previous
        // message: clear it, force a reflow, then re-apply.
        bar.style.animation = 'none'
        void bar.offsetHeight
        bar.style.animation = ''
      },
    }),
    [],
  )

  return (
    <div ref={rootRef} className="hud-action-result" style={{ display: 'none' }}>
      <div
        ref={barRef}
        className="hud-action-result-bar"
        onAnimationEnd={() => {
          if (rootRef.current) rootRef.current.style.display = 'none'
        }}
      >
        <span ref={textRef} className="hud-action-result-text" />
      </div>
    </div>
  )
})

export default ActionResult
