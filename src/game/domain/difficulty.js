export const getDifficultyMultiplier = (gameTime) => {
  const minute = gameTime / 60
  return {
    hpMultiplier: 1 + minute * 0.3,
    damageMultiplier: 1 + minute * 0.15,
    speedMultiplier: 1 + minute * 0.1,
    spawnRate: Math.max(500, 2000 - minute * 200),
    enemyCount: Math.min(10, (1 + Math.floor(minute / 2)) * 2),
  }
}
