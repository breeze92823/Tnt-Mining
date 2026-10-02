import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Box3, BoxGeometry, Color, DoubleSide, EdgesGeometry, Object3D, Plane, Raycaster, Vector3 } from 'three'
import { COLORS, FOREST_SIGN, FLOOR_TOP, GATE, GROUND, INFO_BOARDS, MINE_CUBES, NORTH, NORTH_TREES, WALL, WORLD_BOUNDS, rectsAround } from '../../data/world.js'
import { FUSE_MS, cubeCenter, getVersion, igniteTnt, isRemoved, litTnt, onBlast, placeTnt, placedTnt, previewCube, subscribe, tntKindAt } from '../../systems/mineCubes.js'
import { playExplosion, playFuse } from '../../systems/sfx.js'
import { touchState } from '../../systems/input.js'
import { player } from '../../systems/playerState.js'
import { useGameStore } from '../../store/useGameStore.js'
import { MAT, solid } from '../../materials/hub.js'
import { tileMaterial } from '../../materials/tile.js'
import { billboardTexture, forestSignTexture, infoBoardTexture } from '../../utils/labels.js'
import { Block, Slab, TntBlock } from './Parts.jsx'
import { Tree } from './Props.jsx'

// North zone, past the hub's checkered line: a bright-green field with four
// signboards fanned out in front of a wooden fence. The fence opens through
// the studded "Mine" arch onto the fenced, orange-tiled Forest Mine floor;
// the black "Forest" sign with its price bar hangs on the north wall beyond.
// Layout: NORTH, GATE,
// FOREST_SIGN, INFO_BOARDS and NORTH_TREES in data/world.js.
const T = FLOOR_TOP
const W = WALL.inner
const field = solid(NORTH.grass, COLORS.wall)
const checker = tileMaterial({ top: '#f2f2f2', top2: '#151515', side: '#d8d8d8', checker: 1, speckle: 0.3, roughness: 0.7 })
const mineFloor = tileMaterial({ top: '#ea8b3c', top2: '#e3823a', side: '#c96f2c', checker: 2, grout: '#c46a29', studs: 1, studAmt: 0.6, speckle: 0.8, roughness: 0.9 })
const pitBed = solid('#a45a2a', '#8f4f26')
const fenceWood =solid('#a8642f', '#94562a')
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

// The tall black "Forest" board hung on the north wall, facing the plaza.
function ForestSign() {
  const { z, w, y0, y1, price } = FOREST_SIGN
  const map = useMemo(() => forestSignTexture(price), [price])
  const h = y1 - y0
  return (
    <group>
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

// The mine floor: one instanced mesh, a cube per grid cell and layer, `layers`
// deep (systems/mineCubes.js). A dug cube is scaled to nothing, which opens the
// hole down through the layers below.
function MineCubes() {
  const ref = useRef()
  useLayoutEffect(() => {
    const mesh = ref.current
    const dummy = new Object3D()
    const { size, cols, rows, layers, top } = MINE_CUBES
    const apply = () => {
      for (let layer = 0; layer < layers; layer++) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const c = cubeCenter(col, row)
            dummy.position.set(c.x, top - (layer + 0.5) * size, c.z)
            dummy.scale.setScalar(isRemoved(col, row, layer) ? 0 : 1)
            dummy.updateMatrix()
            mesh.setMatrixAt((layer * rows + row) * cols + col, dummy.matrix)
          }
        }
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    apply()
    return subscribe(apply)
  }, [])
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, MINE_CUBES.cols * MINE_CUBES.rows * MINE_CUBES.layers]}
      material={mineFloor}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[MINE_CUBES.size, MINE_CUBES.size, MINE_CUBES.size]} />
    </instancedMesh>
  )
}

// Holding TNT (hotbar slot 0) inside the mine: a ghost cube, the same size as
// a floor cube, sits on top of the column the mouse points at when that
// is within range of the player, else on the nearest one to the pointer (touch:
// the one ahead of the player). Moved imperatively each frame; hidden
// everywhere else.
const _ray = new Raycaster()
const _plane = new Plane(new Vector3(0, 1, 0), 0)
const _hit = new Vector3()
const _ghostGeo = new BoxGeometry(MINE_CUBES.size, MINE_CUBES.size, MINE_CUBES.size)
const _ghostEdges = new EdgesGeometry(_ghostGeo)
function TntPreview() {
  const ref = useRef()
  const shown = useRef({ col: -1, row: -1, y: 0 })
  const gl = useThree((s) => s.gl)

  // Left click on the indicated cube places a TNT block there (costs one TNT).
  useEffect(() => {
    const el = gl.domElement
    const onDown = (e) => {
      if (e.button !== 0 || !ref.current || !ref.current.visible) return
      const { col, row } = shown.current
      const { slot, tnt, placeMax, tntEquipped } = useGameStore.getState()
      if (slot !== 0 || tnt <= 0 || placedTnt().size >= placeMax) return // placeMax: Upgrades panel
      if (placeTnt(col, row, tntEquipped)) useGameStore.setState({ tnt: tnt - 1 })
    }
    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
  }, [gl])
  useFrame(({ camera, pointer }, delta) => {
    const g = ref.current
    if (!g) return
    let c = null
    if (useGameStore.getState().slot === 0) {
      // Mouse aim: the pointer's ray hits the plane of the cubes' top faces.
      let aim = null
      if (!touchState.active) {
        _ray.setFromCamera(pointer, camera)
        _plane.constant = -MINE_CUBES.top
        aim = _ray.ray.intersectPlane(_plane, _hit) ? _hit : null
      }
      c = previewCube(player.position.x, player.position.z, player.facing, aim, shown.current.col, shown.current.row)
    }
    if (!c) {
      if (g.visible) g.visible = false
      shown.current.col = -1
      return
    }
    const p = cubeCenter(c.col, c.row)
    shown.current.col = c.col
    shown.current.row = c.row
    shown.current.y = p.y
    const ty = p.y + MINE_CUBES.size / 2
    if (!g.visible) {
      g.visible = true
      g.position.set(p.x, ty, p.z)
    } else {
      // Glide to the target cube instead of snapping (frame-rate independent).
      const k = 1 - Math.exp(-delta * 30)
      g.position.x += (p.x - g.position.x) * k
      g.position.y += (ty - g.position.y) * k
      g.position.z += (p.z - g.position.z) * k
    }
  })
  return (
    <group ref={ref} visible={false}>
      <mesh geometry={_ghostGeo}>
        <meshStandardMaterial color="#2bc04a" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <lineSegments geometry={_ghostEdges}>
        <lineBasicMaterial color="#b8ffb0" />
      </lineSegments>
    </group>
  )
}

// A placed TNT block. Once lit it swells and flashes white, faster as the fuse
// runs down (systems/mineCubes.js litTnt gives the blast time).
const _flashGeo = new BoxGeometry(MINE_CUBES.size * 1.03, MINE_CUBES.size * 1.03, MINE_CUBES.size * 1.03)
function Tnt({ index, kind, x, y, z }) {
  const group = useRef()
  const flash = useRef()
  useFrame(() => {
    const g = group.current
    const f = flash.current
    const at = litTnt().get(index)
    if (!g || !f || at === undefined) return
    const t = Math.min(1, Math.max(0, 1 - (at - performance.now()) / FUSE_MS))
    const wave = Math.sin(t * t * 60) * 0.5 + 0.5 // pulses speed up toward the blast
    f.material.opacity = wave * (0.35 + 0.5 * t)
    g.scale.setScalar(1 + wave * 0.05 + t * 0.08)
  })
  const isLit = litTnt().has(index)
  return (
    <group ref={group} position={[x, y, z]}>
      <TntBlock kind={kind} size={MINE_CUBES.size} />
      {isLit && (
        <mesh ref={flash} geometry={_flashGeo}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

// Placed TNT blocks, one per cube holding one. Few at a time (the supply is
// small), so plain meshes; re-rendered only when the set changes.
function PlacedTnt() {
  const version = useSyncExternalStore(subscribe, getVersion)
  const cells = useMemo(() => {
    const out = []
    for (const i of placedTnt()) {
      const col = i % MINE_CUBES.cols
      const row = Math.floor(i / MINE_CUBES.cols)
      const c = cubeCenter(col, row)
      out.push({ i, kind: tntKindAt(i), x: c.x, y: c.y + MINE_CUBES.size / 2, z: c.z })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])
  return cells.map((c) => <Tnt key={c.i} index={c.i} kind={c.kind} x={c.x} y={c.y} z={c.z} />)
}

// Holding the pickaxe (hotbar slot 1), left click on a placed TNT block that
// is in reach and under the mouse lights its fuse. Touch has no pointer to aim
// with, so it lights the nearest unlit block in reach.
const IGNITE_REACH = 4.5
const _box = new Box3()
const _boxHit = new Vector3()
function TntIgniter() {
  const get = useThree((s) => s.get)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    const { size, cols } = MINE_CUBES
    const onDown = (e) => {
      if (e.button !== 0 || useGameStore.getState().slot !== 1) return
      const { camera, pointer } = get()
      const touch = touchState.active
      if (!touch) _ray.setFromCamera(pointer, camera)
      let best = -1
      let bestD = Infinity
      for (const i of placedTnt()) {
        if (litTnt().has(i)) continue
        const c = cubeCenter(i % cols, Math.floor(i / cols))
        const reach = Math.hypot(c.x - player.position.x, c.z - player.position.z)
        if (reach > IGNITE_REACH) continue
        let d
        if (touch) d = reach
        else {
          _box.min.set(c.x - size / 2, c.y, c.z - size / 2)
          _box.max.set(c.x + size / 2, c.y + size, c.z + size / 2)
          if (!_ray.ray.intersectBox(_box, _boxHit)) continue
          d = _ray.ray.origin.distanceTo(_boxHit)
        }
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      if (best >= 0 && igniteTnt(best % cols, Math.floor(best / cols))) playFuse()
    }
    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
  }, [gl, get])
  return null
}

// Blast effects: per blast a fireball, a ground shockwave ring and a point
// light flash (one shared light, so the light count never changes and nothing
// recompiles), plus a pooled instanced-cube particle burst of fire, smoke and
// flying debris.
const PARTICLES = 320
const SLOTS = 4
const _col = new Color()
const _dummy = new Object3D()
const FIRE = [new Color('#fff1a8'), new Color('#ff9a1e'), new Color('#d83a12'), new Color('#2a1a14')]
const DEBRIS = [new Color('#6d3f1f'), new Color('#2bc04a'), new Color('#ea8b3c'), new Color('#1c7a2f')]
function Blasts() {
  const parts = useRef()
  const light = useRef()
  const balls = useRef([])
  const rings = useRef([])
  const state = useMemo(
    () => ({
      p: Array.from({ length: PARTICLES }, () => ({ life: 0, max: 1, kind: 0, size: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, c: 0 })),
      next: 0,
      blasts: Array.from({ length: SLOTS }, () => ({ t0: -1, x: 0, y: 0, z: 0 })),
      slot: 0,
    }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = parts.current
    _dummy.scale.setScalar(0)
    _dummy.updateMatrix()
    for (let i = 0; i < PARTICLES; i++) {
      mesh.setMatrixAt(i, _dummy.matrix)
      mesh.setColorAt(i, _col.set('#ffffff'))
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  }, [])

  useEffect(
    () =>
      onBlast(({ x, y, z }) => {
        playExplosion()
        const b = state.blasts[state.slot]
        state.slot = (state.slot + 1) % SLOTS
        b.t0 = performance.now()
        b.x = x
        b.y = y
        b.z = z
        const spawn = (kind, n, speed, up, life, size) => {
          for (let k = 0; k < n; k++) {
            const p = state.p[state.next]
            state.next = (state.next + 1) % PARTICLES
            const a = Math.random() * Math.PI * 2
            const s = speed * (0.4 + Math.random() * 0.8)
            p.kind = kind
            p.x = x + (Math.random() - 0.5) * 1.4
            p.y = y + (Math.random() - 0.5) * 1.2
            p.z = z + (Math.random() - 0.5) * 1.4
            p.vx = Math.cos(a) * s
            p.vz = Math.sin(a) * s
            p.vy = up * (0.4 + Math.random() * 0.9)
            p.max = life * (0.7 + Math.random() * 0.6)
            p.life = p.max
            p.size = size * (0.6 + Math.random() * 0.8)
            p.c = Math.floor(Math.random() * DEBRIS.length)
          }
        }
        spawn(0, 90, 5, 6, 0.7, 0.9) // fire
        spawn(1, 60, 2.5, 3.5, 1.6, 1.2) // smoke
        spawn(2, 60, 7, 11, 1.4, 0.35) // debris
      }),
    [state],
  )

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const now = performance.now()
    const mesh = parts.current

    let flash = 0
    let fx = 0
    let fy = 0
    let fz = 0
    for (let i = 0; i < SLOTS; i++) {
      const b = state.blasts[i]
      const ball = balls.current[i]
      const ring = rings.current[i]
      const t = b.t0 < 0 ? 99 : (now - b.t0) / 1000
      const ballT = t / 0.55
      const ringT = t / 0.7
      ball.visible = ballT < 1
      ring.visible = ringT < 1
      if (ball.visible) {
        ball.position.set(b.x, b.y, b.z)
        ball.scale.setScalar(1.2 + (1 - (1 - ballT) * (1 - ballT)) * 4.2)
        ball.material.opacity = (1 - ballT) * 0.9
      }
      if (ring.visible) {
        ring.position.set(b.x, b.y - MINE_CUBES.size / 2 + 0.08, b.z)
        ring.scale.setScalar(1 + (1 - (1 - ringT) * (1 - ringT)) * 7)
        ring.material.opacity = (1 - ringT) * 0.7
      }
      const f = Math.max(0, 1 - t / 0.5)
      if (f > flash) {
        flash = f
        fx = b.x
        fy = b.y
        fz = b.z
      }
    }
    light.current.intensity = flash * flash * 260
    light.current.position.set(fx, fy + 1.5, fz)

    let live = false
    for (let i = 0; i < PARTICLES; i++) {
      const p = state.p[i]
      if (p.life <= 0) continue
      live = true
      p.life -= dt
      if (p.life <= 0) {
        _dummy.scale.setScalar(0)
        _dummy.position.set(0, 0, 0)
        _dummy.updateMatrix()
        mesh.setMatrixAt(i, _dummy.matrix)
        continue
      }
      const u = 1 - p.life / p.max // 0 fresh -> 1 gone
      if (p.kind === 2) p.vy -= 24 * dt
      else if (p.kind === 0) p.vy += 2 * dt
      else p.vy += 1 * dt
      const drag = p.kind === 2 ? 1 : Math.max(0, 1 - 2.5 * dt)
      p.vx *= drag
      p.vz *= drag
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      if (p.kind === 2 && p.y < MINE_CUBES.top + 0.1) {
        p.y = MINE_CUBES.top + 0.1
        p.vy *= -0.3
        p.vx *= 0.6
        p.vz *= 0.6
      }
      let s = p.size
      if (p.kind === 0) {
        s *= 1 - u * 0.8
        const f = u * (FIRE.length - 1)
        const a = Math.min(FIRE.length - 2, Math.floor(f))
        _col.copy(FIRE[a]).lerp(FIRE[a + 1], f - a)
      } else if (p.kind === 1) {
        s *= 0.6 + u * 1.6
        _col.set('#4a4642').multiplyScalar(1 - u * 0.5)
      } else {
        s *= 1 - u * 0.4
        _col.copy(DEBRIS[p.c])
      }
      _dummy.position.set(p.x, p.y, p.z)
      _dummy.rotation.set(u * 9 * (p.c + 1), u * 7, 0)
      _dummy.scale.setScalar(s)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      mesh.setColorAt(i, _col)
    }
    if (live || mesh.userData.dirty) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor.needsUpdate = true
      mesh.userData.dirty = live
    }
  })

  return (
    <group>
      <pointLight ref={light} color="#ffa040" intensity={0} distance={22} decay={2} />
      <instancedMesh ref={parts} args={[undefined, undefined, PARTICLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i}>
          <mesh ref={(m) => (balls.current[i] = m)} visible={false}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ffb030" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh ref={(m) => (rings.current[i] = m)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#ffe9b0" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function MineGate() {
  const half = GROUND.size / 2
  const { x0, x1, z0, z1 } = NORTH.mine
  return (
    <group>
      {/* ground under the moved-back north wall, then the field and the start line;
          the ground and field are cut open over the mine so a removed cube leaves a hole */}
      {rectsAround({ x0: -half, x1: half, z0: WORLD_BOUNDS.minZ, z1: -half }, NORTH.mine).map((r, i) => (
        <Slab key={`g${i}`} {...r} y0={-GROUND.depth} y1={0} material={MAT.grass} />
      ))}
      {rectsAround({ x0: -W, x1: W, z0: NORTH.wallZ, z1: NORTH.checkerZ - 2 }, NORTH.mine).map((r, i) => (
        <Slab key={`f${i}`} {...r} y1={T} material={field} />
      ))}
      <Slab x0={x0} x1={x1} z0={z0} z1={z1} y0={MINE_CUBES.bottom - 2} y1={MINE_CUBES.bottom} material={pitBed} />
      <Slab x0={-W} x1={W} z0={NORTH.checkerZ - 2} z1={NORTH.checkerZ} y0={0} y1={T + 0.03} material={checker} />
      <MineCubes />
      <TntPreview />
      <PlacedTnt />
      <TntIgniter />
      <Blasts />
      <MineFence />
      <MineArch />
      <ForestSign />
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
