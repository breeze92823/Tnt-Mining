import { GATE, STALLS } from './world.js'

// New-player tutorial (components/hud/TutorialBanner.jsx, components/GuideArrows.jsx).
// Steps: 0 walk to the Forest Mine, 1 place a TNT, 2 light it with the pickaxe, 3 collect the blocks,
// 4 go to the SELL Stall, 5 sell, 6 buy a better TNT at the TNT Stall, 7 done.
// The saved step is the backend's `tutorialStep` (Tnt-Mining-backend constants.ts TUTORIAL_DONE_STEP):
// keep the two in step.
export const TUTORIAL_DONE_STEP = 7

const stall = (id) => STALLS.find((s) => s.id === id)
const SELL = stall('sell')
const TNT = stall('tnt')

// Where the red arrows lead in each step; `y` is the height of the bobbing arrow above the target;
// null = no arrows in that step.
export const TUTORIAL_TARGETS = [
  { x: 0, z: GATE.z, y: GATE.height + 2.4 }, // step 0: the Mine Arch
  null, // step 1: place a TNT
  null, // step 2: light it
  null, // step 3: collect the blocks
  { x: SELL.x, z: SELL.z, y: 10 }, // step 4: the SELL Stall
  null, // step 5: sell
  { x: TNT.x, z: TNT.z, y: 10 }, // step 6: the TNT Stall
]
