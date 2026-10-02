import { forwardRef, useImperativeHandle, useRef } from 'react'

// Circumference of the hold-progress ring's r=15 circle — the SVG's
// stroke-dasharray/dashoffset unit. Empty at full offset, full ring at 0.
const RING_RADIUS = 15
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

// The "Press E to ..." card: a translucent pill with a square E keycap ringed
// by the shared hold-to-confirm progress (systems/interactHold.js). While E is
// held (progress > 0) the pill strips down to just the enlarged ring + keycap;
// releasing early snaps it back. Written imperatively through a ref on Hud.jsx's
// ~10Hz poll, so it never re-renders per frame.
//
//   setText(label)        label string shows the card, null hides it
//   setHoldProgress(0..1) drives the ring
const InteractPrompt = forwardRef(function InteractPrompt(_props, ref) {
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const textRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      setText(label) {
        const root = rootRef.current
        if (!root) return
        if (!label) {
          root.style.display = 'none'
          return
        }
        textRef.current.textContent = label
        root.style.display = ''
      },
      setHoldProgress(fraction) {
        const root = rootRef.current
        const ring = ringRef.current
        if (!root || !ring) return
        const clamped = Math.max(0, Math.min(1, fraction || 0))
        ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamped))
        root.classList.toggle('is-held', clamped > 0)
      },
    }),
    [],
  )

  return (
    <div ref={rootRef} className="hud-interact" style={{ display: 'none' }}>
      <span className="hud-interact-key">
        <svg viewBox="0 0 36 36" className="hud-interact-ring">
          <circle cx="18" cy="18" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
          <circle
            ref={ringRef}
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: RING_CIRCUMFERENCE,
              transition: 'stroke-dashoffset 120ms linear',
            }}
          />
        </svg>
        <span className="hud-interact-cap">E</span>
      </span>
      <span ref={textRef} className="hud-interact-text" />
    </div>
  )
})

export default InteractPrompt
