import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore.js'
import { TUTORIAL_DONE_STEP } from '../../data/tutorial.js'
import { GATE } from '../../data/world.js'
import { ORES } from '../../data/ores.js'
import { litTnt, placedTnt } from '../../systems/mineCubes.js'
import { player } from '../../systems/playerState.js'
import { touchState } from '../../systems/input.js'

const oreTotal = (s) => ORES.reduce((sum, o) => sum + s[o.item], 0)

// Top-of-screen tutorial banner. Advances the step from game state (it only ever moves forward)
// and, once complete, lingers 6 s, pops out and unmounts. The mine's state is framework-free, so
// it is polled (~10 Hz) rather than subscribed to.
export default function TutorialBanner() {
  const step = useGameStore((s) => s.tutorialStep)
  const progressKnown = useGameStore((s) => s.progressKnown)
  const resumedDone = useGameStore((s) => s.tutorialResumedDone)
  const [phase, setPhase] = useState('show') // 'show' | 'leaving' | 'gone'

  useEffect(() => {
    if (!progressKnown || resumedDone) return undefined // the saved step may still be on its way
    const advance = () => {
      const s = useGameStore.getState()
      const to = (n) => useGameStore.setState({ tutorialStep: n })
      switch (s.tutorialStep) {
        case 0:
          if (player.position.z < GATE.z - 1) to(1)
          break
        case 1:
          if (placedTnt().size > 0 || litTnt().size > 0) to(2)
          break
        case 2:
          if (litTnt().size > 0 || oreTotal(s) > 0) to(3)
          break
        case 3:
          if (oreTotal(s) > 0) to(4)
          break
        case 4:
          if (s.panel === 'sell') to(5)
          break
        case 5:
          if (oreTotal(s) === 0) to(6)
          break
        case 6:
          if (s.tntOwned.length > 1) to(TUTORIAL_DONE_STEP)
          break
        default:
      }
    }
    advance()
    const id = setInterval(advance, 100)
    return () => clearInterval(id)
  }, [progressKnown, resumedDone])

  const done = step >= TUTORIAL_DONE_STEP
  useEffect(() => {
    if (!done) return undefined
    const leave = setTimeout(() => setPhase('leaving'), 6000)
    const gone = setTimeout(() => setPhase('gone'), 6500)
    return () => {
      clearTimeout(leave)
      clearTimeout(gone)
    }
  }, [done])

  // Hidden until we know whether this is a new player, and for good once a returning player's
  // save shows the tutorial was already finished.
  if (!progressKnown || resumedDone || phase === 'gone') return null
  const touch = touchState.active
  return (
    <div className={`hud-tutorial${phase === 'leaving' ? ' is-leaving' : ''}`}>
      <div className="hud-tutorial-tag">{done ? 'COMPLETE' : 'TUTORIAL'}</div>
      <div className="hud-tutorial-text">
        {step === 0 && 'WALK TO THE FOREST MINE'}
        {step === 1 && (
          <>
            PLACE A TNT BLOCK
            <br />
            <small>{touch ? 'TAP THE TNT SLOT, THEN TAP A BLOCK' : 'PRESS 1, THEN CLICK A BLOCK'}</small>
          </>
        )}
        {step === 2 && (
          <>
            LIGHT THE TNT
            <br />
            <small>{touch ? 'TAP THE PICKAXE, THEN TAP THE TNT' : 'PRESS 2, THEN CLICK THE TNT'}</small>
          </>
        )}
        {step === 3 && 'COLLECT THE BLOCKS!'}
        {step === 4 && (
          <>
            GO TO THE SELL STALL
            <br />
            <small>{touch ? 'TAP THE E BUTTON NEAR IT' : 'HOLD E IN FRONT OF IT'}</small>
          </>
        )}
        {step === 5 && 'SELL YOUR BLOCKS!'}
        {step === 6 && (
          <>
            BUY A BETTER TNT
            <br />
            <small>{touch ? 'AT THE TNT STALL, TAP THE E BUTTON' : 'HOLD E AT THE TNT STALL'}</small>
          </>
        )}
        {done && 'NOW, KEEP MINING!'}
      </div>
    </div>
  )
}
