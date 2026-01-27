import { CHARACTER_PASSIVE_SKILLS } from '../../../../MainWeapons'

export const applyPassiveBonuses = ({ state, currentTime }) => {
  // Calculate multipliers separately, then apply to base stats
  // This prevents accumulation while allowing conditional bonuses
  let damageMultiplier = 1
  let speedMultiplier = 1
  let attackSpeedMultiplier = 1
  let critBonus = 0

  // Reset passive bonuses object (but preserve stacks)
  const prevBonuses = state.passiveBonuses || {}
  state.passiveBonuses = {
    // Preserve stack-based values
    wongKillStacks: prevBonuses.wongKillStacks || 0,
    mzamenXpStacks: prevBonuses.mzamenXpStacks || 0,
    mzamenXpStackExpire: prevBonuses.mzamenXpStackExpire || 0,
    areataHairStacks: prevBonuses.areataHairStacks || 0,
    areataHairStacks: prevBonuses.areataHairStacks || 0,
    areataHairStackExpire: prevBonuses.areataHairStackExpire || 0,
    hairBuffFireRate: prevBonuses.hairBuffFireRate, // Preserve active buff fire rate
    // New persistent states
    shieldStacks: prevBonuses.shieldStacks || 0,
    shieldLastRegen: prevBonuses.shieldLastRegen || 0,
    highwayLastRegen: prevBonuses.highwayLastRegen || 0,
  }

  if (state.passiveSkills && state.passiveSkills.length > 0) {
    const passiveSkills = CHARACTER_PASSIVE_SKILLS[state.player.character.id] || []

    state.passiveSkills.forEach(playerSkill => {
      const skillDef = passiveSkills.find(s => s.id === playerSkill.id)
      if (!skillDef || playerSkill.level < 1) return

      const skillEffect = skillDef.levels[playerSkill.level - 1]
      if (!skillEffect) return

      const currentHp = state.stats.hp
      const maxHp = state.baseStats?.maxHp || state.stats.maxHp
      const hpPercent = currentHp / maxHp

      // Accumulate multipliers based on skill type
      switch (skillDef.id) {
        // Female skills
        case 'female_skill1': // Attack + zone damage bonus
          damageMultiplier *= (1 + skillEffect.attack)
          state.passiveBonuses.zoneDamageBonus = skillEffect.zoneDamageBonus
          break

        case 'female_skill2': // Move speed + regen
          speedMultiplier *= (1 + skillEffect.moveSpeed)
          state.passiveBonuses.regenPercent = skillEffect.regenPercent
          state.passiveBonuses.regenInterval = skillEffect.regenInterval
          break

        case 'female_skill3': // Shield stacks
          state.passiveBonuses.shieldSkill = {
            stacks: skillEffect.shieldStacks,
            interval: skillEffect.interval,
            damageReduction: skillEffect.damageReduction,
            invulnerabilityDuration: skillEffect.invulnerabilityDuration,
          }
          break

        // Areata skills
        case 'areata_skill1': // Attack bonus based on enemy count
          // Check current level threshold first, if not met, check lower levels to avoid "upgrade penalty"
          let appliedBonus = 0
          for (let l = playerSkill.level; l >= 1; l--) {
            const effect = skillDef.levels[l - 1]
            if (state.enemies.length >= effect.enemyThreshold) {
              appliedBonus = effect.attackBonus
              break // Found highest applicable bonus
            }
          }
          if (appliedBonus > 0) {
            damageMultiplier *= (1 + appliedBonus)
          }
          break

        case 'areata_skill2': // Dodge chance + shockwave
          state.passiveBonuses.dodgeChance = skillEffect.dodgeChance
          state.passiveBonuses.shockwaveDamage = skillEffect.shockwaveDamage
          break

        case 'areata_skill3': // Hair drop + fixed fire rate buff
          state.passiveBonuses.hairDropChance = skillEffect.dropChance
          state.passiveBonuses.fixedFireRate = skillEffect.fixedFireRate
          state.passiveBonuses.hairBuffDuration = skillEffect.duration
          break

        // Wong Fei Hung skills
        case 'wongfeihung_skill1': // Low HP attack + crit bonus
          if (hpPercent <= skillEffect.hpThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
            critBonus += skillEffect.critBonus
          }
          break

        case 'wongfeihung_skill2': // Kill stacks move speed + HP regen
          state.passiveBonuses.wongMoveSpeedBonus = skillEffect.moveSpeedBonus
          state.passiveBonuses.wongMaxStacks = skillEffect.maxStacks
          state.passiveBonuses.wongHpRegen = skillEffect.hpRegen
          // Apply stacks
          const killStacks = Math.min(state.passiveBonuses.wongKillStacks, skillEffect.maxStacks)
          if (killStacks > 0) {
            speedMultiplier *= (1 + killStacks * skillEffect.moveSpeedBonus)
          }
          break

        case 'wongfeihung_skill3': // Melee damage bonus
          state.passiveBonuses.meleeDamageBonus = skillEffect.meleeDamageBonus
          state.passiveBonuses.critWaveDamage = skillEffect.critWaveDamage
          break

        // Heihachi skills
        case 'heihachi_skill1': // Electric Scalp: Heal on hit
          state.passiveBonuses.electricScalp = {
            chance: skillEffect.healChance,
            percent: skillEffect.healPercent,
          }
          break

        case 'heihachi_skill2': // Devil Gene: Attack bonus on low HP
          if (hpPercent <= skillEffect.hpThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
          }
          break

        case 'heihachi_skill3': // Iron Skull: Damage reduction
          state.passiveBonuses.damageReduction = Math.max(state.passiveBonuses.damageReduction || 0, skillEffect.damageReduction)
          break

        // Mzamen skills
        case 'mzamen_skill1': // Front damage bonus + back damage reduction
          state.passiveBonuses.frontDamageBonus = skillEffect.frontDamageBonus
          state.passiveBonuses.backDamageReduction = skillEffect.backDamageReduction
          break

        case 'mzamen_skill2': // Pickup range + XP attack speed stacks
          state.passiveBonuses.pickupRange = skillEffect.pickupRange
          state.passiveBonuses.mzamenAttackSpeedBonus = skillEffect.attackSpeedBonus
          state.passiveBonuses.mzamenMaxStacks = skillEffect.maxStacks
          state.passiveBonuses.mzamenStackDuration = skillEffect.duration
          // Apply attack speed stacks
          if (state.passiveBonuses.mzamenXpStacks > 0 &&
            currentTime < state.passiveBonuses.mzamenXpStackExpire) {
            const xpStacks = Math.min(state.passiveBonuses.mzamenXpStacks, skillEffect.maxStacks)
            attackSpeedMultiplier *= (1 + xpStacks * skillEffect.attackSpeedBonus)
          }
          break

        case 'mzamen_skill3': // Range bonus
          state.passiveBonuses.rangeBonus = skillEffect.rangeBonus
          break

        // Talmo Docter skills
        case 'talmo_docter_skill1': // Lifesteal + low HP attack
          state.passiveBonuses.lifeStealBonus = skillEffect.lifeStealBonus
          if (hpPercent <= skillEffect.hpThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
          }
          break

        case 'talmo_docter_skill2': // Shield stacks
          state.passiveBonuses.shieldSkill = {
            stacks: skillEffect.shieldStacks,
            interval: skillEffect.interval,
            damageReduction: skillEffect.damageReduction,
            invulnerabilityDuration: skillEffect.invulnerabilityDuration,
          }
          break

        case 'talmo_docter_skill3': // Emergency heal
          state.passiveBonuses.emergencyHeal = {
            hpThreshold: skillEffect.hpThreshold,
            healAmount: skillEffect.healAmount,
            cooldown: skillEffect.cooldown,
            areaDamage: skillEffect.areaDamage,
          }
          break
      }
    })
  }

  // Apply range bonus to attack range
  const rangeBonus = state.passiveBonuses.rangeBonus || 0

  // Apply special ability buffs (Talmo Docter's Emergency Treatment)
  if (state.specialAbility?.active && state.specialAbility?.hasBonusBuff) {
    const effect = state.specialAbility.effect
    if (effect?.bonusAttackPower) {
      damageMultiplier *= (1 + effect.bonusAttackPower)
    }
    if (effect?.bonusLifeSteal) {
      state.passiveBonuses.specialLifeStealBonus = effect.bonusLifeSteal
    }
  }

  // Apply calculated multipliers to base stats (not accumulating)
  if (state.baseStats) {
    state.stats.damage = state.baseStats.damage * damageMultiplier
    state.stats.moveSpeed = state.baseStats.moveSpeed * speedMultiplier
    state.stats.attackSpeed = state.baseStats.attackSpeed * attackSpeedMultiplier
    state.stats.crit = state.baseStats.crit + critBonus
    state.stats.attackRange = (state.baseStats.attackRange || 120) * (1 + rangeBonus)

    // Apply special lifesteal bonus
    const specialLifeSteal = state.passiveBonuses.specialLifeStealBonus || 0
    state.stats.lifeSteal = (state.baseStats.lifeSteal || 0) + (state.passiveBonuses.lifeStealBonus || 0) + specialLifeSteal
  }
}
