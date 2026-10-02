import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { GRASS_HALF, TARGET_BLOCK, TARGET_TILE, TARGETS, TRAINING_STAGE, WALL } from '../../data/world.js'
import { MAT, solid } from '../../materials/hub.js'
import { bannerTexture, oreTexture } from '../../utils/labels.js'
import { Billboard, Block, Slab } from './Parts.jsx'

// West zone: a front row of target blocks at floor level either side of the
// path, a low stage across the back (gold strip in line with the path) with
// the pricier targets, two-step bleachers against the wall and the blue
// "Training" banner fixed to the wall above them. Each target stands on a
// coloured tile and is labelled with its unlock cost and damage multiplier.
const oreMats = new Map()
function oreMaterial(kind) {
  if (!oreMats.has(kind)) oreMats.set(kind, new MeshStandardMaterial({ map: oreTexture(kind), roughness: 0.85 }))
  return oreMats.get(kind)
}

const crystalMat = new MeshStandardMaterial({ color: '#3d7bff', emissive: '#2a4dff', emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.1, flatShading: true })
const shardMat = new MeshStandardMaterial({ color: '#9cc4ff', emissive: '#5f8dff', emissiveIntensity: 1.2, roughness: 0.2, flatShading: true })

// Soft radial glow for the crystal's halo.
let glowTex
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(150,190,255,0.9)')
  g.addColorStop(0.35, 'rgba(90,120,255,0.45)')
  g.addColorStop(1, 'rgba(60,60,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  glowTex = new CanvasTexture(c)
  glowTex.colorSpace = SRGBColorSpace
  return glowTex
}

// The 50x target: a glowing crystal cluster with orbiting shards and a
// pulsing halo, sized to read like the other target blocks.
function Crystal({ y }) {
  const spin = useRef()
  const orbit = useRef()
  const halo = useRef()
  useFrame(({ clock }, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.5
    if (orbit.current) orbit.current.rotation.y -= dt * 1.2
    if (halo.current) halo.current.scale.setScalar(5.2 + Math.sin(clock.elapsedTime * 2.4) * 0.4)
  })
  return (
    <group position={[0, y, 0]}>
      <group ref={spin}>
        <mesh material={crystalMat} castShadow scale={[1.05, 1.7, 1.05]}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={crystalMat} castShadow position={[Math.cos(i * 1.57) * 0.95, -0.55, Math.sin(i * 1.57) * 0.95]} rotation={[Math.sin(i) * 0.6, i, Math.cos(i) * 0.6]} scale={[0.45, 1, 0.45]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
      <group ref={orbit}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} material={shardMat} position={[Math.cos(i * 1.2566) * 1.9, Math.sin(i * 2.1) * 0.7, Math.sin(i * 1.2566) * 1.9]} scale={0.18}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
      <sprite ref={halo} scale={5.2} renderOrder={1}>
        <spriteMaterial map={glowTexture()} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </sprite>
      <pointLight color="#5f86ff" intensity={6} distance={7} decay={1.5} />
    </group>
  )
}

// Back-row labels sit higher so they clear the front row's from the path.
const LABEL_LIFT = { front: 1.5, back: 3.1 }

function Target({ t }) {
  const base = t.floor + TARGET_TILE.h
  const lines = useMemo(() => {
    const dmg = { text: `${t.mult} Damage`, size: 46, color: '#ffa12b' }
    if (t.unlocked) return [{ text: 'Unlocked', size: 50, color: '#5bff2a' }, dmg]
    return [{ text: String(t.cost), size: 50, icon: t.currency, color: t.currency === 'gem' ? '#5bff2a' : '#fff' }, dmg]
  }, [t])
  return (
    <group position={[t.x, 0, t.z]}>
      <Block position={[0, t.floor + TARGET_TILE.h / 2, 0]} size={[TARGET_TILE.size, TARGET_TILE.h, TARGET_TILE.size]} material={solid(t.pad)} cast={false} />
      {t.block === 'crystal' ? (
        <Crystal y={base + 1.7} />
      ) : (
        <mesh position={[0, base + TARGET_BLOCK / 2, 0]} material={oreMaterial(t.block)} castShadow receiveShadow>
          <boxGeometry args={[TARGET_BLOCK, TARGET_BLOCK, TARGET_BLOCK]} />
        </mesh>
      )}
      <Billboard position={[0, t.top + LABEL_LIFT[t.row], 0]} px={0.017} lines={lines} />
    </group>
  )
}

// Low stage across the back: blue-grey wings either side of a gold strip that
// lines up with the path.
function Stage() {
  const s = TRAINING_STAGE
  const y0 = 0.3
  return (
    <group>
      <Slab x0={s.x0} x1={s.x1} z0={s.z0} z1={-s.strip} y0={y0} y1={s.top} material={MAT.floorDark} />
      <Slab x0={s.x0} x1={s.x1} z0={s.strip} z1={s.z1} y0={y0} y1={s.top} material={MAT.floorDark} />
      <Slab x0={s.x0} x1={s.x1} z0={-s.strip} z1={s.strip} y0={y0} y1={s.top} material={MAT.gold} />
    </group>
  )
}

// Banner in a darker blue frame, standing on the lower wall tier's ledge
// close to its front edge so the ledge does not hide its bottom.
function Banner() {
  const map = useMemo(() => bannerTexture('Training', { bg: '#1c6fc4', border: '#3f9bf0', inner: '#145193' }), [])
  const face = -WALL.inner - 1.2
  const y = WALL.height + 2.6
  return (
    <group position={[face, 0, 0]}>
      <Block position={[0.2, y, 0]} size={[0.4, 5.2, 16.2]} material={solid('#123f7a')} />
      <mesh position={[0.42, y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[15.2, 4.45]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function Training() {
  const G = GRASS_HALF
  return (
    <group>
      <Stage />
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
