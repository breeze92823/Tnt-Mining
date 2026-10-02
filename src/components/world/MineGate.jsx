import { useMemo } from 'react'
import { FLOOR_TOP, GATE } from '../../data/world.js'
import { MAT } from '../../materials/hub.js'
import { bannerTexture, infoBoardTexture, portalTexture } from '../../utils/labels.js'
import { Block } from './Parts.jsx'

// North zone: the black "Desert Mine" gate at the end of the north path. A
// wooden door frame inside it opens onto a green-lit doorway, and info boards
// on posts stand either side.
const Z = GATE.z
const HW = GATE.halfW

function Sign({ map, position, size }) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  )
}

function InfoBoard({ kind, x }) {
  const map = useMemo(() => infoBoardTexture(kind), [kind])
  const y = FLOOR_TOP
  return (
    <group position={[x, y, Z + 2.6]}>
      <Block position={[-1.1, 1.2, -0.15]} size={[0.25, 2.4, 0.25]} material={MAT.dark} />
      <Block position={[1.1, 1.2, -0.15]} size={[0.25, 2.4, 0.25]} material={MAT.dark} />
      <Block position={[0, 2.6, -0.1]} size={[3.2, 2.2, 0.2]} material={MAT.dark} />
      <Sign map={map} position={[0, 2.6, 0.01]} size={[3, 2]} />
    </group>
  )
}

export default function MineGate() {
  const desert = useMemo(() => bannerTexture('Desert', { bg: '#0d0d10', border: '#1d1d22', w: 1400, h: 300, size: 220 }), [])
  const mine = useMemo(() => bannerTexture('Mine', { bg: '#3a2412', border: '#5a3a1e', w: 640, h: 160, size: 120 }), [])
  const portal = useMemo(() => portalTexture(), [])
  const h = GATE.height
  return (
    <group>
      {/* black frame */}
      <Block position={[-HW, h / 2, Z]} size={[2, h, 3]} material={MAT.black} />
      <Block position={[HW, h / 2, Z]} size={[2, h, 3]} material={MAT.black} />
      <Block position={[0, h - 1.6, Z]} size={[HW * 2 + 2, 3.2, 3]} material={MAT.black} />
      <Sign map={desert} position={[0, h - 1.6, Z + 1.52]} size={[HW * 2 - 0.5, 2.9]} />
      {/* wooden door frame + glowing doorway */}
      <Block position={[-3.4, 3.6, Z - 0.6]} size={[0.8, 6.8, 1]} material={MAT.trunk} />
      <Block position={[3.4, 3.6, Z - 0.6]} size={[0.8, 6.8, 1]} material={MAT.trunk} />
      <Block position={[0, 6.9, Z - 0.6]} size={[7.6, 0.9, 1]} material={MAT.trunk} />
      <Sign map={mine} position={[0, 6.9, Z - 0.09]} size={[4.4, 1.1]} />
      <Sign map={portal} position={[0, 3.45, Z - 0.8]} size={[6, 6.5]} />
      <Block position={[0, 3.6, Z - 1.3]} size={[HW * 2, 7.2, 0.4]} material={MAT.black} />
      <InfoBoard kind="secret" x={-11.5} />
      <InfoBoard kind="luck" x={10.5} />
      <InfoBoard kind="deep" x={14.2} />
    </group>
  )
}
