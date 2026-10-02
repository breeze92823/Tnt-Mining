// The 3D model of the selected inventory item, held in front of the chest by
// both hands (arm pose: setHolding(gait, 'both') in avatarAnim.js).
// Framework-free; the item order matches components/hud/Panels.jsx INVENTORY
// (slot = index). Models are in rig units (the avatar root scales them to
// metres), +Y up, the grip at the origin, widths kept near the hand gap.
import {
  BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial,
} from 'three'
import { bothHandsLayout } from './avatarAnim.js'


const mat = (color, extra) => new MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra })
const box = (w, h, d, material, x = 0, y = 0, z = 0) => {
  const m = new Mesh(new BoxGeometry(w, h, d), material)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}
const cyl = (r, h, material, x = 0, y = 0, z = 0) => {
  const m = new Mesh(new CylinderGeometry(r, r, h, 8), material)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

const BUILDERS = [
  // TNT (recoloured to the equipped type): a block with darker bands, a white label and a lit fuse.
  () => {
    const g = new Group()
    const body = mat('#2bc04a')
    const band = mat('#1c7a2f')
    g.add(box(1.3, 1.3, 1.3, body, 0, 0.5, 0))
    g.add(box(1.34, 0.22, 1.34, band, 0, 0.1, 0))
    g.add(box(1.34, 0.22, 1.34, band, 0, 0.9, 0))
    g.add(box(0.7, 0.34, 1.36, mat('#f4f4f4'), 0, 0.5, 0))
    g.userData.body = body
    g.userData.band = band
    g.add(cyl(0.06, 0.4, mat('#3a2a1a'), 0, 1.35, 0))
    g.add(box(0.14, 0.14, 0.14, mat('#ff8a1e', { emissive: '#ff6a00', emissiveIntensity: 1 }), 0, 1.6, 0))
    return g
  },
  // Pickaxe: wooden handle with a stone head across the top.
  () => {
    const g = new Group()
    g.add(cyl(0.12, 2.6, mat('#8a5a2b'), 0, 0.5, 0))
    g.add(box(2.1, 0.3, 0.3, mat('#9aa1a8', { metalness: 0.4 }), 0, 1.75, 0))
    g.add(box(0.3, 0.5, 0.34, mat('#6d7279'), 1.0, 1.55, 0))
    g.add(box(0.3, 0.5, 0.34, mat('#6d7279'), -1.0, 1.55, 0))
    return g
  },
  // Dirt block.
  () => {
    const g = new Group()
    g.add(box(1.2, 1.2, 1.2, mat('#7a4e2a'), 0, 0.5, 0))
    g.add(box(1.24, 0.28, 1.24, mat('#4fae3a'), 0, 1.0, 0))
    return g
  },
]

// Attach to the rig's chest (Spine2), centred between the two hands. Returns
// null when the rig lacks the bones.
export function createHeldItem(avatar) {
  const nodes = (avatar && avatar.nodes) || {}
  const chest = nodes.Spine2
  if (!chest || !bothHandsLayout(nodes)) return null

  const holder = new Group()
  chest.add(holder)

  const models = BUILDERS.map((build) => {
    const m = build()
    m.visible = false
    holder.add(m)
    return m
  })
  let slot = -1
  let shown = true // false while the bent-over pose hides the item

  return {
    // Recolour the TNT model ({ right: body, left: bands }).
    tintTnt(c) {
      models[0].userData.body.color.set(c.right)
      models[0].userData.band.color.set(c.left)
    },
    select(i) {
      slot = i == null ? -1 : i // null/-1: hands empty
      for (let j = 0; j < models.length; j++) models[j].visible = shown && j === i
    },
    // Re-centre between the hands (proportions can change), undo the torso
    // stretch, and hide while the bent-over pose lets the arms hang.
    update(bend = 0) {
      const l = bothHandsLayout(nodes)
      if (l) holder.position.set(0, l.y - 0.4, l.z)
      const sp = nodes.Spine1
      if (sp) holder.scale.set(1 / (sp.scale.x || 1), 1 / (sp.scale.y || 1), 1 / (sp.scale.z || 1))
      const show = bend < 0.3
      if (show !== shown) {
        shown = show
        if (slot >= 0) models[slot].visible = show
      }
    },
    dispose() {
      chest.remove(holder)
      holder.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) o.material.dispose()
      })
    },
  }
}
