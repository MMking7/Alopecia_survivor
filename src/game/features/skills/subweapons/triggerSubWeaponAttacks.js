import { generateId, distance } from '../../../domain/math'
import { playHit1 } from '../../../../utils/SoundManager'

export const triggerSubWeaponAttacks = ({ state, currentTime, deltaTime, gameStateRef }) => {
  // ============================================================
  // SUB WEAPON ATTACK LOGIC
  // ============================================================
  const subWeapons = state.inventory.filter(item => item.isSubWeapon)

  subWeapons.forEach(weapon => {
    const effect = weapon.effect
    if (!effect) return

    const cooldown = weapon.attackCooldown || 0
    if (cooldown > 0) {
      if (currentTime - (weapon.lastAttackTime || 0) < cooldown) return
      weapon.lastAttackTime = currentTime
    }

    switch (weapon.id) {
      case 'black_dye': {
        const zoneCount = effect.zoneCount || 3
        const facing = state.player.facing

        for (let i = 0; i < zoneCount; i++) {
          const angle = (facing === 1 ? 0 : Math.PI) + (i - (zoneCount - 1) / 2) * 0.4
          const dist = 80 + i * 40

          state.subWeaponEffects.push({
            id: generateId(),
            type: 'black_dye_zone',
            x: state.player.x + Math.cos(angle) * dist,
            y: state.player.y + Math.sin(angle) * dist,
            radius: effect.range || 60,
            damagePerSecond: effect.damagePerSecond || 0.5,
            duration: (effect.duration || 3) * 1000,
            slowAmount: effect.slowAmount || 0,
            blindChance: effect.blindChance || 0,
            createdAt: currentTime,
          })
        }
        break
      }

      case 'hair_brush': {
        if (!weapon.state) weapon.state = { rotation: 0 }
        weapon.state.rotation += deltaTime * 5 * (effect.rotationSpeed || 1)

        const teethCount = effect.teethCount || 3
        const range = effect.range || 80

        for (let i = 0; i < teethCount; i++) {
          const angle = weapon.state.rotation + (Math.PI * 2 * i) / teethCount
          const toothX = state.player.x + Math.cos(angle) * range
          const toothY = state.player.y + Math.sin(angle) * range

          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            const d = distance({ x: toothX, y: toothY }, enemy)
            if (d < 30) {
              const damage = state.stats.damage * (effect.damagePercent || 0.4)
              enemy.currentHp -= damage * deltaTime * 3

              const knockbackAngle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
              const knockbackForce = effect.knockbackForce || 100
              enemy.x += Math.cos(knockbackAngle) * knockbackForce * deltaTime
              enemy.y += Math.sin(knockbackAngle) * knockbackForce * deltaTime

              if (effect.stunChance && Math.random() < effect.stunChance * deltaTime) {
                enemy.stunned = true
                enemy.stunUntil = currentTime + (effect.stunDuration || 0.5) * 1000
              }

              // Show Damage Number (Throttled per enemy)
              if (!enemy.lastHairBrushDamage || currentTime - enemy.lastHairBrushDamage > 200) {
                enemy.lastHairBrushDamage = currentTime
                enemy.lastHitTime = currentTime // Hit flash
                playHit1()
                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(damage * 0.6), // Estimate per-hit damage (damage * 3 * 0.2s)
                  color: '#FFFFFF',
                  createdAt: currentTime,
                })
              }
            }
          })
        }

        state.attackEffects = state.attackEffects.filter(e => e.type !== 'hair_brush_spin')
        state.attackEffects.push({
          id: generateId(),
          type: 'hair_brush_spin',
          teethCount,
          range,
          rotation: weapon.state.rotation,
          createdAt: currentTime,
          duration: 100,
        })
        break
      }

      case 'hair_spray': {
        let target = null
        let minDist = Infinity
        state.enemies.forEach(enemy => {
          if (enemy.isDead) return
          const d = distance(state.player, enemy)
          if (d < 400 && d < minDist) {
            minDist = d
            target = enemy
          }
        })

        if (target) {
          const missileCount = effect.missileCount || 1
          for (let i = 0; i < missileCount; i++) {
            const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
            const speed = effect.missileSpeed || 300
            const damageMultiplier = i === 0 ? 1 : (effect.secondMissileDamage || 0.5)

            setTimeout(() => {
              if (!gameStateRef.current) return
              gameStateRef.current.subWeaponProjectiles.push({
                id: generateId(),
                type: 'hair_spray_missile',
                x: state.player.x,
                y: state.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: state.stats.damage * (effect.explosionDamage || 1.2) * damageMultiplier,
                radius: effect.explosionRadius || 50,
                cloudDuration: effect.cloudDuration || 3,
                cloudDamage: effect.cloudDamagePerSecond || 0.3,
                createdAt: currentTime + i * 200,
              })
            }, i * 200)
          }
        }
        break
      }

      case 'hair_dryer': {
        const coneAngle = (effect.coneAngle || 60) * Math.PI / 180
        const range = effect.range || 150

        // Determine aim angle based on mode
        let aimAngle = state.player.facingAngle || (state.player.facing === 1 ? 0 : Math.PI)

        if (state.aimMode === 'manual') {
          // Manual: Follow cursor precisely
          aimAngle = Math.atan2(
            state.mouse.worldY - state.player.y,
            state.mouse.worldX - state.player.x
          )
        } else {
          // Auto: Find nearest enemy
          let nearestDist = Infinity
          let nearestEnemy = null
          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            const d = distance(state.player, enemy)
            if (d < range * 1.5 && d < nearestDist) {
              nearestDist = d
              nearestEnemy = enemy
            }
          })

          if (nearestEnemy) {
            aimAngle = Math.atan2(
              nearestEnemy.y - state.player.y,
              nearestEnemy.x - state.player.x
            )
          } else {
            // No enemy nearby, default to facing direction
            aimAngle = state.player.facing === 1 ? 0 : Math.PI
          }
        }

        // Initialize directions processing list
        const directions = [{ angle: aimAngle, type: 'hair_dryer_cone' }]
        if (effect.bidirectional) {
          directions.push({ angle: aimAngle + Math.PI, type: 'hair_dryer_cone_back' })
        }

        directions.forEach(dir => {
          let currentAimAngle = dir.angle

          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            const dx = enemy.x - state.player.x
            const dy = enemy.y - state.player.y
            const d = Math.sqrt(dx * dx + dy * dy)

            if (d <= range) {
              const enemyAngle = Math.atan2(dy, dx)
              let angleDiff = enemyAngle - currentAimAngle
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

              if (Math.abs(angleDiff) <= coneAngle / 2) {
                const damage = state.stats.damage * (effect.damagePerSecond || 0.6) * deltaTime
                enemy.currentHp -= damage

                if (!enemy.burning) {
                  enemy.burning = true
                  enemy.burnDamage = state.stats.damage * (effect.burnDamagePerSecond || 0.2)
                  enemy.burnUntil = currentTime + (effect.burnDuration || 2) * 1000
                }

                // Throttle Damage Numbers
                // Use distinct key for back attack to avoid throttling conflict? 
                // Actually sharing throttle is fine/better to avoid spam, but let's key it by weapon generically
                if (!enemy.lastHairDryerDamage || currentTime - enemy.lastHairDryerDamage > 200) {
                  enemy.lastHairDryerDamage = currentTime

                  // Calculate ~0.2s of damage for display
                  const displayDamage = Math.floor(state.stats.damage * (effect.damagePerSecond || 0.6) * 0.2)

                  state.damageNumbers.push({
                    id: generateId(),
                    x: enemy.x,
                    y: enemy.y,
                    damage: Math.floor(displayDamage),
                    color: '#FF6600',
                    createdAt: currentTime,
                  })
                  enemy.lastHitTime = currentTime // Hit flash
                  playHit1()
                }
              }
            }
          })

          // Persistent Visual Effect Handling
          // We use dir.type to distinguish front vs back effect instances
          // If I use unique IDs, searching by type finds the first one. THIS IS A BUG in my previous logic (finding by type).
          // Fix: Find by type AND specific distinction (like custom property 'isBack').
        })

        // Revised Logic for Visuals with proper ID tracking
        // We will maintain two specific IDs for front and back if needed, or search by custom property.

        // Front
        let frontEffect = state.attackEffects.find(e => e.type === 'hair_dryer_cone' && !e.isBack)
        if (frontEffect) {
          frontEffect.angle = aimAngle
          frontEffect.coneAngle = coneAngle
          frontEffect.range = range
          frontEffect.createdAt = currentTime
          frontEffect.duration = 100
        } else {
          state.attackEffects.push({
            id: generateId(),
            type: 'hair_dryer_cone',
            angle: aimAngle,
            coneAngle,
            range,
            createdAt: currentTime,
            duration: 100,
            isBack: false
          })
        }

        // Back
        if (effect.bidirectional) {
          let backEffect = state.attackEffects.find(e => e.type === 'hair_dryer_cone' && e.isBack)
          if (backEffect) {
            backEffect.angle = aimAngle + Math.PI
            backEffect.coneAngle = coneAngle
            backEffect.range = range
            backEffect.createdAt = currentTime
            backEffect.duration = 100
          } else {
            state.attackEffects.push({
              id: generateId(),
              type: 'hair_dryer_cone',
              angle: aimAngle + Math.PI,
              coneAngle,
              range,
              createdAt: currentTime,
              duration: 100,
              isBack: true
            })
          }
        }
        break
      }

      case 'electric_clipper': {
        if (!weapon.state) weapon.state = { comboCount: 0 }

        // Use effect cooldown if defined, otherwise default
        const currentCooldown = effect.attackCooldown || weapon.attackCooldown || 333

        // Manual Cooldown Check since we might override the default weapon loop check
        // Ideally the main loop handles this if weapon.attackCooldown is set correctly.
        // But since we change it per level, we should update the weapon's main property or check here.
        // For simplicity, we ensure the main loop uses the correct CD by updating the weapon object itself if needed,
        // OR we just trust the main loop if we updated weapon.attackCooldown in updateSkillSystems (which we didn't).
        // PROPER FIX: The main loop (lines 13-17) uses `weapon.attackCooldown`. 
        // We should explicitly update that property based on the current level effect during the skill update phase?
        // OR we can just ignore the main loop's check if we want custom logic, but the main loop already returns.
        // HACK: We can't easily change the main loop from inside the switch.
        // BETTER FIX: We assume the main loop let us through. 
        // To support dynamic CD, we must update weapon.attackCooldown anytime level changes.
        // However, for this specific request, we can just hack it:
        // If we are here, the cooldown PASSSED. 
        // But wait, if the main loop uses a fixed 200ms and we want 333ms, we might attack too fast.
        // If the main loop uses 333ms and we want 250ms, we might attack too slow.
        // Workaround: We will update `weapon.attackCooldown` dynamically here for the *next* frame.
        if (effect.attackCooldown) {
          weapon.attackCooldown = effect.attackCooldown
        }

        const range = effect.range || 50
        const facing = state.player.facing

        state.enemies.forEach(enemy => {
          if (enemy.isDead) return
          const dx = enemy.x - state.player.x
          const dy = enemy.y - state.player.y
          const d = Math.sqrt(dx * dx + dy * dy)

          if (d <= range) {
            let damage = state.stats.damage * (effect.damagePercent || 0.5)

            // Combo Logic
            weapon.state.comboCount++
            const threshold = effect.comboThreshold || 0

            if (threshold > 0 && weapon.state.comboCount >= threshold) {
              const multiplier = effect.comboMultiplier || 2.0
              damage *= multiplier
              weapon.state.comboCount = 0 // Reset combo

              // Visual cue for big hit? 
              // Maybe make the damage number larger or different color?
              // The damage number logic handles criticals, we can fake a crit or add a new type.
            }

            const critBonus = effect.critBonus || 0
            const isCrit = Math.random() < (state.stats.crit + critBonus)
            if (isCrit) damage *= 1.5

            enemy.currentHp -= damage
            enemy.lastHitTime = currentTime // Hit flash
            playHit1()
            state.damageNumbers.push({
              id: generateId(),
              x: enemy.x + (Math.random() - 0.5) * 20,
              y: enemy.y + (Math.random() - 0.5) * 20,
              damage: Math.floor(damage),
              isCritical: isCrit,
              createdAt: currentTime,
            })
          }
        })

        // Add visual slash effect
        state.attackEffects.push({
          id: generateId(),
          type: 'electric_clipper_slash',
          x: state.player.x + (facing === 1 ? 30 : -30),
          y: state.player.y,
          facing: facing,
          createdAt: currentTime,
          duration: 150,
        })
        break
      }

      case 'dandruff_bomb': {
        if (!weapon.state) weapon.state = { bombs: [], lastGeneration: 0 }

        const genInterval = effect.generationInterval || 5000
        const maxBombs = effect.maxBombs || 3

        if (currentTime - weapon.state.lastGeneration > genInterval) {
          if (weapon.state.bombs.length < maxBombs) {
            const angle = Math.random() * Math.PI * 2
            const dist = 30 + Math.random() * 50
            weapon.state.bombs.push({
              id: generateId(),
              x: state.player.x + Math.cos(angle) * dist,
              y: state.player.y + Math.sin(angle) * dist,
              damage: state.stats.damage * (effect.explosionDamage || 1.5),
              radius: effect.explosionRadius || 60,
              slowAmount: effect.slowAmount || 0,
              slowDuration: effect.slowDuration || 0,
              chainChance: effect.chainExplosionChance || 0,
              createdAt: currentTime,
              lifeTime: 10000,
            })
            weapon.state.lastGeneration = currentTime
          }
        }

        const newBombs = []
        weapon.state.bombs = weapon.state.bombs.filter(bomb => {
          let shouldExplode = currentTime - bomb.createdAt > bomb.lifeTime

          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            if (distance(bomb, enemy) < 30) {
              shouldExplode = true
            }
          })

          if (shouldExplode) {
            state.enemies.forEach(enemy => {
              if (enemy.isDead) return
              if (distance(bomb, enemy) < bomb.radius) {
                enemy.currentHp -= bomb.damage

                if (bomb.slowAmount > 0) {
                  enemy.slowed = true
                  enemy.slowAmount = bomb.slowAmount
                  enemy.slowUntil = currentTime + bomb.slowDuration * 1000
                }

                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(bomb.damage),
                  color: '#FFFFFF',
                  createdAt: currentTime,
                })
                enemy.lastHitTime = currentTime // Hit flash
                playHit1()
              }
            })

            state.explosions.push({
              id: generateId(),
              x: bomb.x,
              y: bomb.y,
              radius: bomb.radius,
              createdAt: currentTime,
            })

            if (bomb.chainChance > 0 && Math.random() < bomb.chainChance) {
              const angle = Math.random() * Math.PI * 2
              newBombs.push({
                ...bomb,
                id: generateId(),
                x: bomb.x + Math.cos(angle) * 40,
                y: bomb.y + Math.sin(angle) * 40,
                createdAt: currentTime,
              })
            }

            return false
          }
          return true
        })

        // Add new bombs generated from chain reactions
        if (newBombs.length > 0) {
          weapon.state.bombs.push(...newBombs)
        }
        break
      }
    }
  })
}
