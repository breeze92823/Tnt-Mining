import { STALL_SCALE, STALLS } from '../../data/world.js'
import { MAT, solid } from '../../materials/hub.js'
import { Billboard, Block } from './Parts.jsx'

// Market stall: orange brick counter on three sides, four posts and a
// striped canopy sloping toward the front (+Z local). Built at the origin and
// turned to face the plaza.
const WIDTH = 5.6
const DEPTH = 4
const POST_H = 3.9
const STRIPES = 7

function Canopy({ colors }) {
  const sw = (WIDTH + 0.8) / STRIPES
  return (
    <group position={[0, POST_H + 0.15, 0]} rotation={[0.26, 0, 0]}>
      {Array.from({ length: STRIPES }, (_, i) => {
        const x = -((WIDTH + 0.8) / 2) + sw * (i + 0.5)
        const m = solid(colors[i % 2])
        return (
          <group key={i}>
            <Block position={[x, 0, 0]} size={[sw + 0.01, 0.22, DEPTH + 0.9]} material={m} />
            {/* front valance */}
            <Block position={[x, -0.32, (DEPTH + 0.9) / 2]} size={[sw + 0.01, 0.62, 0.14]} material={m} />
          </group>
        )
      })}
    </group>
  )
}

function Stall({ stall }) {
  const rotY = Math.atan2(-stall.x, -stall.z)
  const half = WIDTH / 2
  return (
    <group position={[stall.x, 0, stall.z]} rotation={[0, rotY, 0]} scale={STALL_SCALE}>
      <Block position={[0, 0.15, 0]} size={[WIDTH + 0.4, 0.3, DEPTH + 0.4]} material={MAT.brick} />
      {/* counters: front, sides, back */}
      <Block position={[0, 0.75, DEPTH / 2 - 0.45]} size={[WIDTH, 1.2, 0.9]} material={MAT.brick} />
      <Block position={[0, 1.42, DEPTH / 2 - 0.4]} size={[WIDTH + 0.2, 0.16, 1.15]} material={MAT.wood} />
      <Block position={[-half + 0.4, 0.75, -0.2]} size={[0.8, 1.2, DEPTH - 0.8]} material={MAT.brick} />
      <Block position={[half - 0.4, 0.75, -0.2]} size={[0.8, 1.2, DEPTH - 0.8]} material={MAT.brick} />
      <Block position={[0, 0.75, -DEPTH / 2 + 0.3]} size={[WIDTH, 1.2, 0.6]} material={MAT.brick} />
      {/* posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <Block
          key={`${sx}${sz}`}
          position={[sx * (half - 0.2), POST_H / 2, sz * (DEPTH / 2 - 0.2)]}
          size={[0.42, POST_H, 0.42]}
          material={MAT.brick}
        />
      ))}
      <Canopy colors={stall.stripes} />
      <Billboard position={[0, 6.2, 0]} px={0.013} lines={[{ text: stall.label, size: 84, icon: stall.icon }]} />
    </group>
  )
}

export default function Stalls() {
  return STALLS.map((s) => <Stall key={s.id} stall={s} />)
}
