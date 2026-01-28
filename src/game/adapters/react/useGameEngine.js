import { useRef, useEffect, useState, useCallback } from 'react'
import { handleSubWeaponSelection, getSubWeaponById } from '../../../SubWeapons'
import { handlePassiveSkillSelection } from '../../../MainWeapons'
import { createInitialState } from '../../engine/createInitialState'
import { useGameInput } from './useGameInput'
import { useGameLoop } from './useGameLoop'

/**
 * useGameEngine
 * Handles gameplay logic and state for the game loop.
 */
export const useGameEngine = ({
  selectedCharacter,
  shopLevels,
  characterRanks = {},
  characterProgress,
  loadedImages,
  onGameOver,
  onQuit,
}) => {
  // Debug Trace


  const canvasRef = useRef(null)
  const gameStateRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Local state for UI
  const [gamePhase, setGamePhase] = useState('playing') // 'playing', 'levelup', 'paused'
  const [displayStats, setDisplayStats] = useState({
    level: 1, xp: 0, xpNeeded: 100, kills: 0, time: 0, hp: 100, maxHp: 100, shield: 0, fragments: 0, coins: 0, specialAbilityLastUsed: 0
  })
  const [levelUpOptions, setLevelUpOptions] = useState([])
  const [pauseTab, setPauseTab] = useState('main')

  // Initialize game
  const initGame = useCallback(() => {
    if (!selectedCharacter) return

    gameStateRef.current = createInitialState({
      selectedCharacter,
      shopLevels,
      characterRanks,
      characterProgress,
    })
  }, [selectedCharacter, shopLevels, characterRanks, characterProgress])

  // Initialize on mount
  useEffect(() => {
    initGame()
  }, [initGame])

  useGameInput({
    gameStateRef,
    canvasRef,
    gamePhase,
    setGamePhase,
    setPauseTab,
  })

  useGameLoop({
    gamePhase,
    canvasRef,
    gameStateRef,
    animationFrameRef,
    loadedImages,
    onGameOver,
    setDisplayStats,
    setLevelUpOptions,
    setGamePhase,
  })

  // Handle upgrade selection
  const handleUpgrade = useCallback((upgrade) => {
    if (gameStateRef.current) {
      if (upgrade.isMainWeapon) {
        // Main Weapon Level Up
        gameStateRef.current.mainWeaponLevel = upgrade.nextLevel
      } else if (upgrade.isPassiveSkill) {
        // Passive Skill Selection
        gameStateRef.current.passiveSkills = handlePassiveSkillSelection(
          upgrade,
          gameStateRef.current.passiveSkills
        )
      } else if (upgrade.isSubWeapon) {
        // Sub Weapon Selection
        const weaponData = upgrade.weaponData || getSubWeaponById(upgrade.id)
        if (weaponData) {
          gameStateRef.current.inventory = handleSubWeaponSelection(
            weaponData,
            gameStateRef.current.inventory
          )
        }
      } else {
        // Regular Item - update both stats and baseStats to persist the effect
        gameStateRef.current.stats = upgrade.effect(gameStateRef.current.stats)
        // Also update baseStats so the effect persists after passive bonus recalculation
        gameStateRef.current.baseStats = upgrade.effect({ ...gameStateRef.current.baseStats })
        // Clone the upgrade object to prevent reference sharing with UPGRADES constant
        // This prevents state from persisting across game instances
        gameStateRef.current.inventory.push({
          id: upgrade.id,
          name: upgrade.name,
          type: upgrade.type,
          description: upgrade.description,
          icon: upgrade.icon,
          isConsumable: upgrade.isConsumable,
          // Don't copy the effect function to inventory - it's not needed for display
        })

        // Magical Wig cooldown reduction is handled via specialCooldownReduction in stats/UI
      }
    }
    setLevelUpOptions([])
    setGamePhase('playing')
  }, [])

  // Handle quit
  const handleQuit = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    gameStateRef.current = null
    onQuit()
  }, [onQuit])

  return {
    canvasRef,
    gameStateRef,
    gamePhase,
    setGamePhase,
    displayStats,
    levelUpOptions,
    pauseTab,
    setPauseTab,
    handleUpgrade,
    handleQuit,
  }
}
