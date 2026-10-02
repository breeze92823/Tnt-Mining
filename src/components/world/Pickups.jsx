import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BoxGeometry, CanvasTexture, Color, Object3D, PlaneGeometry, SRGBColorSpace } from 'three'
import { ORES } from '../../data/ores.js'
import { oreMaterial } from '../../utils/oreTextures.js'
import { FADE, LIFETIME, PICKUP_SIZE, pickups } from '../../systems/pickups.js'

// Ore pickups dropped by dug mine cubes (systems/pickups.js): small spinning
// ore cubes, one instanced mesh per ore so they match the blocks they came from.
// Each bobs on a camera-facing glow halo in its rarity colour; the halo is bigger
// and pulses while the pickup is inside the player's Collection Range.
const MAX = 6000 // above the mine's cube count (cols x rows x layers)
const _geo = new BoxGeometry(PICKUP_SIZE, PICKUP_SIZE, PICKUP_SIZE)
const _haloGeo = new PlaneGeometry(1, 1)
const _dummy = new Object3D()
const _col = new Color()
const GLOW = ['#ffb067', '#9fd0ff', '#ffe08a', '#ffc21a', '#4fe3ff', '#5a8bff'].map((c) => new Color(c)) // by ORES index

function haloTexture() {
  const S = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const t = new CanvasTexture(cv)
  t.colorSpace = SRGBColorSpace
  return t
}

export default function Pickups() {
  const refs = useRef([])
  const halo = useRef()
  const mats = useMemo(() => ORES.map((o, i) => oreMaterial(o.id, i)), [])
  const map = useMemo(haloTexture, [])
  useFrame(({ camera }) => {
    const now = performance.now() / 1000
    const counts = ORES.map(() => 0)
    let h = 0
    for (const p of pickups) {
      const mesh = refs.current[p.ore]
      if (!mesh || counts[p.ore] >= MAX) continue
      const bob = p.age > 1 && !p.pull ? Math.sin(now * 3 + p.spin) * 0.07 + 0.08 : 0
      _dummy.position.set(p.x, p.y + bob, p.z)
      _dummy.rotation.set(0, p.spin, 0)
      const fade = p.pull ? 1 : Math.max(0, Math.min(1, (LIFETIME - p.age) / FADE)) // shrinks away before expiring
      _dummy.scale.setScalar(fade)
      _dummy.updateMatrix()
      mesh.setMatrixAt(counts[p.ore]++, _dummy.matrix)

      const pulse = p.near ? 0.75 + 0.25 * Math.sin(now * 8 + p.spin) : 0.45
      _dummy.quaternion.copy(camera.quaternion) // face the camera
      _dummy.scale.setScalar(PICKUP_SIZE * (p.near ? 3.6 : 2.6) * fade)
      _dummy.updateMatrix()
      halo.current.setMatrixAt(h, _dummy.matrix)
      halo.current.setColorAt(h, _col.copy(GLOW[p.ore]).multiplyScalar(pulse))
      h++
    }
    refs.current.forEach((mesh, k) => {
      if (mesh.count || counts[k]) mesh.instanceMatrix.needsUpdate = true
      mesh.count = counts[k]
    })
    const m = halo.current
    if (m.count || h) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    m.count = h
  })
  return (
    <>
      {ORES.map((o, i) => (
        <instancedMesh key={o.id} ref={(m) => (refs.current[i] = m)} args={[_geo, mats[i], MAX]} count={0} castShadow frustumCulled={false} />
      ))}
      <instancedMesh ref={halo} args={[_haloGeo, undefined, MAX]} count={0} frustumCulled={false} renderOrder={4}>
        <meshBasicMaterial map={map} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  )
}
