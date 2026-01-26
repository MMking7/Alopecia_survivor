import { GAME_CONFIG, getBaseStatsWithShop } from '../../constants'
import { getXpNeededForLevel } from '../domain/xp'

export const createInitialState = ({
  selectedCharacter,
  shopLevels,
  characterRanks,
  characterProgress,
}) => {
  if (!selectedCharacter) return null

  const baseStats = getBaseStatsWithShop(selectedCharacter, shopLevels, characterRanks)
  const bonusStats = characterProgress?.bonusStats || {}
  const startingLevel = Math.max(1, characterProgress?.level || 1)
  const startingMaxHp = baseStats.maxHp + (bonusStats.maxHp || 0)
  const startingCrit = baseStats.crit + (bonusStats.crit || 0)
  const startingLifeSteal = baseStats.lifeSteal + (bonusStats.lifeSteal || 0)
  const startingXpMultiplier = baseStats.xpMultiplier + (bonusStats.xpMultiplier || 0)
  const startingSpawnRateMultiplier = baseStats.spawnRateMultiplier + (bonusStats.spawnRateMultiplier || 0)

  return {
    player: {
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: GAME_CONFIG.CANVAS_HEIGHT / 2,
      character: selectedCharacter,
      facing: 1,
      facingAngle: 0,
      lastFacingDirection: 'right',
    },
    mouse: {
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: GAME_CONFIG.CANVAS_HEIGHT / 2,
      worldX: GAME_CONFIG.CANVAS_WIDTH / 2,
      worldY: GAME_CONFIG.CANVAS_HEIGHT / 2,
    },
    stats: {
      hp: startingMaxHp,
      maxHp: startingMaxHp,
      damage: baseStats.damage,
      attackSpeed: baseStats.attackSpeed,
      attackRange: baseStats.attackRange,
      moveSpeed: baseStats.moveSpeed,
      crit: startingCrit,
      defense: baseStats.defense,
      lifeSteal: startingLifeSteal,
      shield: 0,
      xpMultiplier: startingXpMultiplier,
      spawnRateMultiplier: startingSpawnRateMultiplier,
    },
    enemies: [],
    xpOrbs: [],
    enemyProjectiles: [],
    explosions: [],
    attackEffects: [],
    groundZones: [],
    damageNumbers: [],
    subWeaponEffects: [],
    subWeaponProjectiles: [],
    inventory: [],
    mainWeaponLevel: 1,
    passiveSkills: [],
    passiveBonuses: {},
    specialAbility: {
      cooldown: 0,
      lastUsed: 0,
      lastUsedGameTime: 0,
      active: false,
      activeUntil: 0,
    },
    specialAbilityZoneCreated: false,
    fragments: 0,
    coins: [],
    collectedCoins: 0,
    fragments: 0,
    coins: [],
    collectedCoins: 0,
    xp: 0,
    xpNeeded: getXpNeededForLevel(startingLevel),
    level: startingLevel,
    kills: 0,
    gameTime: 0,
    lastAttackTime: 0,
    lastEnemySpawn: 0,
    spawnedBossIds: [], // Track spawned bosses by ID
    bossSpawned: false, // Legacy/UI flag
    keys: { w: false, a: false, s: false, d: false, shift: false, shiftPressed: false },
    camera: { x: 0, y: 0 },
  }
}
