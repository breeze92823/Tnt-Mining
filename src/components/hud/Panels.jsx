import { useEffect } from 'react'
import { TNTS, tntById } from '../../data/tnts.js'
import { ORES } from '../../data/ores.js'
import { compact } from '../../utils/compact.js'
import { damageMult, moneyMult, doRebirth, playerLevel, rebirthLevelFor, sellBlocks, buyDamage, buyTnt, buyUpgrade, closePanel, equipTnt, selectSlot, useGameStore } from '../../store/useGameStore.js'
import { resetPlayer } from '../../systems/playerState.js'
import { syncYawToPlayer } from '../../systems/cameraOrbit.js'
import { setSetting, settings } from '../../systems/settingsState.js'
import { useSettings } from '../../systems/bloxityHooks.js'
import {
  BagIcon, BasketIcon, BoltIcon, BurstIcon, CalendarIcon, CashIcon, DirtIcon, OreIcon, GearIcon, GemIcon, GiftIcon, MagnetIcon,
  PickaxeIcon, PlusIcon, PotionIcon, RebirthIcon, ScrollIcon, TeleportIcon, TntIcon, UpgradeIcon,
} from './icons.jsx'

// Modal windows opened from the HUD buttons. One open at a time
// (useGameStore.panel); click the backdrop or ✕ to close.

// Damage packs (cash price, blastPower gained); the first is the featured "best value" one.
const DAMAGE_PACKS = [
  { amount: '500K', power: 500e3, price: 250e6 },
  { amount: '5K', power: 5e3, price: 10e6 },
  { amount: '25K', power: 25e3, price: 25e6 },
  { amount: '125K', power: 125e3, price: 125e6 },
]

const DESTINATIONS = [
  { name: 'Spawn', pos: { x: 0, y: 0.3, z: 2 }, facing: Math.PI },
  { name: 'Forest Mine', pos: { x: 0, y: 0.4, z: -36 }, facing: Math.PI },
  { name: 'Training', pos: { x: -22, y: 0.4, z: 0 }, facing: -Math.PI / 2 },
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
  const [best, ...rest] = DAMAGE_PACKS
  return (
    <div className="shop">
      <div className="shop-card shop-best">
        <div className="shop-best-text">
          <b>{best.amount} Damage</b>
          <span className="shop-tag">Best Value!</span>
          <ShopPrice pack={best} />
        </div>
        <BurstIcon className="shop-best-icon" />
      </div>
      <div className="shop-row">
        {rest.map((p) => (
          <div key={p.amount} className="shop-card shop-pack">
            <b>{p.amount}</b>
            <BurstIcon className="shop-pack-icon" />
            <ShopPrice pack={p} />
          </div>
        ))}
      </div>
    </div>
  )
}

const ShopPrice = ({ pack }) => {
  const afford = useGameStore((st) => st.money >= pack.price)
  return (
    <button type="button" className={`shop-price${afford ? '' : ' is-muted'}`} disabled={!afford} onClick={() => buyDamage(pack.power, pack.price)}>
      <CashIcon className="shop-price-icon" />
      {short(pack.price)}
    </button>
  )
}

// The player's inventory: the HUD hotbar shows these in order (slot = index).
export const INVENTORY = [
  { name: 'TNT', count: 5, Icon: TntIcon, enchanted: true, stock: 'tnt' }, // `stock`: live count key in the game store,
  { name: 'Pickaxe', Icon: PickaxeIcon },
  // One slot per ore item (Dirt, Stone, Coal, Gold, Diamond, Bedrock), counted live in the store.
  ...ORES.map((o) => ({ name: o.itemName, Icon: (p) => <OreIcon base={o.base} edge={o.edge} fleck={o.fleck} {...p} />, stock: o.item, hideEmpty: true })),
]

// The inventory entries to show, each with its slot index (the store's `slot`, held-item model):
// ore blocks are hidden while their count is 0.
export const visibleSlots = (stocks) =>
  INVENTORY.map((item, i) => ({ ...item, i })).filter((it) => !it.hideEmpty || stocks[it.stock] > 0)

function Bag() {
  const slot = useGameStore((s) => s.slot)
  const stocks = useGameStore()
  const equipped = tntById(useGameStore((s) => s.tntEquipped))
  return (
    <div className="panel-grid">
      {visibleSlots(stocks).map(({ name, count: base, stock, Icon, i }) => {
        const count = stock ? stocks[stock] : base
        return (
        <button
          key={name}
          type="button"
          className={`panel-tile panel-tile-btn${slot === i ? ' is-selected' : ''}`}
          aria-pressed={slot === i}
          onClick={(e) => { selectSlot(i); e.currentTarget.blur() }}
        >
          <Icon className="panel-tile-icon" {...(stock === 'tnt' && equipped)} />
          <b>{stock === 'tnt' ? `${equipped.name} TNT` : name}</b>
          <small>{count !== undefined ? `x${compact(count)}` : slot === i ? 'Selected' : ''}</small>
        </button>
        )
      })}
    </div>
  )
}

function Tnts() {
  const owned = useGameStore((s) => s.tntOwned)
  const equipped = useGameStore((s) => s.tntEquipped)
  const cash = useGameStore((s) => s.money)
  const gems = useGameStore((s) => s.gems)
  return (
    <div className="panel-list">
      {TNTS.map((t) => {
        const has = owned.includes(t.id)
        const afford = (t.gem ? gems : cash) >= t.price
        return (
          <div key={t.id} className={`tnt-row tnt-${t.rarity.toLowerCase()}`}>
            <TntIcon className="tnt-row-icon" top={t.top} left={t.left} right={t.right} />
            <div className="upgrade-text">
              <b>{t.name}</b>
              <span className="tnt-rarity">{t.rarity}</span>
              <span className="tnt-blast"><BurstIcon className="tnt-blast-icon" />+{short(t.blast)}</span>
            </div>
            {equipped === t.id ? (
              <button type="button" className="panel-btn tnt-equipped" disabled>Equipped</button>
            ) : has ? (
              <button type="button" className="panel-btn tnt-equip" onClick={() => equipTnt(t.id)}>Equip</button>
            ) : (
              <button
                type="button"
                className={`panel-btn${afford ? '' : ' is-muted'}`}
                disabled={!afford}
                onClick={() => buyTnt(t.id, t.price, t.gem)}
              >
                {t.gem && <GemIcon className="panel-btn-icon" />}
                {t.gem ? t.price : money(t.price)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 1200 -> 1.2K, 4e6 -> 4M ...
const short = (n) => {
  const u = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']].find(([v]) => n >= v)
  return u ? `${+(n / u[0]).toFixed(1)}${u[1]}` : `${n}`
}
const money = (n) => `$${short(n)}`

// Each upgrade raises a store value by one per purchase and gets pricier.
const UPGRADES = [
  { key: 'carryMax', name: 'Carried TNT', Icon: BagIcon, tone: 'tan', price: (v) => 600 * 2 ** (v - 5) },
  { key: 'placeMax', name: 'Placed TNT', Icon: TntIcon, tone: 'red', price: (v) => 3000 * 3 ** (v - 1) },
  { key: 'range', name: 'Collection Range', Icon: MagnetIcon, tone: 'purple', price: (v) => Math.round((400 * 1.5 ** (v - 3)) / 10) * 10 },
  { key: 'speed', name: 'Speed', Icon: BoltIcon, tone: 'blue', price: (v) => Math.round((400 * 1.5 ** (v - 22)) / 10) * 10 },
]

function Upgrades() {
  const state = useGameStore()
  return (
    <div className="panel-list">
      {UPGRADES.map(({ key, name, Icon, tone, price }) => {
        const v = state[key]
        const cost = price(v)
        const afford = state.money >= cost
        return (
          <div key={key} className={`upgrade-row upgrade-${tone}`}>
            <Icon className="upgrade-icon" />
            <div className="upgrade-text">
              <b>{name}</b>
              <span className="upgrade-levels">{v}<i>▶</i><em>{v + 1}</em></span>
            </div>
            <button
              type="button"
              className={`panel-btn${afford ? '' : ' is-muted'}`}
              disabled={!afford}
              onClick={() => buyUpgrade(key, cost)}
            >
              {money(cost)}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Sellable blocks: `stock` is the store count key, `price` the cash per block.
const SELLABLE = ORES.map((o) => ({ stock: o.item, name: o.itemName, rarity: o.name, price: o.price, Icon: (p) => <OreIcon base={o.base} edge={o.edge} fleck={o.fleck} {...p} /> }))

function Sell() {
  const state = useGameStore()
  const mult = moneyMult(state.rebirths)
  const rows = SELLABLE.filter((b) => state[b.stock] > 0)
  const total = rows.reduce((sum, b) => sum + Math.round(state[b.stock] * b.price * mult), 0)
  return (
    <div className="panel-list">
      <div className="sell-total">
        <b>+{money(total)}</b>
        <button
          type="button"
          className={`panel-btn${total ? '' : ' is-muted'}`}
          disabled={!total}
          onClick={() => sellBlocks(rows)}
        >
          SELL ALL
        </button>
      </div>
      {rows.map(({ stock, name, rarity, price, Icon }) => (
        <div key={stock} className={`sell-row tnt-${rarity.toLowerCase()}`}>
          <Icon className="sell-icon" />
          <div className="upgrade-text">
            <b>{name}</b>
            <span className="tnt-rarity">{rarity}</span>
          </div>
          <div className="sell-side">
            <span>x{short(state[stock])}</span>
            <button type="button" className="panel-btn" onClick={() => sellBlocks([{ stock, price }])}>
              +{money(Math.round(state[stock] * price * mult))}
            </button>
          </div>
        </div>
      ))}
      {!rows.length && <p className="panel-note">Nothing to sell. Mine some blocks!</p>}
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

const fmtMult = (n) => `${+n.toFixed(2)}x`

function Rebirth() {
  const level = useGameStore(playerLevel)
  const rebirths = useGameStore((s) => s.rebirths)
  const need = rebirthLevelFor(rebirths)
  const ready = level >= need
  const rows = [
    { label: 'Damage', Icon: BurstIcon, from: damageMult(rebirths), to: damageMult(rebirths + 1) },
    { label: 'Money', Icon: CashIcon, from: moneyMult(rebirths), to: moneyMult(rebirths + 1) },
  ]
  return (
    <div className="panel-col rebirth">
      {rows.map(({ label, Icon, from, to }) => (
        <div key={label} className="rebirth-row">
          <div className="rebirth-cell"><Icon className="rebirth-icon" /><span>{fmtMult(from)} {label}</span></div>
          <i className="rebirth-arrow">▶</i>
          <div className="rebirth-cell rebirth-next"><Icon className="rebirth-icon" /><span>{fmtMult(to)} {label}</span></div>
        </div>
      ))}
      <p className="rebirth-warn">*Damage gets reset on rebirth*</p>
      <div className="rebirth-bar"><div style={{ width: `${Math.min(100, (level / need) * 100)}%` }} /><span>Level: {level}/{need}</span></div>
      <div className="rebirth-actions">
        <button type="button" className={`panel-btn${ready ? '' : ' is-muted'}`} disabled={!ready} onClick={doRebirth}>Rebirth</button>
        <button type="button" className="panel-btn rebirth-skip" onClick={closePanel}>Skip</button>
      </div>
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
  shop: { title: 'Shop', Icon: BasketIcon, tone: 'orange', body: Shop, cls: 'panel-shop' },
  bag: { title: 'Bag', Icon: BagIcon, tone: 'orange', body: Bag },
  daily: { title: 'Daily Rewards', Icon: CalendarIcon, tone: 'purple', body: Daily },
  tnts: { title: 'TNTs', Icon: TntIcon, tone: 'pink', body: Tnts },
  sell: { title: 'Sell Blocks', Icon: CashIcon, tone: 'green', body: Sell },
  upgrades: { title: 'Upgrades', Icon: UpgradeIcon, tone: 'lime', body: Upgrades },
  rebirth: { title: 'Rebirth', Icon: RebirthIcon, tone: 'purple', body: Rebirth, cls: 'panel-rebirth' },
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
      <div className={`panel panel-${p.tone}${p.cls ? ` ${p.cls}` : ''}`}>
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
