import { MINE_CUBES } from './world.js'

// Block types of the Forest Mine floor, by rarity. Common sits on top; the
// rarer ones are found deeper. `LAYER_WEIGHTS[layer]` is the chance table for
// the layer-th cube of a column (0 = top), keyed by ORES index.
// `item` is what the block drops: its inventory count key in the game store
// and its name in the Sell panel; `price` is the cash per block.
export const ORES = [
  { id: 'common', name: 'Common', item: 'dirt', itemName: 'Dirt', price: 24, base: '#b9551f', edge: '#8c3d14', fleck: null, blobs: 0 },
  { id: 'uncommon', name: 'Uncommon', item: 'stone', itemName: 'Stone', price: 80, base: '#5d6168', edge: '#42454b', fleck: null, blobs: 0 },
  { id: 'rare', name: 'Rare', item: 'coal', itemName: 'Coal', price: 640, base: '#4b4e54', edge: '#34363b', fleck: '#2a2c30', blobs: 9 },
  { id: 'legendary', name: 'Legendary', item: 'gold', itemName: 'Gold', price: 12500, base: '#50535a', edge: '#383a40', fleck: '#ffae1a', blobs: 7, crystal: true },
  { id: 'mythic', name: 'Mythic', item: 'diamond', itemName: 'Diamond', price: 180000, base: '#50535a', edge: '#383a40', fleck: '#37d4f5', blobs: 7, crystal: true },
  { id: 'secret', name: 'Secret', item: 'bedrock', itemName: 'Bedrock', price: 11200000, base: '#1d2236', edge: '#12162a', fleck: '#2f7bff', blobs: 7, crystal: true },
]

//                      common uncommon rare legendary mythic secret
export const LAYER_WEIGHTS = [
  [100, 0, 0, 0, 0, 0],
  [90, 10, 0, 0, 0, 0],
  [55, 45, 0, 0, 0, 0],
  [10, 50, 40, 0, 0, 0],
  [8, 30, 55, 7, 0, 0],
  [8, 15, 50, 25, 2, 0],
  [8, 10, 30, 32, 20, 0],
  [8, 7, 20, 25, 30, 10],
]

// Which ORES index the layer-th cube of the column (col, row) is. Deterministic.
export function oreFor(col, row, layer) {
  // The table is a depth profile stretched over however many layers the mine has.
  const w = LAYER_WEIGHTS[Math.min(LAYER_WEIGHTS.length - 1, Math.floor((layer * LAYER_WEIGHTS.length) / MINE_CUBES.layers))]
  let h = (col * 73856093) ^ (row * 19349663) ^ (layer * 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  let r = ((h >>> 0) / 4294967296) * w.reduce((a, b) => a + b, 0)
  for (let i = 0; i < w.length; i++) {
    r -= w[i]
    if (r < 0) return i
  }
  return 0
}
