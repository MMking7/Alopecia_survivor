// ============================================================
// useCollision Hook - Collision Detection System
// ============================================================
// Handles movement collision, occlusion detection, and object interaction

import { useCallback, useRef } from 'react'
import {
  getMapObjectDef,
  getCollisionBox,
  getInteractionBox,
  getRenderBox,
} from '../mapObjects'

/**
 * Check if two axis-aligned boxes overlap
 */
const boxesOverlap = (box1, box2) => {
  if (!box1 || !box2) return false
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  )
}

/**
 * Check if a point is inside a box
 */
const pointInBox = (px, py, box) => {
  if (!box) return false
  return (
    px >= box.x &&
    px <= box.x + box.width &&
    py >= box.y &&
    py <= box.y + box.height
  )
}

/**
 * Get overlap area between two boxes
 */
const getOverlapArea = (box1, box2) => {
  if (!boxesOverlap(box1, box2)) return 0
  
  const overlapX = Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x)
  const overlapY = Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y)
  
  return overlapX * overlapY
}

/**
 * useCollision Hook
 * 
 * Provides collision detection functionality for:
 * - Movement blocking (player vs obstacle collision boxes)
 * - Occlusion detection (player behind tall objects)
 * - Overlap detection (player walking through passable objects)
 * - Attack hit detection (attacks vs destructible objects)
 * 
 * @param {object} mapHook - The useMap hook instance
 * @returns {object} Collision detection functions
 */
export const useCollision = (mapHook) => {
  // Cache for spatial partitioning (optional optimization)
  const spatialCacheRef = useRef(null)

  /**
   * Get player collision box
   * The player's collision is typically a small box at their feet
   */
  const getPlayerCollisionBox = useCallback((playerX, playerY, playerSize = 64) => {
    const collisionWidth = playerSize * 0.5
    const collisionHeight = playerSize * 0.25
    const feetOffsetY = playerSize * 0.35 // Collision at feet level
    
    return {
      x: playerX - collisionWidth / 2,
      y: playerY + feetOffsetY - collisionHeight / 2,
      width: collisionWidth,
      height: collisionHeight,
      centerX: playerX,
      centerY: playerY + feetOffsetY,
    }
  }, [])

  /**
   * Check if a position would collide with any blocking objects
   * Returns collision result with resolved position if blocked
   */
  const checkMovementCollision = useCallback((
    currentX, currentY,
    targetX, targetY,
    playerSize = 64
  ) => {
    const objects = mapHook?.getAllObjects() || []
    
    const targetBox = getPlayerCollisionBox(targetX, targetY, playerSize)
    let blocked = false
    let resolvedX = targetX
    let resolvedY = targetY
    const collidedObjects = []

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.collisionBox) continue // No collision for this object
      
      const objBox = getCollisionBox(obj)
      if (!objBox) continue

      if (boxesOverlap(targetBox, objBox)) {
        blocked = true
        collidedObjects.push(obj)

        // Calculate push-back direction
        const playerCenterX = targetBox.centerX
        const playerCenterY = targetBox.centerY
        const objCenterX = objBox.centerX
        const objCenterY = objBox.centerY

        const dx = playerCenterX - objCenterX
        const dy = playerCenterY - objCenterY

        // Determine which axis to resolve on based on overlap
        const overlapX = (targetBox.width / 2 + objBox.width / 2) - Math.abs(dx)
        const overlapY = (targetBox.height / 2 + objBox.height / 2) - Math.abs(dy)

        if (overlapX < overlapY) {
          // Resolve on X axis
          resolvedX = dx > 0
            ? objBox.x + objBox.width + targetBox.width / 2
            : objBox.x - targetBox.width / 2
        } else {
          // Resolve on Y axis
          const feetOffsetY = playerSize * 0.35
          resolvedY = dy > 0
            ? objBox.y + objBox.height + targetBox.height / 2 - feetOffsetY
            : objBox.y - targetBox.height / 2 - feetOffsetY
        }
      }
    }

    return {
      blocked,
      resolvedX,
      resolvedY,
      collidedObjects,
    }
  }, [mapHook, getPlayerCollisionBox])

  /**
   * Check movement with sliding along obstacles
   * Attempts X and Y movement separately if diagonal is blocked
   */
  const checkMovementWithSlide = useCallback((
    currentX, currentY,
    targetX, targetY,
    playerSize = 64
  ) => {
    // First try direct movement
    const directResult = checkMovementCollision(currentX, currentY, targetX, targetY, playerSize)
    
    if (!directResult.blocked) {
      return { x: targetX, y: targetY, blocked: false }
    }

    // Try X-only movement
    const xResult = checkMovementCollision(currentX, currentY, targetX, currentY, playerSize)
    // Try Y-only movement
    const yResult = checkMovementCollision(currentX, currentY, currentX, targetY, playerSize)

    let finalX = currentX
    let finalY = currentY

    if (!xResult.blocked) {
      finalX = targetX
    }
    if (!yResult.blocked) {
      finalY = targetY
    }

    return {
      x: finalX,
      y: finalY,
      blocked: finalX === currentX && finalY === currentY,
    }
  }, [checkMovementCollision])

  /**
   * Check which objects should be semi-transparent due to occlusion
   * Returns object IDs and their target alpha values
   * 
   * Occlusion occurs when:
   * - Player Y < Object Y (player is "behind" the object)
   * - Player is within the horizontal range of the object's sprite
   */
  const checkOcclusion = useCallback((playerX, playerY, playerSize = 64) => {
    const objects = mapHook?.getAllObjects() || []
    const occlusionAlphas = {}
    
    const playerBox = {
      x: playerX - playerSize / 2,
      y: playerY - playerSize / 2,
      width: playerSize,
      height: playerSize,
    }

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.occlusionEnabled) continue

      const renderBox = getRenderBox(obj)
      if (!renderBox) continue

      // Check if player is behind this object (player Y < object base Y)
      // AND player is within horizontal range of the sprite
      const playerBehind = playerY < obj.y
      const horizontalOverlap = 
        playerX + playerSize / 2 > renderBox.x &&
        playerX - playerSize / 2 < renderBox.x + renderBox.width

      if (playerBehind && horizontalOverlap) {
        // Check if player actually overlaps with the render area
        if (boxesOverlap(playerBox, renderBox)) {
          occlusionAlphas[obj.id] = 0.4 // Semi-transparent
        }
      }
    }

    return occlusionAlphas
  }, [mapHook])

  /**
   * Check which passable objects the player is overlapping with
   * These should become semi-transparent to show the player
   */
  const checkOverlap = useCallback((playerX, playerY, playerSize = 64) => {
    const objects = mapHook?.getAllObjects() || []
    const overlapAlphas = {}

    const playerBox = {
      x: playerX - playerSize / 2,
      y: playerY - playerSize / 2,
      width: playerSize,
      height: playerSize,
    }

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.overlapTransparency) continue

      const interactionBox = getInteractionBox(obj)
      if (!interactionBox) continue

      if (boxesOverlap(playerBox, interactionBox)) {
        // Calculate transparency based on overlap amount
        const overlapArea = getOverlapArea(playerBox, interactionBox)
        const playerArea = playerBox.width * playerBox.height
        const overlapRatio = overlapArea / playerArea
        
        // More overlap = more transparent (0.3 to 0.7 range)
        overlapAlphas[obj.id] = Math.max(0.3, 0.7 - overlapRatio * 0.4)
      }
    }

    return overlapAlphas
  }, [mapHook])

  /**
   * Combined transparency check for both occlusion and overlap
   */
  const checkAllTransparency = useCallback((playerX, playerY, playerSize = 64) => {
    const occlusion = checkOcclusion(playerX, playerY, playerSize)
    const overlap = checkOverlap(playerX, playerY, playerSize)
    
    // Merge, taking the more transparent value if both apply
    const combined = { ...occlusion }
    for (const [id, alpha] of Object.entries(overlap)) {
      if (combined[id] !== undefined) {
        combined[id] = Math.min(combined[id], alpha)
      } else {
        combined[id] = alpha
      }
    }
    
    return combined
  }, [checkOcclusion, checkOverlap])

  /**
   * Check if an attack hits any destructible objects
   * Returns array of hit objects
   */
  const checkAttackCollision = useCallback((attackBox) => {
    const objects = mapHook?.getAllObjects() || []
    const hitObjects = []

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.destructible || obj.isDestroyed) continue
      if (obj.hp <= 0) continue

      const collisionBox = getCollisionBox(obj)
      if (!collisionBox) continue

      if (boxesOverlap(attackBox, collisionBox)) {
        hitObjects.push(obj)
      }
    }

    return hitObjects
  }, [mapHook])

  /**
   * Check circular attack area (for AoE attacks)
   */
  const checkCircularAttackCollision = useCallback((centerX, centerY, radius) => {
    const objects = mapHook?.getAllObjects() || []
    const hitObjects = []

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.destructible || obj.isDestroyed) continue
      if (obj.hp <= 0) continue

      const collisionBox = getCollisionBox(obj)
      if (!collisionBox) continue

      // Check if circle intersects with box
      const closestX = Math.max(collisionBox.x, Math.min(centerX, collisionBox.x + collisionBox.width))
      const closestY = Math.max(collisionBox.y, Math.min(centerY, collisionBox.y + collisionBox.height))
      
      const distanceX = centerX - closestX
      const distanceY = centerY - closestY
      const distanceSquared = distanceX * distanceX + distanceY * distanceY

      if (distanceSquared <= radius * radius) {
        hitObjects.push(obj)
      }
    }

    return hitObjects
  }, [mapHook])

  /**
   * Get objects within a rectangular area (for spatial queries)
   */
  const getObjectsInArea = useCallback((x, y, width, height) => {
    const objects = mapHook?.getAllObjects() || []
    const areaBox = { x, y, width, height }
    
    return objects.filter((obj) => {
      const renderBox = getRenderBox(obj)
      return renderBox && boxesOverlap(areaBox, renderBox)
    })
  }, [mapHook])

  /**
   * Get the closest blocking object to a point
   */
  const getClosestBlockingObject = useCallback((x, y) => {
    const objects = mapHook?.getAllObjects() || []
    let closest = null
    let closestDist = Infinity

    for (const obj of objects) {
      const def = getMapObjectDef(obj.type)
      if (!def || !def.collisionBox) continue

      const dx = obj.x - x
      const dy = obj.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < closestDist) {
        closestDist = dist
        closest = obj
      }
    }

    return { object: closest, distance: closestDist }
  }, [mapHook])

  return {
    // Player collision
    getPlayerCollisionBox,
    checkMovementCollision,
    checkMovementWithSlide,

    // Transparency/Occlusion
    checkOcclusion,
    checkOverlap,
    checkAllTransparency,

    // Attack collision
    checkAttackCollision,
    checkCircularAttackCollision,

    // Spatial queries
    getObjectsInArea,
    getClosestBlockingObject,
  }
}

export default useCollision
