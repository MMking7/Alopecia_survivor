import { getSpecialAbility } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'

export const activateSpecialAbility = ({ state, currentTime }) => {
  // Special Ability activation (Shift key)
  if (state.keys.shiftPressed && !state.specialAbility.active) {

    state.keys.shiftPressed = false // 한 번만 발동되도록 플래그 리셋
    const ability = getSpecialAbility(state.player.character.id)

    if (ability) {
      // 모근 조각 최소 요구량 체크 (탈모의사 전용)
      const minFragments = ability.minFragments || 0
      const hasEnoughFragments = state.fragments >= minFragments
      
      // lastUsedGameTime이 0이면 한 번도 안 쓴 것 → 바로 사용 가능
      const neverUsed = state.specialAbility.lastUsedGameTime === 0
      const timeSinceLastUse = (state.gameTime - state.specialAbility.lastUsedGameTime) * 1000 // 초 → 밀리초
      
      // Apply Cooldown Reduction (Magical Wig item)
      let cooldownDuration = ability.cooldown
      const reduction = Math.min(0.5, state.stats.specialCooldownReduction || 0) // 최대 50%로 제한
      
      console.log('🎀 Magical Wig Check:', {
        baseStats_specialCooldownReduction: state.baseStats?.specialCooldownReduction,
        stats_specialCooldownReduction: state.stats?.specialCooldownReduction,
        reduction: reduction,
        originalCooldown: ability.cooldown,
        reducedCooldown: cooldownDuration * (1 - reduction)
      })
      
      if (reduction > 0) {
        cooldownDuration *= (1 - reduction)
      }

      const cooldownReady = neverUsed || timeSinceLastUse >= cooldownDuration

      
      if (cooldownReady && hasEnoughFragments) {

        // Activate ability
        state.specialAbility.active = true
        state.specialAbility.activeUntil = currentTime + (ability.duration || 0)
        state.specialAbility.lastUsed = currentTime
        state.specialAbility.lastUsedGameTime = state.gameTime // 게임 시간 기준으로 저장
        state.specialAbility.type = ability.effect.type
        state.specialAbility.effect = ability.effect

        // Character-specific activation effects
        if (ability.effect.type === 'consume_fragments') {
          // Talmo Docter - consume fragments immediately
          const fragments = state.fragments

          const healAmount = fragments * ability.effect.healPerFragment
          const maxHp = state.player.character.baseStats.hp
          state.stats.hp = Math.min(maxHp, state.stats.hp + healAmount * maxHp)


          // Deal damage in area
          state.enemies.forEach((enemy) => {
            const dist = distance(state.player, enemy)
            if (dist < ability.effect.areaRadius) {
              const areaDamage = state.stats.damage * ability.effect.areaDamage
              enemy.currentHp -= areaDamage
              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(areaDamage),
                createdAt: currentTime,
              })
            }
          })

          // Apply buffs if threshold met
          if (fragments >= ability.effect.bonusThreshold) {

            state.specialAbility.hasBonusBuff = true
          } else {

          }

          // Reset fragments
          state.fragments = 0

        }

        // Mzamen - M 패턴 장판 생성
        if (ability.effect.type === 'm_pattern_field') {

          state.specialAbility.mFieldPosition = {
            x: state.player.x,
            y: state.player.y,
          }
          state.specialAbility.mFieldLastDamageTime = currentTime
        }
      }
    }
  }
}
