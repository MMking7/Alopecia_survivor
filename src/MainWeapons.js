// ============================================================
// MAIN WEAPONS & CHARACTER ABILITIES
// 캐릭터별 전용 무기, 패시브 스킬, 스페셜 능력
// ============================================================

/**
 * 캐릭터 전용 무기 정의
 * - 각 캐릭터는 하나의 메인 무기를 가짐
 * - 레벨 1~6: 일반 레벨업
 * - 레벨 7: 각성 (覺醒, Awakened)
 */
export const MAIN_WEAPONS = {
  // ============================================================
  // 여성형 탈모 - 일자 탈모 장판 (멀티샷)
  // ============================================================
  female: {
    id: 'female_weapon',
    name: '일자 탈모 장판',
    nameEn: 'Line Area Damage',
    characterId: 'female',
    type: 'ground_line',
    description: '전방 바닥에 길게 일자형 장판을 깔아 초당 피해',
    maxLevel: 7,
    levelEffects: {
      1: {
        lines: 1,
        length: 200,
        width: 60,
        damagePerSecond: 0.80,
        duration: 2,
      },
      2: {
        lines: 1,
        length: 240, // 20% 증가
        width: 60,
        damagePerSecond: 0.80,
        duration: 2,
      },
      3: {
        lines: 1,
        length: 240,
        width: 60,
        damagePerSecond: 1.04, // 30% 증가
        duration: 2,
      },
      4: {
        lines: 1,
        length: 240,
        width: 60,
        damagePerSecond: 1.04,
        duration: 2,
      },
      5: {
        lines: 3, // 좌우 두 줄 추가 (총 3줄)
        length: 240,
        width: 60,
        damagePerSecond: 1.04,
        duration: 2,
        spread: 80, // 좌우 간격
      },
      6: {
        lines: 3,
        length: 240,
        width: 60,
        damagePerSecond: 1.35, // 30% 증가
        duration: 2,
        spread: 80,
      },
      7: { // 각성
        lines: 3,
        length: 240,
        width: 60,
        damagePerSecond: 1.35,
        duration: 2,
        spread: 80,
        shockwave: true, // 장판 끝에서 충격파
        shockwaveDamage: 1.50,
        shockwaveKnockback: 200,
        shockwaveInterval: 1000, // 1초마다
      },
    },
    attackCooldown: 5000,
  },

  // ============================================================
  // 원형 탈모 - 탈모빔 (원거리)
  // ============================================================
  areata: {
    id: 'areata_weapon',
    name: '탈모빔',
    nameEn: 'Hair Loss Beam',
    characterId: 'areata',
    type: 'beam_projectile',
    description: '원형 에너지 구체를 발사, 폭발로 광역 피해',
    maxLevel: 7,
    levelEffects: {
      1: {
        damage: 1.00,
        explosionRadius: 50,
        pierce: 2, // 관통 수
      },
      2: {
        damage: 1.20, // 20% 증가
        explosionRadius: 50,
        pierce: 2,
      },
      3: {
        damage: 1.20,
        explosionRadius: 62.5, // 25% 증가
        pierce: 2,
      },
      4: {
        damage: 1.20,
        explosionRadius: 62.5,
        pierce: 2,
        attackSpeedBonus: 0.15, // 공격주기 15% 감소
      },
      5: {
        damage: 1.20,
        explosionRadius: 62.5,
        pierce: 5, // 3 증가
        attackSpeedBonus: 0.15,
      },
      6: {
        damage: 1.56, // 30% 증가
        explosionRadius: 62.5,
        pierce: 5,
        attackSpeedBonus: 0.15,
      },
      7: { // 각성
        damage: 1.56,
        explosionRadius: 62.5,
        pierce: 5,
        attackSpeedBonus: 0.15,
        doubleExplosion: true, // 2회 연속 폭발
        defenseReduction: 0.10, // 적 방어력 10% 감소 (최대 30%)
        defenseReductionMax: 0.30,
      },
    },
    attackCooldown: 1200,
  },

  // ============================================================
  // 황비홍 - 비홍 편두 (근접)
  // ============================================================
  wongfeihung: {
    id: 'wongfeihung_weapon',
    name: '비홍 편두',
    nameEn: 'Ponytail Whip',
    characterId: 'wongfeihung',
    type: 'melee_sweep',
    description: '남은 머리카락으로 전방을 휘두름',
    maxLevel: 7,
    levelEffects: {
      1: {
        damage: 1.00,
        range: 100,
        angle: 120, // 전방 120도
      },
      2: {
        damage: 1.20, // 20% 증가
        range: 100,
        angle: 120,
      },
      3: {
        damage: 1.20,
        range: 120, // 20% 증가
        angle: 120,
      },
      4: {
        damage: 1.20,
        range: 120,
        angle: 120,
        attackSpeedBonus: 0.10, // 공격주기 10% 감소
      },
      5: {
        damage: 1.20,
        range: 120,
        angle: 120,
        attackSpeedBonus: 0.10,
        stunChance: 0.20, // 20% 확률로 0.5초 기절
        stunDuration: 0.5,
      },
      6: {
        damage: 1.56, // 30% 증가
        range: 120,
        angle: 120,
        attackSpeedBonus: 0.10,
        stunChance: 0.20,
        stunDuration: 0.5,
      },
      7: { // 각성
        damage: 1.56,
        range: 120,
        angle: 120,
        attackSpeedBonus: 0.10,
        stunChance: 0.20,
        stunDuration: 0.5,
        doubleSwing: true, // 2회 연속 휘두르기
        firstSwingKnockback: 150,
        secondSwingDamage: 1.50, // 둘째 타 150% 피해
        armorPenetration: 0.20, // 방어 관통 20%
      },
    },
    attackCooldown: 1300,
  },

  // ============================================================
  // 헤이하치 - 초 풍신권 (근접)
  // ============================================================
  heihachi: {
    id: 'heihachi_weapon',
    name: '초 풍신권',
    nameEn: 'Electric Wind God Fist',
    characterId: 'heihachi',
    type: 'dash_punch',
    description: '돌진 후 전방에 감전 피해',
    maxLevel: 7,
    levelEffects: {
      1: {
        damage: 1.50,
        dashDistance: 80,
        radius: 60,
        electrifyDuration: 3, // 감전 3초
        electrifyDamagePerSecond: 0.40,
      },
      2: {
        damage: 1.80, // 20% 증가
        dashDistance: 80,
        radius: 60,
        electrifyDuration: 3,
        electrifyDamagePerSecond: 0.40,
      },
      3: {
        damage: 1.80,
        dashDistance: 80,
        radius: 60,
        electrifyDuration: 4, // 1초 증가
        electrifyDamagePerSecond: 0.40,
      },
      4: {
        damage: 1.80,
        dashDistance: 80,
        radius: 60,
        electrifyDuration: 4,
        electrifyDamagePerSecond: 0.40,
        attackSpeedBonus: 0.10,
      },
      5: {
        damage: 1.80,
        dashDistance: 80,
        radius: 60,
        electrifyDuration: 4,
        electrifyDamagePerSecond: 0.52, // 30% 증가
        attackSpeedBonus: 0.10,
      },
      6: {
        damage: 1.80,
        dashDistance: 96, // 20% 증가
        radius: 60,
        electrifyDuration: 4,
        electrifyDamagePerSecond: 0.52,
        attackSpeedBonus: 0.10,
      },
      7: { // 각성
        damage: 1.80,
        dashDistance: 96,
        radius: 60,
        electrifyDuration: 4,
        electrifyDamagePerSecond: 0.52,
        attackSpeedBonus: 0.10,
        chainLightning: true, // 감전된 적이 죽으면 번개가 2체에게 튐
        chainLightningTargets: 2,
      },
    },
    attackCooldown: 1400,
  },

  // ============================================================
  // M자맨 - M라인 커터 (멀티샷)
  // ============================================================
  mzamen: {
    id: 'mzamen_weapon',
    name: 'M라인 커터',
    nameEn: 'M-Line Cutter',
    characterId: 'mzamen',
    type: 'wave_pattern',
    description: 'M 모양 부메랑 파동 발사',
    maxLevel: 7,
    levelEffects: {
      1: {
        waveCount: 1,
        damage: 1.00,
        speed: 300,
        range: 250,
      },
      2: {
        waveCount: 2, // 1개 추가
        damage: 1.00,
        speed: 300,
        range: 250,
      },
      3: {
        waveCount: 2,
        damage: 1.20, // 20% 증가
        speed: 300,
        range: 250,
      },
      4: {
        waveCount: 2,
        damage: 1.20,
        speed: 300,
        range: 250,
        attackSpeedBonus: 0.15,
      },
      5: {
        waveCount: 3, // 2개 추가
        damage: 1.20,
        speed: 300,
        range: 250,
        attackSpeedBonus: 0.15,
      },
      6: {
        waveCount: 3,
        damage: 1.68, // 40% 증가
        speed: 300,
        range: 250,
        attackSpeedBonus: 0.15,
      },
      7: { // 각성
        waveCount: 3,
        damage: 1.68,
        speed: 300,
        range: 250,
        attackSpeedBonus: 0.15,
        returnExplosion: true, // 돌아올 때 교차 시 폭발
        returnExplosionDamage: 2.00,
        returnExplosionRadius: 70,
        armorPenetration: 0.20,
      },
    },
    attackCooldown: 1500,
  },

  // ============================================================
  // 탈모 의사 - 모근 절개칼 (중근거리)
  // ============================================================
  talmo_docter: {
    id: 'talmo_docter_weapon',
    name: '모근 절개칼',
    nameEn: 'Hair Follicle Scalpel',
    characterId: 'talmo_docter',
    type: 'cone_sweep',
    description: '전방 120도 원뿔형 휘두르기, 흡혈',
    maxLevel: 7,
    levelEffects: {
      1: {
        damage: 1.20,
        angle: 120,
        range: 130,
        lifeSteal: 0.15, // 피해의 15% 흡수
        fragmentChance: 0.50, // 50% 확률로 모근 조각 획득
        maxFragments: 15,
      },
      2: {
        damage: 1.38, // 15% 증가
        angle: 120,
        range: 130,
        lifeSteal: 0.20, // 5% 증가
        fragmentChance: 0.50,
        maxFragments: 15,
      },
      3: {
        damage: 1.38,
        angle: 120,
        range: 162.5, // 25% 증가
        lifeSteal: 0.20,
        fragmentChance: 0.75, // 75%로 증가
        maxFragments: 15,
      },
      4: {
        damage: 1.38,
        angle: 120,
        range: 162.5,
        lifeSteal: 0.20,
        fragmentChance: 0.75,
        maxFragments: 15,
        attackSpeedBonus: 0.10,
      },
      5: {
        damage: 1.38,
        angle: 120,
        range: 162.5,
        lifeSteal: 0.25, // 5% 증가
        fragmentChance: 0.75,
        maxFragments: 15,
        attackSpeedBonus: 0.10,
        multiSwing: 2, // 2회 연속 휘두름
      },
      6: {
        damage: 1.72, // 25% 증가
        angle: 120,
        range: 162.5,
        lifeSteal: 0.25,
        fragmentChance: 0.75,
        maxFragments: 15,
        attackSpeedBonus: 0.10,
        multiSwing: 2,
      },
      7: { // 각성
        damage: 1.72,
        angle: 120,
        range: 162.5,
        lifeSteal: 0.35, // 10% 증가
        fragmentChance: 0.75,
        maxFragments: 15,
        attackSpeedBonus: 0.10,
        multiSwing: 2,
        fragmentBonus: true, // 5개 이상 보유 시 50% 피해 증가
        fragmentBonusThreshold: 5,
        fragmentBonusDamage: 0.50,
      },
    },
    attackCooldown: 1200,
  },
}

// ============================================================
// 캐릭터 스페셜 능력 (Shift 키)
// ============================================================
export const SPECIAL_ABILITIES = {
  female: {
    id: 'female_special',
    name: '일자 탈모 융단폭격',
    nameEn: 'Line Carpet Bombing',
    description: '8초 동안 화면 가로 전체에 거대 장판, 초당 200% 피해, 적 이동속도 40% 감소',
    cooldown: 70000, // 70초
    duration: 8000,
    effect: {
      type: 'screen_wide_line',
      damagePerSecond: 2.00,
      slowAmount: 0.40,
    },
  },

  areata: {
    id: 'areata_special',
    name: '탈모 영역 확산',
    nameEn: 'Hair Loss Zone Expansion',
    description: '6초 동안 큰 원형 영역 생성, 초당 150% 피해, 받는 피해 25% 증가',
    cooldown: 80000,
    duration: 6000,
    effect: {
      type: 'circular_zone',
      radius: 250,
      damagePerSecond: 1.50,
      damageAmplification: 0.25, // 적이 받는 피해 25% 증가
    },
  },

  wongfeihung: {
    id: 'wongfeihung_special',
    name: '비홍 십팔탈',
    nameEn: 'Eighteen Hair Strands',
    description: '5초 동안 머리카락 회오리 3줄 회전, 초당 250% 피해, 적 끌어당김',
    cooldown: 75000,
    duration: 5000,
    effect: {
      type: 'rotating_whirlpool',
      orbits: 3,
      damagePerSecond: 2.50,
      pullStrength: 150, // 끌어당김 강도
    },
  },

  heihachi: {
    id: 'heihachi_special',
    name: '철권 난무',
    nameEn: 'Tekken Barrage',
    description: '6초 동안 공격속도 40% 증가, 모든 공격에 추가 100% 번개 피해, 20% 기절',
    cooldown: 80000,
    duration: 6000,
    effect: {
      type: 'attack_buff',
      attackSpeedBonus: 0.40,
      extraLightningDamage: 1.00,
      stunChance: 0.20,
    },
  },

  mzamen: {
    id: 'mzamen_special',
    name: 'M 패턴 붕괴',
    nameEn: 'M Pattern Collapse',
    description: '화면 전방에 거대 M 장판, 5초간 초당 200% 피해, 이동속도 40% 감소',
    cooldown: 75000,
    duration: 5000,
    effect: {
      type: 'm_pattern_field',
      damagePerSecond: 2.00,
      slowAmount: 0.40,
      width: 400,
      height: 300,
    },
  },

  talmo_docter: {
    id: 'talmo_docter_special',
    name: '긴급 치료',
    nameEn: 'Emergency Treatment',
    description: '모근 조각 전부 소모, 1개당 3% HP 회복, 주변 80% 피해. 10개 이상 시 6초간 공격력 40% 증가, 흡혈 15% 추가',
    cooldown: 80000,
    effect: {
      type: 'consume_fragments',
      healPerFragment: 0.03,
      areaDamage: 0.80,
      areaRadius: 150,
      bonusThreshold: 10,
      bonusDuration: 6000,
      bonusAttackPower: 0.40,
      bonusLifeSteal: 0.15,
    },
  },
}

// ============================================================
// 캐릭터 전용 패시브 스킬
// ============================================================
export const CHARACTER_PASSIVE_SKILLS = {
  female: [
    {
      id: 'female_skill1',
      name: '가늘어지는 모근',
      nameEn: 'Thinning Hair Follicles',
      description: '공격력 증가, 장판 위 적이 추가 피해를 받음',
      icon: 'female_skill1',
      maxLevel: 3,
      levels: [
        { attack: 0.10, zoneDamageBonus: 0.10 },
        { attack: 0.20, zoneDamageBonus: 0.15 },
        { attack: 0.30, zoneDamageBonus: 0.20 },
      ],
    },
    {
      id: 'female_skill2',
      name: '고속도로',
      nameEn: 'Highway',
      description: '이동속도 증가, 이동 시 5초마다 HP 회복',
      icon: 'female_skill2',
      maxLevel: 3,
      levels: [
        { moveSpeed: 0.10, regenPercent: 0.03, regenInterval: 5 },
        { moveSpeed: 0.15, regenPercent: 0.04, regenInterval: 5 },
        { moveSpeed: 0.20, regenPercent: 0.05, regenInterval: 5 },
      ],
    },
    {
      id: 'female_skill3',
      name: '모발 방어막',
      nameEn: 'Hair Shield',
      description: '12초마다 보호막 스택 획득, 피격 시 피해 50% 감소 및 0.3초 무적',
      icon: 'female_skill3',
      maxLevel: 3,
      levels: [
        { shieldStacks: 1, interval: 12, damageReduction: 0.50, invulnerabilityDuration: 0.3 },
        { shieldStacks: 2, interval: 12, damageReduction: 0.50, invulnerabilityDuration: 0.3 },
        { shieldStacks: 3, interval: 12, damageReduction: 0.50, invulnerabilityDuration: 0.3 },
      ],
    },
  ],

  areata: [
    {
      id: 'areata_skill1',
      name: '동전 크기의 절망',
      nameEn: 'Coin-Sized Despair',
      description: '화면에 적이 많을수록 공격력 증가',
      icon: 'areata_skill1',
      maxLevel: 3,
      levels: [
        { enemyThreshold: 20, attackBonus: 0.20 },
        { enemyThreshold: 30, attackBonus: 0.30 },
        { enemyThreshold: 40, attackBonus: 0.40 },
      ],
    },
    {
      id: 'areata_skill2',
      name: '두피 감각 마비',
      nameEn: 'Scalp Numbness',
      description: '피격 시 확률로 피해 무시 및 충격파 발생',
      icon: 'areata_skill2',
      maxLevel: 3,
      levels: [
        { dodgeChance: 0.20, shockwaveDamage: 1.00 },
        { dodgeChance: 0.25, shockwaveDamage: 1.50 },
        { dodgeChance: 0.30, shockwaveDamage: 2.00 },
      ],
    },
    {
      id: 'areata_skill3',
      name: '집단 탈모',
      nameEn: 'Mass Hair Loss',
      description: '적 처치 시 확률로 "빠진 머리카락" 드롭, 줍으면 공격속도 증가',
      icon: 'areata_skill3',
      maxLevel: 3,
      levels: [
        { dropChance: 0.10, attackSpeedBonus: 0.20, duration: 5 },
        { dropChance: 0.12, attackSpeedBonus: 0.30, duration: 5 },
        { dropChance: 0.15, attackSpeedBonus: 0.40, duration: 5 },
      ],
    },
  ],

  wongfeihung: [
    {
      id: 'wongfeihung_skill1',
      name: '절세 가닥',
      nameEn: 'Legendary Strand',
      description: 'HP 50% 이하 시 공격력 및 치명타 확률 증가',
      icon: 'wongfeihung_skill1',
      maxLevel: 3,
      levels: [
        { hpThreshold: 0.50, attackBonus: 0.20, critBonus: 0.05 },
        { hpThreshold: 0.50, attackBonus: 0.35, critBonus: 0.10 },
        { hpThreshold: 0.50, attackBonus: 0.50, critBonus: 0.15 },
      ],
    },
    {
      id: 'wongfeihung_skill2',
      name: '두피 경맥술',
      nameEn: 'Scalp Meridian Art',
      description: '적 처치 시 이동속도 증가(중첩) 및 HP 회복',
      icon: 'wongfeihung_skill2',
      maxLevel: 3,
      levels: [
        { moveSpeedBonus: 0.05, maxStacks: 6, hpRegen: 1 },
        { moveSpeedBonus: 0.07, maxStacks: 6, hpRegen: 2 },
        { moveSpeedBonus: 0.10, maxStacks: 6, hpRegen: 3 },
      ],
    },
    {
      id: 'wongfeihung_skill3',
      name: '민머리 권법',
      nameEn: 'Bald Fist Technique',
      description: '근접 무기 피해 증가, 근접 치명타 시 파동 발생',
      icon: 'wongfeihung_skill3',
      maxLevel: 3,
      levels: [
        { meleeDamageBonus: 0.10, critWaveDamage: 1.00 },
        { meleeDamageBonus: 0.20, critWaveDamage: 1.50 },
        { meleeDamageBonus: 0.30, critWaveDamage: 2.00 },
      ],
    },
  ],

  heihachi: [
    {
      id: 'heihachi_skill1',
      name: '전류 두피',
      nameEn: 'Electric Scalp',
      description: '감전 상태의 적에게 주는 피해 증가',
      icon: 'heihachi_skill1',
      maxLevel: 3,
      levels: [
        { damageBonus: 0.15 },
        { damageBonus: 0.25 },
        { damageBonus: 0.35 },
      ],
    },
    {
      id: 'heihachi_skill2',
      name: '악마 유전자',
      nameEn: 'Devil Gene',
      description: 'HP 30% 이하 시 공격력 증가, 피격 시 확률로 HP 회복 및 폭발',
      icon: 'heihachi_skill2',
      maxLevel: 3,
      levels: [
        { hpThreshold: 0.30, attackBonus: 0.30, healChance: 0.15, healAmount: 0.15, explosionDamage: 2.00 },
        { hpThreshold: 0.30, attackBonus: 0.45, healChance: 0.20, healAmount: 0.15, explosionDamage: 2.00 },
        { hpThreshold: 0.30, attackBonus: 0.60, healChance: 0.25, healAmount: 0.15, explosionDamage: 2.00 },
      ],
    },
    {
      id: 'heihachi_skill3',
      name: '강철 두개골',
      nameEn: 'Steel Skull',
      description: '피격 피해 감소, 넉백 저항 증가',
      icon: 'heihachi_skill3',
      maxLevel: 3,
      levels: [
        { damageReduction: 0.10, knockbackResistance: 0.30 },
        { damageReduction: 0.15, knockbackResistance: 0.50 },
        { damageReduction: 0.20, knockbackResistance: 0.70 },
      ],
    },
  ],

  mzamen: [
    {
      id: 'mzamen_skill1',
      name: '미들 파트 집중',
      nameEn: 'Middle Part Focus',
      description: '전방 적에게 피해 증가, 후방에서 받는 피해 감소',
      icon: 'mzaman_skill1',
      maxLevel: 3,
      levels: [
        { frontDamageBonus: 0.20, backDamageReduction: 0.10 },
        { frontDamageBonus: 0.30, backDamageReduction: 0.15 },
        { frontDamageBonus: 0.40, backDamageReduction: 0.20 },
      ],
    },
    {
      id: 'mzamen_skill2',
      name: '점점 넓어지는 이마',
      nameEn: 'Widening Forehead',
      description: '픽업 범위 증가, 경험치 구슬 획득 시 공격속도 증가',
      icon: 'mzaman_skill2',
      maxLevel: 3,
      levels: [
        { pickupRange: 0.20, attackSpeedBonus: 0.05, maxStacks: 6, duration: 5 },
        { pickupRange: 0.30, attackSpeedBonus: 0.07, maxStacks: 6, duration: 5 },
        { pickupRange: 0.40, attackSpeedBonus: 0.10, maxStacks: 6, duration: 5 },
      ],
    },
    {
      id: 'mzamen_skill3',
      name: '파고드는 M자',
      nameEn: 'Receding M-Line',
      description: '모든 무기 사정거리 증가',
      icon: 'mzaman_skill3',
      maxLevel: 3,
      levels: [
        { rangeBonus: 0.20 },
        { rangeBonus: 0.30 },
        { rangeBonus: 0.40 },
      ],
    },
  ],

  talmo_docter: [
    {
      id: 'talmo_docter_skill1',
      name: '피부과 수술',
      nameEn: 'Dermatological Surgery',
      description: '흡혈 효율 증가, HP 50% 이하 시 공격력 증가',
      icon: 'talmo_docter_skill1',
      maxLevel: 3,
      levels: [
        { lifeStealBonus: 0.10, hpThreshold: 0.50, attackBonus: 0.15 },
        { lifeStealBonus: 0.15, hpThreshold: 0.50, attackBonus: 0.25 },
        { lifeStealBonus: 0.20, hpThreshold: 0.50, attackBonus: 0.35 },
      ],
    },
    {
      id: 'talmo_docter_skill2',
      name: '감염 예방 주사',
      nameEn: 'Infection Prevention',
      description: '8초마다 보호막 스택 획득, 피격 시 피해 감소 및 무적',
      icon: 'talmo_docter_skill2',
      maxLevel: 3,
      levels: [
        { shieldStacks: 1, interval: 8, damageReduction: 0.40, invulnerabilityDuration: 0.3 },
        { shieldStacks: 2, interval: 8, damageReduction: 0.50, invulnerabilityDuration: 0.3 },
        { shieldStacks: 3, interval: 8, damageReduction: 0.60, invulnerabilityDuration: 0.3 },
      ],
    },
    {
      id: 'talmo_docter_skill3',
      name: '모발 긴급 이식',
      nameEn: 'Emergency Hair Transplant',
      description: 'HP 30% 이하 시 자동 회복(쿨다운 30초), 회복 시 주변에 피해',
      icon: 'talmo_docter_skill3',
      maxLevel: 3,
      levels: [
        { hpThreshold: 0.30, healAmount: 0.10, cooldown: 30, areaDamage: 1.50 },
        { hpThreshold: 0.30, healAmount: 0.15, cooldown: 30, areaDamage: 2.00 },
        { hpThreshold: 0.30, healAmount: 0.20, cooldown: 30, areaDamage: 2.50 },
      ],
    },
  ],
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 캐릭터ID로 메인 무기 가져오기
 */
export const getMainWeapon = (characterId) => {
  return MAIN_WEAPONS[characterId]
}

/**
 * 캐릭터ID로 스페셜 능력 가져오기
 */
export const getSpecialAbility = (characterId) => {
  return SPECIAL_ABILITIES[characterId]
}

/**
 * 캐릭터ID로 패시브 스킬 목록 가져오기
 */
export const getPassiveSkills = (characterId) => {
  return CHARACTER_PASSIVE_SKILLS[characterId] || []
}

/**
 * 레벨업 옵션 생성 (패시브 스킬 포함)
 */
export const getPassiveSkillOptions = (characterId, currentSkills = []) => {
  const skills = getPassiveSkills(characterId)

  return skills.filter(skill => {
    const current = currentSkills.find(s => s.id === skill.id)
    const currentLevel = current ? current.level : 0
    return currentLevel < skill.maxLevel
  }).map(skill => {
    const current = currentSkills.find(s => s.id === skill.id)
    const currentLevel = current ? current.level : 0
    const nextLevel = currentLevel + 1

    return {
      ...skill,
      currentLevel,
      nextLevel,
      isPassiveSkill: true,
      effect: skill.levels[nextLevel - 1],
    }
  })
}

/**
 * 패시브 스킬 선택 처리
 */
export const handlePassiveSkillSelection = (skill, currentSkills) => {
  const existingIndex = currentSkills.findIndex(s => s.id === skill.id)

  if (existingIndex >= 0) {
    const updated = [...currentSkills]
    updated[existingIndex] = {
      ...updated[existingIndex],
      level: Math.min(updated[existingIndex].level + 1, skill.maxLevel),
    }
    return updated
  } else {
    return [...currentSkills, {
      id: skill.id,
      name: skill.name,
      nameEn: skill.nameEn,
      level: 1,
      maxLevel: skill.maxLevel,
    }]
  }
}
