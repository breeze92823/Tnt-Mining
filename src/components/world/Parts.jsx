import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { billboardTexture, tntFaces } from '../../utils/labels.js'

// Small building blocks shared by the hub components.

// Axis-aligned box from its centre and size.
export function Block({ position, size, material, cast = true, receive = true, rotation }) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// Box spanning x0..x1, z0..z1, from y0 up to y1.
export function Slab({ x0, x1, z0, z1, y0 = 0, y1, material, cast = false }) {
  return (
    <Block
      position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]}
      size={[x1 - x0, y1 - y0, z1 - z0]}
      material={material}
      cast={cast}
    />
  )
}

// Roblox BillboardGui: camera-facing text lines (see labels.billboardTexture).
// `px` is metres per canvas pixel, so equal font sizes read equal in-world.
export function Billboard({ lines, position, px = 0.012 }) {
  const key = JSON.stringify(lines)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { texture, aspect } = useMemo(() => billboardTexture(lines), [key])
  const h = texture.image.height * px
  return (
    <sprite position={position} scale={[h * aspect, h, 1]} renderOrder={2}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

const faceCache = new Map()
function tntMaterials(kind) {
  if (!faceCache.has(kind)) {
    faceCache.set(kind, tntFaces(kind).map((map) => new MeshStandardMaterial({ map, roughness: 0.7 })))
  }
  return faceCache.get(kind)
}

export function TntBlock({ kind = 'green', size = 1.6, ...props }) {
  const mats = useMemo(() => tntMaterials(kind), [kind])
  return (
    <mesh material={mats} castShadow {...props}>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  )
}
