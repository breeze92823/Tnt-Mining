import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { addClickPower, useGameStore } from '../store/useGameStore.js'
import { tntById } from '../data/tnts.js'
import { step as stepPlayer } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { step as stepMineCubes, mineFloorAt } from '../systems/mineCubes.js'
import { stepPickups } from '../systems/pickups.js'
import { step as stepInteract } from '../systems/interact.js'
import { spawnActionPopup, step as stepActionPopups } from '../systems/actionPopups.js'
import { player, playerScreen } from '../systems/playerState.js'
import { HUB_WALL, TARGETS } from '../data/world.js'
import { placeTrainingTnt, stepTrainingTnt } from '../systems/trainingTnt.js'
import { playFuse } from '../systems/sfx.js'
import { Vector3 } from 'three'
import { inputState } from '../systems/input.js'
import { reportLocal } from '../systems/net.js'

// A left click only adds blast power once per cooldown.
const CLICK_COOLDOWN_MS = 1000

// Standing within this distance (m) of an unlocked Training target starts training:
// once per interval: the same gain as a click, times the target's multiplier.
const TRAIN_RANGE = 3.6
const TRAIN_INTERVAL = 1
let trainTimer = 0
let training = null // the target being trained on: the player is held in place
let exited = null // target the player left with Space; no re-entry until they step out of its range

const inRange = (t) => Math.hypot(player.position.x - t.x, player.position.z - t.z) <= TRAIN_RANGE

// Runs before the player moves: enters training at an unlocked target, holds the
// player still while training, and leaves on Space (the jump is swallowed).
function updateTrainingLock() {
  const { rebirths } = useGameStore.getState()
  if (exited && !inRange(exited)) exited = null
  if (!training) {
    const near = TARGETS.find((t) => t !== exited && rebirths >= t.cost && inRange(t))
    if (!near) return
    training = near
    trainTimer = 0
  }
  if (inputState.jump) {
    inputState.jump = false
    exited = training
    training = null
    trainTimer = 0
    return
  }
  inputState.move.x = 0
  inputState.move.z = 0
  player.velocity.x = 0
  player.velocity.z = 0
}

function stepTraining(dt) {
  if (!training) return
  trainTimer += dt
  if (trainTimer < TRAIN_INTERVAL) return
  trainTimer -= TRAIN_INTERVAL
  const { tntEquipped } = useGameStore.getState()
  spawnActionPopup(addClickPower(tntById(tntEquipped).blast, parseFloat(training.mult)))
  placeTrainingTnt(tntEquipped, training.x, training.top, training.z)
  playFuse()
}

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame.
const _p = new Vector3()

export default function GameLoop() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  // Every left click / tap on the game view powers up the blast (store.clickPower).
  useEffect(() => {
    const el = gl.domElement
    let lastGain = -Infinity
    const onDown = (e) => {
      if (e.button !== 0) return
      if (player.position.z < HUB_WALL.z0) return // no click power in the Forest Mine
      const now = performance.now()
      if (now - lastGain < CLICK_COOLDOWN_MS) return
      lastGain = now
      const gain = addClickPower(tntById(useGameStore.getState().tntEquipped).blast)
      spawnActionPopup(gain)
    }
    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
  }, [gl])
  if (import.meta.env.DEV) {
    window.__scene = useThree((s) => s.scene)
  }

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1) // clamp huge frames (tab switch, breakpoint)
    updateTrainingLock()
    stepMineCubes() // before the player, so a refilled cube is already solid this frame
    stepPlayer(dt)
    stepPickups(dt, mineFloorAt) // after the player moved, so the magnet follows this frame's position
    stepActionPopups(dt)
    stepTraining(dt)
    stepTrainingTnt()
    stepInteract() // after the player moved, so range checks use this frame's position
    reportLocal(dt)
    inputState.interact = false // one-shot edge flag; a press nothing consumed must not linger
    updateCamera(camera, dt)
    _p.set(player.position.x, player.position.y + 1.1, player.position.z).project(camera)
    playerScreen.x = _p.x * 0.5 + 0.5
    playerScreen.y = 0.5 - _p.y * 0.5
  })

  return null
}
