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
  // 엄청 어렵게
  else {
    return {
      hpMultiplier: 1 + minute * 1.0, // 체력 폭증
      damageMultiplier: 1 + minute * 0.5, // 데미지 폭증
      speedMultiplier: 1.5 + (minute - 9) * 0.1, // 속도 빠름
      spawnRate: 400, // 0.4초 (광속 스폰)
      enemyCount: 60, // 60마리 (화면 가득)
    }
  }
}
