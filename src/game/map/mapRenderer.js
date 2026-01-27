// ============================================================
// Map Renderer - Canvas Rendering for Map Objects
// ============================================================
// Handles Y-sorted rendering with occlusion transparency

import { getMapObjectDef, getRenderBox, getCollisionBox } from './mapObjects'

/**
 * Preload all map object sprites
 * @param {object} mapData - Map data with objects array
 * @returns {Promise<object>} - Loaded images keyed by sprite path
 */
export const preloadMapSprites = async (mapData) => {
  if (!mapData || !mapData.objects) return {}

  const spritePaths = new Set()
  
  // Collect unique sprite paths
  mapData.objects.forEach((placement) => {
    const def = getMapObjectDef(placement.type)
    if (def && def.sprite) {
      spritePaths.add(def.sprite)
    }
    // Also preload transformation sprites
    if (def && def.transformsTo) {
      const transformDef = getMapObjectDef(def.transformsTo)
      if (transformDef && transformDef.sprite) {
        spritePaths.add(transformDef.sprite)
      }
    }
  })

  const loadedImages = {}
  const loadPromises = []

  spritePaths.forEach((path) => {
    const promise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        loadedImages[path] = img
        resolve()
      }
      img.onerror = () => {
        console.warn(`Failed to load map sprite: ${path}`)
        resolve()
      }
      img.src = path
    })
    loadPromises.push(promise)
  })

  await Promise.all(loadPromises)
  return loadedImages
}

/**
 * Render a single map object
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} obj - Map object instance
 * @param {object} camera - Camera offset { x, y }
 * @param {object} loadedImages - Preloaded image map
 * @param {object} options - Render options
 */
export const renderMapObject = (ctx, obj, camera, loadedImages, options = {}) => {
  const def = getMapObjectDef(obj.type)
  if (!def) return

  const { showCollisionBoxes = false, showRenderBoxes = false } = options

  const renderBox = getRenderBox(obj)
  if (!renderBox) return

  // Calculate screen position
  const screenX = renderBox.x - camera.x
  const screenY = renderBox.y - camera.y

  // Culling - skip if off screen
  const canvas = ctx.canvas
  if (
    screenX + renderBox.width < 0 ||
    screenX > canvas.width ||
    screenY + renderBox.height < 0 ||
    screenY > canvas.height
  ) {
    return
  }

  // Get sprite image
  const img = loadedImages[def.sprite]

  ctx.save()

  // Apply alpha for transparency effects
  if (obj.alpha !== undefined && obj.alpha < 1) {
    ctx.globalAlpha = obj.alpha
  }

  if (img && img.complete && img.naturalWidth > 0) {
    // Draw sprite
    ctx.imageSmoothingEnabled = false // Pixel art style
    ctx.drawImage(
      img,
      screenX,
      screenY,
      renderBox.width,
      renderBox.height
    )
  } else {
    // Fallback rendering
    renderFallbackObject(ctx, obj, def, screenX, screenY, renderBox)
  }

  // Debug: Show collision boxes
  if (showCollisionBoxes && def.collisionBox) {
    const collisionBox = getCollisionBox(obj)
    if (collisionBox) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(
        collisionBox.x - camera.x,
        collisionBox.y - camera.y,
        collisionBox.width,
        collisionBox.height
      )
      ctx.setLineDash([])
    }
  }

  // Debug: Show render boxes
  if (showRenderBoxes) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(screenX, screenY, renderBox.width, renderBox.height)
  }

  // Show HP bar for destructible objects
  if (def.destructible && obj.hp !== undefined && obj.hp < obj.maxHp) {
    renderHpBar(ctx, obj, screenX, screenY, renderBox.width)
  }

  ctx.restore()
}

/**
 * Fallback rendering when sprite is not loaded
 */
const renderFallbackObject = (ctx, obj, def, screenX, screenY, renderBox) => {
  const colors = {
    big_tree: '#2d5a27',
    old_tree: '#3d6a37',
    statue_pillar: '#8b8b8b',
    broken_statue: '#6b6b6b',
    bush: '#4a7c44',
    statue_bust: '#9b9b9b',
  }

  const color = colors[obj.type] || '#888888'

  ctx.fillStyle = color
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2

  if (def.category === 'TALL_OBSTACLE' || def.category === 'DESTRUCTIBLE_OBSTACLE') {
    // Draw as rectangle with rounded top
    ctx.beginPath()
    ctx.roundRect(screenX, screenY, renderBox.width, renderBox.height, [8, 8, 0, 0])
    ctx.fill()
    ctx.stroke()

    // Add some detail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(screenX + 4, screenY + renderBox.height * 0.6, renderBox.width - 8, 4)
  } else if (def.category === 'PASSABLE_DECORATION') {
    // Draw as oval/bush shape
    ctx.beginPath()
    ctx.ellipse(
      screenX + renderBox.width / 2,
      screenY + renderBox.height / 2,
      renderBox.width / 2,
      renderBox.height / 2,
      0, 0, Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
  }

  // Draw type label for debugging
  ctx.fillStyle = 'white'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(obj.type, screenX + renderBox.width / 2, screenY + renderBox.height / 2)
}

/**
 * Render HP bar above damaged destructible objects
 */
const renderHpBar = (ctx, obj, screenX, screenY, width) => {
  const barWidth = Math.min(width, 48)
  const barHeight = 6
  const barX = screenX + (width - barWidth) / 2
  const barY = screenY - 12

  const hpRatio = obj.hp / obj.maxHp

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  // HP fill
  const hpColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444'
  ctx.fillStyle = hpColor
  ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2)

  // Border
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(barX, barY, barWidth, barHeight)
}

/**
 * Render all map objects with Y-sorting, split around player Y position
 * This allows proper layering where player can appear in front of or behind objects
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} objects - Map objects from useMap
 * @param {object} camera - Camera offset { x, y }
 * @param {number} playerY - Player Y position for split rendering
 * @param {object} loadedImages - Preloaded image map
 * @param {object} options - Render options
 * @returns {object} - Functions to render before and after player
 */
export const createMapRenderer = (ctx, objects, camera, loadedImages, options = {}) => {
  // Sort objects by Y position
  const sortedObjects = [...objects].sort((a, b) => a.y - b.y)

  return {
    /**
     * Render objects that should appear behind the player
     * (objects with Y <= playerY)
     */
    renderBehindPlayer: (playerY) => {
      sortedObjects.forEach((obj) => {
        if (obj.y <= playerY) {
          renderMapObject(ctx, obj, camera, loadedImages, options)
        }
      })
    },

    /**
     * Render objects that should appear in front of the player
     * (objects with Y > playerY)
     */
    renderInFrontOfPlayer: (playerY) => {
      sortedObjects.forEach((obj) => {
        if (obj.y > playerY) {
          renderMapObject(ctx, obj, camera, loadedImages, options)
        }
      })
    },

    /**
     * Render all objects in Y-sorted order (when player isn't involved)
     */
    renderAll: () => {
      sortedObjects.forEach((obj) => {
        renderMapObject(ctx, obj, camera, loadedImages, options)
      })
    },
  }
}

/**
 * Integration helper for existing renderFrame function
 * Returns rendering functions to call at appropriate points in the render pipeline
 */
export const createMapRenderIntegration = (mapHook, collisionHook, loadedImages) => {
  return {
    /**
     * Update transparency for all objects based on player position
     */
    updateTransparency: (playerX, playerY, playerSize) => {
      if (!collisionHook || !mapHook) return

      const alphas = collisionHook.checkAllTransparency(playerX, playerY, playerSize)
      mapHook.updateObjectAlphas(alphas)
    },

    /**
     * Get renderer for current frame
     */
    getRenderer: (ctx, camera, options = {}) => {
      if (!mapHook) return null

      const objects = mapHook.getAllObjects()
      return createMapRenderer(ctx, objects, camera, loadedImages, options)
    },
  }
}
