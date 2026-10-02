import { useFrame, useThree } from '@react-three/fiber'
import { step as stepPlayer } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { step as stepMineCubes } from '../systems/mineCubes.js'
import { step as stepInteract } from '../systems/interact.js'
import { inputState } from '../systems/input.js'

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame.
export default function GameLoop() {
  const camera = useThree((s) => s.camera)
  if (import.meta.env.DEV) {
    window.__scene = useThree((s) => s.scene)
  }

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1) // clamp huge frames (tab switch, breakpoint)
    stepMineCubes() // before the player, so a refilled cube is already solid this frame
    stepPlayer(dt)
    stepInteract() // after the player moved, so range checks use this frame's position
    inputState.interact = false // one-shot edge flag; a press nothing consumed must not linger
    updateCamera(camera, dt)
  })

  return null
}
