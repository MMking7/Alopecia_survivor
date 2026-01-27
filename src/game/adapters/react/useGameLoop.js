import { useEffect } from 'react'
import { handleSpawns } from '../../usecases/spawn'
import { updateMovementAndCamera, updateCombat } from '../../usecases/combat'
import { renderFrame } from '../../usecases/render'

export const useGameLoop = ({
  gamePhase,
  canvasRef,
  gameStateRef,
  animationFrameRef,
  loadedImages,
  onGameOver,
  setDisplayStats,
  setLevelUpOptions,
  setGamePhase,
}) => {
  useEffect(() => {
    if (gamePhase !== 'playing' || !canvasRef.current || !gameStateRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let lastTime = performance.now()

    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      const state = gameStateRef.current
      if (!state) return

      // Safety Init for Hot Reload / Existing Game States
      if (!state.coins) state.coins = []
      if (typeof state.collectedCoins === 'undefined') state.collectedCoins = 0
      if (!state.spawnedBossIds) state.spawnedBossIds = []

      const buildFinalStats = () => ({
        level: state.level,
        kills: state.kills,
        time: state.gameTime,
        hp: 0,
        maxHp: state.stats.maxHp,
        collectedCoins: state.collectedCoins,
        statsSnapshot: {
          maxHp: state.stats.maxHp,
          damage: state.stats.damage,
          attackSpeed: state.stats.attackSpeed,
          attackRange: state.stats.attackRange,
          moveSpeed: state.stats.moveSpeed,
          crit: state.stats.crit,
          defense: state.stats.defense,
          lifeSteal: state.stats.lifeSteal,
          xpMultiplier: state.stats.xpMultiplier,
          spawnRateMultiplier: state.stats.spawnRateMultiplier,
        },
      })

      // Update game time
      state.gameTime += deltaTime

      updateMovementAndCamera({ state, deltaTime })
      handleSpawns({ state, currentTime })
      updateCombat({
        state,
        deltaTime,
        currentTime,
        onGameOver,
        buildFinalStats,
        gameStateRef,
        setLevelUpOptions,
        setGamePhase,
        setDisplayStats,
      })
      renderFrame({ state, ctx, canvas, currentTime, loadedImages })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gamePhase, loadedImages, onGameOver])
}
