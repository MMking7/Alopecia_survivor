export const getDifficultyMultiplier = (gameTime) => {
  const minute = gameTime / 60
  
  // Phase 1: 0~7분 (초반 - 쉬움)
  // 몹 젠 수 줄임, 스폰 속도 느림
  if (minute < 7) {
    return {
      hpMultiplier: 1 + minute * 0.2, // 체력 천천히 증가
      damageMultiplier: 1 + minute * 0.1,
      speedMultiplier: 1 + minute * 0.05,
      spawnRate: Math.max(1500, 3000 - minute * 200), // 3초 -> 1.5초 (천천히 빨라짐)
      enemyCount: Math.min(10, 3 + Math.floor(minute * 1)), // 3마리 -> 10마리 (적은 수 유지)
    }
  } 
  // Phase 2: 7~9분 (후반 - 어려워짐)
  // 몹 젠 수 대폭 증가
  else if (minute < 9) {
    return {
      hpMultiplier: 1 + minute * 0.4, // 체력 증가폭 상승
      damageMultiplier: 1 + minute * 0.2,
      speedMultiplier: 1 + minute * 0.1,
      spawnRate: Math.max(600, 1500 - (minute - 7) * 450), // 1.5초 -> 0.6초 (급격히 빨라짐)
      enemyCount: Math.min(30, 20 + Math.floor((minute - 7) * 5)), // 20마리 -> 30마리 (갑자기 많아짐)
    }
  }
  // Phase 3: 9분 이후 (극후반 - 지옥)
  // 8분대의 값으로 고정
  else {
    return {
      hpMultiplier: 1 + 8 * 0.4, // 4.2배 (8분 시점)
      damageMultiplier: 1 + 8 * 0.2, // 2.6배 (8분 시점)
      speedMultiplier: 1 + 8 * 0.1, // 1.8배 (8분 시점)
      spawnRate: 1050, // 8분 시점: 1500 - (8-7) * 450 = 1050ms
      enemyCount: 25, // 8분 시점: 20 + (8-7) * 5 = 25마리
    }
  }
}
