import { useMemo } from 'react'
import { COLORS, DESERT_SIGN, FLOOR_TOP, GATE, GROUND, INFO_BOARDS, NORTH, NORTH_TREES, WALL, WORLD_BOUNDS } from '../../data/world.js'
import { MAT, solid } from '../../materials/hub.js'
import { tileMaterial } from '../../materials/tile.js'
import { billboardTexture, desertSignTexture, infoBoardTexture } from '../../utils/labels.js'
import { Block, Slab } from './Parts.jsx'
import { Tree } from './Props.jsx'

// North zone, past the hub's checkered line: a bright-green field with four
// signboards fanned out in front of a wooden fence. The fence opens through
// the studded "Mine" arch (under the black "Desert" sign with its price bar)
// onto the fenced, orange-tiled Desert Mine floor. Layout: NORTH, GATE,
// DESERT_SIGN, INFO_BOARDS and NORTH_TREES in data/world.js.
const T = FLOOR_TOP
const W = WALL.inner
const field = solid(NORTH.grass, COLORS.wall)
const checker = tileMaterial({ top: '#f2f2f2', top2: '#151515', side: '#d8d8d8', checker: 1, speckle: 0.3, roughness: 0.7 })
const mineFloor = tileMaterial({ top: '#ea8b3c', top2: '#e3823a', side: '#c96f2c', checker: 2, grout: '#c46a29', studs: 1, studAmt: 0.6, speckle: 0.8, roughness: 0.9 })
const fenceWood = solid('#a8642f', '#94562a')
const archWood = solid('#9c5a2a', '#8a4e24')
const boardBack = solid('#3b2a1f', '#2e2018')

function Face({ map, position, size, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={map} toneMapped={false} transparent />
    </mesh>
  )
}

// Straight wooden fence from (x0, z0) to (x1, z1): posts every ~2.5 m and
// two rails.
function Fence({ x0, z0, x1, z1 }) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const n = Math.max(1, Math.round(len / 2.5))
  const yaw = Math.atan2(x1 - x0, z1 - z0)
  const mx = (x0 + x1) / 2
  const mz = (z0 + z1) / 2
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <Block
          key={i}
          position={[x0 + ((x1 - x0) * i) / n, T + 1, z0 + ((z1 - z0) * i) / n]}
          size={[0.4, 2, 0.4]}
          material={fenceWood}
        />
      ))}
      {[0.85, 1.6].map((y) => (
        <Block key={y} position={[mx, T + y, mz]} rotation={[0, yaw, 0]} size={[0.18, 0.32, len]} material={fenceWood} />
      ))}
    </group>
  )
}

function MineFence() {
  const { x0, x1, z0, z1 } = NORTH.mine
  const gap = GATE.halfW - 0.7
  return (
    <group>
      <Fence x0={x0} z0={z1} x1={-gap} z1={z1} />
      <Fence x0={gap} z0={z1} x1={x1} z1={z1} />
      <Fence x0={x0} z0={z0} x1={x0} z1={z1} />
      <Fence x0={x1} z0={z0} x1={x1} z1={z1} />
      <Fence x0={x0} z0={z0} x1={x1} z1={z0} />
    </group>
  )
}

// Two studded wooden pillars and a header board reading "Mine".
function MineArch() {
  const { halfW, height, z } = GATE
  const label = useMemo(() => billboardTexture([{ text: 'Mine', size: 120 }]), [])
  const headerY = T + height - 1.4
  const headerW = halfW * 2 + 1.4
  return (
    <group>
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Block position={[sx * halfW, T + height / 2, z]} size={[1.4, height, 1.4]} material={archWood} />
          <Block position={[sx * halfW, T + height + 0.2, z]} size={[1.6, 0.4, 1.6]} material={archWood} />
        </group>
      ))}
      <Block position={[0, headerY, z]} size={[headerW, 2.2, 1]} material={archWood} />
      <Face map={label.texture} position={[0, headerY, z + 0.52]} size={[1.9 * label.aspect, 1.9]} />
    </group>
  )
}

// The tall black "Desert" board behind the arch, on two legs.
function DesertSign() {
  const { z, w, y0, y1, price } = DESERT_SIGN
  const map = useMemo(() => desertSignTexture(price), [price])
  const h = y1 - y0
  return (
    <group>
      {[-1, 1].map((sx) => (
        <Block key={sx} position={[sx * 4.5, (T + y0) / 2, z]} size={[0.6, y0 - T, 0.6]} material={MAT.black} />
      ))}
      <Block position={[0, y0 + h / 2, z]} size={[w, h, 0.5]} material={MAT.black} />
      <Face map={map} position={[0, y0 + h / 2, z + 0.26]} size={[w - 0.2, h - 0.2]} />
    </group>
  )
}

// A thick signboard on two short legs, turned toward the plaza.
function Signboard({ board }) {
  const map = useMemo(() => infoBoardTexture(board.id), [board.id])
  const BW = 4.8
  const BH = 3.0
  const y = T + 0.9 + BH / 2
  return (
    <group position={[board.x, 0, board.z]} rotation={[0, board.rot, 0]}>
      {[-1, 1].map((sx) => (
        <Block key={sx} position={[sx * 1.7, T + 0.6, -0.05]} size={[0.32, 1.2, 0.32]} material={fenceWood} />
      ))}
      <Block position={[0, y, -0.05]} size={[BW, BH, 0.45]} material={boardBack} />
      <Face map={map} position={[0, y, 0.18]} size={[BW - 0.1, BH - 0.1]} />
    </group>
  )
}

const BUSHES = [[-29, -44], [29, -52], [-29.5, -57], [23, -70.5], [-9, -70.5], [8, -71]]

function Bush({ x, z }) {
  return (
    <group position={[x, T, z]}>
      <Block position={[0, 0.6, 0]} size={[2.2, 1.2, 1.6]} material={MAT.leaf} />
      <Block position={[0.5, 1.3, 0.1]} size={[1.2, 0.8, 1.1]} material={MAT.leaf} />
    </group>
  )
}

export default function MineGate() {
  const half = GROUND.size / 2
  const { x0, x1, z0, z1 } = NORTH.mine
  return (
    <group>
      {/* ground under the moved-back north wall, then the field and the start line */}
      <Slab x0={-half} x1={half} z0={WORLD_BOUNDS.minZ} z1={-half} y0={-GROUND.depth} y1={0} material={MAT.grass} />
      <Slab x0={-W} x1={W} z0={NORTH.wallZ} z1={NORTH.checkerZ - 2} y1={T} material={field} />
      <Slab x0={-W} x1={W} z0={NORTH.checkerZ - 2} z1={NORTH.checkerZ} y0={0} y1={T + 0.03} material={checker} />
      <Slab x0={x0} x1={x1} z0={z0} z1={z1} y0={T - 0.02} y1={T + 0.04} material={mineFloor} />
      <MineFence />
      <MineArch />
      <DesertSign />
      {INFO_BOARDS.map((b) => (
        <Signboard key={b.id} board={b} />
      ))}
      {NORTH_TREES.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} seed={i * 17 + 101} />
      ))}
      {BUSHES.map(([x, z]) => (
        <Bush key={`${x},${z}`} x={x} z={z} />
      ))}
    </group>
  )
}
