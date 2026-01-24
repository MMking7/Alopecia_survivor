import React, { useState, useEffect, useCallback } from 'react'
import { GAME_CONFIG, SPRITES, CHARACTERS, SHOP_UPGRADES } from './constants'
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
 * - Global state management (coins, shopLevels, highScore)
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
  const [coins, setCoins] = useState(() => {
    return parseInt(localStorage.getItem('hairSurvivor_coins')) || 0
  })
  
  const [shopLevels, setShopLevels] = useState(() => {
    const saved = localStorage.getItem('hairSurvivor_shopLevels')
    return saved ? JSON.parse(saved) : {}
  })
  
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('hairSurvivor_highScore')) || 0
  })
  
  // Image loading state
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState({})
  
  // Game over stats (passed from GameScreen)
  const [gameOverStats, setGameOverStats] = useState(null)

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
    localStorage.setItem('hairSurvivor_coins', coins)
  }, [coins])

  useEffect(() => {
    localStorage.setItem('hairSurvivor_shopLevels', JSON.stringify(shopLevels))
  }, [shopLevels])

  useEffect(() => {
    localStorage.setItem('hairSurvivor_highScore', highScore)
  }, [highScore])

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================
  const handleStartGame = useCallback(() => {
    if (selectedCharacter && imagesLoaded) {
      setGamePhase('playing')
    }
  }, [selectedCharacter, imagesLoaded])

  const handleGameOver = useCallback((stats) => {
    // Calculate earned coins
    const earnedCoins = stats.kills + Math.floor(stats.time / 5)
    setCoins(prev => prev + earnedCoins)
    
    // Calculate score
    const score = stats.kills * 50 + Math.floor(stats.time * 10) + stats.level * 500
    if (score > highScore) {
      setHighScore(score)
    }
    
    // Store stats for GameOverScreen
    setGameOverStats({
      ...stats,
      earnedCoins,
      score,
    })
    
    setGamePhase('gameover')
  }, [highScore])

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
            characters={CHARACTERS}
            onStart={() => setGamePhase('characterSelect')}
            onShop={() => setGamePhase('shop')}
          />
        )}

        {/* CHARACTER SELECT SCREEN */}
        {gamePhase === 'characterSelect' && (
          <CharacterSelectScreen
            characters={CHARACTERS}
            selectedCharacter={selectedCharacter}
            onSelect={setSelectedCharacter}
            onStart={handleStartGame}
            onBack={() => setGamePhase('menu')}
            imagesLoaded={imagesLoaded}
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
            shopLevels={shopLevels}
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
