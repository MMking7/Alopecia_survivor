import { generateId } from '../../../domain/math'

export const updatePassiveSkills = ({ state, currentTime, deltaTime }) => {
  // 1. Infection Prevention Injection (Talmo Docter / Female Bald Shield)
  // Periodically regenerate shield stacks
  if (state.passiveBonuses.shieldSkill) {
    const { stacks, interval } = state.passiveBonuses.shieldSkill
    const intervalMs = interval * 1000
    
    // Initialize timer if not exists
    if (!state.lastShieldRegenTime) {
      state.lastShieldRegenTime = currentTime
    }

    if (currentTime - state.lastShieldRegenTime >= intervalMs) {
      state.lastShieldRegenTime = currentTime
      
      // Calculate current max shield form this skill
      // Note: This logic assumes shield stacks add to the shield value directly (1 stack = 1 shield point)
      // or we just add 1 shield point up to the 'stacks' limit defined by the skill level.
      // Based on the skill description "Acquire shield stack", let's assume it adds to state.stats.shield.
      // We'll limit it to a reasonable amount per stack if not specified, 
      // but usually these games treat shield as a pool. 
      // Let's interpret "shieldStacks" as the amount to add per interval.
      
      // However, usually these skills have a cap. 
      // Let's assume the 'stacks' is the amount added per interval.
      // And maybe there's no cap or a high cap? 
      // "Acquire 1/2/3 stacks every 8s".
      
      const shieldToAdd = stacks
      state.stats.shield = (state.stats.shield || 0) + shieldToAdd
      
      // Optional: Visual effect for shield regen
      state.damageNumbers.push({
        id: generateId(),
        x: state.player.x,
        y: state.player.y - 50,
        damage: `+${shieldToAdd} Shield`,
        color: '#87CEEB', // Sky blue for shield
        createdAt: currentTime,
        isHeal: true, // Reuse heal styling or logic if flexible
      })
    }
  }

  // 2. Emergency Hair Transplant (Talmo Docter)
  // Low HP Auto Heal + AoE Damage
  if (state.passiveBonuses.emergencyHeal) {
    const { hpThreshold, healAmount, cooldown, areaDamage } = state.passiveBonuses.emergencyHeal
    const cooldownMs = cooldown * 1000
    
    // Check cooldown
    const lastTrigger = state.lastEmergencyHealTime || 0
    if (currentTime - lastTrigger >= cooldownMs) {
      
      // Check HP Threshold
      const maxHp = state.stats.maxHp
      const currentHp = state.stats.hp
      if (currentHp / maxHp <= hpThreshold && currentHp > 0) {
        
        // Trigger Heal
        state.lastEmergencyHealTime = currentTime
        const healValue = maxHp * healAmount
        state.stats.hp = Math.min(maxHp, currentHp + healValue)
        
        // Visuals for Heal
        state.damageNumbers.push({
          id: generateId(),
          x: state.player.x,
          y: state.player.y - 50,
          damage: `+${Math.floor(healValue)} HP`,
          color: '#00FF00',
          createdAt: currentTime,
          isHeal: true,
        })
        
        // Trigger AoE Damage
        // "Deal 150/200/250% damage to surrounding enemies"
        const damageRadius = 250 // Assumption for "surrounding"
        const damageValue = state.stats.damage * areaDamage
        
        state.attackEffects.push({
          id: generateId(),
          type: 'explosion',
          x: state.player.x,
          y: state.player.y,
          radius: 0,
          maxRadius: damageRadius,
          color: '#00CED1', // Talmo docter color
          createdAt: currentTime,
          duration: 500,
        })
        
        state.enemies.forEach(enemy => {
          if (enemy.isDead) return
          // Simple distance check
          const dx = enemy.x - state.player.x
          const dy = enemy.y - state.player.y
          const dist = Math.sqrt(dx*dx + dy*dy)
          
          if (dist < damageRadius) {
            enemy.currentHp -= damageValue
             state.damageNumbers.push({
              id: generateId(),
              x: enemy.x,
              y: enemy.y,
              damage: Math.floor(damageValue),
              color: '#00CED1',
              createdAt: currentTime,
              isCritical: true, // Make it pop
            })
          }
        })
      }
    }
  }
}
