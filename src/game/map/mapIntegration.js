// ============================================================
// Map Integration Helpers for Game Engine
// ============================================================
// Helper functions to integrate map system with existing game loop

import {
  getMapObjectDef,
  getCollisionBox,
  getRenderBox,
} from './mapObjects'
import { renderMapObject } from './mapRenderer'

/**
 * Update player movement with map collision
 * Call this in updateMovementAndCamera
 * 
 * @param {object} state - Game state
 * @param {object} mapSystem - The useMapSystem hook instance
 * @param {number} deltaTime - Frame delta time
 * @param {number} moveSpeed - Calculated move speed
 */
export const updateMovementWithMapCollision = (state, mapSystem, deltaTime, moveSpeed) => {
  if (!mapSystem?.isLoaded) {
    return { x: state.player.x, y: state.player.y }
  }

  let targetX = state.player.x
  let targetY = state.player.y

  // Calculate target position from input
  if (state.keys.w) targetY -= moveSpeed * deltaTime
  if (state.keys.s) targetY += moveSpeed * deltaTime
  if (state.keys.a) targetX -= moveSpeed * deltaTime
  if (state.keys.d) targetX += moveSpeed * deltaTime

  // Check collision and get resolved position
  const playerSize = 64 * (state.player.character?.spriteScale || 1)
  const result = mapSystem.processMovement(
    state.player.x,
    state.player.y,
    targetX,
    targetY,
    playerSize
  )

  return {
    x: result.x,
    y: result.y,
    blocked: result.blocked,
  }
}

/**
 * Process attack damage against map objects
 * Call this when player attacks
 * 
 * @param {object} state - Game state
 * @param {object} mapSystem - The useMapSystem hook instance  
 * @param {object} attackArea - Attack hitbox { x, y, width, height } or { x, y, radius }
 * @param {number} damage - Damage amount
 * @param {boolean} isCircular - Whether attack is circular
 * @returns {Array} - Array of hit results
 */
export const processMapObjectAttack = (state, mapSystem, attackArea, damage, isCircular = false) => {
  if (!mapSystem?.isLoaded) return []

  const results = mapSystem.processAttack(attackArea, damage, isCircular)

  // Create visual effects for hits
  results.forEach(({ object, destroyed }) => {
    if (destroyed) {
      // Add destruction effect
      state.attackEffects.push({
        type: 'aoe',
        x: object.x,
        y: object.y,
        maxRadius: 40,
        color: 'rgba(200, 180, 150, 0.6)',
        createdAt: performance.now(),
        duration: 400,
      })

      // Add damage number
      state.damageNumbers?.push?.({
        x: object.x,
        y: object.y - 40,
        text: 'DESTROYED',
        color: '#FFD700',
        createdAt: performance.now(),
        duration: 1000,
      })
    } else if (results.length > 0) {
      // Add hit effect for non-destroyed hits
      state.attackEffects.push({
        type: 'aoe',
        x: object.x,
        y: object.y,
        maxRadius: 20,
        color: 'rgba(255, 255, 255, 0.4)',
        createdAt: performance.now(),
        duration: 150,
      })
    }
  })

  return results
}

/**
 * Render map objects with Y-sorting around player
 * Call this in renderFrame at appropriate points
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} state - Game state
 * @param {object} mapSystem - The useMapSystem hook instance
 * @param {object} loadedMapSprites - Preloaded map sprites
 * @param {object} options - Render options
 */
export const renderMapWithPlayer = (ctx, state, mapSystem, loadedMapSprites, options = {}) => {
  if (!mapSystem?.isLoaded) return { renderBehind: () => {}, renderInFront: () => {} }

  const playerSize = 64 * (state.player.character?.spriteScale || 1)

  // Update transparencies
  mapSystem.updateTransparencies(state.player.x, state.player.y, playerSize)

  // Get all objects sorted by Y
  const objects = mapSystem.getSortedObjects()
  const camera = state.camera

  return {
    /**
     * Render objects behind player (call before rendering player)
     */
    renderBehind: () => {
      objects.forEach((obj) => {
        if (obj.y <= state.player.y) {
          renderMapObject(ctx, obj, camera, loadedMapSprites, options)
        }
      })
    },

    /**
     * Render objects in front of player (call after rendering player)
     */
    renderInFront: () => {
      objects.forEach((obj) => {
        if (obj.y > state.player.y) {
          renderMapObject(ctx, obj, camera, loadedMapSprites, options)
        }
      })
    },
  }
}

/**
 * Check if a spawn position is valid (not inside obstacles)
 * Use this for enemy spawning
 * 
 * @param {object} mapSystem - The useMapSystem hook instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} radius - Spawn clearance radius
 * @returns {boolean} - Whether position is valid for spawning
 */
export const isValidSpawnPosition = (mapSystem, x, y, radius = 30) => {
  if (!mapSystem?.isLoaded) return true

  const spawnBox = {
    x: x - radius,
    y: y - radius,
    width: radius * 2,
    height: radius * 2,
  }

  const objects = mapSystem.getAllObjects()
  
  for (const obj of objects) {
    const def = getMapObjectDef(obj.type)
    if (!def || !def.collisionBox) continue

    const collisionBox = getCollisionBox(obj)
    if (!collisionBox) continue

    // Check overlap
    if (
      spawnBox.x < collisionBox.x + collisionBox.width &&
      spawnBox.x + spawnBox.width > collisionBox.x &&
      spawnBox.y < collisionBox.y + collisionBox.height &&
      spawnBox.y + spawnBox.height > collisionBox.y
    ) {
      return false
    }
  }

  return true
}

/**
 * Get a valid spawn position near the target, avoiding obstacles
 * 
 * @param {object} mapSystem - The useMapSystem hook instance
 * @param {number} targetX - Desired X position
 * @param {number} targetY - Desired Y position
 * @param {number} radius - Spawn clearance radius
 * @param {number} maxAttempts - Max repositioning attempts
 * @returns {object|null} - Valid position { x, y } or null if none found
 */
export const findValidSpawnPosition = (mapSystem, targetX, targetY, radius = 30, maxAttempts = 10) => {
  // First try the exact position
  if (isValidSpawnPosition(mapSystem, targetX, targetY, radius)) {
    return { x: targetX, y: targetY }
  }

  // Try nearby positions in a spiral pattern
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const angle = (attempt / maxAttempts) * Math.PI * 2 * 3 // 3 full rotations
    const distance = radius * (1 + attempt * 0.5)
    
    const testX = targetX + Math.cos(angle) * distance
    const testY = targetY + Math.sin(angle) * distance

    if (isValidSpawnPosition(mapSystem, testX, testY, radius)) {
      return { x: testX, y: testY }
    }
  }

  return null
}

/**
 * Check line of sight between two points (for AI pathfinding)
 * 
 * @param {object} mapSystem - The useMapSystem hook instance
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {number} stepSize - Check interval
 * @returns {boolean} - Whether line of sight is clear
 */
export const hasLineOfSight = (mapSystem, x1, y1, x2, y2, stepSize = 20) => {
  if (!mapSystem?.isLoaded) return true

  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.ceil(distance / stepSize)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x1 + dx * t
    const y = y1 + dy * t

    if (mapSystem.isPositionBlocked(x, y, 16)) {
      return false
    }
  }

  return true
}
