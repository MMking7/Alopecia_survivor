// ============================================================
// MAP DATA SCHEMA & SAMPLE MAP
// ============================================================
// Data-driven map definition using JSON/array format

/**
 * Map Schema:
 * {
 *   id: string - Unique map identifier
 *   name: string - Display name
 *   width: number - Map width in pixels
 *   height: number - Map height in pixels
 *   background: string - Background tile sprite path
 *   objects: Array<MapObjectPlacement> - Placed objects
 * }
 * 
 * MapObjectPlacement:
 * {
 *   type: string - Object type ID from mapObjects.js
 *   x: number - World X position
 *   y: number - World Y position
 *   hp?: number - Override default HP for destructibles
 * }
 */

// Sample map data demonstrating all object types
export const SAMPLE_MAP = {
  id: 'forest_clearing',
  name: 'Forest Clearing',
  width: 2048,
  height: 2048,
  background: '/sprites/holo/background.webp',
  objects: [
    // Tall obstacles - Trees scattered around
    { type: 'big_tree', x: 300, y: 200 },
    { type: 'big_tree', x: 800, y: 350 },
    { type: 'big_tree', x: 1500, y: 180 },
    { type: 'old_tree', x: 500, y: 600 },
    { type: 'old_tree', x: 1200, y: 450 },
    { type: 'old_tree', x: 1800, y: 700 },
    
    // Statue pillars as landmarks
    { type: 'statue_pillar', x: 1024, y: 300 },
    { type: 'statue_pillar', x: 700, y: 900 },
    { type: 'statue_pillar', x: 1400, y: 1100 },
    
    // Broken statues (already destroyed)
    { type: 'broken_statue', x: 400, y: 1200 },
    { type: 'broken_statue', x: 1600, y: 500 },
    
    // Bushes - walkable decorations
    { type: 'bush', x: 250, y: 400 },
    { type: 'bush', x: 280, y: 420 },
    { type: 'bush', x: 600, y: 300 },
    { type: 'bush', x: 950, y: 550 },
    { type: 'bush', x: 1300, y: 700 },
    { type: 'bush', x: 1700, y: 300 },
    { type: 'bush', x: 1100, y: 900 },
    
    // Destructible statue busts
    { type: 'statue_bust', x: 450, y: 800 },
    { type: 'statue_bust', x: 900, y: 400 },
    { type: 'statue_bust', x: 1500, y: 850 },
    { type: 'statue_bust', x: 1000, y: 1200, hp: 300 }, // Custom HP
  ],
}

// Empty map for testing
export const EMPTY_MAP = {
  id: 'empty',
  name: 'Empty Map',
  width: 2048,
  height: 2048,
  background: '/sprites/holo/background.webp',
  objects: [],
}

// Generate a random map with the specified parameters
export const generateRandomMap = ({
  width = 2048,
  height = 2048,
  treeCount = 10,
  bushCount = 15,
  statueCount = 5,
  bustCount = 3,
  minSpacing = 100,
  safeZone = { x: 512, y: 384, radius: 150 }, // Player spawn area
  existingObjects = [],
  attemptsMultiplier = 10,
}) => {
  const objects = [...existingObjects]
  const placedPositions = existingObjects.map(({ x, y }) => ({ x, y }))

  const isValidPosition = (x, y, minDist) => {
    // Check safe zone
    const dx = x - safeZone.x
    const dy = y - safeZone.y
    if (Math.sqrt(dx * dx + dy * dy) < safeZone.radius) {
      return false
    }

    // Check spacing from other objects
    for (const pos of placedPositions) {
      const pdx = x - pos.x
      const pdy = y - pos.y
      if (Math.sqrt(pdx * pdx + pdy * pdy) < minDist) {
        return false
      }
    }
    return true
  }

  const placeObject = (type, count, spacing) => {
    let attempts = 0
    let placed = 0
    const maxAttempts = Math.max(1, count) * attemptsMultiplier
    while (placed < count && attempts < maxAttempts) {
      const x = 100 + Math.random() * (width - 200)
      const y = 100 + Math.random() * (height - 200)
      if (isValidPosition(x, y, spacing)) {
        objects.push({ type, x, y })
        placedPositions.push({ x, y })
        placed++
      }
      attempts++
    }
  }

  // Place objects with appropriate spacing
  placeObject('big_tree', Math.floor(treeCount / 2), minSpacing * 1.5)
  placeObject('old_tree', Math.ceil(treeCount / 2), minSpacing * 1.5)
  placeObject('statue_pillar', Math.floor(statueCount / 2), minSpacing * 1.2)
  placeObject('broken_statue', Math.ceil(statueCount / 2), minSpacing)
  placeObject('statue_bust', bustCount, minSpacing)
  placeObject('bush', bushCount, minSpacing * 0.5) // Bushes can be closer

  return {
    id: `random_${Date.now()}`,
    name: 'Random Forest',
    width,
    height,
    background: '/sprites/holo/background.webp',
    objects,
  }
}

// Map registry for easy lookup
export const MAP_REGISTRY = {
  forest_clearing: SAMPLE_MAP,
  empty: EMPTY_MAP,
}

export const getMapById = (mapId) => {
  return MAP_REGISTRY[mapId] || null
}
