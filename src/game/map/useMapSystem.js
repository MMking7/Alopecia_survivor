// ============================================================
// useMapSystem - Combined Map Integration Hook
// ============================================================
// Provides a unified interface for map, collision, and rendering

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMap } from './hooks/useMap'
import { useCollision } from './hooks/useCollision'
import { preloadMapSprites, createMapRenderIntegration } from './mapRenderer'
import { SAMPLE_MAP } from './mapData'

/**
 * useMapSystem Hook
 * 
 * Combines useMap and useCollision into a single integrated system
 * that can be easily connected to the game engine.
 * 
 * @param {object} options - Configuration options
 * @param {object} options.mapData - Map data to load (defaults to SAMPLE_MAP)
 * @param {boolean} options.autoInitialize - Auto-initialize on mount (default: true)
 * @param {boolean} options.debugMode - Show debug visuals (default: false)
 * @returns {object} Combined map system interface
 */
export const useMapSystem = (options = {}) => {
  const {
    mapData = SAMPLE_MAP,
    autoInitialize = true,
    debugMode = false,
  } = options

  // Map state management
  const mapHook = useMap(mapData)
  
  // Collision detection
  const collisionHook = useCollision(mapHook)

  // Loaded sprites
  const [mapSprites, setMapSprites] = useState({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Debug options
  const debugOptionsRef = useRef({
    showCollisionBoxes: debugMode,
    showRenderBoxes: debugMode,
  })

  /**
   * Initialize the map system
   */
  const initialize = useCallback(async (data = mapData) => {
    setIsLoaded(false)

    // Initialize map objects
    mapHook.initializeMap(data)

    // Preload sprites
    const sprites = await preloadMapSprites(data)
    setMapSprites(sprites)

    setIsLoaded(true)
  }, [mapData, mapHook])

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && mapData) {
      initialize(mapData)
    }
  }, []) // Only on mount

  /**
   * Process player movement with collision detection
   * Returns the resolved position after collision checks
   */
  const processMovement = useCallback((
    currentX, currentY,
    targetX, targetY,
    playerSize = 64
  ) => {
    return collisionHook.checkMovementWithSlide(
      currentX, currentY,
      targetX, targetY,
      playerSize
    )
  }, [collisionHook])

  /**
   * Update object transparencies based on player position
   * Call this each frame before rendering
   */
  const updateTransparencies = useCallback((playerX, playerY, playerSize = 64) => {
    const alphas = collisionHook.checkAllTransparency(playerX, playerY, playerSize)
    mapHook.updateObjectAlphas(alphas)
  }, [collisionHook, mapHook])

  /**
   * Process attack against destructible objects
   * @param {object} attackBox - { x, y, width, height } or { x, y, radius } for circular
   * @param {number} damage - Damage amount
   * @param {boolean} isCircular - Whether the attack is circular
   * @returns {Array} - Array of { object, destroyed } results
   */
  const processAttack = useCallback((attackBox, damage, isCircular = false) => {
    const hitObjects = isCircular
      ? collisionHook.checkCircularAttackCollision(attackBox.x, attackBox.y, attackBox.radius)
      : collisionHook.checkAttackCollision(attackBox)

    const results = []

    hitObjects.forEach((obj) => {
      const destroyed = mapHook.damageObject(obj.id, damage)
      results.push({
        object: obj,
        destroyed,
        remainingHp: destroyed ? 0 : obj.hp,
      })
    })

    return results
  }, [collisionHook, mapHook])

  /**
   * Get render integration for the current frame
   * Use this to render map objects with proper Y-sorting
   */
  const getRenderIntegration = useCallback((ctx, camera) => {
    return createMapRenderIntegration(mapHook, collisionHook, mapSprites)
  }, [mapHook, collisionHook, mapSprites])

  /**
   * Render map objects for a frame
   * Call updateTransparencies first, then use this split rendering approach:
   * 1. renderBehindPlayer(playerY) - before rendering player
   * 2. (render player)
   * 3. renderInFrontOfPlayer(playerY) - after rendering player
   */
  const createFrameRenderer = useCallback((ctx, camera) => {
    const { createMapRenderer } = require('./mapRenderer')
    const objects = mapHook.getAllObjects()
    return createMapRenderer(ctx, objects, camera, mapSprites, debugOptionsRef.current)
  }, [mapHook, mapSprites])

  /**
   * Set debug display options
   */
  const setDebugOptions = useCallback((options) => {
    debugOptionsRef.current = {
      ...debugOptionsRef.current,
      ...options,
    }
  }, [])

  /**
   * Check if a world position is blocked by any object
   */
  const isPositionBlocked = useCallback((x, y, playerSize = 64) => {
    const result = collisionHook.checkMovementCollision(x, y, x, y, playerSize)
    return result.blocked
  }, [collisionHook])

  return {
    // State
    isLoaded,
    mapInfo: mapHook.mapInfo,
    mapSprites,

    // Initialization
    initialize,
    reset: mapHook.resetMap,

    // Movement
    processMovement,
    isPositionBlocked,

    // Combat
    processAttack,
    damageObject: mapHook.damageObject,

    // Rendering
    updateTransparencies,
    createFrameRenderer,
    getRenderIntegration,

    // Object management
    getAllObjects: mapHook.getAllObjects,
    getSortedObjects: mapHook.getSortedObjects,
    getObjectById: mapHook.getObjectById,
    addObject: mapHook.addObject,
    removeObject: mapHook.removeObject,

    // Debug
    setDebugOptions,
    debugOptions: debugOptionsRef.current,

    // Raw hook access for advanced usage
    _mapHook: mapHook,
    _collisionHook: collisionHook,
  }
}

export default useMapSystem
