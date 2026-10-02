import { GROUND, GROUND_Y } from '../data/world.js'
import { MAT } from '../materials/hub.js'

// The base slab: studded bright-green grass on top (world-space tile shader,
// so no UVs), orange dirt on the sides. Top face sits at GROUND_Y. The hub's
// paths, plaza and raised floor (world/Hub.jsx) sit on top of it.
export default function Ground() {
  const { size, depth } = GROUND
  return (
    <mesh position={[0, GROUND_Y - depth / 2, 0]} material={MAT.grass} receiveShadow>
      <boxGeometry args={[size, depth, size]} />
    </mesh>
  )
}
