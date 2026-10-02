import { GROUND, GROUND_Y, NORTH, rectsAround } from '../data/world.js'
import { MAT } from '../materials/hub.js'
import { Slab } from './world/Parts.jsx'

// The base slab: studded bright-green grass on top (world-space tile shader,
// so no UVs), orange dirt on the sides. Top face sits at GROUND_Y. The hub's
// paths, plaza and raised floor (world/Hub.jsx) sit on top of it. It is cut
// open where it overlaps the Forest Mine (the cube floor there goes deeper).
export default function Ground() {
  const half = GROUND.size / 2
  return (
    <group>
      {rectsAround({ x0: -half, x1: half, z0: -half, z1: half }, NORTH.mine).map((r, i) => (
        <Slab key={i} {...r} y0={GROUND_Y - GROUND.depth} y1={GROUND_Y} material={MAT.grass} />
      ))}
    </group>
  )
}
