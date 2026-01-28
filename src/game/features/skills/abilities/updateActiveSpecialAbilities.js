import { GAME_CONFIG } from '../../../../constants'
import { generateId, isInsideMPattern, distance } from '../../../domain/math'
import { playHit1 } from '../../../../utils/SoundManager'

export const updateActiveSpecialAbilities = ({ state, currentTime, deltaTime }) => {
  // Process active special abilities
  if (state.specialAbility.active) {
    if (currentTime >= state.specialAbility.activeUntil) {
      // Ability expired
      state.specialAbility.active = false
      state.specialAbility.hasBonusBuff = false
      state.specialAbilityZoneCreated = false // Reset so it can be created again next time
    } else {
      // Apply ability effects during duration
      const abilityType = state.specialAbility.type
      const effect = state.specialAbility.effect
      switch (abilityType) {
        case 'screen_wide_line': // Female - screen-wide VERTICAL damage pool
          // Create a single massive vertical zone ONCE when ability activates
          if (!state.specialAbilityZoneCreated) {
            state.specialAbilityZoneCreated = true
            // Store the initial position where ability was activated
            const abilityX = state.player.x
            const abilityY = state.player.y
            // Create one massive vertical zone at the activation position
            state.groundZones.push({
              id: generateId(),
              type: 'special_vertical_zone',
              x: abilityX,
              y: abilityY,
              angle: Math.PI / 2, // Rotated 90 degrees for vertical
              length: GAME_CONFIG.CANVAS_HEIGHT * 2, // Extra tall to cover screen
              width: 300, // Wide damage zone
              damagePerSecond: effect.damagePerSecond,
              duration: state.specialAbility.activeUntil - currentTime, // Full ability duration
              createdAt: currentTime,
              color: state.player.character.attackColor,
              slowAmount: effect.slowAmount,
              useSprite: true,
            })
            // Visual effect with sprite - stays for full duration
            state.attackEffects.push({
              id: generateId(),
              type: 'female_special_zone',
              x: abilityX,
              y: abilityY,
              length: GAME_CONFIG.CANVAS_HEIGHT * 2,
              width: 300,
              color: state.player.character.attackColor,
              createdAt: currentTime,
              duration: state.specialAbility.activeUntil - currentTime,
              useSprite: true,
            })
          }
          break
        case 'tekken_storm': // Heihachi - Tekken Barrage (Target 30 enemies, 600% dmg, Full Heal)
          if (!state.specialAbilityZoneCreated) {
            state.specialAbilityZoneCreated = true

            // Full Heal
            const healAmount = state.stats.maxHp - state.stats.hp
            state.stats.hp = state.stats.maxHp
            state.damageNumbers.push({
              id: generateId(),
              x: state.player.x,
              y: state.player.y - 60,
              damage: `${state.stats.maxHp}HP`,
              color: '#00FF00',
              createdAt: currentTime,
              isHeal: true,
            })

            // Find targets
            const targets = state.enemies.filter(e => !e.isDead)
            // Sort by distance
            targets.sort((a, b) => distance(state.player, a) - distance(state.player, b))
            // Take top N
            const stormTargets = targets.slice(0, effect.targetCount || 30)

            stormTargets.forEach((enemy) => {
              const damage = state.stats.damage * (effect.damageMultiplier || 6.0)
              enemy.currentHp -= damage
              enemy.lastHitTime = currentTime // Hit flash
              playHit1()

              // Visual: Lightning strike on enemy
              state.attackEffects.push({
                id: generateId(),
                type: 'chain_lightning',
                startX: state.player.x,
                startY: state.player.y,
                endX: enemy.x,
                endY: enemy.y,
                color: '#FFFF00',
                createdAt: currentTime,
                duration: 300
              })

              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(damage),
                color: '#FFFF00',
                createdAt: currentTime,
                isCritical: true,
              })
            })
          }
          break
        case 'circular_zone': // Areata - following zone with damage amplification
          if (!state.specialAbilityZoneCreated) {
            state.specialAbilityZoneCreated = true
            state.groundZones.push({
              id: generateId(),
              type: 'areata_special_zone',
              x: state.player.x,
              y: state.player.y,
              radius: effect.radius,
              angle: 0,
              damagePerSecond: effect.damagePerSecond,
              damageAmplification: effect.damageAmplification,
              duration: state.specialAbility.activeUntil - currentTime,
              createdAt: currentTime,
              followPlayer: true,
              color: state.player.character.attackColor,
            })
            state.attackEffects.push({
              id: generateId(),
              type: 'areata_special_zone',
              x: state.player.x,
              y: state.player.y,
              radius: effect.radius,
              color: state.player.character.attackColor,
              createdAt: currentTime,
              duration: state.specialAbility.activeUntil - currentTime,
              followPlayer: true,
            })
          }
          break
        case 'rotating_whirlpool': // Wongfeihung - orbiting satellites + pull
          if (!state.specialAbilityZoneCreated) {
            state.specialAbilityZoneCreated = true
            state.attackEffects.push({
              id: generateId(),
              type: 'rotating_whirlpool',
              x: state.player.x,
              y: state.player.y,
              radius: 180,
              orbits: effect.orbits || 3,
              color: state.player.character.attackColor,
              createdAt: currentTime,
              duration: state.specialAbility.activeUntil - currentTime,
              followPlayer: true,
            })
          }
          const pullRadius = 400
          const pullStrength = effect.pullStrength || 150
          state.enemies.forEach((enemy) => {
            if (enemy.isDead) return
            const dist = distance(state.player, enemy)
            if (dist < pullRadius) {
              const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x)
              enemy.vx = (enemy.vx || 0) + Math.cos(angle) * pullStrength * deltaTime
              enemy.vy = (enemy.vy || 0) + Math.sin(angle) * pullStrength * deltaTime
            }
          })
          const orbitRadius = 180
          const rotationSpeed = 3
          const currentAngle = (currentTime / 1000) * rotationSpeed
          const orbitCount = effect.orbits || 3
          for (let i = 0; i < orbitCount; i++) {
            const angle = currentAngle + (i * (Math.PI * 2 / orbitCount))
            const satX = state.player.x + Math.cos(angle) * orbitRadius
            const satY = state.player.y + Math.sin(angle) * orbitRadius
            state.enemies.forEach((enemy) => {
              if (enemy.isDead) return
              if (distance({ x: satX, y: satY }, enemy) < 180) {
                const cooldownKey = `${enemy.id}_whirlpool_${i}`
                if (!enemy[cooldownKey] || currentTime - enemy[cooldownKey] > 200) {
                  enemy[cooldownKey] = currentTime
                  const damage = state.stats.damage * effect.damagePerSecond * 0.2
                  enemy.currentHp -= damage
                  enemy.lastHitTime = currentTime // Hit flash
                  playHit1()
                  state.damageNumbers.push({
                    id: generateId(),
                    x: enemy.x,
                    y: enemy.y,
                    damage: Math.floor(damage),
                    createdAt: currentTime,
                    color: '#FFA500',
                  })
                }
              }
            })
          }
          break
        case 'm_pattern_field': // Mzamen - M 모양 장판
          // M 패턴 내 적에게 초당 데미지와 슬로우 적용
          const mFieldPos = state.specialAbility.mFieldPosition
          if (mFieldPos) {
            const mWidth = effect.width || 400
            const mHeight = effect.height || 300

            // 초당 데미지 적용 (1초마다)
            if (currentTime - (state.specialAbility.mFieldLastDamageTime || 0) >= 1000) {
              state.specialAbility.mFieldLastDamageTime = currentTime

              state.enemies.forEach((enemy) => {
                if (enemy.isDead) return

                // M 패턴 내부인지 체크
                if (isInsideMPattern(enemy, mFieldPos, mWidth, mHeight)) {
                  // 데미지 적용
                  const damage = state.stats.damage * effect.damagePerSecond
                  enemy.currentHp -= damage
                  enemy.lastHitTime = currentTime // Hit flash
                  playHit1()

                  state.damageNumbers.push({
                    id: generateId(),
                    x: enemy.x,
                    y: enemy.y,
                    damage: Math.floor(damage),
                    createdAt: currentTime,
                    color: '#FFD700',
                  })
                }
              })
            }

            // 슬로우 효과는 매 프레임 적용
            state.enemies.forEach((enemy) => {
              if (enemy.isDead) return
              if (isInsideMPattern(enemy, mFieldPos, mWidth, mHeight)) {
                enemy.mPatternSlowed = true
                enemy.mPatternSlowAmount = effect.slowAmount
              } else {
                enemy.mPatternSlowed = false
              }
            })
          }
          break
      }
      if (state.specialAbilityZoneCreated) {
        state.groundZones.forEach((zone) => {
          if (zone.followPlayer) {
            zone.x = state.player.x
            zone.y = state.player.y
          }
        })
        state.attackEffects.forEach((effectItem) => {
          if (effectItem.followPlayer) {
            effectItem.x = state.player.x
            effectItem.y = state.player.y
          }
        })
      }
    }
  }
}
