import { COLLIDERS, GROUND_Y, WORLD_BOUNDS } from '../data/world.js'
import { mineFloorAt } from './mineCubes.js'

// Floor height under (x, z): the highest collider covering the point (see
// COLLIDERS in data/world.js), else the bare ground. playerMovement and the
// camera boom clamp both go through here; colliders taller than the player's
// step height act as walls.
export function terrainHeightAt(x, z) {
  // Inside the Forest Mine the base is the cube grid, not the bare ground.
  let h = mineFloorAt(x, z) ?? GROUND_Y
  for (let i = 0; i < COLLIDERS.length; i++) {
    const c = COLLIDERS[i]
    if (c.top <= h) continue
    if (c.r !== undefined) {
      const dx = x - c.cx
      const dz = z - c.cz
      if (dx * dx + dz * dz <= c.r * c.r) h = c.top
    } else if (x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) {
      h = c.top
    }
  }
  return h
}

// True once (x, z) is past the edge of the walkable world.
export function isOutsideBounds(x, z) {
  const b = WORLD_BOUNDS
  return x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ
}
