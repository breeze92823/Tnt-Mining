# Hold-E Interaction

Ported from Laser-Escape (`C:\ThreeJS\Laser-Escape`) and made generic. In Laser-Escape the system was hard-wired to three things (AFK targets, hex power pads, the merchant). Here you register **zones** instead, so any stall, gate, pedestal or NPC can use it.

**What the player sees:** walk near a zone and a card appears: `[E] Open Shop`. Hold E (or the on-screen E button on touch) and a ring fills around the keycap while the card shrinks to just the ring. When it completes the action fires once, with a confirm sound. Releasing early snaps the ring back to empty and does nothing. A blocked action shows a red popup at the top centre with a buzz; a success can show a green one.

**Nothing is registered yet**, so no prompt appears in the game until you add a zone (recipes below).

## Files

| Part | File | Role |
|---|---|---|
| Tunables | [data/interact.js](src/data/interact.js) | key (`KeyE`), `HOLD_MS` (2000), default range, all sound gains/synth notes |
| Zone registry + per-frame step | [systems/interact.js](src/systems/interact.js) | `registerInteractZone`, `proximityZone`, `interactState`, `step()` |
| Hold gate | [systems/interactHold.js](src/systems/interactHold.js) | the timer; `interactHoldState.progress` 0..1 |
| Result popup trigger | [systems/actionResult.js](src/systems/actionResult.js) | `showActionResult(text, success)` |
| Audio | [systems/sfx.js](src/systems/sfx.js) | `playConfirmPop`, `playButtonClick`, `playActionFail` (all synthesized, no asset files), on top of [audio.js](src/systems/audio.js)'s master bus |
| Input | [systems/input.js](src/systems/input.js) | `isInteractKeyDown()`, `inputState.interact` (one-shot edge), touch `pressTouchInteract/releaseTouchInteract` |
| Prompt UI | [components/hud/InteractPrompt.jsx](src/components/hud/InteractPrompt.jsx) | keycap, ring, label |
| Popup UI | [components/hud/ActionResult.jsx](src/components/hud/ActionResult.jsx) | green/red top-centre bar with pop animation |
| HUD wiring | [components/Hud.jsx](src/components/Hud.jsx) (`useInteractHud`) | 10 Hz poll writes the prompt and popup imperatively |
| Touch button | [components/TouchControls.jsx](src/components/TouchControls.jsx) | "E" button next to JUMP |
| Styles + animation | [hud.css](src/hud.css) (end of file) | `.hud-interact*`, `.hud-action-result*`, `hud-action-result-pop` |
| Frame hook | [components/GameLoop.jsx](src/components/GameLoop.jsx) | calls `stepInteract()` after the player moves, then clears the one-shot flag |

## How a frame works

1. `GameLoop` runs `stepPlayer`, then `interact.step()`.
2. `step()` skips everything if a modal panel is open (`store.panel !== null`). Otherwise it asks zones, lowest `priority` first, for the first `check(player)` that returns a hit.
3. `interactState.label` is set to that hit's label (or `null`); `Hud.jsx` polls it every 100 ms and shows/hides the prompt, and polls `interactHoldState.progress` for the ring.
4. The hold gate runs against the key `"<zoneId>:<hit.key>"`. Changing zone or sub-target, or releasing E, resets the timer.
5. When the hold reaches the zone's `holdMs`, `step()` plays the confirm pop and calls `zone.onConfirm(hit)` once. E must be **released** before another hold can start (so holding E doesn't re-buy every 2 s).

Why polling and imperative refs: the HUD never re-renders per frame. Systems are framework-free singletons; React only reads them at 10 Hz.

## Recipes

### 1. A plain "walk up and hold E" spot

```js
import { proximityZone } from '../systems/interact.js'
import { openPanel } from '../store/useGameStore.js'

// Call once (e.g. in a component's useEffect) and return the unregister fn.
useEffect(() => proximityZone({
  id: 'stall:shop',
  position: [8, 0, 4],          // or an array of positions: nearest in range wins
  range: 3,
  label: 'Open Shop',           // or (hit) => `Open Shop ${hit.index + 1}`
  onConfirm: () => openPanel('shop'),
}), [])
```

`proximityZone` returns the unregister function, so it drops straight into `useEffect`.

### 2. Gated / conditional (with a failure popup)

```js
import { proximityZone } from '../systems/interact.js'
import { showActionResult } from '../systems/actionResult.js'
import { useGameStore } from '../store/useGameStore.js'

proximityZone({
  id: 'gate:forest',
  position: [0, 0, -40],
  range: 4,
  label: 'Enter Forest Mine',
  enabled: () => true,          // return false to hide the prompt entirely
  onConfirm() {
    if (useGameStore.getState().level < 5) {
      showActionResult('Level 5 required', false)   // red popup + buzz
      return
    }
    showActionResult('Entering Mine!', true)        // green popup
    // ...teleport, open panel, etc.
  },
})
```

Like Laser-Escape, show the prompt even when the player is ineligible and let the held E report why via `showActionResult(..., false)`.

### 3. Fully custom zone (not a circle)

```js
import { registerInteractZone } from '../systems/interact.js'

registerInteractZone({
  id: 'npc:guide',
  priority: -1,                          // beats other zones when both in range
  holdMs: 0,                             // instant: fires on the first frame E is down
  confirmSound: false,                   // skip the pop if you play your own sound
  check(player) {                        // player.position.{x,y,z}
    const inBox = Math.abs(player.position.x - 5) < 2 && Math.abs(player.position.z - 9) < 4
    return inBox ? { label: 'Talk', key: 'guide' } : null
  },
  onConfirm(hit) { /* ... */ },
})
```

`key` matters when one zone covers several targets (e.g. a row of pads): walking from one to the next mid-hold changes the key and resets the ring. `proximityZone` sets it to the index of the nearest position automatically.

### 4. Toggle off with a quick E press (the AFK pattern)

Laser-Escape's "AFK: press E again to stop" must not wait for a hold. Read the one-shot edge flag in your own system's `step()`:

```js
import { inputState } from './input.js'
if (active && inputState.interact) { inputState.interact = false; stop() }
```

`inputState.interact` is set on each E keydown (or touch E press) and cleared by `GameLoop` at the end of every frame. Make sure your system's step runs **before** that clear (anywhere inside `GameLoop`'s `useFrame`, ahead of the reset line). While active, return `null` from the zone's `check` so the prompt/hold don't also fire.

### 5. Sounds and popups on their own

```js
import { playButtonClick, playConfirmPop, playActionFail } from '../systems/sfx.js'
import { showActionResult } from '../systems/actionResult.js'
```

- Call `playButtonClick()` first in any HUD button `onClick` (Laser-Escape did this for every button; nothing in Tnt-Mining calls it yet).
- `showActionResult(text, false)` plays `playActionFail()` itself. The success variant is silent; pair it with `playConfirmPop()` if you want, but zone confirms already play the pop.

## Tuning

All in [data/interact.js](src/data/interact.js): `HOLD_MS`, `DEFAULT_RANGE`, `INTERACT_KEY`, the three `*_GAIN` values (0..1 on top of the master volume), and the synth note frequencies/envelopes. To use real audio instead (Laser-Escape's `power_gain.mp3` was a real file), `fetch` + `decodeAudioData` it in `sfx.js` and swap the matching `play(...)` call; the `play()` helper already shows the fire-and-forget pattern.

Prompt position and size: `.hud .hud-interact` in `hud.css` (`top: 70%`, sizes scale with `--s`). Popup: `.hud .hud-action-result` (`top`) and `hud-action-result-pop` (2.4 s timing and the pop keyframes). The red/green colours are in `ActionResult.jsx`.

## Differences from Laser-Escape

| Laser-Escape | Here |
|---|---|
| `interact.js` hard-codes AFK > hex pad > merchant | zone registry with `priority`; no game zones baked in |
| `afk.js`/`hexPowerPad.js`/`merchant.js` compute proximity | `proximityZone()` or a custom `check()` |
| Three `InteractPrompt` instances, one per system, hide each other | one prompt; the winning zone supplies the label |
| Prompt text had to start with `"Press E to "` to show the keycap | labels are just the action (`"Open Shop"`); keycap always shown. The "AFK firing, E to stop" key-less message form was dropped |
| 2 s hold fixed for everyone | per-zone `holdMs` |
| Holding E past a confirm repeated the action | E must be released first |
| Success/confirm pop from `power_gain.mp3`; level-up, wall-break and laser sounds | confirm pop synthesized; only click / confirm / fail ported (laser, level-up, wall-break are game-specific) |
| Tailwind classes toggled in JS | plain CSS in `hud.css` scaled by `--s`, `is-held` class |
| Skipped input only via global suspensions | also skipped while a HUD modal panel is open (`store.panel`) |
| Touch E button in `TouchControls.jsx` (red FIRE style) | same behaviour, `touch-btn-small` style beside JUMP |

Not ported on purpose: AFK lock-on, hex power pads, merchant/Aura popup, target purchase popup, LevelUp popup, laser sounds. These are game-specific; recipe 2 and 4 show how to rebuild the equivalents.

## Gotchas

- `onConfirm` runs outside React. Use store actions (`openPanel`, `useGameStore.setState`) or flags; never hooks.
- Register zones once and unregister on unmount, otherwise hot reload/StrictMode double-registers (`proximityZone` returns the unregister function; React 18 StrictMode runs effects twice in dev, which is fine as long as the cleanup is returned).
- Zone `id`s must be unique; they form the hold key.
- Range is 3D distance to the given point (like Laser-Escape). Use a `y` near the ground or a bigger range if the point is elevated.
- `inputState.interact` is only a one-shot edge for quick-press toggles; hold-to-confirm uses `isInteractKeyDown()`.
- Audio can't play until the first user gesture (browser rule); `main.jsx` unlocks and pre-renders the sounds on that first gesture.
