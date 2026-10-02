import { useEffect } from 'react'
import { closePanel, useGameStore } from '../../store/useGameStore.js'
import { resetPlayer } from '../../systems/playerState.js'
import { syncYawToPlayer } from '../../systems/cameraOrbit.js'
import { setSetting, settings } from '../../systems/settingsState.js'
import { useSettings } from '../../systems/bloxityHooks.js'
import {
  BagIcon, BasketIcon, BurstIcon, CalendarIcon, CashIcon, DirtIcon, GearIcon, GemIcon, GiftIcon,
  PickaxeIcon, PlusIcon, PotionIcon, RebirthIcon, ScrollIcon, TeleportIcon, TntIcon,
} from './icons.jsx'

// Modal windows opened from the HUD buttons. One open at a time
// (useGameStore.panel); click the backdrop or ✕ to close.

const TNT_SHOP = [
  { name: 'Green TNT', rarity: 'Uncommon', dmg: '218 DMG', price: 'Owned', color: '#2bc04a' },
  { name: 'Red TNT', rarity: 'Rare', dmg: '540 DMG', price: '$1,500', color: '#e3262b' },
  { name: 'Corrupt TNT', rarity: 'Epic', dmg: 'Big Explosion!', price: '69', gem: true, color: '#ffd400' },
  { name: 'Atomic TNT', rarity: 'Legendary', dmg: 'Huge Explosion!', price: '205', gem: true, color: '#7ee81e' },
  { name: 'Admin TNT', rarity: 'Mythic', dmg: 'Massive Explosion!', price: '449', gem: true, color: '#e01b24' },
]

const DESTINATIONS = [
  { name: 'Spawn', pos: { x: 0, y: 0.3, z: 2 }, facing: Math.PI },
  { name: 'Desert Mine', pos: { x: 0, y: 0.4, z: -36 }, facing: Math.PI },
  { name: 'Training', pos: { x: -27, y: 0.4, z: 0 }, facing: -Math.PI / 2 },
  { name: 'Leaderboards', pos: { x: 29, y: 0.4, z: 0 }, facing: Math.PI / 2 },
  { name: 'Premium TNT', pos: { x: 0, y: 0.4, z: 26 }, facing: 0 },
]

const DAILY = [
  { day: 1, reward: '$250', Icon: CashIcon },
  { day: 2, reward: '3 TNT', Icon: TntIcon },
  { day: 3, reward: '5 Gems', Icon: GemIcon },
  { day: 4, reward: '$1,000', Icon: CashIcon },
  { day: 5, reward: 'Potion', Icon: PotionIcon },
  { day: 6, reward: '15 Gems', Icon: GemIcon },
  { day: 7, reward: 'Mystery', Icon: GiftIcon },
]

function Shop() {
  return (
    <div className="panel-list">
      {TNT_SHOP.map((t) => (
        <div key={t.name} className="panel-item">
          <span className="panel-swatch" style={{ background: t.color }}>TNT</span>
          <div className="panel-item-text">
            <b>{t.name}</b>
            <small>{t.rarity} · {t.dmg}</small>
          </div>
          <button type="button" className={`panel-btn${t.price === 'Owned' ? ' is-muted' : ''}`}>
            {t.gem && <GemIcon className="panel-btn-icon" />}
            {t.price}
          </button>
        </div>
      ))}
    </div>
  )
}

function Bag() {
  const items = [
    { name: 'Green TNT', count: 5, Icon: TntIcon },
    { name: 'Pickaxe', count: 1, Icon: PickaxeIcon },
    { name: 'Dirt', count: 141, Icon: DirtIcon },
  ]
  return (
    <div className="panel-grid">
      {items.map(({ name, count, Icon }) => (
        <div key={name} className="panel-tile">
          <Icon className="panel-tile-icon" />
          <b>{name}</b>
          <small>x{count}</small>
        </div>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="panel-tile is-empty" />
      ))}
    </div>
  )
}

function Daily() {
  return (
    <div className="panel-grid">
      {DAILY.map(({ day, reward, Icon }) => (
        <div key={day} className={`panel-tile${day === 1 ? ' is-ready' : ''}`}>
          <small>Day {day}</small>
          <Icon className="panel-tile-icon" />
          <b>{reward}</b>
        </div>
      ))}
      <button type="button" className="panel-btn panel-btn-wide">Claim Day 1</button>
    </div>
  )
}

function Rebirth() {
  const progress = useGameStore((s) => s.rebirthProgress)
  const rebirths = useGameStore((s) => s.rebirths)
  return (
    <div className="panel-col">
      <RebirthIcon className="panel-hero" />
      <p>Rebirths: <b>{rebirths}</b> → <b>{rebirths + 1}</b></p>
      <p>Resets your money for a permanent <b>+1.5x Damage</b> boost.</p>
      <div className="panel-progress"><div style={{ width: `${progress}%` }} /><span>{progress}%</span></div>
      <button type="button" className="panel-btn panel-btn-wide is-muted">Need $1,000</button>
    </div>
  )
}

function Teleport() {
  return (
    <div className="panel-col">
      {DESTINATIONS.map((d) => (
        <button
          key={d.name}
          type="button"
          className="panel-btn panel-btn-wide"
          onClick={() => {
            resetPlayer(d.pos, d.facing)
            syncYawToPlayer()
            closePanel()
          }}
        >
          {d.name}
        </button>
      ))}
    </div>
  )
}

function Quests() {
  const quests = [
    { text: 'Blow up 200 blocks', done: 145, total: 200 },
    { text: 'Earn $1,000', done: 320, total: 1000 },
    { text: 'Reach Level 6', done: 47, total: 49 },
  ]
  return (
    <div className="panel-col">
      {quests.map((q) => (
        <div key={q.text} className="panel-quest">
          <span>{q.text}</span>
          <div className="panel-progress"><div style={{ width: `${(q.done / q.total) * 100}%` }} /><span>{q.done}/{q.total}</span></div>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  useSettings()
  return (
    <div className="panel-col">
      <label className="panel-toggle">
        <span>Show FPS</span>
        <input type="checkbox" checked={!!settings.show_fps} onChange={(e) => setSetting('show_fps', String(e.target.checked))} />
      </label>
      <p className="panel-note">WASD to move · Space to jump · Right-drag to look · Wheel to zoom · 1-3 hotbar</p>
    </div>
  )
}

const Message = ({ Icon, children }) => (
  <div className="panel-col">
    <Icon className="panel-hero" />
    {children}
  </div>
)

const PANELS = {
  shop: { title: 'Shop', Icon: BasketIcon, tone: 'orange', body: Shop },
  bag: { title: 'Bag', Icon: BagIcon, tone: 'orange', body: Bag },
  daily: { title: 'Daily Rewards', Icon: CalendarIcon, tone: 'purple', body: Daily },
  rebirth: { title: 'Rebirth', Icon: RebirthIcon, tone: 'purple', body: Rebirth },
  teleport: { title: 'Teleport', Icon: TeleportIcon, tone: 'slate', body: Teleport },
  quests: { title: 'Quests', Icon: ScrollIcon, tone: 'slate', body: Quests },
  settings: { title: 'Settings', Icon: GearIcon, tone: 'slate', body: Settings },
  friends: {
    title: 'Friend Boost', Icon: PlusIcon, tone: 'blue',
    body: () => <Message Icon={BurstIcon}><p>Play with friends for <b>+10% damage</b> each!</p></Message>,
  },
  potion: {
    title: '90% OFF', Icon: PotionIcon, tone: 'red',
    body: () => (
      <Message Icon={PotionIcon}>
        <p><b>Explosion Potion</b> — 2x explosion radius for 15 minutes.</p>
        <button type="button" className="panel-btn panel-btn-wide"><GemIcon className="panel-btn-icon" />2</button>
      </Message>
    ),
  },
  gift: {
    title: 'FREE!', Icon: GiftIcon, tone: 'orange',
    body: () => (
      <Message Icon={GiftIcon}>
        <p>Stay in the game for <b>5 minutes</b> to claim a free gift!</p>
      </Message>
    ),
  },
}

export default function Panels() {
  const id = useGameStore((s) => s.panel)
  useEffect(() => {
    if (!id) return
    const onKey = (e) => e.code === 'Escape' && closePanel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id])
  const p = id && PANELS[id]
  if (!p) return null
  const Body = p.body
  return (
    <div className="panel-backdrop" onPointerDown={(e) => e.target === e.currentTarget && closePanel()}>
      <div className={`panel panel-${p.tone}`}>
        <div className="panel-head">
          <p.Icon className="panel-head-icon" />
          <h2>{p.title}</h2>
          <button type="button" className="panel-close" onClick={closePanel} aria-label="Close">✕</button>
        </div>
        <div className="panel-body">
          <Body />
        </div>
      </div>
    </div>
  )
}
