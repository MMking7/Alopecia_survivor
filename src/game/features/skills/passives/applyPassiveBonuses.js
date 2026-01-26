import { CHARACTER_PASSIVE_SKILLS } from '../../../../MainWeapons'

export const applyPassiveBonuses = ({ state }) => {
  // Calculate multipliers separately, then apply to base stats
  // This prevents accumulation while allowing conditional bonuses
  let damageMultiplier = 1
  let speedMultiplier = 1
  let critBonus = 0
  
  // Reset passive bonuses object
  state.passiveBonuses = {}
  
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
          break

        // Areata skills
        case 'areata_skill1': // Attack bonus based on enemy count
          if (state.enemies.length >= skillEffect.enemyThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
          }
          break

        // Wong Fei Hung skills
        case 'wongfeihung_skill1': // Low HP attack + crit bonus
          if (hpPercent <= skillEffect.hpThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
            critBonus += skillEffect.critBonus
          }
          break

        case 'wongfeihung_skill3': // Melee damage bonus
          state.passiveBonuses.meleeDamageBonus = skillEffect.meleeDamageBonus
          break

        // Heihachi skills
        case 'heihachi_skill1': // Bonus damage to electrified enemies
          state.passiveBonuses.electrifiedDamageBonus = skillEffect.damageBonus
          break

        case 'heihachi_skill2': // Low HP attack bonus
          if (hpPercent <= skillEffect.hpThreshold) {
            damageMultiplier *= (1 + skillEffect.attackBonus)
          }
          break

        case 'heihachi_skill3': // Damage reduction
          state.passiveBonuses.damageReduction = skillEffect.damageReduction
          break

        // Mzamen skills
        case 'mzamen_skill2': // Pickup range
          state.passiveBonuses.pickupRange = skillEffect.pickupRange
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
      }
    })
  }
  
  // Apply calculated multipliers to base stats (not accumulating)
  if (state.baseStats) {
    state.stats.damage = state.baseStats.damage * damageMultiplier
    state.stats.moveSpeed = state.baseStats.moveSpeed * speedMultiplier
    state.stats.crit = state.baseStats.crit + critBonus
  }
}
