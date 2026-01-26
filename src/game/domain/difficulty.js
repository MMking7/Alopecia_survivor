export const getDifficultyMultiplier = (gameTime) => {
  const minute = gameTime / 60
  return {
    hpMultiplier: 1 + minute * 0.3,
    damageMultiplier: 1 + minute * 0.15,
    speedMultiplier: 1 + minute * 0.1,
    spawnRate: Math.max(500, 2000 - minute * 150), // 2초에서 시작해서 0.5초까지 줄어듦
    enemyCount: Math.min(50, 5 + Math.floor(minute * 5)), // 5마리~50마리 (스폰 텀이 길어졌으므로 한 번에 더 많이)
  }
}
