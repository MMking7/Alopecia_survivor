import { GAME_CONFIG, ENEMIES, BOSS } from '../../constants'
import { getDifficultyMultiplier } from '../domain/difficulty'
import { generateId } from '../domain/math'

export const handleSpawns = ({ state, currentTime }) => {
  const difficulty = getDifficultyMultiplier(state.gameTime)

  // Spawn enemies with difficulty scaling
  const adjustedSpawnRate = difficulty.spawnRate / (state.stats.spawnRateMultiplier || 1.0)
  if (currentTime - state.lastEnemySpawn > adjustedSpawnRate) {
    state.lastEnemySpawn = currentTime

    // 한번에 여러 적 스폰
    for (let i = 0; i < difficulty.enemyCount; i++) {
      // 담배 몹은 20% 확률로만 소환
      let enemyType
      if (Math.random() < 0.2) {
        enemyType = ENEMIES[Math.floor(Math.random() * ENEMIES.length)]
      } else {
        // 담배를 제외한 다른 몹 중에서 선택
        const nonCigaretteEnemies = ENEMIES.filter(e => e.type !== 'cigarette')
        enemyType = nonCigaretteEnemies[Math.floor(Math.random() * nonCigaretteEnemies.length)]
      }
      const angle = Math.random() * Math.PI * 2
      const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)

      state.enemies.push({
        id: generateId(),
        ...enemyType,
        x: state.player.x + Math.cos(angle) * dist,
        y: state.player.y + Math.sin(angle) * dist,
        currentHp: Math.floor(enemyType.hp * difficulty.hpMultiplier),
        maxHp: Math.floor(enemyType.hp * difficulty.hpMultiplier),
        scaledDamage: enemyType.damage * difficulty.damageMultiplier,
        scaledSpeed: enemyType.speed * difficulty.speedMultiplier,
        rotation: 0,
        lastAttack: 0,
        isDashing: false,
        dashTarget: null,
        isDead: false,
        deathTimer: 0,
        vx: 0,
        vy: 0,
      })
    }
  }

  // Spawn boss
  if (state.gameTime >= GAME_CONFIG.BOSS_SPAWN_TIME && !state.bossSpawned) {
    state.bossSpawned = true
    const angle = Math.random() * Math.PI * 2
    state.enemies.push({
      id: generateId(),
      ...BOSS,
      x: state.player.x + Math.cos(angle) * 500,
      y: state.player.y + Math.sin(angle) * 500,
      currentHp: Math.floor(BOSS.hp * difficulty.hpMultiplier),
      maxHp: Math.floor(BOSS.hp * difficulty.hpMultiplier),
      scaledDamage: BOSS.damage * difficulty.damageMultiplier,
      scaledSpeed: BOSS.speed,
      rotation: 0,
      lastAttack: 0,
    })
  }
}
