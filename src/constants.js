// ============================================================
// GAME CONFIG & SHARED CONSTANTS
// ============================================================

export const GAME_CONFIG = {
  CANVAS_WIDTH: 1024,
  CANVAS_HEIGHT: 768,
  PLAYER_SPEED: 120,
  ENEMY_SPAWN_INTERVAL: 800,
  BOSS_SPAWN_TIME: 120,
  XP_PER_LEVEL: 50,
  LEVEL_XP_MULTIPLIER: 1.3,
  ENEMY_DESPAWN_DISTANCE: 800,
  SPAWN_DISTANCE_MIN: 300,
  SPAWN_DISTANCE_MAX: 600,
  COIN_DROP_RATE: 0.05, // 5% chance to drop a coin
  COIN_VALUE_RANGE: { min: 10, max: 100 },
}

export const getShopBonuses = (shopLevels = {}) => ({
  maxHp: (shopLevels.hp || 0) * 10,
  damage: 1 + (shopLevels.atk || 0) * 0.1,
  attackSpeed: 1 + (shopLevels.spd || 0) * 0.1,
  moveSpeed: 1 + (shopLevels.mov || 0) * 0.05,
  crit: (shopLevels.crit || 0) * 0.03,
  xpMultiplier: 1 + (shopLevels.xp || 0) * 0.1,
})

// 캐릭터 랑크에 따른 보너스 배수 계산 (RANK 1당 1% 증가)
export const getRankMultiplier = (characterId, characterRanks = {}) => {
  const rank = characterRanks[characterId] || 0
  return 1 + (rank * 0.01) // RANK 1 = 1.01배, RANK 10 = 1.10배
}

export const getBaseStatsWithShop = (character, shopLevels = {}, characterRanks = {}) => {
  const baseStats = character?.baseStats || {}
  const baseHp = baseStats.hp || 100
  const baseDamage = baseStats.damage || 30
  const baseAttackSpeed = baseStats.attackSpeed || 1.5
  const baseAttackRange = baseStats.attackRange || 120
  const baseCrit = baseStats.crit || 0.05
  const shopBonuses = getShopBonuses(shopLevels)

  // 캐릭터 랑크 보너스 적용
  const rankMultiplier = getRankMultiplier(character?.id, characterRanks)

  return {
    maxHp: Math.floor((baseHp + shopBonuses.maxHp) * rankMultiplier),
    damage: baseDamage * shopBonuses.damage * rankMultiplier,
    attackSpeed: baseAttackSpeed * shopBonuses.attackSpeed * rankMultiplier,
    attackRange: baseAttackRange * rankMultiplier,
    moveSpeed: shopBonuses.moveSpeed * rankMultiplier,
    crit: (baseCrit + shopBonuses.crit) * rankMultiplier,
    defense: 0,
    lifeSteal: 0,
    xpMultiplier: shopBonuses.xpMultiplier * rankMultiplier,
    spawnRateMultiplier: 1.0,
  }
}

export const SPRITES = {
  background: '/sprites/holo/map_grass.webp',
  characters: {
    female: '/sprites/char_female_baldness_1769163428088.webp',
    areata: '/sprites/char_areata_1769163447640.webp',
    wongfeihung: '/sprites/char_wong_feihung_1769163464961.webp',
    heihachi: '/sprites/char_heihachi_1769163501406.webp',
    talmo_docter: '/sprites/talmo_docter/talmo_docter.png',
    mzamen: '/sprites/mzaman/Mzaman.png',
  },
  attacks: {
    talmo_docter_projectile: '/sprites/talmo_docter/talmo_docter_attack.png',
    mzamen_boomerang: '/sprites/mzaman/mzamanmainattack.png',
    wongfeihung_hair: '/sprites/wongfeihung/wongfeihunghair.png',
    wongfeihung_slash: '/sprites/wongfeihung/wongfeihungslash.png',
    femalebald_mainattack: '/sprites/femalebald/femalebaldmainattack.png',
  },
  enemies: {
    shrimp: '/sprites/holo/enemy_shrimp.webp',
    deadbeat: '/sprites/holo/enemy_deadbeat.webp',
    takodachi: '/sprites/holo/enemy_takodachi.webp',
    clipper: '/sprites/enemy_clipper_1769163541753.webp',
    zombie: '/sprites/enemy_zombie_1769163560887.webp',
    dna: '/sprites/enemy_dna_1769163577183.webp',
    cigarette: '/sprites/enemy_cigarette_1769163592604.webp',
    soju: '/sprites/enemy_soju_1769163624862.webp',
    cigarette_projectile: '/sprites/cigarette_fire.png',
  },
  boss: '/sprites/boss_complainant_1769163642840.webp',
  ui: {
    title: '/sprites/holo/ui_title.webp',
    menu: '/sprites/title_screen_v2.jpg',
    bg_levelup: '/sprites/holo/ui_levelup_bg.webp',
    box_item: '/sprites/holo/ui_item_box.webp',
    char_frame: '/sprites/holo/ui_char_frame.webp',
    char_bg: '/sprites/holo/ui_char_bg.webp',
    icon_hp: '/sprites/holo/ui_icon_hp.webp',
    icon_atk: '/sprites/holo/ui_icon_atk.webp',
    icon_spd: '/sprites/holo/ui_icon_spd.webp',
    icon_crt: '/sprites/holo/ui_icon_crt.webp',
    icon_pickup: '/sprites/holo/ui_icon_pickup.webp',
    icon_haste: '/sprites/holo/ui_icon_haste.webp',
    button: '/sprites/holo/ui_button.webp',
  },
  items: {
    coin: '/sprites/coin.png',
    glasses: '/sprites/holo/item_glasses.webp',
    ubersheep: '/sprites/holo/item_ubersheep.webp',
    pillow: '/sprites/holo/item_pillow.webp',
    horn: '/sprites/holo/item_horn.webp',
    piman: '/sprites/holo/item_piman.webp',
    sake: '/sprites/holo/item_sake.webp',
    halu: '/sprites/holo/item_halu.webp',
  },
  subweapons: {
    black_dye: '/sprites/subweapon/blackspraythumb.webp',
    black_dye_anim: '/sprites/subweapon/blackspray.png',
    hair_brush: '/sprites/subweapon/combspinthumb.webp',
    hair_brush_anim: '/sprites/subweapon/comb250.png',
    hair_spray: '/sprites/subweapon/hairspraybombthumb.webp',
    hair_spray_missile: '/sprites/subweapon/hairspraymissile.png',
    hair_spray_explosion: '/sprites/subweapon/hairsprayexplosion110x118.png',
    hair_dryer: '/sprites/subweapon/hairdryerthumb.webp',
    electric_clipper: '/sprites/subweapon/buzzerthumb.webp',
    electric_clipper_slash: '/sprites/subweapon/razorslash.png',
    dandruff_bomb: '/sprites/subweapon/bombthumb.webp',
    dandruff_bomb_anim: '/sprites/subweapon/bomb225.png',
  },
  abilities: {
    // 여성형 탈모 (Female Bald) - using 'female' as character ID
    female_ability: '/sprites/femalebald/femalebaldability.png',
    female_gaksung: '/sprites/femalebald/femalebaldgaksung.png',
    female_skill1: '/sprites/femalebald/femalebaldskill1.png',
    female_skill2: '/sprites/femalebald/femalebaldskill2.png',
    female_skill3: '/sprites/femalebald/femalebaldskill3.png',
    // Aliases for backward compatibility
    femalebald_ability: '/sprites/femalebald/femalebaldability.png',
    femalebald_gaksung: '/sprites/femalebald/femalebaldgaksung.png',
    femalebald_skill1: '/sprites/femalebald/femalebaldskill1.png',
    femalebald_skill2: '/sprites/femalebald/femalebaldskill2.png',
    femalebald_skill3: '/sprites/femalebald/femalebaldskill3.png',
    // 원형 탈모 (Areata)
    areata_ability: '/sprites/areata/areataability.png',
    areata_gaksung: '/sprites/areata/areatagaksung.png',
    areata_skill1: '/sprites/areata/areataskill1.png',
    areata_skill2: '/sprites/areata/areataskill2.png',
    areata_skill3: '/sprites/areata/areataskill3.png',
    // 황비홍 (Wong Fei Hung)
    wongfeihung_ability: '/sprites/wongfeihung/wongfeihungability.png',
    wongfeihung_gaksung: '/sprites/wongfeihung/wongfeihunggaksung.png',
    wongfeihung_skill1: '/sprites/wongfeihung/wongfeihungskill1.png',
    wongfeihung_skill2: '/sprites/wongfeihung/wongfeihungskill2.png',
    wongfeihung_skill3: '/sprites/wongfeihung/wongfeihungskill3.png',
    // 헤이하치 (Heihachi)
    heihachi_ability: '/sprites/heihachi/heihachiability.png',
    heihachi_gaksung: '/sprites/heihachi/heihachigaksung.png',
    heihachi_skill1: '/sprites/heihachi/heihachiskill1.png',
    heihachi_skill2: '/sprites/heihachi/heihachiskill2.png',
    heihachi_skill3: '/sprites/heihachi/heihachiskill3.png',
    // M자맨 (Mzaman)
    mzaman_ability: '/sprites/mzaman/mzamanability.png',
    mzaman_gaksung: '/sprites/mzaman/mzamangaksung.png',
    mzaman_skill1: '/sprites/mzaman/mzamanskill1.png',
    mzaman_skill2: '/sprites/mzaman/mzamanskill2.png',
    mzaman_skill3: '/sprites/mzaman/mzamanskill3.png',
    // 탈모 의사 (Talmo Docter)
    talmo_docter_ability: '/sprites/talmo_docter/talmo_docterability.png',
    talmo_docter_gaksung: '/sprites/talmo_docter/talmo_doctergaksung.png',
    talmo_docter_skill1: '/sprites/talmo_docter/talmo_docterskill1.png',
    talmo_docter_skill2: '/sprites/talmo_docter/talmo_docterskill2.png',
    talmo_docter_skill3: '/sprites/talmo_docter/talmo_docterskill3.png',
  }
}

export const CHARACTERS = [
  {
    id: 'female',
    name: '여성형 탈모',
    subName: '균형잡힌 올라운더',
    weapon: 'Equalizer',
    description: '충격파 AoE (밸런스형)',
    color: '#FF69B4',
    attackType: 'aoe',
    attackColor: 'rgba(255, 105, 180, 0.4)',
    baseStats: { hp: 75, maxHp: 75, damage: 35, speed: 1.35, attackSpeed: 1.5, defense: 0, crit: 0.1 }
  },
  {
    id: 'areata',
    name: '원형 탈모',
    subName: '원거리 저격수',
    weapon: 'Hair Loss Beam',
    description: '단일 대상 고데미지 (공격형)',
    color: '#32CD32',
    attackType: 'beam',
    attackColor: '#00FF00',
    baseStats: { hp: 60, maxHp: 60, damage: 45, speed: 1.40, attackSpeed: 1.2, defense: 0, crit: 0.2 }
  },
  {
    id: 'wongfeihung',
    name: '황비홍',
    subName: '중국 무술의 대가',
    weapon: 'Ponytail Spin',
    description: '근접 회전 공격 (방어형)',
    color: '#8B4513',
    attackType: 'spin',
    attackColor: 'rgba(210, 105, 30, 0.6)',
    baseStats: { hp: 90, maxHp: 90, damage: 30, speed: 1.20, attackSpeed: 1.3, defense: 0.15, crit: 0.05 }
  },
  {
    id: 'heihachi',
    name: '헤이하치',
    subName: '번개를 다루는 자',
    weapon: 'Lightning',
    description: '랜덤 번개 공격 (유틸형)',
    color: '#FFD700',
    attackType: 'lightning',
    attackColor: '#FFFF00',
    baseStats: { hp: 70, maxHp: 70, damage: 40, speed: 1.30, attackSpeed: 1.4, defense: 0.05, crit: 0.15 }
  },
  {
    id: 'talmo_docter',
    name: '탈모의사',
    subName: '탈모전문 모발이식 의사',
    weapon: 'Hair Transplant Gun',
    description: '식모기 발사! 관통 공격 (원거리형)',
    color: '#00CED1',
    attackType: 'transplant',
    attackColor: 'rgba(0, 206, 209, 0.8)',
    projectileRange: 175,
    projectileSpeed: 400,
    projectileSize: 80,
    spriteScale: 1.0,
    baseStats: { hp: 65, maxHp: 65, damage: 38, speed: 1.30, attackSpeed: 1.3, defense: 0, crit: 0.12 }
  },
  {
    id: 'mzamen',
    name: 'M자맨',
    subName: 'M자 탈모의 전설',
    weapon: 'Boomerang M',
    description: '부메랑 투척! 돌아오는 광역 공격',
    color: '#FF6B35',
    attackType: 'boomerang',
    attackColor: 'rgba(255, 107, 53, 0.8)',
    projectileRange: 200,
    projectileSpeed: 350,
    projectileSize: 80,
    returnSpeed: 450,
    spriteScale: 1.0,
    baseStats: { hp: 70, maxHp: 70, damage: 42, speed: 1.25, attackSpeed: 1.4, defense: 0.08, crit: 0.10 }
  },
]

export const ENEMIES = [
  { type: 'clipper', name: 'Barikan', sprite: SPRITES.enemies.clipper, speed: 100, hp: 20, damage: 5, xp: 10, size: 55, attackType: 'dash' },
  { type: 'zombie', name: 'Overwork Zombie', sprite: SPRITES.enemies.zombie, speed: 60, hp: 40, damage: 10, xp: 15, size: 60, attackType: 'melee' },
  { type: 'dna', name: 'Bad Genetics', sprite: SPRITES.enemies.dna, speed: 80, hp: 30, damage: 8, xp: 12, size: 55, attackType: 'spiral' },
  { type: 'cigarette', name: 'Stress Smoke', sprite: SPRITES.enemies.cigarette, speed: 90, hp: 25, damage: 8, xp: 12, size: 55, attackType: 'ranged' },
  { type: 'soju', name: 'Alcohol', sprite: SPRITES.enemies.soju, speed: 70, hp: 45, damage: 15, xp: 20, size: 60, attackType: 'dash' },
]

export const BOSS = {
  type: 'boss',
  name: 'Smol Ame (Boss)',
  speed: 80,
  hp: 2000,
  damage: 40,
  xp: 1000,
  size: 90,
  attackType: 'boss',
  attackCooldown: 800,
}

export const UPGRADES = [
  {
    id: 'glasses',
    name: '모낭 스캐너',
    type: '아이템',
    description: '두피 상태를 분석합니다. 경험치 획득량이 15% 증가합니다.',
    icon: 'glasses',
    effect: (stats) => ({ ...stats, xpMultiplier: (stats.xpMultiplier || 1) + 0.15 })
  },
  {
    id: 'ubersheep',
    name: '비오틴 보급',
    type: '아이템',
    description: '필수 영양소. 주기적으로 HP를 20% 회복합니다.',
    icon: 'ubersheep',
    effect: (stats) => ({ ...stats, hp: Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.2) })
  },
  {
    id: 'horn',
    name: '미녹시딜',
    type: '아이템',
    description: '발모 촉진. 처치 시 3 HP를 회복할 확률이 있습니다.',
    icon: 'horn',
    effect: (stats) => ({ ...stats, lifeSteal: (stats.lifeSteal || 0) + 0.05 })
  },
  {
    id: 'pillow',
    name: '실크 캡',
    type: '아이템',
    description: '마찰을 줄입니다. 15 HP 보호막을 부여합니다.',
    icon: 'pillow',
    effect: (stats) => ({ ...stats, shield: stats.shield + 15 })
  },
  {
    id: 'sake',
    name: '맥주 효모',
    type: '아이템',
    description: '머리에 좋을지도? 치명타 +5%, 하지만 조준이 흔들립니다.',
    icon: 'sake',
    effect: (stats) => ({ ...stats, crit: (stats.crit || 0) + 0.05 })
  },
  {
    id: 'piman',
    name: '검은콩',
    type: '아이템',
    description: '전통 요법. 최대 HP +15.',
    icon: 'piman',
    effect: (stats) => ({ ...stats, maxHp: stats.maxHp + 15, hp: stats.hp + 15 })
  },
  {
    id: 'halu',
    name: 'DHT 호르몬',
    type: '아이템',
    description: '원인 그 자체. 적 생성 속도 증가!',
    icon: 'halu',
    effect: (stats) => ({ ...stats, spawnRateMultiplier: (stats.spawnRateMultiplier || 1) + 0.2 })
  },
]

export const SHOP_UPGRADES = [
  { id: 'hp', name: 'HP 강화', description: '최대 HP +10 per level', icon: '❤️', cost: 100, maxLevel: 10 },
  { id: 'atk', name: 'ATK 강화', description: '공격력 +10% per level', icon: '⚔️', cost: 150, maxLevel: 10 },
  { id: 'spd', name: 'ATK SPD 강화', description: '공격속도 +10% per level', icon: '⚡', cost: 180, maxLevel: 10 },
  { id: 'mov', name: 'MOVE 강화', description: '이동속도 +5% per level', icon: '🏃', cost: 120, maxLevel: 10 },
  { id: 'crit', name: 'CRIT 강화', description: '크리티컬 +3% per level', icon: '💥', cost: 200, maxLevel: 10 },
  { id: 'xp', name: 'XP 강화', description: '경험치 배율 +10% per level', icon: '📈', cost: 250, maxLevel: 10 },
]
