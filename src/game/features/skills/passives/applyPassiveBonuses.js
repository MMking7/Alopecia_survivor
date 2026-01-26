import { CHARACTER_PASSIVE_SKILLS } from '../../../../MainWeapons'

export const applyPassiveBonuses = ({ state }) => {
  // Apply passive skill bonuses (reset and recalculate each frame)
  state.passiveBonuses = {}
  if (state.passiveSkills && state.passiveSkills.length > 0) {
    const passiveSkills = CHARACTER_PASSIVE_SKILLS[state.player.character.id] || []

    state.passiveSkills.forEach(playerSkill => {
      const skillDef = passiveSkills.find(s => s.id === playerSkill.id)
      if (!skillDef || playerSkill.level < 1) return

      const skillEffect = skillDef.levels[playerSkill.level - 1]
      if (!skillEffect) return

      const currentHp = state.stats.hp
      const maxHp = state.stats.maxHp
      const hpPercent = currentHp / maxHp

      // Apply stat bonuses based on skill type
      switch (skillDef.id) {
        // Female skills
        case 'female_skill1': // Attack + zone damage bonus
          state.stats.damage *= (1 + skillEffect.attack)
          state.passiveBonuses.zoneDamageBonus = skillEffect.zoneDamageBonus
          break

        case 'female_skill2': // Move speed + regen
          state.stats.speed *= (1 + skillEffect.moveSpeed)
          break

        // Areata skills
        case 'areata_skill1': // Attack bonus based on enemy count
          if (state.enemies.length >= skillEffect.enemyThreshold) {
            state.stats.damage *= (1 + skillEffect.attackBonus)
          }
          break

        // Wong Fei Hung skills
        case 'wongfeihung_skill1': // Low HP attack + crit bonus
          if (hpPercent <= skillEffect.hpThreshold) {
            state.stats.damage *= (1 + skillEffect.attackBonus)
            state.stats.crit += skillEffect.critBonus
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
            state.stats.damage *= (1 + skillEffect.attackBonus)
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
            state.stats.damage *= (1 + skillEffect.attackBonus)
          }
          break
      }
    })
  }
}
