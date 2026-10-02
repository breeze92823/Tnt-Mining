import { useMemo } from 'react'
import { ADMIN_STAGE, FLOOR_TOP, GATE, GRASS_HALF, GROUND, LB_STAGE, PATH, PLAZA, TRAINING_PAD, WALL } from '../../data/world.js'
import { MAT } from '../../materials/hub.js'
import { seededRandom } from '../../utils/random.js'
import { Block, Slab } from './Parts.jsx'

const G = GRASS_HALF
const W = WALL.inner
const HALF = GROUND.size / 2

// Round plaza: grey stepped rim around a tiled disc.
function Plaza() {
  return (
    <group>
      <mesh position={[0, PLAZA.rimTop / 2, 0]} material={MAT.plazaRim} receiveShadow>
        <cylinderGeometry args={[PLAZA.rim, PLAZA.rim + 0.2, PLAZA.rimTop, 72]} />
      </mesh>
      <mesh position={[0, PLAZA.top / 2, 0]} material={MAT.plaza} receiveShadow>
        <cylinderGeometry args={[PLAZA.radius, PLAZA.radius, PLAZA.top, 72]} />
      </mesh>
    </group>
  )
}

// One straight path: grey curb under a sage tiled strip. `axis` 'z' runs
// north-south, 'x' east-west; from..to along that axis.
function Path({ axis, from, to, base = 0 }) {
  const len = Math.abs(to - from)
  const mid = (from + to) / 2
  const w = PATH.width
  const pos = (y) => (axis === 'z' ? [0, y, mid] : [mid, y, 0])
  const size = (width, h) => (axis === 'z' ? [width, h, len] : [len, h, width])
  return (
    <group>
      <Block position={pos(base + 0.02)} size={size(w + 1, 0.04)} material={MAT.pathEdge} cast={false} />
      <Block position={pos(base + 0.04)} size={size(w, 0.08)} material={MAT.path} cast={false} />
    </group>
  )
}

// Raised blue-grey floor ringing the grass, with a low lip step.
function OuterFloor() {
  const t = FLOOR_TOP
  return (
    <group>
      <Slab x0={-W} x1={W} z0={-W} z1={-G} y1={t} material={MAT.floor} />
      <Slab x0={-W} x1={W} z0={G} z1={W} y1={t} material={MAT.floor} />
      <Slab x0={-W} x1={-G} z0={-G} z1={G} y1={t} material={MAT.floor} />
      <Slab x0={G} x1={W} z0={-G} z1={G} y1={t} material={MAT.floor} />
    </group>
  )
}

// Terraced orange walls: a low inner tier and a taller, uneven outer tier,
// both grass-topped with a slightly overhanging green cap.
function Walls() {
  const segments = useMemo(() => {
    const rand = seededRandom(31)
    const out = []
    const SEG = 8
    // North/south runs span the full width (and own the corners); east/west
    // runs fill in between them.
    for (const side of ['n', 's', 'w', 'e']) {
      const end = side === 'n' || side === 's' ? HALF : W
      for (let a = -end; a < end; a += SEG) {
        const inner = WALL.height + Math.floor(rand() * 2)
        const outer = WALL.outerHeight + Math.floor(rand() * 4)
        out.push({ side, a0: a, a1: Math.min(a + SEG, end), inner, outer })
      }
    }
    return out
  }, [])

  const slab = (side, a0, a1, d0, d1, h, key) => {
    // d = distance from centre (inward edge d0, outward d1)
    let x0, x1, z0, z1
    if (side === 'n') [x0, x1, z0, z1] = [a0, a1, -d1, -d0]
    if (side === 's') [x0, x1, z0, z1] = [a0, a1, d0, d1]
    if (side === 'w') [x0, x1, z0, z1] = [-d1, -d0, a0, a1]
    if (side === 'e') [x0, x1, z0, z1] = [d0, d1, a0, a1]
    return (
      <group key={key}>
        <Slab x0={x0} x1={x1} z0={z0} z1={z1} y1={h} material={MAT.wall} cast />
        <Slab x0={x0 - 0.15} x1={x1 + 0.15} z0={z0 - 0.15} z1={z1 + 0.15} y0={h - 0.05} y1={h + 0.45} material={MAT.wallCap} />
      </group>
    )
  }

  return (
    <group>
      {segments.map((s, i) => (
        <group key={i}>
          {slab(s.side, s.a0, s.a1, W, W + WALL.thick, s.inner, 'i')}
          {slab(s.side, s.a0, s.a1, W + WALL.thick, HALF, s.outer, 'o')}
        </group>
      ))}
    </group>
  )
}

export default function Hub() {
  return (
    <group>
      <Plaza />
      <Path axis="z" from={-G} to={G} />
      <Path axis="x" from={-G} to={G} />
      <OuterFloor />
      {/* paths continue across the raised floor toward each zone */}
      <Path axis="z" from={-G} to={GATE.z + 2.5} base={FLOOR_TOP} />
      <Path axis="z" from={G} to={ADMIN_STAGE.z - ADMIN_STAGE.d / 2 - 1} base={FLOOR_TOP} />
      <Path axis="x" from={-G} to={TRAINING_PAD.x + TRAINING_PAD.size / 2} base={FLOOR_TOP} />
      <Path axis="x" from={G} to={LB_STAGE.x0 - 4} base={FLOOR_TOP} />
      <Walls />
    </group>
  )
}
