// ============================================================
// useMap Hook - Map State Management
// ============================================================
// Manages map object state, transformations, and Y-axis sorting

import { useState, useCallback, useMemo, useRef } from 'react'
import {
  createMapObject,
  getMapObjectDef,
  getSortKey,
} from '../mapObjects'

/**
 * useMap Hook
 * 
 * Manages the runtime state of map objects including:
 * - Initialization from map data
 * - Object state changes (HP, destruction, transformation)
 * - Y-axis sorted render order
 * - Efficient updates for React rendering
 * 
 * @param {object} mapData - Map definition with objects array
 * @returns {object} Map state and mutation functions
 */
export const useMap = (mapData) => {
  // Store objects in a ref for mutable access in game loop
  const objectsRef = useRef([])
  
  // State for React re-renders when needed
  const [objectsVersion, setObjectsVersion] = useState(0)

  /**
   * Initialize map from data
   */
  const initializeMap = useCallback((data) => {
    if (!data || !data.objects) {
      objectsRef.current = []
      setObjectsVersion((v) => v + 1)
      return
    }

    const initializedObjects = data.objects
      .map((placement) => createMapObject(placement.type, placement.x, placement.y, {
        hp: placement.hp,
      }))
      .filter(Boolean) // Remove null entries from unknown types

    objectsRef.current = initializedObjects
    setObjectsVersion((v) => v + 1)
  }, [])

  /**
   * Get all objects sorted by Y for rendering
   * Objects with higher Y values render on top (in front)
   */
  const getSortedObjects = useCallback(() => {
    return [...objectsRef.current].sort((a, b) => getSortKey(a) - getSortKey(b))
  }, [])

  /**
   * Get objects that should render below a given Y position
   * Used for rendering objects behind the player
   */
  const getObjectsBelowY = useCallback((y) => {
    return objectsRef.current
      .filter((obj) => getSortKey(obj) <= y)
      .sort((a, b) => getSortKey(a) - getSortKey(b))
  }, [])

  /**
   * Get objects that should render above a given Y position
   * Used for rendering objects in front of the player
   */
  const getObjectsAboveY = useCallback((y) => {
    return objectsRef.current
      .filter((obj) => getSortKey(obj) > y)
      .sort((a, b) => getSortKey(a) - getSortKey(b))
  }, [])

  /**
   * Damage a destructible object
   * Returns true if the object was destroyed
   */
  const damageObject = useCallback((objectId, damage) => {
    const objIndex = objectsRef.current.findIndex((obj) => obj.id === objectId)
    if (objIndex === -1) return false

    const obj = objectsRef.current[objIndex]
    const def = getMapObjectDef(obj.type)
    
    if (!def || !def.destructible || obj.isDestroyed) return false

    obj.hp = Math.max(0, obj.hp - damage)

    if (obj.hp <= 0) {
      obj.isDestroyed = true

      // Transform to broken version if specified
      const transformTo = def.transformsTo || def.onDestroy?.transformTo
      if (transformTo) {
        const newObj = createMapObject(transformTo, obj.x, obj.y)
        if (newObj) {
          objectsRef.current[objIndex] = newObj
        }
      }

      setObjectsVersion((v) => v + 1)
      return true
    }

    return false
  }, [])

  /**
   * Update object alpha for transparency effects
   */
  const setObjectAlpha = useCallback((objectId, alpha) => {
    const obj = objectsRef.current.find((o) => o.id === objectId)
    if (obj) {
      obj.alpha = Math.max(0, Math.min(1, alpha))
    }
  }, [])

  /**
   * Batch update alphas for multiple objects
   */
  const updateObjectAlphas = useCallback((alphaMap) => {
    objectsRef.current.forEach((obj) => {
      if (alphaMap.hasOwnProperty(obj.id)) {
        obj.alpha = Math.max(0, Math.min(1, alphaMap[obj.id]))
      } else {
        // Reset to full opacity if not in the map
        obj.alpha = 1
      }
    })
  }, [])

  /**
   * Get object by ID
   */
  const getObjectById = useCallback((objectId) => {
    return objectsRef.current.find((obj) => obj.id === objectId) || null
  }, [])

  /**
   * Get all objects (unsorted)
   */
  const getAllObjects = useCallback(() => {
    return objectsRef.current
  }, [])

  /**
   * Add a new object at runtime
   */
  const addObject = useCallback((type, x, y, overrides = {}) => {
    const newObj = createMapObject(type, x, y, overrides)
    if (newObj) {
      objectsRef.current.push(newObj)
      setObjectsVersion((v) => v + 1)
      return newObj.id
    }
    return null
  }, [])

  /**
   * Remove an object by ID
   */
  const removeObject = useCallback((objectId) => {
    const index = objectsRef.current.findIndex((obj) => obj.id === objectId)
    if (index !== -1) {
      objectsRef.current.splice(index, 1)
      setObjectsVersion((v) => v + 1)
      return true
    }
    return false
  }, [])

  /**
   * Reset map to initial state
   */
  const resetMap = useCallback(() => {
    if (mapData) {
      initializeMap(mapData)
    }
  }, [mapData, initializeMap])

  // Memoized map info
  const mapInfo = useMemo(() => ({
    id: mapData?.id || 'unknown',
    name: mapData?.name || 'Unknown Map',
    width: mapData?.width || 2048,
    height: mapData?.height || 2048,
    background: mapData?.background || null,
  }), [mapData])

  return {
    // State
    objectsRef,
    objectsVersion,
    mapInfo,
    
    // Initialization
    initializeMap,
    resetMap,
    
    // Queries
    getAllObjects,
    getSortedObjects,
    getObjectsBelowY,
    getObjectsAboveY,
    getObjectById,
    
    // Mutations
    damageObject,
    setObjectAlpha,
    updateObjectAlphas,
    addObject,
    removeObject,
  }
}

export default useMap
