import { useEffect, useMemo } from 'react'
import { LB_BOARD_X, LB_BOARDS, LB_STAGE, WALL } from '../../data/world.js'
import { MAT } from '../../materials/hub.js'
import { bannerTexture, leaderboardTexture, setLeaderboardRows } from '../../utils/labels.js'
import { subscribeLeaderboard } from '../../systems/net.js'
import { Block, Slab } from './Parts.jsx'

// East zone: a two-step grey stage with a red carpet up the middle, three
// leaderboards on posts and the purple "Leaderboards" banner over them.
const BOARD_X = LB_BOARD_X

function Board({ board }) {
  const map = useMemo(() => leaderboardTexture(board), [board])
  const top = LB_STAGE.top
  return (
    <group position={[BOARD_X, 0, board.z]}>
      {[-2.8, 2.8].map((dz) => (
        <Block key={dz} position={[0.3, top + 4, dz]} size={[0.4, 8, 0.4]} material={MAT.dark} />
      ))}
      <Block position={[0.3, top + 4.6, 0]} size={[0.35, 7.6, 6.2]} material={MAT.brick} />
      <mesh position={[0.1, top + 4.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5.8, 7.25]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Banner() {
  const map = useMemo(() => bannerTexture('Leaderboards', { bg: '#6a1fb4', border: '#f5b82e', inner: '#4d1287', w: 1280, size: 160 }), [])
  return (
    <group position={[WALL.inner - 0.6, 0, 0]}>
      {[-7.5, 7.5].map((z) => (
        <Block key={z} position={[0, 7, z]} size={[0.5, 11, 0.5]} material={MAT.dark} />
      ))}
      <Block position={[0.1, 12.2, 0]} size={[0.3, 3.8, 16.4]} material={MAT.gold} />
      <mesh position={[-0.07, 12.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[16, 3.6]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function Leaderboards() {
  const s = LB_STAGE
  return (
    <group>
      <Slab x0={s.x0} x1={s.x1} z0={s.z0} z1={s.z1} y1={s.step} material={MAT.floorDark} />
      <Slab x0={s.x0 + 2} x1={s.x1} z0={s.z0} z1={s.z1} y1={s.top} material={MAT.floor} />
      {/* red carpet: runner, step and landing */}
      <Slab x0={s.x0 - 4} x1={s.x0} z0={-2.5} z1={2.5} y0={0.38} y1={0.43} material={MAT.carpet} />
      <Slab x0={s.x0 - 0.05} x1={s.x0 + 2} z0={-2.5} z1={2.5} y0={s.step - 0.02} y1={s.step + 0.03} material={MAT.carpet} />
      <Slab x0={s.x0 + 1.95} x1={BOARD_X - 3} z0={-2.5} z1={2.5} y0={s.top - 0.02} y1={s.top + 0.03} material={MAT.carpet} />
      {LB_BOARDS.map((b) => (
        <Board key={b.id} board={b} />
      ))}
      <Banner />
    </group>
  )
}
