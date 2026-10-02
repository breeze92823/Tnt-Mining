import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial, Object3D } from 'three'
import { FLOOR_TOP, GRASS_HALF, INDEX_POS, MAILBOX_POS, PATH, PLAZA, STALLS, TREES } from '../../data/world.js'
import { MAT, solid } from '../../materials/hub.js'
import { bookTexture } from '../../utils/labels.js'
import { seededRandom } from '../../utils/random.js'
import { Billboard, Block } from './Parts.jsx'

const baseY = (x, z) => (Math.abs(x) > GRASS_HALF || Math.abs(z) > GRASS_HALF ? FLOOR_TOP : 0)

// Blocky tree: square trunk under two stacked, offset leaf cubes.
export function Tree({ x, z, seed }) {
  const y = baseY(x, z)
  const r = seededRandom(seed)
  const s = 0.9 + r() * 0.35
  return (
    <group position={[x, y, z]} scale={s} rotation={[0, r() * Math.PI, 0]}>
      <Block position={[0, 2.2, 0]} size={[1, 4.4, 1]} material={MAT.trunk} />
      <Block position={[0, 5, 0]} size={[4.2, 2.6, 4.2]} material={MAT.leaf} />
      <Block position={[0.4, 6.9, -0.3]} size={[2.8, 1.6, 2.8]} material={MAT.leaf} />
      <Block position={[-1.9, 4.4, 1]} size={[1.6, 1.6, 1.6]} material={MAT.leaf} />
    </group>
  )
}

const bookMats = []
function getBookMats() {
  if (!bookMats.length) {
    const cover = new MeshStandardMaterial({ map: bookTexture(), roughness: 0.6 })
    const pages = new MeshStandardMaterial({ color: '#f4efe0', roughness: 0.9 })
    const spine = new MeshStandardMaterial({ color: '#0f3f8f', roughness: 0.6 })
    bookMats.push(pages, spine, pages, pages, cover, cover)
  }
  return bookMats
}

// Collection index: a floating, turning blue book over a small pad.
function IndexBook() {
  const ref = useRef()
  const { x, z } = INDEX_POS
  const y = baseY(x, z)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.7
    ref.current.position.y = y + 2 + Math.sin(clock.elapsedTime * 1.8) * 0.15
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, y + 0.2, 0]} material={MAT.floorDark} receiveShadow castShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.4, 24]} />
      </mesh>
      <mesh position={[0, y + 0.45, 0]} material={solid('#4ea8ff', '#3a8ee6')} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.12, 24]} />
      </mesh>
      <group ref={ref} position={[0, y + 2, 0]}>
        <mesh material={getBookMats()} castShadow rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.45, 1.6, 1.25]} />
        </mesh>
      </group>
      <Billboard position={[0, y + 3.6, 0]} px={0.012} lines={[{ text: 'Index', size: 52 }]} />
    </group>
  )
}

// Feedback mailbox on a post, red flag up.
function Mailbox() {
  const { x, z } = MAILBOX_POS
  const y = baseY(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI / 4, 0]}>
      <Block position={[0, 0.7, 0]} size={[0.25, 1.4, 0.25]} material={MAT.trunk} />
      <Block position={[0, 1.65, 0]} size={[0.7, 0.55, 1.1]} material={MAT.metal} />
      <mesh position={[0, 1.92, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.metal} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <Block position={[0.4, 1.95, -0.2]} size={[0.06, 0.6, 0.12]} material={MAT.red} />
      <Block position={[0.4, 2.15, -0.05]} size={[0.06, 0.22, 0.3]} material={MAT.red} />
      <Billboard position={[0, 3, 0]} px={0.011} lines={[{ text: 'Feedback', size: 48 }]} />
    </group>
  )
}

// Grass tufts and flower patches scattered over the four grass quadrants,
// clear of the paths, plaza, stalls and trees.
function Decor() {
  const tufts = useRef()
  const flowers = useRef()
  const { tuftMats, flowerMats } = useMemo(() => {
    const rand = seededRandom(91)
    const clear = (x, z) => {
      if (Math.abs(x) < PATH.width / 2 + 1 || Math.abs(z) < PATH.width / 2 + 1) return false
      if (Math.hypot(x, z) < PLAZA.rim + 1) return false
      if (STALLS.some((s) => Math.hypot(x - s.x, z - s.z) < 5)) return false
      if (TREES.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 2.6)) return false
      return true
    }
    const dummy = new Object3D()
    const tuftMats = []
    const flowerMats = []
    let tries = 0
    while ((tuftMats.length < 110 * 3 || flowerMats.length < 60) && tries++ < 4000) {
      const x = (rand() * 2 - 1) * (GRASS_HALF - 1)
      const z = (rand() * 2 - 1) * (GRASS_HALF - 1)
      if (!clear(x, z)) continue
      if (rand() < 0.62 && tuftMats.length < 110 * 3) {
        const h = 0.5 + rand() * 0.6
        const blades = [[0, 0, h], [0.22, 0.05, h * 0.7], [-0.2, -0.08, h * 0.6]]
        const yaw = rand() * Math.PI
        for (const [ox, oz, bh] of blades) {
          dummy.position.set(x + ox * Math.cos(yaw), bh / 2, z + oz + ox * Math.sin(yaw))
          dummy.rotation.set(0, yaw, 0)
          dummy.scale.set(0.16, bh, 0.16)
          dummy.updateMatrix()
          tuftMats.push(dummy.matrix.clone())
        }
      } else if (flowerMats.length < 60) {
        for (let k = 0; k < 3; k++) {
          dummy.position.set(x + (rand() - 0.5) * 0.9, 0.04, z + (rand() - 0.5) * 0.9)
          dummy.rotation.set(0, rand() * Math.PI, 0)
          dummy.scale.set(0.32, 0.06, 0.32)
          dummy.updateMatrix()
          flowerMats.push(dummy.matrix.clone())
        }
      }
    }
    return { tuftMats, flowerMats }
  }, [])

  useLayoutEffect(() => {
    tuftMats.forEach((m, i) => tufts.current.setMatrixAt(i, m))
    tufts.current.instanceMatrix.needsUpdate = true
    const pink = new Color('#f59ad8')
    const lilac = new Color('#c7a4ff')
    const white = new Color('#fff4fb')
    flowerMats.forEach((m, i) => {
      flowers.current.setMatrixAt(i, m)
      flowers.current.setColorAt(i, [pink, lilac, white][i % 3])
    })
    flowers.current.instanceMatrix.needsUpdate = true
    if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true
  }, [tuftMats, flowerMats])

  return (
    <group>
      <instancedMesh ref={tufts} args={[undefined, undefined, tuftMats.length]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#2c9a1c" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, flowerMats.length]}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

export default function Props() {
  return (
    <group>
      {TREES.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} seed={i * 13 + 5} />
      ))}
      <IndexBook />
      <Mailbox />
      <Decor />
    </group>
  )
}
