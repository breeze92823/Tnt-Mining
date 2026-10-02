import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial } from 'three'
import { STALL_SCALE, STALLS } from '../../data/world.js'
import { proximityZone } from '../../systems/interact.js'
import { openPanel, useGameStore } from '../../store/useGameStore.js'
import { MAT, solid } from '../../materials/hub.js'
import { Billboard, Block } from './Parts.jsx'

// Market stall: orange brick counter at the front, low brick rails at the
// sides, chunky posts (front pair shorter) and a wide, thick striped canopy
// sloping toward the front (+Z local). Built at the origin and turned to face
// the plaza.
const WIDTH = 5.6
const DEPTH = 4
const STRIPES = 5
const TILT = 0.12
const POST = 0.7
const POST_FRONT_H = 3.5
const POST_BACK_H = POST_FRONT_H + (DEPTH - POST) * Math.tan(TILT)
const CANOPY_W = WIDTH + 1.6
const CANOPY_D = DEPTH + 1.4
const STUDS = 7

function Canopy({ colors, canopyRef }) {
  const sw = CANOPY_W / STRIPES
  const y = (POST_FRONT_H + POST_BACK_H) / 2 + 0.15
  return (
    <group ref={canopyRef} position={[0, y, 0]} rotation={[TILT, 0, 0]}>
      {Array.from({ length: STRIPES }, (_, i) => {
        const x = -CANOPY_W / 2 + sw * (i + 0.5)
        const m = solid(colors[i % 2])
        return (
          <group key={i}>
            <Block position={[x, 0, 0]} size={[sw + 0.01, 0.3, CANOPY_D]} material={m} />
            {/* front valance */}
            <Block position={[x, -0.4, CANOPY_D / 2 - 0.08]} size={[sw + 0.01, 0.7, 0.16]} material={m} />
          </group>
        )
      })}
    </group>
  )
}

// Blocky shopkeeper standing behind the front counter, facing the plaza.
// `root` hops and `arm` (right arm, pivoting at the shoulder) waves on interact.
function Vendor({ shirt, root, arm }) {
  const skin = solid('#f2c48f')
  const dark = solid('#2b2b33')
  const top = solid(shirt)
  return (
    <group ref={root} position={[0, 0, 0.3]}>
      <Block position={[0, 0.5, 0]} size={[0.8, 1, 0.45]} material={dark} />
      <Block position={[0, 1.5, 0]} size={[0.95, 1, 0.5]} material={top} />
      <Block position={[-0.65, 1.45, 0]} size={[0.32, 0.95, 0.4]} material={dark} />
      <group ref={arm} position={[0.65, 1.95, 0]}>
        <Block position={[0, -0.475, 0]} size={[0.32, 0.95, 0.4]} material={dark} />
      </group>
      <Block position={[0, 2.35, 0]} size={[0.7, 0.7, 0.65]} material={skin} />
      <Block position={[-0.16, 2.4, 0.33]} size={[0.1, 0.12, 0.03]} material={dark} />
      <Block position={[0.16, 2.4, 0.33]} size={[0.1, 0.12, 0.03]} material={dark} />
      <Block position={[0, 2.78, 0]} size={[0.78, 0.2, 0.72]} material={top} />
    </group>
  )
}

// Chest + coins out front, ported from Age-every-click's Shop. While a stall's
// panel is open the chest lid swings open; when it closes the stall
// squash-pops, the awning wobbles, coins burst out and the vendor hops and waves.
const GOLD = '#ffc21a'
const CHEST_BLUE = '#2fb4ef'
const CHEST_LID_OPEN = -1.9 // rad about the back hinge
// Per burst coin: sideways drift and launch speed.
const COIN_BURST = [[-0.5, 1.2], [0.3, 1.5], [0.7, 1.1], [-0.2, 1.7], [0.1, 1.3]]
const COIN_BURST_TIME = 0.9
const WAVE_S = 1.6 // vendor waves goodbye this long after the panel closes
const CHEST_SCALE = 1.7

const goldMat = new MeshStandardMaterial({ color: GOLD, emissive: '#ff9d00', emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.4 })

function GoldCoin({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation} material={goldMat} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.07, 8]} />
    </mesh>
  )
}

function TreasureChest({ lidRef }) {
  const blue = solid(CHEST_BLUE)
  const gold = solid(GOLD)
  return (
    <group>
      <Block size={[1, 0.55, 0.7]} position={[0, 0.275, 0]} material={blue} />
      <Block size={[1.04, 0.1, 0.74]} position={[0, 0.05, 0]} material={gold} />
      <Block size={[1.04, 0.08, 0.74]} position={[0, 0.52, 0]} material={gold} />
      {[-0.46, 0.46].map((x) => (
        <Block key={x} size={[0.12, 0.56, 0.76]} position={[x, 0.28, 0]} material={gold} />
      ))}
      <Block size={[0.16, 0.2, 0.06]} position={[0, 0.44, 0.37]} material={gold} />
      {/* lid, hinged along the back top edge */}
      <group ref={lidRef} position={[0, 0.56, -0.35]}>
        <Block size={[1, 0.28, 0.7]} position={[0, 0.14, 0.35]} material={blue} />
        <Block size={[1.04, 0.08, 0.74]} position={[0, 0.3, 0.35]} material={gold} />
        {[-0.46, 0.46].map((x) => (
          <Block key={x} size={[0.12, 0.34, 0.76]} position={[x, 0.15, 0.35]} material={gold} />
        ))}
        <Block size={[0.16, 0.14, 0.06]} position={[0, 0.07, 0.72]} material={gold} />
      </group>
      {/* glowing gold pile, seen once the lid lifts */}
      <mesh position={[0, 0.5, 0]} material={goldMat}>
        <boxGeometry args={[0.8, 0.08, 0.5]} />
      </mesh>
    </group>
  )
}

// Id of the stall whose panel was last opened with E.
let activeStall = null

function Stall({ stall }) {
  const rotY = Math.atan2(-stall.x, -stall.z)
  const half = WIDTH / 2
  const studW = WIDTH / STUDS
  const rootRef = useRef()
  const vendor = useRef()
  const arm = useRef()
  const canopy = useRef()
  const lid = useRef()
  const coinRef = useRef()
  const burst = useRef([])
  // sinceOpen: seconds since the panel closed (Infinity = never, so the one-shot
  // pop/burst stay idle). lid/arm: eased blend values.
  const anim = useRef({ wasOpen: false, sinceOpen: Infinity, lid: 0, arm: 0 })

  // Hold E in front of the counter: open the panel (the animation follows it).
  useEffect(() => {
    const reach = 3.4 * STALL_SCALE
    return proximityZone({
      id: `stall:${stall.id}`,
      position: [stall.x + Math.sin(rotY) * reach, 0, stall.z + Math.cos(rotY) * reach],
      range: 3.2,
      label: stall.prompt,
      onConfirm() {
        activeStall = stall.id
        openPanel(stall.panel)
      },
    })
  }, [stall, rotY])

  useFrame(({ clock }, dt) => {
    const a = anim.current
    const open = activeStall === stall.id && useGameStore.getState().panel !== null
    if (!open && a.wasOpen) a.sinceOpen = 0 // panel just closed
    a.wasOpen = open
    a.sinceOpen += dt
    const t = a.sinceOpen
    const time = clock.elapsedTime + stall.x
    const fresh = Number.isFinite(t)

    // Squash-pop of the whole stall, and a trailing wobble on the canopy.
    const pop = fresh ? 0.05 * Math.sin(t * 16) * Math.exp(-t * 5) : 0
    rootRef.current?.scale.set(1 + pop, 1 - pop, 1 + pop)
    if (canopy.current) canopy.current.rotation.x = TILT + (fresh ? 0.12 * Math.sin(t * 11 - 0.6) * Math.exp(-t * 3.5) : 0)

    // Chest lid eases open while the panel is up, then drops shut on close.
    const k = 1 - Math.exp(-dt * (open ? 9 : 6))
    a.lid += ((open ? CHEST_LID_OPEN : 0) - a.lid) * k
    if (lid.current) lid.current.rotation.x = a.lid

    // Vendor idles with a small bob and look-around; hops and waves on open.
    const waving = fresh && t < WAVE_S
    a.arm += ((waving ? 1 : 0) - a.arm) * (1 - Math.exp(-dt * (waving ? 9 : 6)))
    if (vendor.current) {
      const hop = fresh && t < 0.5 ? Math.max(0, Math.sin(t * Math.PI * 2)) * 0.4 : 0
      vendor.current.position.y = Math.sin(time * 2.2) * 0.03 + hop
      vendor.current.rotation.y = Math.sin(time * 0.7) * 0.12 * (1 - a.arm)
    }
    if (arm.current) arm.current.rotation.z = 0.05 + a.arm * (2.5 + Math.sin(time * 9) * 0.35)

    if (coinRef.current) {
      coinRef.current.rotation.y = time * 2
      coinRef.current.position.y = 1.85 + Math.sin(time * 3) * 0.05
    }

    // Coins arc up out of the chest and fall back in, once per open.
    burst.current.forEach((coin, i) => {
      if (!coin) return
      const ct = t - i * 0.06
      const active = ct > 0 && ct < COIN_BURST_TIME
      coin.visible = active
      if (!active) return
      const [dx, vy] = COIN_BURST[i]
      const p = ct / COIN_BURST_TIME
      coin.position.set(dx * p, 0.5 + vy * 2.2 * ct - 5.5 * ct * ct, 0.25 * p)
      coin.rotation.set(ct * 9, ct * 6, 0)
    })
  })

  return (
    <group position={[stall.x, 0, stall.z]} rotation={[0, rotY, 0]} scale={STALL_SCALE}>
      <group ref={rootRef}>
      {/* front counter, wood cap and a row of studs along the top */}
      <Block position={[0, 0.6, DEPTH / 2 - 0.45]} size={[WIDTH, 1.2, 0.9]} material={MAT.brick} />
      <Block position={[0, 1.27, DEPTH / 2 - 0.4]} size={[WIDTH + 0.2, 0.16, 1.15]} material={MAT.wood} />
      {Array.from({ length: STUDS }, (_, i) => (
        <Block
          key={i}
          position={[-half + studW * (i + 0.5), 1.45, DEPTH / 2 - 0.4]}
          size={[studW * 0.6, 0.2, 0.5]}
          material={MAT.brick}
        />
      ))}
      {/* side rails (open sides) and back counter */}
      <Block position={[-half + 0.3, 0.3, -0.2]} size={[0.6, 0.6, DEPTH - 1.2]} material={MAT.brick} />
      <Block position={[half - 0.3, 0.3, -0.2]} size={[0.6, 0.6, DEPTH - 1.2]} material={MAT.brick} />
      <Block position={[0, 0.6, -DEPTH / 2 + 0.3]} size={[WIDTH, 1.2, 0.6]} material={MAT.brick} />
      {/* chunky posts: back pair taller so the canopy slopes forward */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => {
        const h = sz > 0 ? POST_FRONT_H : POST_BACK_H
        return (
          <Block
            key={`${sx}${sz}`}
            position={[sx * (half - POST / 2 + 0.1), h / 2, sz * (DEPTH / 2 - POST / 2)]}
            size={[POST, h, POST]}
            material={MAT.brick}
          />
        )
      })}
      <Vendor shirt={stall.stripes[0]} root={vendor} arm={arm} />
      <Canopy colors={stall.stripes} canopyRef={canopy} />
      {/* coin spinning on the counter */}
      <group ref={coinRef} position={[1.6, 1.85, DEPTH / 2 - 0.4]} scale={1.6}>
        <GoldCoin rotation={[Math.PI / 2, 0, 0]} />
      </group>
      {/* treasure chest out front, coins bursting from it */}
      <group position={[-1.9, 0, DEPTH / 2 + 1.1]} rotation={[0, 0.2, 0]} scale={CHEST_SCALE}>
        <TreasureChest lidRef={lid} />
        {COIN_BURST.map((_, i) => (
          <group key={i} ref={(el) => (burst.current[i] = el)} visible={false}>
            <GoldCoin />
          </group>
        ))}
      </group>
      </group>
      <Billboard position={[0, 5.9, 0.6]} px={0.016} lines={[{ text: stall.label, size: 84, icon: stall.icon }]} />
    </group>
  )
}

export default function Stalls() {
  return STALLS.map((s) => <Stall key={s.id} stall={s} />)
}
