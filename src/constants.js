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
  SPAWN_DISTANCE_MIN: 450,
  SPAWN_DISTANCE_MAX: 600,
}

export const getShopBonuses = (shopLevels = {}) => ({
  maxHp: (shopLevels.hp || 0) * 10,
  damage: 1 + (shopLevels.atk || 0) * 0.1,
  attackSpeed: 1 + (shopLevels.spd || 0) * 0.1,
  moveSpeed: 1 + (shopLevels.mov || 0) * 0.05,
  crit: (shopLevels.crit || 0) * 0.03,
  xpMultiplier: 1 + (shopLevels.xp || 0) * 0.1,
})

export const getBaseStatsWithShop = (character, shopLevels = {}) => {
  const baseStats = character?.baseStats || {}
  const baseHp = baseStats.hp || 100
  const baseDamage = baseStats.damage || 30
  const baseAttackSpeed = baseStats.attackSpeed || 1.5
  const baseAttackRange = baseStats.attackRange || 120
  const baseCrit = baseStats.crit || 0.05
  const shopBonuses = getShopBonuses(shopLevels)

  return {
    maxHp: baseHp + shopBonuses.maxHp,
    damage: baseDamage * shopBonuses.damage,
    attackSpeed: baseAttackSpeed * shopBonuses.attackSpeed,
    attackRange: baseAttackRange,
    moveSpeed: shopBonuses.moveSpeed,
    crit: baseCrit + shopBonuses.crit,
    defense: 0,
    lifeSteal: 0,
    xpMultiplier: shopBonuses.xpMultiplier,
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
  }
}

export const CHARACTERS = [
  {
    id: 'female',
    name: '여성형 탈모',
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
    weapon: 'Lightning',
    description: '랜덤 번개 공격 (유틸형)',
    color: '#FFD700',
    attackType: 'lightning',
    attackColor: '#FFFF00',
    baseStats: { hp: 70, maxHp: 70, damage: 40, speed: 1.30, attackSpeed: 1.4, defense: 0.05, crit: 0.15 }
  },
]

export const ENEMIES = [
  { type: 'clipper', name: 'Barikan', sprite: SPRITES.enemies.clipper, speed: 100, hp: 20, damage: 5, xp: 10, size: 64, attackType: 'dash' },
  { type: 'zombie', name: 'Overwork Zombie', sprite: SPRITES.enemies.zombie, speed: 60, hp: 40, damage: 10, xp: 15, size: 80, attackType: 'melee' },
  { type: 'dna', name: 'Bad Genetics', sprite: SPRITES.enemies.dna, speed: 80, hp: 30, damage: 8, xp: 12, size: 64, attackType: 'spiral' },
  { type: 'cigarette', name: 'Stress Smoke', sprite: SPRITES.enemies.cigarette, speed: 90, hp: 25, damage: 12, xp: 12, size: 64, attackType: 'ranged' },
  { type: 'soju', name: 'Alcohol', sprite: SPRITES.enemies.soju, speed: 70, hp: 45, damage: 15, xp: 20, size: 80, attackType: 'dash' },
]

export const BOSS = {
  type: 'boss',
  name: 'Smol Ame (Boss)',
  speed: 80,
  hp: 2000,
  damage: 40,
  xp: 1000,
  size: 140,
  attackType: 'boss',
  attackCooldown: 800,
}

export const UPGRADES = [
  {
    id: 'glasses',
    name: 'Follicle Scanner',
    type: 'Item',
    description: 'Analyzes scalp health. Increase EXP gain by 15%.',
    icon: 'glasses',
    effect: (stats) => ({ ...stats, xpMultiplier: (stats.xpMultiplier || 1) + 0.15 })
  },
  {
    id: 'ubersheep',
    name: 'Biotin Delivery',
    type: 'Item',
    description: 'Essential nutrients. Heals 20% HP periodically.',
    icon: 'ubersheep',
    effect: (stats) => ({ ...stats, hp: Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.2) })
  },
  {
    id: 'horn',
    name: 'Minoxidil',
    type: 'Item',
    description: 'Promotes regrowth. Chance to heal 3 HP on kill.',
    icon: 'horn',
    effect: (stats) => ({ ...stats, lifeSteal: (stats.lifeSteal || 0) + 0.05 })
  },
  {
    id: 'pillow',
    name: 'Silk Cap',
    type: 'Item',
    description: 'Reduces friction. Grants a Shield (15 HP).',
    icon: 'pillow',
    effect: (stats) => ({ ...stats, shield: stats.shield + 15 })
  },
  {
    id: 'sake',
    name: 'Beer Yeast',
    type: 'Item',
    description: 'Good for hair? Crit +5%, but Aim wavers.',
    icon: 'sake',
    effect: (stats) => ({ ...stats, crit: (stats.crit || 0) + 0.05 })
  },
  {
    id: 'piman',
    name: 'Black Bean',
    type: 'Item',
    description: 'Traditional remedy. Max HP +15.',
    icon: 'piman',
    effect: (stats) => ({ ...stats, maxHp: stats.maxHp + 15, hp: stats.hp + 15 })
  },
  {
    id: 'halu',
    name: 'DHT Hormone',
    type: 'Item',
    description: 'The root cause. Enemy Spawn Rate UP!',
    icon: 'halu',
    effect: (stats) => ({ ...stats, spawnRateMultiplier: (stats.spawnRateMultiplier || 1) + 0.2 })
  },
]

export const SHOP_UPGRADES = [
  { id: 'maxHp', name: 'HP 강화', description: '최대 HP +5% per level', icon: '❤️', cost: 100, maxLevel: 10 },
  { id: 'atk', name: 'ATK 강화', description: '공격력 +3% per level', icon: '⚔️', cost: 150, maxLevel: 10 },
  { id: 'spd', name: 'SPD 강화', description: '이동속도 +2% per level', icon: '🏃', cost: 120, maxLevel: 10 },
  { id: 'crt', name: 'CRT 강화', description: '크리티컬 +2% per level', icon: '💥', cost: 200, maxLevel: 10 },
  { id: 'pickup', name: 'Pickup 강화', description: '습득 범위 +5% per level', icon: '🧲', cost: 80, maxLevel: 10 },
  { id: 'haste', name: 'Haste 강화', description: '공격속도 +2% per level', icon: '⚡', cost: 180, maxLevel: 10 },
  { id: 'heal', name: 'Heal 강화', description: '회복량 +3% per level', icon: '💊', cost: 150, maxLevel: 10 },
  { id: 'luck', name: 'Luck 강화', description: '드랍률 +2% per level', icon: '🎲', cost: 250, maxLevel: 10 },
  { id: 'revival', name: 'Revival', description: '부활 횟수 +1', icon: '💖', cost: 500, maxLevel: 3 },
]
