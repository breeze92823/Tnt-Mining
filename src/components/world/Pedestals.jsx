import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ADMIN_STAGE, FLOOR_TOP, PEDESTALS } from '../../data/world.js'
import { compact } from '../../utils/compact.js'
import { MAT, solid } from '../../materials/hub.js'
import { Billboard, Block, Slab, TntBlock } from './Parts.jsx'

// Premium TNT showcase along the south edge: a coloured rim under a dark
// slab, the TNT block spinning and bobbing above, and a name/price billboard.
// Admin TNT stands on a raised red stage at the end of the south path.
function Pedestal({ p }) {
  const spin = useRef()
  const base = p.id === 'admin' ? ADMIN_STAGE.top : FLOOR_TOP
  const rim = solid(p.color)

  useFrame(({ clock }) => {
    const g = spin.current
    if (!g) return
    const t = clock.elapsedTime + p.x
    g.rotation.y = t * 0.6
    g.position.y = base + 2.8 + Math.sin(t * 1.6) * 0.18
  })

  return (
    <group position={[p.x, 0, p.z]}>
      <Block position={[0, base + 0.15, 0]} size={[5.4, 0.3, 5.4]} material={rim} />
      <Block position={[0, base + 0.45, 0]} size={[4.6, 0.3, 4.6]} material={MAT.dark} />
      <group ref={spin} position={[0, base + 2.8, 0]}>
        <TntBlock kind={p.id} size={2.3} />
      </group>
      <Billboard
        position={[0, base + 6, 0]}
        px={0.019}
        lines={[
          { text: p.name, size: 60, color: p.nameColor },
          { text: p.tagline, size: 54 },
          { text: '$' + compact(p.price), size: 54, color: '#5bff2a', icon: 'cash' },
        ]}
      />
    </group>
  )
}

function AdminStage() {
  const { x, z, w, d, top } = ADMIN_STAGE
  return (
    <group>
      <Slab x0={x - w / 2 - 1} x1={x + w / 2 + 1} z0={z - d / 2 - 1} z1={z + d / 2} y1={0.7} material={MAT.carpet} />
      <Slab x0={x - w / 2} x1={x + w / 2} z0={z - d / 2} z1={z + d / 2} y1={top} material={MAT.red} />
      {/* gold trim along the stage front */}
      <Slab x0={x - w / 2} x1={x + w / 2} z0={z - d / 2 - 0.1} z1={z - d / 2 + 0.2} y0={top - 0.12} y1={top + 0.04} material={MAT.gold} />
    </group>
  )
}

export default function Pedestals() {
  return (
    <group>
      <AdminStage />
      {PEDESTALS.map((p) => (
        <Pedestal key={p.id} p={p} />
      ))}
    </group>
  )
}
