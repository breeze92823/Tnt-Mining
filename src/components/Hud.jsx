import { useEffect, useRef, useState } from 'react'
import { settings } from '../systems/settingsState.js'
import { useSettings } from '../systems/bloxityHooks.js'
import { login, subscribeAuth } from '../systems/bloxity.js'
import { compact } from '../utils/compact.js'
import { blastPower as blastPowerOf, levelFor, openPanel, playerLevel, rebirthLevelFor, selectSlot, useGameStore } from '../store/useGameStore.js'
import { tntById } from '../data/tnts.js'
import Panels, { visibleSlots } from './hud/Panels.jsx'
import InteractPrompt from './hud/InteractPrompt.jsx'
import ActionResult from './hud/ActionResult.jsx'
import CollectPopups from './hud/CollectPopups.jsx'
import ActionPopups from './hud/ActionPopups.jsx'
import { interactState } from '../systems/interact.js'
import { interactHoldState } from '../systems/interactHold.js'
import { actionResultState } from '../systems/actionResult.js'
import {
  BagIcon, BasketIcon, BurstIcon, CalendarIcon, CashIcon, DirtIcon, GiftIcon,
  PickaxeIcon, RebirthIcon, SparkleIcon, TeleportIcon, TntIcon,
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
  const blastPower = useGameStore(blastPowerOf)
  const { level, xp, need: xpMax } = levelFor(blastPower)
  return (
    <div className="hud-level">
      <div className="hud-level-track">
        <div className="hud-level-fill" style={{ width: `${(xp / xpMax) * 100}%` }} />
        <span className="hud-level-name">Level {level}</span>
        <span className="hud-level-xp">{compact(xp)} / {compact(xpMax)}</span>
      </div>
      <BurstIcon className="hud-level-icon" />
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
  const progress = useGameStore((s) => Math.min(100, Math.floor((playerLevel(s) / rebirthLevelFor(s.rebirths)) * 100)))
  return (
    <div className="hud-menu">
      {/* TEMP disabled: Shop */}
      <MenuCard id="bag" title="Bag" tone="orange" Icon={BagIcon} />
      {/* TEMP disabled: Daily reward */}
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
    { Icon: BurstIcon, text: fmt(blastPowerOf(s)), cls: 'boom' },
    { Icon: CashIcon, text: `$${fmt(s.money)}`, cls: 'cash' },
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
      {/* TEMP disabled: Gift offer
      <button type="button" className="hud-offer hud-offer-gift" onClick={() => openPanel('gift')}>
        <span className="hud-offer-title">FREE!</span>
        <GiftIcon className="hud-offer-icon" />
      </button>
      */}
    </div>
  )
}

function Hotbar() {
  const slot = useGameStore((s) => s.slot)
  const [done, total] = useGameStore((s) => s.enchanted)
  const stocks = useGameStore()
  const equipped = tntById(stocks.tntEquipped)

  const shown = visibleSlots(stocks)
  const shownRef = useRef(shown)
  shownRef.current = shown

  // An ore slot that empties (sold) disappears; drop the selection so nothing hidden stays held.
  useEffect(() => {
    if (slot !== null && !shown.some((it) => it.i === slot)) useGameStore.setState({ slot: null })
  }, [slot, shown])

  useEffect(() => {
    const onKey = (e) => {
      const n = shownRef.current.findIndex((_, p) => e.code === `Digit${p + 1}`)
      if (n >= 0) selectSlot(shownRef.current[n].i)
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
        {shown.map(({ name, Icon, count: base, enchanted, stock, i }, p) => {
          const count = stock ? stocks[stock] : base
          return (
          <button
            key={i}
            type="button"
            className={`hud-slot${slot === i ? ' is-selected' : ''}`}
            aria-label={stock === 'tnt' ? `${equipped.name} TNT` : name}
            aria-pressed={slot === i}
            onClick={(e) => { selectSlot(i); e.currentTarget.blur() }}
          >
            <span className="hud-slot-num">{p + 1}</span>
            <Icon className="hud-slot-icon" {...(stock === 'tnt' && equipped)} />
            {enchanted && <SparkleIcon className="hud-slot-sparkle" />}
            {count !== undefined && <span className="hud-slot-count">x{compact(count)}</span>}
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
      <LeftMenu />
      <Stats />
      <RightOffers />
      <Hotbar />
      <InteractPrompt ref={promptRef} />
      <ActionResult ref={resultRef} />
      <CollectPopups />
      <ActionPopups />
      <LoginButton />
      {settings.show_fps && <FpsMeter />}
      <Panels />
    </div>
  )
}
