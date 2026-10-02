import { FLOOR_TOP, HUB_WALL, WALL } from '../../data/world.js'
import { MAT } from '../../materials/hub.js'
import { Slab } from './Parts.jsx'

// The wall between the hub and the north zone: orange studded body with a
// slightly overhanging green cap (same look as the perimeter walls), running
// from each side wall to a narrow gate on the path line. Layout: HUB_WALL in
// data/world.js.
function Section({ x0, x1 }) {
  const { z0, z1, height } = HUB_WALL
  return (
    <group>
      <Slab x0={x0} x1={x1} z0={z0} z1={z1} y0={FLOOR_TOP - 0.05} y1={height} material={MAT.wall} cast />
      <Slab x0={x0 - 0.15} x1={x1 + 0.15} z0={z0 - 0.15} z1={z1 + 0.15} y0={height - 0.05} y1={height + 0.45} material={MAT.wallCap} />
    </group>
  )
}

export default function HubWall() {
  return (
    <group>
      <Section x0={-WALL.inner} x1={-HUB_WALL.halfGap} />
      <Section x0={HUB_WALL.halfGap} x1={WALL.inner} />
    </group>
  )
}
