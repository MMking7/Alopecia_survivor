import React, { useState, useEffect, useCallback } from 'react'
import { GAME_CONFIG, SPRITES, CHARACTERS, SHOP_UPGRADES, getBaseStatsWithShop } from './constants'
import TitleScreen from './screens/TitleScreen'
import CharacterSelectScreen from './screens/CharacterSelectScreen'
import ShopScreen from './screens/ShopScreen'
import GameScreen from './screens/GameScreen'
import GameOverScreen from './screens/GameOverScreen'
import './App.css'

/**
 * App Component - Main Application Controller
 * 
 * Responsibilities:
 * - Global state management (character progress, highScore)
 * - Screen routing/navigation
 * - Image preloading
 * - LocalStorage persistence
 * 
 * Architecture:
 * - App.jsx: State management & routing only
 * - TitleScreen: Main menu
 * - CharacterSelectScreen: Character selection
 * - ShopScreen: Shop purchases
 * - GameScreen: All gameplay logic
 * - GameOverScreen: Game over display
 */

// Preload all game images
const preloadImages = () => {
  const sources = [
    SPRITES.background,
    SPRITES.boss,
    ...Object.values(SPRITES.characters),
    ...Object.values(SPRITES.enemies),
    ...Object.values(SPRITES.items),
    ...Object.values(SPRITES.ui),
  ]
  
  const loaded = {}
  let loadedCount = 0

  return new Promise((resolve) => {
    sources.forEach(src => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        loaded[src] = img
        loadedCount++
        if (loadedCount === sources.length) {
          resolve(loaded)
        }
      }
      img.onerror = () => {
        loadedCount++
        if (loadedCount === sources.length) {
          resolve(loaded)
        }
      }
    })
  })
}

const CHARACTER_PROGRESS_KEY = 'hairSurvivor_characterProgress'
const ACTIVE_CHARACTER_KEY = 'hairSurvivor_activeCharacterId'

const createDefaultProfile = () => ({
  level: 1,
  bonusStats: {},
  shopLevels: {},
  coins: 0,
})

const normalizeProfile = (profile) => ({
  level: profile?.level || 1,
  bonusStats: profile?.bonusStats || {},
  shopLevels: profile?.shopLevels || {},
  coins: profile?.coins || 0,
})

const loadCharacterProgress = () => {
  const saved = localStorage.getItem(CHARACTER_PROGRESS_KEY)
  if (saved) {
    try {
      return JSON.parse(saved) || {}
    } catch (error) {
      return {}
    }
  }

  const legacyCoins = parseInt(localStorage.getItem('hairSurvivor_coins') || '0', 10)
  let legacyShopLevels = {}
  const legacyShopRaw = localStorage.getItem('hairSurvivor_shopLevels')
  if (legacyShopRaw) {
    try {
      legacyShopLevels = JSON.parse(legacyShopRaw) || {}
    } catch (error) {
      legacyShopLevels = {}
    }
  }

  if (legacyCoins || Object.keys(legacyShopLevels).length > 0) {
    const fallbackId = localStorage.getItem(ACTIVE_CHARACTER_KEY) || CHARACTERS[0]?.id
    if (!fallbackId) return {}
    return {
      [fallbackId]: {
        ...createDefaultProfile(),
        coins: legacyCoins || 0,
        shopLevels: legacyShopLevels,
      },
    }
  }

  return {}
}

const mergeBonusStats = (prevBonus = {}, baseline = {}, current = {}) => {
  const getDelta = (key) => Math.max(0, (current[key] ?? baseline[key] ?? 0) - (baseline[key] ?? 0))

  return {
    maxHp: Math.max(prevBonus.maxHp || 0, getDelta('maxHp')),
    crit: Math.max(prevBonus.crit || 0, getDelta('crit')),
    lifeSteal: Math.max(prevBonus.lifeSteal || 0, getDelta('lifeSteal')),
    xpMultiplier: Math.max(prevBonus.xpMultiplier || 0, getDelta('xpMultiplier')),
    spawnRateMultiplier: Math.max(prevBonus.spawnRateMultiplier || 0, getDelta('spawnRateMultiplier')),
  }
}

function App() {
  // ============================================================
  // GLOBAL STATE
  // ============================================================
  
  // Screen navigation
  const [gamePhase, setGamePhase] = useState('menu')
  // Values: 'menu', 'characterSelect', 'shop', 'playing', 'gameover'
  
  // Character selection
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  
  // Persistent data (saved to localStorage)
  const [characterProgress, setCharacterProgress] = useState(() => loadCharacterProgress())
  const [activeCharacterId, setActiveCharacterId] = useState(() => {
    return localStorage.getItem(ACTIVE_CHARACTER_KEY) || CHARACTERS[0]?.id || null
  })
  
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('hairSurvivor_highScore')) || 0
  })
  
  // Image loading state
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState({})
  
  // Game over stats (passed from GameScreen)
  const [gameOverStats, setGameOverStats] = useState(null)

  const activeProfile = normalizeProfile(characterProgress[activeCharacterId])
  const coins = activeProfile.coins
  const shopLevels = activeProfile.shopLevels
  const activeCharacter = CHARACTERS.find((char) => char.id === activeCharacterId) || null
  const selectedProfile = selectedCharacter ? normalizeProfile(characterProgress[selectedCharacter.id]) : activeProfile

  // ============================================================
  // IMAGE PRELOADING
  // ============================================================
  useEffect(() => {
    preloadImages().then(images => {
      setLoadedImages(images)
      setImagesLoaded(true)
    })
  }, [])

  // ============================================================
  // PERSISTENCE
  // ============================================================
  useEffect(() => {
    localStorage.setItem(CHARACTER_PROGRESS_KEY, JSON.stringify(characterProgress))
  }, [characterProgress])

  useEffect(() => {
    if (activeCharacterId) {
      localStorage.setItem(ACTIVE_CHARACTER_KEY, activeCharacterId)
    }
  }, [activeCharacterId])

  useEffect(() => {
    localStorage.setItem('hairSurvivor_highScore', highScore)
  }, [highScore])

  useEffect(() => {
    if (!activeCharacterId && CHARACTERS.length > 0) {
      setActiveCharacterId(CHARACTERS[0].id)
    }
  }, [activeCharacterId])

  const updateActiveProfile = useCallback((updater) => {
    if (!activeCharacterId) return
    setCharacterProgress(prev => {
      const current = normalizeProfile(prev[activeCharacterId])
      const nextProfile = updater(current)
      return { ...prev, [activeCharacterId]: nextProfile }
    })
  }, [activeCharacterId])

  const setCoins = useCallback((updater) => {
    updateActiveProfile(profile => {
      const nextCoins = typeof updater === 'function' ? updater(profile.coins) : updater
      return { ...profile, coins: nextCoins }
    })
  }, [updateActiveProfile])

  const setShopLevels = useCallback((updater) => {
    updateActiveProfile(profile => {
      const nextLevels = typeof updater === 'function' ? updater(profile.shopLevels) : updater
      return { ...profile, shopLevels: nextLevels }
    })
  }, [updateActiveProfile])

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================
  const handleSelectCharacter = useCallback((character) => {
    setSelectedCharacter(character)
    setActiveCharacterId(character.id)
  }, [setSelectedCharacter, setActiveCharacterId])

  const handleStartGame = useCallback(() => {
    if (selectedCharacter && imagesLoaded) {
      setGamePhase('playing')
    }
  }, [selectedCharacter, imagesLoaded])

  const handleGameOver = useCallback((stats) => {
    // Calculate earned coins
    const earnedCoins = stats.kills + Math.floor(stats.time / 5)
    
    // Calculate score
    const score = stats.kills * 50 + Math.floor(stats.time * 10) + stats.level * 500
    if (score > highScore) {
      setHighScore(score)
    }

    if (selectedCharacter) {
      setCharacterProgress(prev => {
        const currentProfile = normalizeProfile(prev[selectedCharacter.id])
        const baselineStats = getBaseStatsWithShop(selectedCharacter, currentProfile.shopLevels)
        const nextBonusStats = stats.statsSnapshot
          ? mergeBonusStats(currentProfile.bonusStats, baselineStats, stats.statsSnapshot)
          : currentProfile.bonusStats

        const nextProfile = {
          ...currentProfile,
          coins: currentProfile.coins + earnedCoins,
          level: Math.max(currentProfile.level, stats.level || 1),
          bonusStats: nextBonusStats,
        }

        return { ...prev, [selectedCharacter.id]: nextProfile }
      })
    }
    
    // Store stats for GameOverScreen
    setGameOverStats({
      ...stats,
      earnedCoins,
      score,
    })
    
    setGamePhase('gameover')
  }, [highScore, selectedCharacter])

  const handleQuitGame = useCallback(() => {
    setGamePhase('menu')
    setSelectedCharacter(null)
  }, [])

  const handleRetry = useCallback(() => {
    setGamePhase('playing')
  }, [])

  const handleBackToMenu = useCallback(() => {
    setGamePhase('menu')
    setSelectedCharacter(null)
    setGameOverStats(null)
  }, [])

  const handleBackToCharacterSelect = useCallback(() => {
    setGamePhase('characterSelect')
    setSelectedCharacter(null)
    setGameOverStats(null)
  }, [])

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#111',
      overflow: 'hidden',
      fontFamily: '"Noto Sans KR", sans-serif',
    }}>
      {/* Main App Container - Fixed Resolution */}
      <div style={{
        width: GAME_CONFIG.CANVAS_WIDTH,
        height: GAME_CONFIG.CANVAS_HEIGHT,
        position: 'relative',
        background: '#000',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        
        {/* MENU SCREEN */}
        {gamePhase === 'menu' && (
          <TitleScreen
            coins={coins}
            activeCharacterName={activeCharacter?.name}
            onStart={() => setGamePhase('characterSelect')}
            onShop={() => setGamePhase('shop')}
          />
        )}

        {/* CHARACTER SELECT SCREEN */}
        {gamePhase === 'characterSelect' && (
          <CharacterSelectScreen
            characters={CHARACTERS}
            selectedCharacter={selectedCharacter}
            onSelect={handleSelectCharacter}
            onStart={handleStartGame}
            onBack={() => setGamePhase('menu')}
            imagesLoaded={imagesLoaded}
            characterProgress={characterProgress}
          />
        )}

        {/* SHOP SCREEN */}
        {gamePhase === 'shop' && (
          <ShopScreen
            coins={coins}
            setCoins={setCoins}
            shopLevels={shopLevels}
            setShopLevels={setShopLevels}
            shopUpgrades={SHOP_UPGRADES}
            onBack={() => setGamePhase('menu')}
          />
        )}

        {/* GAME SCREEN */}
        {gamePhase === 'playing' && selectedCharacter && (
          <GameScreen
            selectedCharacter={selectedCharacter}
            shopLevels={selectedProfile.shopLevels}
            characterProgress={selectedProfile}
            loadedImages={loadedImages}
            onGameOver={handleGameOver}
            onQuit={handleQuitGame}
          />
        )}

        {/* GAME OVER SCREEN */}
        {gamePhase === 'gameover' && gameOverStats && (
          <GameOverScreen
            stats={gameOverStats}
            onRetry={handleRetry}
            onCharacterSelect={handleBackToCharacterSelect}
            onMenu={handleBackToMenu}
          />
        )}
      </div>
    </div>
  )
}

export default App
