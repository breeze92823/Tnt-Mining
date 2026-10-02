import { useFontsReady } from './useFonts.js'
import Hub from './Hub.jsx'
import Stalls from './Stalls.jsx'
import Pedestals from './Pedestals.jsx'
import Training from './Training.jsx'
import Leaderboards from './Leaderboards.jsx'
import MineGate from './MineGate.jsx'
import Props from './Props.jsx'

// The lobby hub (layout in data/world.js). Suspends until the label font has
// loaded so every canvas-painted sign bakes in the right typeface.
export default function World() {
  useFontsReady()
  return (
    <group>
      <Hub />
      <Stalls />
      <Pedestals />
      <Training />
      <Leaderboards />
      <MineGate />
      <Props />
    </group>
  )
}
