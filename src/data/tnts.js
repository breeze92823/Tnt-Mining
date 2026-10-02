// `blast`: power (blocks per explosion). Types without a price are owned from the start.
export const TNTS = [
  { id: 'classic', name: 'Classic', rarity: 'Common', blast: 1, top: '#e8262b', left: '#c21c20', right: '#d92327' },
  { id: 'green', name: 'Green', rarity: 'Uncommon', blast: 3, price: 100, top: '#3fd25a', left: '#1f9a3a', right: '#2bb84a' },
  { id: 'yellow', name: 'Yellow', rarity: 'Uncommon', blast: 6, price: 2000, top: '#ffd21f', left: '#c79a0a', right: '#e6b811' },
  { id: 'blue', name: 'Blue', rarity: 'Rare', blast: 12, price: 8000, top: '#4a9af0', left: '#1f5fc8', right: '#2f7fe0' },
  { id: 'purple', name: 'Purple', rarity: 'Rare', blast: 25, price: 25000, top: '#a43fe0', left: '#6a1fb8', right: '#8a2fd0' },
  { id: 'white', name: 'White', rarity: 'Rare', blast: 45, price: 120000, top: '#ffffff', left: '#c8ccd4', right: '#e6e9ef' },
  { id: 'black', name: 'Black', rarity: 'Rare', blast: 80, price: 800000, top: '#4a4a52', left: '#1a1a1f', right: '#2e2e35' },
  { id: 'silver', name: 'Silver', rarity: 'Epic', blast: 300, price: 4000000, top: '#e6e9ef', left: '#8d939d', right: '#b8bec8' },
  { id: 'gold', name: 'Gold', rarity: 'Epic', blast: 600, price: 20000000, top: '#ffe066', left: '#c79a0a', right: '#f0b81f' },
  { id: 'diamond', name: 'Diamond', rarity: 'Epic', blast: 1200, price: 100000000, top: '#8af0ff', left: '#2fa8c8', right: '#5cd0ec' },
  { id: 'obsidian', name: 'Obsidian', rarity: 'Epic', blast: 2400, price: 500000000, top: '#4a2a7a', left: '#1a0a33', right: '#2e1456' },
  { id: 'springy', name: 'Springy', rarity: 'Legendary', blast: 5000, price: 2000000000, top: '#7ee81e', left: '#3f9a0a', right: '#5cc012' },
  { id: 'speedy', name: 'Speedy', rarity: 'Legendary', blast: 20000, price: 10000000000, top: '#40e0ff', left: '#1a90b0', right: '#2fb8d8' },
  { id: 'lucky', name: 'Lucky', rarity: 'Legendary', blast: 60000, price: 50000000000, top: '#3fd25a', left: '#14783a', right: '#22a84a' },
  { id: 'fire', name: 'Fire', rarity: 'Legendary', blast: 120000, price: 250000000000, top: '#ff8a1f', left: '#c23a0a', right: '#e85a14' },
  { id: 'nuke', name: 'Nuke', rarity: 'Mythic', blast: 600000, price: 750000000000, top: '#b8f01e', left: '#5a7a0a', right: '#8ab814' },
  { id: 'ice', name: 'Ice', rarity: 'Mythic', blast: 1500000, price: 4000000000000, top: '#bfeaff', left: '#5a9ad0', right: '#8ac8f0' },
]

export const tntById = (id) => TNTS.find((t) => t.id === id) || TNTS[0]
