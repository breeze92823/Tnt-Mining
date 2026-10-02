import { useEffect, useRef, useState } from 'react'
import { settings } from '../systems/settingsState.js'
import { useSettings } from '../systems/bloxityHooks.js'
import { login, subscribeAuth } from '../systems/bloxity.js'
import { openPanel, selectSlot, useGameStore } from '../store/useGameStore.js'
import Panels, { INVENTORY } from './hud/Panels.jsx'
import InteractPrompt from './hud/InteractPrompt.jsx'
import ActionResult from './hud/ActionResult.jsx'
import { interactState } from '../systems/interact.js'
import { interactHoldState } from '../systems/interactHold.js'
import { actionResultState } from '../systems/actionResult.js'
import {
  BagIcon, BasketIcon, BurstIcon, CalendarIcon, CashIcon, DirtIcon, GearIcon, GemIcon, GiftIcon,
  PickaxeIcon, PlusIcon, PotionIcon, RebirthIcon, ScrollIcon, ShellIcon, SparkleIcon, TeleportIcon, TntIcon,
} from './hud/icons.jsx'

function FpsMeter() {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)
  useEffect(() => {
    let raf
    let last = performance.now()
    const tick = (now) => {
      frames.current += 1
      if (now - last >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last)))
        frames.current = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div className="hud-fps">{fps} FPS</div>
}

// Shown only to signed-out players (guests); hidden once signed in, and until
// the first auth state arrives so it doesn't flash for a signed-in player.
function LoginButton() {
  const [signedOut, setSignedOut] = useState(false)
  useEffect(() => subscribeAuth((s) => setSignedOut(s.ready && !s.user)), [])
  if (!signedOut) return null
  return (
    <button type="button" className="hud-login" onClick={login}>
      Bloxity Login
    </button>
  )
}

const Badge = () => <span className="hud-badge">!</span>

function LevelBar() {
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const xpMax = useGameStore((s) => s.xpMax)
  return (
    <div className="hud-level">
      <div className="hud-level-track">
        <div className="hud-level-fill" style={{ width: `${(xp / xpMax) * 100}%` }} />
        <span className="hud-level-name">Level {level}</span>
        <span className="hud-level-xp">{xp} / {xpMax}</span>
      </div>
      <BurstIcon className="hud-level-icon" />
    </div>
  )
}

function TopRight() {
  const boost = useGameStore((s) => s.friendBoost)
  return (
    <div className="hud-topright">
      <div className="hud-topright-row">
        <button type="button" className="hud-plus" onClick={() => openPanel('friends')} aria-label="Invite friends">
          <PlusIcon />
        </button>
        <button type="button" className="hud-boost" onClick={() => openPanel('friends')}>
          Friend Boost: +{boost}%
        </button>
      </div>
      <div className="hud-topright-row hud-round-row">
        <button type="button" className="hud-round" onClick={() => openPanel('quests')} aria-label="Quests">
          <ScrollIcon />
          <Badge />
        </button>
        <button type="button" className="hud-round" onClick={() => openPanel('settings')} aria-label="Settings">
          <GearIcon />
        </button>
      </div>
    </div>
  )
}

function MenuCard({ id, title, tone, Icon, badge, corner }) {
  return (
    <button type="button" className={`hud-card hud-card-${tone}`} onClick={() => openPanel(id)}>
      <span className="hud-card-title">{title}</span>
      <Icon className="hud-card-icon" />
      {corner && <span className="hud-card-corner">{corner}</span>}
      {badge && <Badge />}
    </button>
  )
}

function LeftMenu() {
  const progress = useGameStore((s) => s.rebirthProgress)
  return (
    <div className="hud-menu">
      <MenuCard id="shop" title="Shop" tone="orange" Icon={BasketIcon} badge />
      <MenuCard id="bag" title="Bag" tone="orange" Icon={BagIcon} />
      <MenuCard id="daily" title="Daily" tone="purple" Icon={CalendarIcon} badge />
      <MenuCard id="rebirth" title="Rebirth" tone="purple" Icon={RebirthIcon} corner={`${progress}%`} />
      <button type="button" className="hud-teleport" onClick={() => openPanel('teleport')}>
        <TeleportIcon className="hud-teleport-icon" />
        <span>Teleport</span>
      </button>
    </div>
  )
}

const fmt = (n) => n.toLocaleString('en-US')

function Stats() {
  const s = useGameStore()
  const rows = [
    { Icon: BurstIcon, text: fmt(s.explosions), cls: 'boom' },
    { Icon: CashIcon, text: `$${fmt(s.money)}`, cls: 'cash' },
    { Icon: ShellIcon, text: `x${fmt(s.shells)}`, cls: 'shell' },
    { Icon: RebirthIcon, text: fmt(s.rebirths), cls: 'rebirth' },
  ]
  return (
    <div className="hud-stats">
      {rows.map(({ Icon, text, cls }) => (
        <div key={cls} className={`hud-stat hud-stat-${cls}`}>
          <Icon className="hud-stat-icon" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  )
}

function RightOffers() {
  return (
    <div className="hud-offers">
      <button type="button" className="hud-offer hud-offer-potion" onClick={() => openPanel('potion')}>
        <span className="hud-offer-title hud-offer-sale">90% OFF</span>
        <PotionIcon className="hud-offer-icon" />
        <span className="hud-offer-price">
          <GemIcon className="hud-offer-gem" />2
        </span>
      </button>
      <button type="button" className="hud-offer hud-offer-gift" onClick={() => openPanel('gift')}>
        <span className="hud-offer-title">FREE!</span>
        <GiftIcon className="hud-offer-icon" />
      </button>
    </div>
  )
}

function Hotbar() {
  const slot = useGameStore((s) => s.slot)
  const [done, total] = useGameStore((s) => s.enchanted)
  const tnt = useGameStore((s) => s.tnt)

  useEffect(() => {
    const onKey = (e) => {
      const n = INVENTORY.findIndex((_, i) => e.code === `Digit${i + 1}`)
      if (n >= 0) selectSlot(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="hud-bottom">
      <div className="hud-enchanted">
        {done}/{total} Enchanted
      </div>
      <div className="hud-hotbar">
        {INVENTORY.map(({ name, Icon, count: base, enchanted, stock }, i) => {
          const count = stock === 'tnt' ? tnt : base
          return (
          <button
            key={i}
            type="button"
            className={`hud-slot${slot === i ? ' is-selected' : ''}`}
            aria-label={name}
            aria-pressed={slot === i}
            onClick={(e) => { selectSlot(i); e.currentTarget.blur() }}
          >
            <span className="hud-slot-num">{i + 1}</span>
            <Icon className="hud-slot-icon" />
            {enchanted && <SparkleIcon className="hud-slot-sparkle" />}
            {count !== undefined && <span className="hud-slot-count">x{count}</span>}
          </button>
          )
        })}
      </div>
    </div>
  )
}

// The E prompt and the result popup are written imperatively from a ~10Hz poll
// of the framework-free singletons (never per-frame React renders). See Interact.md.
function useInteractHud(promptRef, resultRef) {
  useEffect(() => {
    let lastId = actionResultState.id
    const id = setInterval(() => {
      const prompt = promptRef.current
      if (prompt) {
        prompt.setText(interactState.label)
        prompt.setHoldProgress(interactHoldState.progress)
      }
      if (actionResultState.id !== lastId) {
        lastId = actionResultState.id
        resultRef.current?.show(actionResultState.text, actionResultState.success)
      }
    }, 100)
    return () => clearInterval(id)
  }, [promptRef, resultRef])
}

export default function Hud() {
  useSettings()
  const promptRef = useRef(null)
  const resultRef = useRef(null)
  useInteractHud(promptRef, resultRef)
  return (
    <div className="hud">
      <LevelBar />
      <TopRight />
      <LeftMenu />
      <Stats />
      <RightOffers />
      <Hotbar />
      <InteractPrompt ref={promptRef} />
      <ActionResult ref={resultRef} />
      <LoginButton />
      {settings.show_fps && <FpsMeter />}
      <Panels />
    </div>
  )
}
