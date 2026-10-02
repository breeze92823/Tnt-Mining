import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial } from 'three'
import { FLOOR_TOP, GRASS_HALF, TARGETS, TRAINING_PAD, WALL } from '../../data/world.js'
import { MAT } from '../../materials/hub.js'
import { bannerTexture, oreTexture } from '../../utils/labels.js'
import { Billboard, Block, Slab } from './Parts.jsx'

// West zone: a gold pad flanked by an arc of target blocks on low bases, each
// labelled with its unlock cost and damage multiplier, tiered bleachers
// against the wall and the blue "Training" banner above them.
const oreMats = new Map()
function oreMaterial(kind) {
  if (!oreMats.has(kind)) oreMats.set(kind, new MeshStandardMaterial({ map: oreTexture(kind), roughness: 0.85 }))
  return oreMats.get(kind)
}

const crystalMat = new MeshStandardMaterial({ color: '#2f6dff', emissive: '#1a3cff', emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.1, flatShading: true })

function Crystal({ y }) {
  const ref = useRef()
  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5
  })
  return (
    <group ref={ref} position={[0, y, 0]}>
      <mesh material={crystalMat} castShadow scale={[0.9, 1.5, 0.9]}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={crystalMat} castShadow position={[Math.cos(i * 1.57) * 0.8, -0.5, Math.sin(i * 1.57) * 0.8]} rotation={[Math.sin(i) * 0.6, i, Math.cos(i) * 0.6]} scale={[0.4, 0.9, 0.4]}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  )
}

function inPad(x, z) {
  const h = TRAINING_PAD.size / 2
  return Math.abs(x - TRAINING_PAD.x) < h && Math.abs(z - TRAINING_PAD.z) < h
}

function Target({ t }) {
  const floor = inPad(t.x, t.z) ? TRAINING_PAD.top : FLOOR_TOP
  const top = floor + 0.3
  const lines = useMemo(() => {
    const dmg = { text: `${t.mult} Damage`, size: 46, color: '#ffa12b' }
    if (t.unlocked) return [{ text: 'Unlocked', size: 50, color: '#5bff2a' }, dmg]
    return [{ text: String(t.cost), size: 50, icon: t.currency, color: t.currency === 'gem' ? '#5bff2a' : '#fff' }, dmg]
  }, [t])
  return (
    <group position={[t.x, 0, t.z]}>
      <Block position={[0, floor + 0.15, 0]} size={[3.2, 0.3, 3.2]} material={MAT.floorDark} />
      {t.block === 'crystal' ? (
        <Crystal y={top + 1.6} />
      ) : (
        <mesh position={[0, top + 1.2, 0]} material={oreMaterial(t.block)} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
        </mesh>
      )}
      <Billboard position={[0, top + 4, 0]} px={0.017} lines={lines} />
    </group>
  )
}

function Banner() {
  const map = useMemo(() => bannerTexture('Training', { bg: '#1c6fc4', border: '#3f9bf0', inner: '#145193' }), [])
  return (
    <group position={[-WALL.inner + 1.8, 0, 0]}>
      {[-5, 5].map((z) => (
        <Block key={z} position={[0, 5.5, z]} size={[0.5, 8, 0.5]} material={MAT.dark} />
      ))}
      <Block position={[-0.1, 9.6, 0]} size={[0.3, 3.8, 13]} material={MAT.blue} />
      <mesh position={[0.07, 9.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12.4, 3.6]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function Training() {
  const p = TRAINING_PAD
  const G = GRASS_HALF
  return (
    <group>
      <Slab x0={p.x - p.size / 2} x1={p.x + p.size / 2} z0={p.z - p.size / 2} z1={p.z + p.size / 2} y1={p.top} material={MAT.gold} />
      {/* bleachers along the west wall */}
      <Slab x0={-WALL.inner} x1={-WALL.inner + 3} z0={-G} z1={G} y1={1.0} material={MAT.floorDark} />
      <Slab x0={-WALL.inner} x1={-WALL.inner + 1.5} z0={-G} z1={G} y1={1.6} material={MAT.floor} />
      {TARGETS.map((t) => (
        <Target key={t.block} t={t} />
      ))}
      <Banner />
    </group>
  )
}
