import { useMemo } from 'react'
import { ADMIN_STAGE, COLORS, FLOOR_TOP, GRASS_HALF, GROUND, LB_STAGE, NORTH, PATH, PLAZA, TRAINING_STAGE, WALL } from '../../data/world.js'
import { MAT, solid } from '../../materials/hub.js'
import { seededRandom } from '../../utils/random.js'
import { Block, Slab } from './Parts.jsx'

const G = GRASS_HALF
const W = WALL.inner
const HALF = GROUND.size / 2
const NORTH_D = -NORTH.wallZ // north wall's inner distance from centre

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

// Raised blue-grey floor ringing the grass. The north band is grass up to
// the checkered line; the field beyond it belongs to world/MineGate.jsx.
function OuterFloor() {
  const t = FLOOR_TOP
  return (
    <group>
      <Slab x0={-W} x1={W} z0={NORTH.checkerZ} z1={-G} y1={t} material={solid(COLORS.grass, COLORS.grassDark)} />
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
        out.push({ side, a0: a, a1: Math.min(a + SEG, end), inner, outer, d: side === 'n' ? NORTH_D : W })
      }
    }
    // The north wall stands back past the mine: extend the east/west walls up
    // to it (own seed, so the original segments keep their heights).
    const rand2 = seededRandom(57)
    for (const side of ['w', 'e']) {
      for (let a = -NORTH_D; a < -W; a += SEG) {
        const inner = WALL.height + Math.floor(rand2() * 2)
        const outer = WALL.outerHeight + Math.floor(rand2() * 4)
        out.push({ side, a0: a, a1: Math.min(a + SEG, -W), inner, outer, d: W })
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
          {slab(s.side, s.a0, s.a1, s.d, s.d + WALL.thick, s.inner, 'i')}
          {slab(s.side, s.a0, s.a1, s.d + WALL.thick, s.d + HALF - W, s.outer, 'o')}
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
      <Path axis="z" from={-G} to={NORTH.checkerZ} base={FLOOR_TOP} />
      <Path axis="z" from={G} to={ADMIN_STAGE.z - ADMIN_STAGE.d / 2 - 1} base={FLOOR_TOP} />
      <Path axis="x" from={-G} to={TRAINING_STAGE.x1} base={FLOOR_TOP} />
      <Path axis="x" from={G} to={LB_STAGE.x0 - 4} base={FLOOR_TOP} />
      <Walls />
    </group>
  )
}
