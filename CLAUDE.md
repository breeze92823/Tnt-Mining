# Tnt Mining

3D game shell. Vite + React 18 + @react-three/fiber 8 + three 0.171 + zustand, plain JS/JSX. Same architecture as ../Poop-a-big-poop, stripped to a flat ground and the Bloxity-integrated player.

- `npm run dev` / `npm run build`; `.env.example` documents `VITE_DEV_MODE` (skips the Bloxity SDK/CDN).
- `systems/` is framework-free (no React); all SDK calls go through `systems/bloxity.js` and must never throw. `GAME_SLUG` in `data/bloxity.js` is a placeholder (`tnt-mining`) until the game is registered on bloxity.io.
- World layout lives in `data/world.js` (metres, +X east, +Z south): the lobby hub — round plaza, cross paths, grass quadrants with four stalls, raised blue-grey outer floor, terraced walls; zones: Desert Mine gate (N), Training (W), Leaderboards (E), premium TNT pedestals (S). Its `COLLIDERS` (boxes/circles with a top height) feed `systems/terrainHeight.js`, the single floor-height lookup (player + camera boom); anything taller than the step height is a wall. Add a collider whenever you add a solid mesh.
- Hub meshes: `components/world/*` (studded world-space materials in `materials/hub.js`; `tile.js` has a `studs` option). Signs, billboards, TNT/ore faces and leaderboards are canvas textures in `utils/labels.js` (Fredoka font; `World` suspends until it loads).
- HUD: `components/Hud.jsx` + `components/hud/` (SVG icons, modal panels), styles in `src/hud.css` scaled by `--s`. HUD numbers live in `store/useGameStore.js` (placeholder values for now).
- Copied unchanged from the reference: lighting rig (`Lighting.jsx`), sky dome (`Sky.jsx` + `utils/textures.js`), world-space tile/mottle shader (`materials/tile.js`), orbit camera (`cameraOrbit.js`, `cameraCollision.js`), avatar pipeline (`avatarLoader.js`, `defaultCharacter.js`, `avatarAnim.js`, `public/avatars/player.glb`), input and touch controls.
- Player is always the game's own character with the player's equipped Bloxity hat/back attached; proportions follow the customizer.
- `Landmark.md` names every place in the hub (stalls, gate, targets, boards, pedestals, HUD parts) with its coordinates and code location; use those names when talking about the world and keep it updated when adding or moving something.
