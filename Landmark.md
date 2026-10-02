# Landmarks

Names for the places in the hub. Use these names when you ask for changes (for example "move the **SELL Stall** closer to the plaza" or "add a sign above **Mine Arch**"), so there is no guessing which thing you mean.

Coordinates are in metres: +X is east, +Z is south, +Y is up. The plaza centre is (0, 0). Positions come from [src/data/world.js](src/data/world.js), which is the single place to change them.

## Quick index

Every name in this file, by area. The sections below give positions and code locations.

- **Centre:** Spawn, Plaza, Paths, Raised Floor, Walls
- **Stalls:** TNT Stall, SELL Stall, SHOP Stall, UPGRADE Stall
- **North:** Hub Wall, Hub Gate, Start Line, North Field, Mine Arch, Forest Sign, Explosions Board, Secrets Board, Luck Board, Deep Block Board, Mine Fence, Forest Mine, Placed TNT, North Trees, North Bushes
- **West:** Training Banner, Training Stage, Seating, Wood / Stone / Snow / Emerald / Sand / Amethyst / Crystal / Lava / Ruby Target
- **East:** Leaderboards Banner, Leaderboard Stage, Damage Board, Rebirths Board, Money Board
- **South:** Corrupt TNT, Admin TNT, Atomic TNT, Admin Stage
- **Props:** Index, Feedback Mailbox, Trees
- **HUD:** Level Bar, Friend Boost, Quest Button, Settings Button, Menu Cards, Teleport Button, Stats, Offers, Hotbar, Enchanted Label

## Map

The sketch is not to scale; use the coordinates in the tables.

```
                        NORTH (-Z)
                 North Wall (z = -76), Forest Sign on it (0,-75.6)
          ┌──────── Forest Mine ────────┐
          │  orange floor, fenced       │
          │  x -26..26, z -68..-42      │
          └──────── Mine Arch (0,-42) ──┘
   Explosions  Secrets            Luck   Deep Block   (signboards)
   (-14,-37.6) (-8,-38.8)    (8,-38.8)  (14,-37.6)
             North Field (bright green)
   ████████████ Hub Wall (z -33..-29) ██ Hub Gate (x ±5) ██████████
   ▚▚▚▚▚▚▚▚▚▚▚ Start Line (z -29..-27) ▚▚▚▚▚▚▚▚▚▚▚
        Feedback Mailbox                Index
        (-19,-24)                       (19,-24)

           TNT Stall                  SELL Stall
           (-12,-12)                  (12,-12)

 WEST (-X)             Plaza (0,0)             EAST (+X)
 Training                                      Leaderboards
 (-32,0)                                       (34.5,0)

           UPGRADE Stall              SHOP Stall
           (-12,12)                   (12,12)

        Atomic TNT    Admin TNT    Corrupt TNT
        (-10,27)      (0,30)       (10,27)
                        SOUTH (+Z)
```

## Centre

| Name | Position (x, z) | What it is | Code |
|---|---|---|---|
| **Spawn** | 0, 2 | Where the player starts, on the plaza, facing north | `SPAWN` in world.js |
| **Plaza** | 0, 0 | Round tiled disc (radius 8.5) with a grey rim | `Plaza` in [Hub.jsx](src/components/world/Hub.jsx) |
| **Paths** | along the X and Z axes | Four tiled paths out from the plaza (8 m wide) | `Path` in Hub.jsx |
| **Raised Floor** | outside ±21 | Blue-grey studded floor around the grass (the north band, z -27 to -21, is grass) | `OuterFloor` in Hub.jsx |
| **Walls** | x ±40, z +40; north wall at z -76 | Terraced orange walls with grass caps (the north wall is further back than the others to make room for the mine) | `Walls` in Hub.jsx |
| **World Bounds** | x ±49, z -85 to 49 | The invisible edge the player cannot walk past | `WORLD_BOUNDS` in world.js |

## Stalls

All four face the plaza. Code: [Stalls.jsx](src/components/world/Stalls.jsx), data: `STALLS` in world.js.

| Name | Position (x, z) | Canopy | Sign |
|---|---|---|---|
| **TNT Stall** | -12, -12 | red / white | TNT |
| **SELL Stall** | 12, -12 | green / white | SELL |
| **SHOP Stall** | 12, 12 | yellow / white | SHOP |
| **UPGRADE Stall** | -12, 12 | cream / white | UPGRADE |

## North: Forest Mine

Everything past the Start Line. Code: [MineGate.jsx](src/components/world/MineGate.jsx), data: `NORTH`, `GATE`, `FOREST_SIGN`, `INFO_BOARDS` and `NORTH_TREES` in world.js.

| Name | Position (x, z) | What it is |
|---|---|---|
| **Hub Wall** | z -33 to -29, x ±40 | Tall orange wall with a grass cap (9 m high, 4 m thick) between the hub and the north zone, joined to the east and west walls. Code: [HubWall.jsx](src/components/world/HubWall.jsx), data: `HUB_WALL` in world.js |
| **Hub Gate** | x ±5, z -33 to -29 | The 10 m wide opening in the Hub Wall, in line with the north path. The only way from the hub to the north zone |
| **Start Line** | z -29 to -27, full width | Black-and-white checkered strip where the hub ends |
| **North Field** | z -76 to -29 | Bright-green studded grass around the mine |
| **Mine Arch** | 0, -42 | Two studded wooden pillars (at x ±3.6, 8.4 m tall) and a header board reading "Mine"; the way into the mine. The only gap in the fence |
| **Forest Sign** | 0, -75.6 | Tall black board (11 m wide, 6.8 to 13.6 m up) hung on the North Wall, facing the plaza: "Forest" and a green **$12M** price bar |
| **Explosions Board** | -14, -37.6 | Wooden signboard: "More Damage = Bigger Explosions" |
| **Secrets Board** | -8, -38.8 | Purple signboard: "Secrets spawn in 21m 50s" with a **Track It!** button |
| **Luck Board** | 8, -38.8 | Green signboard with a clover: "Mine Luck 1x ▸ 1.2x" with a **$4K** button |
| **Deep Block Board** | 14, -37.6 | Wooden signboard: "Deeper = Tougher Blocks" |
| **Mine Fence** | around the Forest Mine | Wooden posts and two rails on all four sides; the only gap is the Mine Arch. Code: `MineFence` in MineGate.jsx, solid via `fenceColliders` in world.js |
| **Forest Mine** | x -26 to 26, z -68 to -42 | Fenced floor behind the arch: a 26 × 13 grid of columns, each 8 layers (16 m) of separate 2 m orange cubes (`MINE_CUBES` in world.js, state in [mineCubes.js](src/systems/mineCubes.js)). Removing a cube digs the top layer of its column (floor drops 2 m); dug cubes stay gone until the player is back in the hub (south of the Hub Wall), then the whole mine refills |
| **Placed TNT** | on a Forest Mine cube | A 2 m Green TNT block the player puts on top of a floor cube: hold TNT (hotbar slot 1) in the mine, aim with the mouse (the ghost cube shows the target: the cube pointed at if within 3 m of the player, else the nearest one in range), left-click to place; costs 1 TNT, one per cube, can go on the cube the player stands on, removed with its cube. Not solid: the player walks through it. Code: `PlacedTnt` and the `TntPreview` ghost in MineGate.jsx, `placeTnt` in mineCubes.js |
| **North Trees** | list in `NORTH_TREES` in world.js | Eight trees: two on each side of the mine and a row along the north wall (none in front of the Forest Sign) |
| **North Bushes** | list in `BUSHES` in MineGate.jsx | Six low bushes around the fence (decoration, not solid) |

### North details

Exact numbers for each north landmark (heights are measured from the raised floor, y = 0.4; "T" below). Change them in the named code, then update this section.

**Start Line.** Checkered strip, 2 m deep (z -29 to -27) and the full width of the walls (x ±40); tiles are 1 m, white `#f2f2f2` and black `#151515`. Code: `checker` in MineGate.jsx, `NORTH.checkerZ` in world.js.

**North Field.** Bright green `#0fcf3a` studded floor from the Start Line to the north wall (z -76), x ±40. The grass band between the hub and the Start Line (z -27 to -21) uses the normal hub green. Code: `field` in MineGate.jsx, `NORTH.grass` in world.js.

**Mine Arch.** Centred at x 0, z -42 (`NORTH.fenceZ`).
- Pillars: 1.4 m square, 8.4 m tall, at x ±3.6, each with a 1.6 m cap 0.4 m thick.
- Header board: 8.6 m wide, 2.2 m tall, 1 m deep, its centre 1.4 m below the pillar tops, with the white "Mine" text on its south face.
- Colour: brown wood `#9c5a2a`, studded.
- Gap you walk through: x ±2.9 (between the pillars), the only opening in the fence.

**Forest Sign.** Black board centred at x 0, z -75.6 (`NORTH.wallZ + 0.4`), hung flat on the North Wall's inner face (just clear of the wall cap's overhang), facing south toward the plaza. No legs, no collider (it is out of reach).
- Board: 11 m wide, 6.8 m tall (y 6.8 to 13.6), 0.5 m deep; its top half rises above the inner tier against the outer tier.
- Face: "Forest" in large white text over a green price bar showing `$12M` (`FOREST_SIGN.price`).

**Signboards** (all 4.8 m wide, 3.0 m tall, 0.45 m deep, on two 1.2 m wooden legs; the board's bottom edge is 0.9 m above T). Each is turned toward the plaza by the angle below (radians, positive turns the face toward +X; so the left boards face right and the right boards face left).

| Name | x, z | Turn | Face colour | Text |
|---|---|---|---|---|
| **Explosions Board** | -14, -37.6 | 0.42 | brown wood | More Damage = Bigger Explosions, with a burst icon |
| **Secrets Board** | -8, -38.8 | 0.18 | purple | Secrets spawn in 21m 50s, "?" blob, **Track It!** button |
| **Luck Board** | 8, -38.8 | -0.18 | green | Mine Luck, 1x ▸ 1.2x, clover, **$4K** button |
| **Deep Block Board** | 14, -37.6 | -0.42 | brown wood | Deeper = Tougher Blocks, with a fist icon |

Code: `Signboard` in MineGate.jsx (art in `infoBoardTexture` in [labels.js](src/utils/labels.js)), data: `INFO_BOARDS` in world.js. Each is solid within 2.2 m of its centre.

**Mine Fence.** Posts 0.4 m square and 2 m tall about every 2.5 m, with two rails (0.85 m and 1.6 m up). Four sides around the mine, 2.4 m collision height, 0.6 m thick.
- South side: z -42, from x -26 to -2.9 and from 2.9 to 26 (the gap is the Mine Arch).
- West side: x -26, z -68 to -42.
- East side: x 26, z -68 to -42.
- North side: z -68, x -26 to 26.

**Forest Mine.** Floor from x -26 to 26 and z -68 to -42 (52 m × 26 m), orange-tiled with 2 m tiles `#ea8b3c` and `#e3823a`, studs and orange grout. Each column is 8 stacked removable 2 × 2 × 2 m cubes (`removeCube` / `removeCubeAt` in mineCubes.js; in dev, `window.__mine`); a fully dug column bottoms out on a bed at y -15.6. No removal input yet.

**North Trees.** Same tree as the rest of the map (`Tree` in Props.jsx, shared), solid in a 0.8 m circle. Positions (x, z):
- Beside the mine: (-33, -46), (33, -47), (-33, -61), (34, -62)
- Along the north wall: (-31, -72), (-16, -72.5), (16, -72.5), (31, -72)

**North Bushes.** Low leaf blocks (2.2 m × 1.2 m, plus a small top block), not solid. Positions (x, z): (-29, -44), (29, -52), (-29.5, -57), (23, -70.5), (-9, -70.5), (8, -71). Code: `BUSHES` in MineGate.jsx.

**North Wall.** Inner face at z -76, two tiers like the other walls (inner tier 7 to 8 m, outer tier 13 to 16 m, 4 m thick), grass-topped. The Forest Sign hangs on it at x 0. The east and west walls extend north (z -76 to -40) to meet it. Code: `Walls` in Hub.jsx, `NORTH.wallZ` in world.js.

## West: Training

Code: [Training.jsx](src/components/world/Training.jsx), data: `TARGETS`, `TARGET_ROWS`, `TRAINING_STAGE`, `TARGET_TILE` and `TARGET_BLOCK` in world.js. The **Teleport Button**'s Training stop is (-22, 0), facing west.

| Name | Position (x, z) | What it is |
|---|---|---|
| **Training Banner** | -41.2, 0 | Blue "Training" banner (15 m wide) in a dark-blue frame, standing on the lower wall tier's ledge |
| **Training Stage** | x -37 to -30, z -19 to 19 | Low blue-grey stage (top 1.0, a single step up from the path) with a gold strip (z ±4) in line with the path; holds the back row |
| **Seating** | against the west wall | Two-step bleachers, level with the stage at the back |

Targets are 2.4 m blocks on 3.4 m coloured floor tiles. The front row is at x -26 on the floor; the back row is at x -33.5 on the stage. Labels show the cost (or "Unlocked") and the damage multiplier; back-row labels sit higher so they clear the front row's. Each is solid within 1.6 m.

| Name | Position (x, z) | Row | Tile | Damage | Cost |
|---|---|---|---|---|---|
| **Stone Target** | -26, 13.5 | front | grey | 1.5x | 1 rebirth |
| **Wood Target** | -26, 6.5 | front | brown | 1x | unlocked (starter) |
| **Snow Target** | -26, -6.5 | front | light blue | 3x | 3 rebirths |
| **Emerald Target** | -26, -13.5 | front | orange | 5x | 5 rebirths |
| **Sand Target** | -33.5, 14 | back | yellow | 7x | 7 rebirths |
| **Amethyst Target** | -33.5, 7 | back | purple | 10x | 69 gems |
| **Crystal Target** | -33.5, 0 | back | red, on the gold strip | 50x | 449 gems (spinning, glowing blue crystal with orbiting shards) |
| **Lava Target** | -33.5, -7 | back | dark | 25x | 205 gems |
| **Ruby Target** | -33.5, -14 | back | red | 10x | 10 rebirths |

## East: Leaderboards

Code: [Leaderboards.jsx](src/components/world/Leaderboards.jsx), data: `LB_STAGE` and `LB_BOARDS` in world.js.

| Name | Position (x, z) | What it is |
|---|---|---|
| **Leaderboards Banner** | 39.4, 0 | Purple "Leaderboards" banner over the east wall |
| **Leaderboard Stage** | 29 to 40, -13 to 13 | Two-step grey stage with a red carpet |
| **Damage Board** | 38, -8.5 | Most Damage |
| **Rebirths Board** | 38, 0 | Most Rebirths |
| **Money Board** | 38, 8.5 | Most Money |

## South: Premium TNT

Code: [Pedestals.jsx](src/components/world/Pedestals.jsx), data: `PEDESTALS` and `ADMIN_STAGE` in world.js.

| Name | Position (x, z) | Price |
|---|---|---|
| **Corrupt TNT** | 10, 27 | 69 gems |
| **Admin TNT** | 0, 30 | 449 gems (on the red **Admin Stage**) |
| **Atomic TNT** | -10, 27 | 205 gems |

## Props

Code: [Props.jsx](src/components/world/Props.jsx).

| Name | Position (x, z) | What it is |
|---|---|---|
| **Index** | 19, -24 | Floating blue book on a pad |
| **Feedback Mailbox** | -19, -24 | Mailbox with a red flag |
| **Trees** | list in `TREES` in world.js | Blocky green trees around the grass and corners |

## HUD (screen, not world)

Code: [Hud.jsx](src/components/Hud.jsx), panels in [Panels.jsx](src/components/hud/Panels.jsx), styles in [hud.css](src/hud.css).

| Name | Where on screen |
|---|---|
| **Level Bar** | top centre |
| **Friend Boost** (and the **+** button) | top right |
| **Quest Button** and **Settings Button** | under Friend Boost |
| **Menu Cards** (Shop, Bag, Daily, Rebirth) and **Teleport Button** | left |
| **Stats** (explosions, money, shells, rebirths) | bottom left |
| **Offers** (90% OFF potion, FREE gift) | right |
| **Hotbar** (the player's inventory) and **Enchanted Label** | bottom centre |
| **E Prompt** (keycap + hold ring) | centre, 70% down; shown only near an interact zone (see [Interact.md](Interact.md)) |
| **Action Result** (green/red popup) | top centre, under the Level Bar |
| **E Button** (touch only) | bottom right, beside JUMP |

## Solid or walk-through

Solid things (you bump into them) are listed in `COLLIDERS` in world.js. Walk-through: the grass tufts, flowers, bushes, the Start Line and the carpets. Platforms (Admin Stage, Leaderboard Stage, Training Stage, Seating) can be walked up onto.

## Adding or renaming one

1. Put the position in `data/world.js` and have the component read it. If the thing is solid, add it to `COLLIDERS` there too.
2. Add a row to the right table above, using a short unique name.
3. If you rename something, update this file in the same change.
