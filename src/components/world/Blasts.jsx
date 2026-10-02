import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, FramebufferTexture, LinearFilter, NormalBlending, Object3D, ShaderMaterial, SRGBColorSpace, Vector2 } from 'three'
import { ORES } from '../../data/ores.js'
import { oreMaterial } from '../../utils/oreTextures.js'
import { MINE_CUBES } from '../../data/world.js'
import { onBlast } from '../../systems/mineCubes.js'
import { playExplosion } from '../../systems/sfx.js'
import { addShockwave, shockScale, SHOCK_LIFE, shockRadius } from '../../systems/cameraShake.js'

// Blast effects. Per blast: a hot core flash, a short fireball, a ground
// shockwave and a flickering point light (one shared light, so the light
// count never changes). The shockwave is a hemisphere that refracts the frame
// behind it (strongest at its silhouette, with slight colour fringing), a
// faint ground ring and a ring of dust thrown up by the front; its timing comes
// from systems/cameraShake.js, which shakes the camera as the front passes. Particles are soft billboard sprites in pooled
// THREE.Points: billowing smoke (normal blending), rolling fire (additive),
// ground dust, fast gravity sparks, plus a few flying debris cubes.
const SLOTS = 4
const SMOKE = 800
const FIRE = 600
const SPARKS = 450
const DEBRIS_N = 220
const GROUND_Y = MINE_CUBES.top + 0.1
// Velocity decay (1/s) of the shock-front dust; with v0 = reach * this, it
// travels close to the front's reach.
const SHOCK_DRAG = 2.6

const FIRE_COLS = ['#fffbe0', '#ffd25a', '#ff8a1e', '#d8400f', '#5a1a0a'].map((c) => new Color(c))
const _c = new Color()
const _dummy = new Object3D()
const _size = new Vector2()
const rnd = (a, b) => a + Math.random() * (b - a)

// Soft, slightly lumpy puff: radial falloff modulated by cheap value noise.
function puffTexture() {
  const S = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(S, S)
  const g = 8
  const grid = Array.from({ length: (g + 1) * (g + 1) }, () => Math.random())
  const noise = (x, y) => {
    const fx = (x / S) * g
    const fy = (y / S) * g
    const ix = Math.floor(fx)
    const iy = Math.floor(fy)
    const tx = fx - ix
    const ty = fy - iy
    const sx = tx * tx * (3 - 2 * tx)
    const sy = ty * ty * (3 - 2 * ty)
    const v = (i, j) => grid[j * (g + 1) + i]
    const a = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * sx
    const b = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * sx
    return a + (b - a) * sy
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x / S - 0.5) * 2
      const dy = (y / S - 0.5) * 2
      const d = Math.sqrt(dx * dx + dy * dy)
      const edge = 0.78 + (noise(x, y) - 0.5) * 0.5
      let a = Math.max(0, 1 - d / edge)
      a = a * a * (3 - 2 * a)
      const k = (y * S + x) * 4
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255
      img.data[k + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new CanvasTexture(cv)
  t.colorSpace = SRGBColorSpace
  return t
}

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aRot;
  attribute vec3 aColor;
  uniform float uScale;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    vAlpha = aAlpha;
    vRot = aRot;
    vColor = aColor;
  }
`
const frag = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot);
    float s = sin(vRot);
    vec2 uv = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
    float a = texture2D(uMap, uv).a * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

// Refraction shell: samples a copy of the frame taken just before it draws and
// offsets the lookup along the view-space normal, so the edge of the dome bends
// whatever is behind it.
const shockVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const shockFrag = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uRes;
  uniform float uStrength;
  uniform float uHaze;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    float rim = 1.0 - abs(dot(n, normalize(vV)));
    float band = pow(rim, 3.0);
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 off = n.xy * band * uStrength;
    vec3 col = vec3(
      texture2D(uScene, clamp(uv - off * 1.08, 0.0, 1.0)).r,
      texture2D(uScene, clamp(uv - off, 0.0, 1.0)).g,
      texture2D(uScene, clamp(uv - off * 0.92, 0.0, 1.0)).b
    );
    col = mix(col, vec3(0.96, 0.94, 0.9), band * uHaze);
    gl_FragColor = vec4(col, 1.0);
  }
`

function makePool(n) {
  const geo = new BufferGeometry()
  const attr = (name, size) => {
    const a = new BufferAttribute(new Float32Array(n * size), size)
    geo.setAttribute(name, a)
    return a
  }
  return {
    n,
    next: 0,
    geo,
    pos: attr('position', 3),
    size: attr('aSize', 1),
    alpha: attr('aAlpha', 1),
    rot: attr('aRot', 1),
    col: attr('aColor', 3),
    p: Array.from({ length: n }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, grow: 1, rot: 0, spin: 0, seed: 0, kind: 0, dark: 0 })),
  }
}

function poolMaterial(map, blending) {
  return new ShaderMaterial({
    uniforms: { uMap: { value: map }, uScale: { value: 600 } },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending,
    toneMapped: false,
  })
}

function stepPool(pool, dt, shade) {
  let live = false
  for (let i = 0; i < pool.n; i++) {
    const p = pool.p[i]
    if (p.life <= 0) continue
    live = true
    p.life -= dt
    if (p.life <= 0) {
      pool.size.setX(i, 0)
      pool.alpha.setX(i, 0)
      continue
    }
    const u = 1 - p.life / p.max
    shade(p, u, dt)
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.z += p.vz * dt
    p.rot += p.spin * dt
    pool.pos.setXYZ(i, p.x, p.y, p.z)
    pool.rot.setX(i, p.rot)
    pool.size.setX(i, p._s)
    pool.alpha.setX(i, p._a)
    pool.col.setXYZ(i, _c.r, _c.g, _c.b)
  }
  if (live || pool.dirty) {
    for (const a of [pool.pos, pool.size, pool.alpha, pool.rot, pool.col]) a.needsUpdate = true
    pool.dirty = live
  }
}

export default function Blasts() {
  const parts = useRef([])
  const light = useRef()
  const cores = useRef([])
  const balls = useRef([])
  const rings = useRef([])
  const shells = useRef([])
  const { gl, camera } = useThree()

  const mats = useMemo(() => ORES.map((o, i) => oreMaterial(o.id, i)), [])
  const fx = useMemo(() => {
    const map = puffTexture()
    return {
      map,
      smoke: makePool(SMOKE),
      fire: makePool(FIRE),
      sparks: makePool(SPARKS),
      smokeMat: poolMaterial(map, NormalBlending),
      fireMat: poolMaterial(map, AdditiveBlending),
      sparkMat: poolMaterial(map, AdditiveBlending),
      debris: Array.from({ length: DEBRIS_N }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, c: 0, rx: 0, ry: 0, sx: 0, sy: 0 })),
      debrisNext: 0,
      blasts: Array.from({ length: SLOTS }, () => ({ t0: -1, x: 0, y: 0, z: 0, s: 1, k: 1, shock: true })),
      slot: 0,
      grab: { tex: null, w: 0, h: 0, frame: -1 },
    }
  }, [])

  const shellMats = useMemo(
    () =>
      Array.from(
        { length: SLOTS },
        () =>
          new ShaderMaterial({
            uniforms: { uScene: { value: null }, uRes: { value: new Vector2(1, 1) }, uStrength: { value: 0 }, uHaze: { value: 0 } },
            vertexShader: shockVert,
            fragmentShader: shockFrag,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  )

  // Copies the frame (opaque pass done) into a texture, once per rendered frame
  // however many shells are visible.
  const grabFrame = (renderer) => {
    const g = fx.grab
    const frame = renderer.info.render.frame
    renderer.getDrawingBufferSize(_size)
    if (!g.tex || g.w !== _size.x || g.h !== _size.y) {
      g.tex?.dispose()
      g.tex = new FramebufferTexture(_size.x, _size.y)
      g.tex.minFilter = g.tex.magFilter = LinearFilter
      g.w = _size.x
      g.h = _size.y
      g.frame = -1
    }
    if (g.frame !== frame) {
      renderer.copyFramebufferToTexture(g.tex)
      g.frame = frame
    }
    for (const m of shellMats) {
      m.uniforms.uScene.value = g.tex
      m.uniforms.uRes.value.set(g.w, g.h)
    }
  }

  useEffect(
    () =>
      onBlast(({ x, y, z, cubes, power = 1, scale = 1, shock = true, debris = true }) => {
        playExplosion()
        const b = fx.blasts[fx.slot]
        fx.slot = (fx.slot + 1) % SLOTS
        b.t0 = performance.now()
        b.x = x
        b.y = y
        b.z = z
        // power 1 -> 1x ... 1.5M -> ~2.6x in size; counts grow faster (~4x)
        const lg = Math.log10(Math.max(1, power))
        // `scale` shrinks the whole blast (Training: 0.2); `shock: false` drops the shockwave and camera shake
        const S = (1 + lg * 0.26) * scale
        const C = (1 + lg * 0.5) * scale
        b.s = S
        b.k = shockScale(power)
        b.shock = shock
        if (shock) addShockwave(x, z, power)

        const emit = (pool, n, init) => {
          for (let k = 0; k < n; k++) {
            const p = pool.p[pool.next]
            pool.next = (pool.next + 1) % pool.n
            p.rot = rnd(0, 6.28)
            p.spin = rnd(-1.2, 1.2)
            p.seed = Math.random()
            init(p)
            p.life = p.max
          }
        }
        // random point in a sphere-ish blob, with outward-biased velocity
        const burst = (p, rad, speed, up) => {
          const a = rnd(0, Math.PI * 2)
          const e = rnd(-0.3, 1)
          const r = Math.sqrt(1 - e * e)
          const dx = Math.cos(a) * r
          const dz = Math.sin(a) * r
          const k = Math.random()
          p.x = x + dx * rad * k
          p.y = y + e * rad * k * 0.7
          p.z = z + dz * rad * k
          const s = speed * rnd(0.35, 1)
          p.vx = dx * s
          p.vz = dz * s
          p.vy = e * s * 0.8 + up * rnd(0.4, 1)
        }

        // fire: fast, short, rising billows
        emit(fx.fire, Math.round(110 * C), (p) => {
          burst(p, 0.9 * S, 7 * S, 4 * S)
          p.max = rnd(0.5, 1.1)
          p.size = rnd(1.8, 3.4) * S
          p.grow = rnd(0.8, 1.6)
        })
        // smoke: slower, much longer, grows large; two thirds rise as a column
        emit(fx.smoke, Math.round(150 * C), (p) => {
          burst(p, 1.2 * S, 3.8 * S, 3.5 * S)
          p.max = rnd(2.2, 4.2) * (0.8 + S * 0.2)
          p.size = rnd(2.2, 3.6) * S
          p.grow = rnd(2.0, 3.2)
          p.dark = rnd(0.55, 1)
          p.kind = 0
        })
        // low dust rolling out along the ground
        emit(fx.smoke, Math.round(50 * C), (p) => {
          const a = rnd(0, Math.PI * 2)
          const s = rnd(4, 8) * S
          p.x = x + Math.cos(a) * 0.6
          p.z = z + Math.sin(a) * 0.6
          p.y = GROUND_Y + rnd(0.1, 0.5)
          p.vx = Math.cos(a) * s
          p.vz = Math.sin(a) * s
          p.vy = rnd(0.2, 1)
          p.max = rnd(1.4, 2.4)
          p.size = rnd(2, 3.2) * S
          p.grow = rnd(1.8, 2.6)
          p.dark = rnd(0.9, 1.2)
          p.kind = 1
        })
        // dust kicked up by the shock front: drag-slowed so it keeps pace with
        // the front's deceleration and settles near its full reach
        const reach = shockRadius(SHOCK_LIFE, b.k)
        emit(fx.smoke, Math.round(70 * C), (p) => {
          const a = rnd(0, Math.PI * 2)
          const s = reach * SHOCK_DRAG * rnd(0.8, 1)
          p.x = x + Math.cos(a) * 0.8
          p.z = z + Math.sin(a) * 0.8
          p.y = GROUND_Y + rnd(0, 0.3)
          p.vx = Math.cos(a) * s
          p.vz = Math.sin(a) * s
          p.vy = rnd(0.5, 2)
          p.max = rnd(1.6, 2.6)
          p.size = rnd(1.6, 2.8) * S
          p.grow = rnd(1.6, 2.4)
          p.dark = rnd(0.9, 1.1)
          p.kind = 2
        })
        // sparks / embers
        emit(fx.sparks, Math.round(90 * C), (p) => {
          burst(p, 0.4 * S, 13 * S, 11 * S)
          p.max = rnd(0.7, 1.7)
          p.size = rnd(0.18, 0.45)
          p.grow = 1
        })
        // debris: chunks of the very cubes that were dug, with their own ore material
        const src = cubes.length ? cubes : [{ x, y: y - 1, z, ore: 0 }]
        const n = debris ? Math.min(DEBRIS_N, Math.round((10 + src.length * 2) * Math.sqrt(C))) : 0
        for (let k = 0; k < n; k++) {
          const cb = src[k % src.length]
          const d = fx.debris[fx.debrisNext]
          fx.debrisNext = (fx.debrisNext + 1) % DEBRIS_N
          const dx = cb.x - x
          const dz = cb.z - z
          const dist = Math.hypot(dx, dz) || 1
          const s = (rnd(2.5, 7) + dist * 0.8) * (0.7 + S * 0.3)
          d.x = cb.x + rnd(-0.8, 0.8)
          d.y = cb.y + rnd(-0.8, 0.8)
          d.z = cb.z + rnd(-0.8, 0.8)
          d.vx = (dx / dist) * s + rnd(-2, 2)
          d.vz = (dz / dist) * s + rnd(-2, 2)
          d.vy = rnd(6, 14) * (0.7 + S * 0.3)
          d.max = d.life = rnd(1.1, 1.9)
          d.size = rnd(0.35, 0.75)
          d.c = cb.ore
          d.rx = rnd(0, 6)
          d.ry = rnd(0, 6)
          d.sx = rnd(-9, 9)
          d.sy = rnd(-9, 9)
        }
      }),
    [fx],
  )

  const fireShade = (p, u, dt) => {
    p.vy += 3.5 * dt
    const drag = Math.max(0, 1 - 2.8 * dt)
    p.vx *= drag
    p.vz *= drag
    p.vy *= Math.max(0, 1 - 0.8 * dt)
    // swell fast, then shrink as it burns out
    p._s = p.size * (0.5 + p.grow * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.62)) * (1 - u * 0.35)
    const f = Math.min(0.999, u * 1.1) * (FIRE_COLS.length - 1)
    const a = Math.floor(f)
    _c.copy(FIRE_COLS[a]).lerp(FIRE_COLS[a + 1], f - a)
    // additive: fold brightness into colour so it fades toward black
    p._a = Math.min(1, (1 - u) * 1.6) * 0.8
  }
  const smokeShade = (p, u, dt) => {
    if (p.kind === 2) return shockDustShade(p, u, dt)
    p.vy += (p.kind ? 0.3 : 1.4) * dt
    const drag = Math.max(0, 1 - (p.kind ? 1.6 : 1.3) * dt)
    p.vx *= drag
    p.vz *= drag
    p.vy *= Math.max(0, 1 - 0.5 * dt)
    p._s = p.size * (0.5 + p.grow * Math.sqrt(u))
    // glows orange from the fire at first, then cools to grey and thins out
    const heat = Math.max(0, 1 - u * 4)
    const g = (0.12 + u * 0.3) * p.dark
    _c.setRGB(g, g * 0.97, g * 0.93)
    _c.r += heat * 0.55
    _c.g += heat * 0.2
    const fadeIn = Math.min(1, u * 14)
    p._a = fadeIn * (1 - u) * (1 - u) * (p.kind ? 0.38 : 0.62)
  }
  // pale, low dust riding the shock front: it thickens as the front sweeps out,
  // then hangs and thins
  const shockDustShade = (p, u, dt) => {
    const drag = Math.exp(-SHOCK_DRAG * dt)
    p.vx *= drag
    p.vz *= drag
    p.vy *= Math.exp(-1.5 * dt)
    p._s = p.size * (0.4 + p.grow * Math.sqrt(u))
    _c.setRGB(0.62 * p.dark, 0.56 * p.dark, 0.47 * p.dark)
    p._a = Math.min(1, u * 6) * (1 - u) * (1 - u) * 0.3
  }
  const sparkShade = (p, u, dt) => {
    p.vy -= 22 * dt
    if (p.y < GROUND_Y) {
      p.y = GROUND_Y
      p.vy *= -0.35
      p.vx *= 0.7
      p.vz *= 0.7
    }
    const drag = Math.max(0, 1 - 0.6 * dt)
    p.vx *= drag
    p.vz *= drag
    p._s = p.size * (1 - u * 0.6)
    _c.copy(FIRE_COLS[1]).lerp(FIRE_COLS[3], u)
    p._a = 1 - u * u
  }

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const now = performance.now()

    // sprite scale: pixels per world unit at distance 1
    const h = gl.getDrawingBufferSize(_size).y
    const scale = h / (2 * Math.tan((camera.fov * Math.PI) / 360))
    fx.smokeMat.uniforms.uScale.value = scale
    fx.fireMat.uniforms.uScale.value = scale
    fx.sparkMat.uniforms.uScale.value = scale

    let flash = 0
    let lx = 0
    let ly = 0
    let lz = 0
    for (let i = 0; i < SLOTS; i++) {
      const b = fx.blasts[i]
      const t = b.t0 < 0 ? 99 : (now - b.t0) / 1000
      const core = cores.current[i]
      const ball = balls.current[i]
      const ring = rings.current[i]
      const shell = shells.current[i]
      const coreT = t / 0.18
      const ballT = t / 0.5
      const shockT = t / SHOCK_LIFE
      core.visible = coreT < 1
      ball.visible = ballT < 1
      ring.visible = b.shock && shockT < 1
      shell.visible = b.shock && shockT < 1
      if (core.visible) {
        core.position.set(b.x, b.y, b.z)
        core.scale.setScalar((1 + coreT * 2.4) * b.s)
        core.material.opacity = (1 - coreT) * 0.95
      }
      if (ball.visible) {
        ball.position.set(b.x, b.y + ballT * 0.8, b.z)
        ball.scale.setScalar((1.4 + (1 - (1 - ballT) * (1 - ballT)) * 3.6) * b.s)
        ball.material.opacity = (1 - ballT) * (1 - ballT) * 0.55
      }
      if (shell.visible) {
        const r = Math.max(0.5, shockRadius(t, b.k))
        const fade = (1 - shockT) * (1 - shockT)
        shell.position.set(b.x, GROUND_Y - 0.05, b.z)
        // a little flattened: the dome hugs the ground as it spreads
        shell.scale.set(r, r * 0.75, r)
        const m = shell.material.uniforms
        m.uStrength.value = 0.025 * Math.min(2.2, 0.5 + b.k * 0.6) * fade * Math.min(1, t / 0.04)
        m.uHaze.value = 0.18 * fade
        ring.position.set(b.x, GROUND_Y + 0.02, b.z)
        ring.scale.setScalar(r)
        ring.material.opacity = fade * 0.35
      }
      // sharp hit, then a flickering burn-down while the fire lasts
      const S = b.s
      const f = t < 0.06 ? t / 0.06 : Math.max(0, 1 - (t - 0.06) / 1.1) * (0.8 + Math.sin(now * 0.05 + i) * 0.12 + Math.random() * 0.1)
      if (f * S > flash) {
        flash = f * S
        lx = b.x
        ly = b.y
        lz = b.z
      }
    }
    light.current.intensity = flash * flash * 320
    light.current.distance = 30 + flash * 12
    light.current.position.set(lx, ly + 1.5, lz)
    // hot white-yellow at the peak, settling to deep orange
    const fl = Math.min(1, flash)
    light.current.color.setRGB(1, 0.5 + fl * 0.3, 0.12 + fl * 0.25)

    stepPool(fx.smoke, dt, smokeShade)
    stepPool(fx.fire, dt, fireShade)
    stepPool(fx.sparks, dt, sparkShade)

    const counts = ORES.map(() => 0)
    for (let i = 0; i < DEBRIS_N; i++) {
      const d = fx.debris[i]
      if (d.life <= 0) continue
      d.life -= dt
      if (d.life <= 0) continue
      d.vy -= 24 * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.z += d.vz * dt
      if (d.y < GROUND_Y) {
        d.y = GROUND_Y
        d.vy *= -0.3
        d.vx *= 0.6
        d.vz *= 0.6
      }
      d.rx += d.sx * dt
      d.ry += d.sy * dt
      _dummy.position.set(d.x, d.y, d.z)
      _dummy.rotation.set(d.rx, d.ry, 0)
      _dummy.scale.setScalar(d.size * Math.min(1, d.life / 0.3))
      _dummy.updateMatrix()
      const mesh = parts.current[d.c]
      mesh.setMatrixAt(counts[d.c]++, _dummy.matrix)
    }
    ORES.forEach((_, k) => {
      const mesh = parts.current[k]
      if (mesh.count !== counts[k] || counts[k]) mesh.instanceMatrix.needsUpdate = true
      mesh.count = counts[k]
    })
  })

  return (
    <group>
      <pointLight ref={light} color="#ffa040" intensity={0} distance={30} decay={2} />
      <points geometry={fx.smoke.geo} material={fx.smokeMat} frustumCulled={false} renderOrder={1} />
      <points geometry={fx.fire.geo} material={fx.fireMat} frustumCulled={false} renderOrder={2} />
      <points geometry={fx.sparks.geo} material={fx.sparkMat} frustumCulled={false} renderOrder={3} />
      {ORES.map((o, k) => (
        <instancedMesh key={o.id} ref={(m) => (parts.current[k] = m)} args={[undefined, mats[k], DEBRIS_N]} frustumCulled={false} count={0}>
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
      ))}
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i}>
          <mesh ref={(m) => (cores.current[i] = m)} visible={false}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#fff6d0" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh ref={(m) => (balls.current[i] = m)} visible={false}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ff8a20" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh ref={(m) => (rings.current[i] = m)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.93, 1, 64]} />
            <meshBasicMaterial color="#ffe9b0" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} side={DoubleSide} />
          </mesh>
          <mesh ref={(m) => (shells.current[i] = m)} material={shellMats[i]} visible={false} frustumCulled={false} onBeforeRender={grabFrame}>
            <sphereGeometry args={[1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
