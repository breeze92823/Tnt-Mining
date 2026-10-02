# Landmarks

Names for the places in the hub. Use these names when you ask for changes (for example "move the **SELL Stall** closer to the plaza" or "add a sign above **Mine Gate**"), so there is no guessing which thing you mean.

Coordinates are in metres: +X is east, +Z is south, +Y is up. The plaza centre is (0, 0). Positions come from [src/data/world.js](src/data/world.js), which is the single place to change them.

## Map

```
                        NORTH (-Z)
        Feedback Mailbox   Mine Gate    Index
        (-19,-24)         (0,-39)      (19,-24)

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
| **Raised Floor** | outside ±21 | Blue-grey studded floor around the grass | `OuterFloor` in Hub.jsx |
| **Walls** | edge of the map (±40) | Terraced orange walls with grass caps | `Walls` in Hub.jsx |

## Stalls

All four face the plaza. Code: [Stalls.jsx](src/components/world/Stalls.jsx), data: `STALLS` in world.js.

| Name | Position (x, z) | Canopy | Sign |
|---|---|---|---|
| **TNT Stall** | -12, -12 | red / white | TNT |
| **SELL Stall** | 12, -12 | green / white | SELL |
| **SHOP Stall** | 12, 12 | yellow / white | SHOP |
| **UPGRADE Stall** | -12, 12 | cream / white | UPGRADE |

## North: Desert Mine

Code: [MineGate.jsx](src/components/world/MineGate.jsx), data: `GATE` in world.js.

| Name | Position (x, z) | What it is |
|---|---|---|
| **Mine Gate** | 0, -39 | Black gate with the "Desert" banner and a "Mine" doorway glowing green |
| **Secrets Board** | -11.5, -36.4 | Info board: "Secrets spawn in Desert Mine, Track it!" |
| **Luck Board** | 10.5, -36.4 | Info board: "Mine Luck 1x ▸ 1.2x" |
| **Deep Block Board** | 14.2, -36.4 | Info board: "Deep Tough Block" |

## West: Training

Code: [Training.jsx](src/components/world/Training.jsx), data: `TARGETS` and `TRAINING_PAD` in world.js.

| Name | Position (x, z) | What it is |
|---|---|---|
| **Training Banner** | -38.2, 0 | Blue "Training" banner over the west wall |
| **Training Pad** | -32, 0 | Gold pad in the middle of the targets |
| **Seating** | against the west wall | Two-step bleachers |
| **Wood Target** | -25, 12.5 | 1x Damage, unlocked |
| **Stone Target** | -29.5, 9 | 1.5x Damage, costs 1 rebirth |
| **Snow Target** | -33, 5.2 | 3x Damage, costs 3 rebirths |
| **Crystal Target** | -34, 0 | 50x Damage, costs 449 gems (spinning blue crystal) |
| **Ruby Target** | -33, -5.2 | 25x Damage, costs 205 gems |
| **Emerald Target** | -29.5, -9 | 10x Damage, costs 10 rebirths |
| **Gold Target** | -25, -12.5 | 5x Damage, costs 5 rebirths |

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
| **Hotbar** and **Enchanted Label** | bottom centre |

## Adding or renaming one

1. Put the position in `data/world.js` and have the component read it. If the thing is solid, add it to `COLLIDERS` there too.
2. Add a row to the right table above, using a short unique name.
3. If you rename something, update this file in the same change.
