import { GAME_CONFIG } from '../../constants'
import { MAIN_WEAPONS } from '../../MainWeapons'
import { generateId, distance } from '../domain/math'
import { buildLevelUpOptions } from './levelUpOptions'
import { updateSkillSystems } from '../features/skills/updateSkillSystems'
import { getMapObjectDef, getInteractionBox, createMapObject, getCollisionBox, getRenderBox } from '../map/mapObjects'

/**
 * Damage destructible map objects within an area
 * @param {object} state - Game state
 * @param {object} attackArea - { x, y, radius } for circular or { x, y, width, height } for rectangular
 * @param {number} damage - Damage to deal
 * @param {number} currentTime - Current time for effects
 * @param {boolean} isCircular - Whether attack area is circular
 */
export const damageMapObjects = (state, attackArea, damage, currentTime, isCircular = true) => {
  if (!state.mapObjects || state.mapObjects.length === 0) {
    return
  }

  state.mapObjects.forEach((obj, index) => {
    const def = getMapObjectDef(obj.type)
    
    if (!def || !def.destructible) return
    if (obj.isDestroyed) return

    if (obj.hp === undefined || obj.hp === null) {
      const defaultHp = def.hp ?? 1
      obj.hp = defaultHp
      if (obj.maxHp === undefined || obj.maxHp === null) {
        obj.maxHp = defaultHp
      }
    }
    if (obj.hp <= 0) return

    const interactionBox = getInteractionBox(obj)
    if (!interactionBox) return

    let hit = false

    if (isCircular) {
      // Circular attack - check if circle intersects box
      const closestX = Math.max(interactionBox.x, Math.min(attackArea.x, interactionBox.x + interactionBox.width))
      const closestY = Math.max(interactionBox.y, Math.min(attackArea.y, interactionBox.y + interactionBox.height))
      const distX = attackArea.x - closestX
      const distY = attackArea.y - closestY
      const distSq = distX * distX + distY * distY
      hit = distSq <= attackArea.radius * attackArea.radius
    } else {
      // Rectangular attack
      hit = 
        attackArea.x < interactionBox.x + interactionBox.width &&
        attackArea.x + attackArea.width > interactionBox.x &&
        attackArea.y < interactionBox.y + interactionBox.height &&
        attackArea.y + attackArea.height > interactionBox.y
    }

    if (hit) {
      obj.hp -= damage

      // Show damage number
      state.damageNumbers.push({
        id: generateId(),
        x: obj.x,
        y: obj.y - 20,
        damage: Math.floor(damage),
        createdAt: currentTime,
        color: '#FFD700',
      })

      // Check if destroyed
      if (obj.hp <= 0) {
        // Transform to broken version if specified
        const transformTo = def.transformsTo || (def.onDestroy && def.onDestroy.transformTo)
        if (transformTo) {
          const newObj = createMapObject(transformTo, obj.x, obj.y, {
            spawned: obj.spawned,
            spawnedAt: obj.spawnedAt,
          })
          if (newObj) {
            state.mapObjects[index] = newObj
          }
        } else {
          // Mark as destroyed if no transformation
          obj.isDestroyed = true
        }

        // Add destruction effect
        state.attackEffects.push({
          type: 'aoe',
          id: generateId(),
          x: obj.x,
          y: obj.y,
          maxRadius: 40,
          color: 'rgba(200, 180, 150, 0.6)',
          createdAt: currentTime,
          duration: 400,
        })

        // Add destruction text
        state.damageNumbers.push({
          id: generateId(),
          x: obj.x,
          y: obj.y - 40,
          damage: 'DESTROYED',
          createdAt: currentTime,
          color: '#FF6347',
        })
      }
    }
  })
}

const DYNAMIC_OBSTACLE_TYPES = [
  'big_tree',
  'old_tree',
  'statue_pillar',
  'statue_bust',
]

const boxesOverlap = (boxA, boxB) => {
  if (!boxA || !boxB) return false
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  )
}

const getDynamicObstacleState = (state) => {
  if (!state.dynamicObstacleState) {
    state.dynamicObstacleState = {
      lastSpawnX: state.player.x,
      lastSpawnY: state.player.y,
      lastMoveDir: { x: 0, y: 0 },
    }
  }
  return state.dynamicObstacleState
}

const pruneSpawnedObstacles = (state, config) => {
  if (!state.mapObjects || state.mapObjects.length === 0) return

  let nextObjects = state.mapObjects

  if (config.despawnDistance) {
    nextObjects = nextObjects.filter((obj) => {
      if (!obj.spawned) return true
      return distance(state.player, obj) <= config.despawnDistance
    })
  }

  if (config.maxSpawned) {
    const spawned = nextObjects.filter((obj) => obj.spawned)
    if (spawned.length > config.maxSpawned) {
      spawned.sort((a, b) => distance(state.player, b) - distance(state.player, a))
      const removeIds = new Set(
        spawned.slice(config.maxSpawned).map((obj) => obj.id)
      )
      nextObjects = nextObjects.filter((obj) => !removeIds.has(obj.id))
    }
  }

  state.mapObjects = nextObjects
}

const spawnDynamicObstacles = (state) => {
  const config = GAME_CONFIG.MAP_DYNAMIC_OBSTACLES
  if (!config?.enabled || !state.mapObjects || !state.player) return

  const spawnState = getDynamicObstacleState(state)
  const moveDir = spawnState.lastMoveDir
  if (!moveDir || (moveDir.x === 0 && moveDir.y === 0)) return

  const viewMargin = config.offscreenMargin ?? 0
  const viewRect = {
    x: state.player.x - GAME_CONFIG.CANVAS_WIDTH / 2 - viewMargin,
    y: state.player.y - GAME_CONFIG.CANVAS_HEIGHT / 2 - viewMargin,
    width: GAME_CONFIG.CANVAS_WIDTH + viewMargin * 2,
    height: GAME_CONFIG.CANVAS_HEIGHT + viewMargin * 2,
  }

  const movedDistance = Math.hypot(
    state.player.x - spawnState.lastSpawnX,
    state.player.y - spawnState.lastSpawnY
  )

  if (movedDistance < config.spawnDistance) return

  spawnState.lastSpawnX = state.player.x
  spawnState.lastSpawnY = state.player.y

  pruneSpawnedObstacles(state, config)

  const currentSpawned = state.mapObjects.filter((obj) => obj.spawned).length
  let spawnCount =
    config.spawnCountMin +
    Math.floor(Math.random() * (config.spawnCountMax - config.spawnCountMin + 1))

  if (config.maxSpawned) {
    spawnCount = Math.min(spawnCount, Math.max(0, config.maxSpawned - currentSpawned))
  }

  if (spawnCount <= 0) return

  const mapWidth = state.mapData?.width
  const mapHeight = state.mapData?.height
  const minOffscreenRadius = Math.hypot(viewRect.width / 2, viewRect.height / 2)
  const spawnRadiusMin = Math.max(config.spawnRadiusMin ?? 0, minOffscreenRadius + 8)
  const spawnRadiusMax = Math.max(config.spawnRadiusMax ?? spawnRadiusMin, spawnRadiusMin + 80)

  for (let i = 0; i < spawnCount; i++) {
    let placed = false

    for (let attempt = 0; attempt < config.spawnAttempts; attempt++) {
      const type = DYNAMIC_OBSTACLE_TYPES[Math.floor(Math.random() * DYNAMIC_OBSTACLE_TYPES.length)]
      const baseAngle = Math.atan2(moveDir.y, moveDir.x)
      const cone = Math.max(0, config.forwardConeAngle ?? Math.PI)
      const deadZone = Math.min(Math.abs(config.forwardDeadZoneAngle ?? 0), cone)
      const side = Math.random() < 0.5 ? -1 : 1
      const offset = deadZone + Math.random() * Math.max(0, cone - deadZone)
      const angle = baseAngle + side * offset
      const radius =
        spawnRadiusMin + Math.random() * Math.max(0, spawnRadiusMax - spawnRadiusMin)
      const x = state.player.x + Math.cos(angle) * radius
      const y = state.player.y + Math.sin(angle) * radius

      if (distance(state.player, { x, y }) < config.playerSafeRadius) continue

      const newObj = createMapObject(type, x, y, {
        spawned: true,
        spawnedAt: state.gameTime,
      })
      if (!newObj) continue

      const newBox = getCollisionBox(newObj)
      if (!newBox) continue
      const renderBox = getRenderBox(newObj) || newBox
      if (boxesOverlap(renderBox, viewRect)) continue

      if (mapWidth && mapHeight && !config.allowOutsideMap) {
        if (
          newBox.x < 0 ||
          newBox.y < 0 ||
          newBox.x + newBox.width > mapWidth ||
          newBox.y + newBox.height > mapHeight
        ) {
          continue
        }
      }

      let overlaps = false
      for (const existing of state.mapObjects) {
        const def = getMapObjectDef(existing.type)
        if (!def || !def.collisionBox) continue
        if (existing.isDestroyed) continue
        if (def.behavior === 'destructible') {
          const hp = existing.hp ?? def.hp ?? 0
          if (hp <= 0) continue
        }
        const existingBox = getCollisionBox(existing)
        if (!existingBox) continue
        if (boxesOverlap(newBox, existingBox)) {
          overlaps = true
          break
        }
      }

      if (overlaps) continue

      state.mapObjects.push(newObj)
      placed = true
      break
    }

    if (!placed) break
  }
}

export const updateMovementAndCamera = ({ state, deltaTime }) => {
  // Player movement - 무한맵 (경계 없음)
  let dx = 0, dy = 0
  if (state.keys.w) dy -= 1
  if (state.keys.s) dy += 1
  if (state.keys.a) dx -= 1
  if (state.keys.d) dx += 1

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy)
    dx /= len
    dy /= len

    const spawnState = getDynamicObstacleState(state)
    spawnState.lastMoveDir = { x: dx, y: dy }
  }

  const speed = GAME_CONFIG.PLAYER_SPEED * state.stats.moveSpeed * deltaTime
  let newX = state.player.x + dx * speed
  let newY = state.player.y + dy * speed

  // Check collision with map objects
  const playerRadius = 16 // Player collision radius
  if (state.mapObjects && state.mapObjects.length > 0) {
    for (const obj of state.mapObjects) {
      const def = getMapObjectDef(obj.type)
      if (!def) continue
      if (obj.isDestroyed) continue

      let objHp = obj.hp
      if (def.behavior === 'destructible') {
        if (objHp === undefined || objHp === null) {
          objHp = def.hp ?? 1
          obj.hp = objHp
          if (obj.maxHp === undefined || obj.maxHp === null) {
            obj.maxHp = objHp
          }
        }
        if (objHp <= 0) continue
      }

      // Block movement for 'blocking' behavior OR 'destructible' with hp > 0
      const shouldBlock = def.behavior === 'blocking' || 
        (def.behavior === 'destructible' && objHp > 0)
      if (!shouldBlock) continue

      const collisionBox = getCollisionBox(obj)
      if (!collisionBox) continue

      // Check if new position collides with object
      const closestX = Math.max(collisionBox.x, Math.min(newX, collisionBox.x + collisionBox.width))
      const closestY = Math.max(collisionBox.y, Math.min(newY, collisionBox.y + collisionBox.height))
      
      const distX = newX - closestX
      const distY = newY - closestY
      const distSquared = distX * distX + distY * distY

      if (distSquared < playerRadius * playerRadius) {
        // Collision detected - try sliding along X axis
        const testX = newX
        const closestXOnly = Math.max(collisionBox.x, Math.min(testX, collisionBox.x + collisionBox.width))
        const closestYOld = Math.max(collisionBox.y, Math.min(state.player.y, collisionBox.y + collisionBox.height))
        const distXOnly = testX - closestXOnly
        const distYOld = state.player.y - closestYOld
        
        if (distXOnly * distXOnly + distYOld * distYOld >= playerRadius * playerRadius) {
          // X movement is valid, keep newX but revert Y
          newY = state.player.y
        } else {
          // Try Y axis only
          const closestXOld = Math.max(collisionBox.x, Math.min(state.player.x, collisionBox.x + collisionBox.width))
          const testY = newY
          const closestYOnly = Math.max(collisionBox.y, Math.min(testY, collisionBox.y + collisionBox.height))
          const distXOld = state.player.x - closestXOld
          const distYOnly = testY - closestYOnly
          
          if (distXOld * distXOld + distYOnly * distYOnly >= playerRadius * playerRadius) {
            // Y movement is valid, revert X but keep newY
            newX = state.player.x
          } else {
            // Both blocked, revert both
            newX = state.player.x
            newY = state.player.y
          }
        }
      }
    }
  }

  state.player.x = newX
  state.player.y = newY

  // Spawn dynamic obstacles as the player moves beyond the static map area
  spawnDynamicObstacles(state)

  // 마우스 커서 방향으로 facing 업데이트
  const mouseWorldX = state.mouse.worldX
  const mouseWorldY = state.mouse.worldY
  const toMouseX = mouseWorldX - state.player.x
  const toMouseY = mouseWorldY - state.player.y

  // facing angle 계산 (마우스 방향)
  state.player.facingAngle = Math.atan2(toMouseY, toMouseX)

  // facing (좌/우) 업데이트 - 마우스가 플레이어 오른쪽이면 1, 왼쪽이면 -1
  state.player.facing = toMouseX >= 0 ? 1 : -1
  state.player.lastFacingDirection = toMouseX >= 0 ? 'right' : 'left'

  // Update camera
  state.camera.x = state.player.x - GAME_CONFIG.CANVAS_WIDTH / 2
  state.camera.y = state.player.y - GAME_CONFIG.CANVAS_HEIGHT / 2
}

export const updateCombat = ({
  state,
  deltaTime,
  currentTime,
  onGameOver,
  buildFinalStats,
  gameStateRef,
  setLevelUpOptions,
  setGamePhase,
  setDisplayStats,
}) => {
  // Move and update enemies with unique behaviors
  state.enemies.forEach((enemy) => {
    const edx = state.player.x - enemy.x
    const edy = state.player.y - enemy.y
    const dist = Math.sqrt(edx * edx + edy * edy)
    let effectiveSpeed = enemy.scaledSpeed || enemy.speed

    // Generic Slow Application
    if (enemy.slowed && enemy.slowAmount) {
      effectiveSpeed *= (1 - enemy.slowAmount)
    }

    // M 패턴 슬로우 적용 (Stacking or independent?)
    if (enemy.mPatternSlowed && enemy.mPatternSlowAmount) {
      effectiveSpeed *= (1 - enemy.mPatternSlowAmount)
    }

    // Apply electrify DoT (Heihachi)
    if (enemy.electrified && currentTime < enemy.electrified.until) {
      const electrifyDamage = state.stats.damage * enemy.electrified.damagePerSecond * deltaTime
      enemy.currentHp -= electrifyDamage
    } else if (enemy.electrified) {
      delete enemy.electrified
    }

    // Reset damage taken multiplier (re-applied every frame if in zone)
    enemy.damageTakenMultiplier = 1.0

    // 몬스터별 행동 패턴
    switch (enemy.attackType) {
      case 'dash': // 바리깡 - 대시 공격
        if (!enemy.isDashing && dist < 200 && currentTime - enemy.lastAttack > (enemy.dashCooldown || 2000)) {
          enemy.isDashing = true
          enemy.dashTarget = { x: state.player.x, y: state.player.y }
          enemy.lastAttack = currentTime
        }
        if (enemy.isDashing) {
          const ddx = enemy.dashTarget.x - enemy.x
          const ddy = enemy.dashTarget.y - enemy.y
          const ddist = Math.sqrt(ddx * ddx + ddy * ddy)
          if (ddist > 10) {
            enemy.x += (ddx / ddist) * (enemy.dashSpeed || 300) * deltaTime
            enemy.y += (ddy / ddist) * (enemy.dashSpeed || 300) * deltaTime
          } else {
            enemy.isDashing = false
          }
        } else if (dist > 30) {
          enemy.x += (edx / dist) * effectiveSpeed * deltaTime
          enemy.y += (edy / dist) * effectiveSpeed * deltaTime
        }
        break

      case 'ranged': // 담배 - 원거리 공격
        if (dist > 150) {
          enemy.x += (edx / dist) * effectiveSpeed * deltaTime
          enemy.y += (edy / dist) * effectiveSpeed * deltaTime
        }
        if (dist < (enemy.attackRange || 280) && currentTime - enemy.lastAttack > (enemy.attackCooldown || 1500)) {
          enemy.lastAttack = currentTime
          const projSpeed = enemy.projectileSpeed || 200
          state.enemyProjectiles.push({
            id: generateId(),
            type: 'cigarette_projectile',
            x: enemy.x,
            y: enemy.y,
            vx: (edx / dist) * projSpeed,
            vy: (edy / dist) * projSpeed,
            damage: enemy.scaledDamage || enemy.damage,
            size: 20, // Increased hitbox size
            createdAt: currentTime,
          })
        }
        break

      case 'spiral': // DNA - 나선형 이동
        enemy.rotation = (enemy.rotation || 0) + deltaTime * 3
        const spiralAngle = Math.atan2(edy, edx) + Math.sin(enemy.rotation) * 0.5
        if (dist > 30) {
          enemy.x += Math.cos(spiralAngle) * effectiveSpeed * deltaTime
          enemy.y += Math.sin(spiralAngle) * effectiveSpeed * deltaTime
        }
        break

      case 'explosion': // 소주 - 근접 시 폭발
        if (dist > 30) {
          enemy.x += (edx / dist) * effectiveSpeed * deltaTime
          enemy.y += (edy / dist) * effectiveSpeed * deltaTime
        }
        if (dist < 50 && !enemy.exploded) {
          enemy.exploded = true
          enemy.currentHp = 0
          state.explosions.push({
            id: generateId(),
            x: enemy.x,
            y: enemy.y,
            radius: enemy.explosionRadius || 80,
            damage: (enemy.scaledDamage || enemy.damage) * 2,
            createdAt: currentTime,
          })
        }
        break

      default: // 기본 이동
        if (dist > 30) {
          enemy.x += (edx / dist) * effectiveSpeed * deltaTime
          enemy.y += (edy / dist) * effectiveSpeed * deltaTime
        }
    }

    // Death Check & Animation Update
    if (enemy.isDead) {
      enemy.deathTimer += deltaTime
      // Knockback physics - 캐릭터 반대 방향으로 날아감
      enemy.x += enemy.vx * deltaTime
      enemy.y += enemy.vy * deltaTime
      enemy.vx *= 0.95 // 더 천천히 감속
      enemy.vy *= 0.95
    } else if (enemy.currentHp <= 0) {
      enemy.isDead = true
      enemy.deathTimer = 0
      // Apply Knockback away from player (캐릭터 반대 방향으로 멀리 날아감)
      const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
      const force = 500 // 더 강한 knockback
      enemy.vx = Math.cos(angle) * force
      enemy.vy = Math.sin(angle) * force

      // Drop XP Orb
      state.xpOrbs.push({
        id: generateId(),
        x: enemy.x,
        y: enemy.y,
        value: enemy.xp,
        createdAt: currentTime
      })

      // Drop Coin (Chance)
      if (Math.random() < GAME_CONFIG.COIN_DROP_RATE) {
        const value = Math.floor(Math.random() * (GAME_CONFIG.COIN_VALUE_RANGE.max - GAME_CONFIG.COIN_VALUE_RANGE.min + 1)) + GAME_CONFIG.COIN_VALUE_RANGE.min

        state.coins.push({
          id: generateId(),
          x: enemy.x,
          y: enemy.y,
          value: value,
          createdAt: currentTime
        })
      }

      // Life Steal (Minoxidil / Vampirism Effect)
      if (state.stats.lifeSteal > 0) {
        // Chance: Cap at 15% (0.15)
        const chance = Math.min(state.stats.lifeSteal, 0.15)

        if (Math.random() < chance) {
          // Heal Amount: 3 HP per 0.05 Life Steal (Factor: 60)
          // e.g. 0.05 -> 3, 0.10 -> 6, 0.15 -> 9... (Unlimited scaling)
          const healAmount = Math.floor(state.stats.lifeSteal * 60)

          if (healAmount > 0 && state.stats.hp < state.stats.maxHp) {
            state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + healAmount)
            state.damageNumbers.push({
              id: generateId(),
              x: state.player.x,
              y: state.player.y - 40,
              damage: `${healAmount}HP`,
              color: '#00FF00',
              createdAt: currentTime,
              isHeal: true,
            })
          }
        }
      }

      state.kills += 1

      // Wongfeihung passive skill: increase kill stacks
      if (state.passiveBonuses?.wongMoveSpeedBonus) {
        state.passiveBonuses.wongKillStacks = Math.min(
          (state.passiveBonuses.wongKillStacks || 0) + 1,
          state.passiveBonuses.wongMaxStacks || 6
        )
        if (state.passiveBonuses.wongHpRegen) {
          state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + state.passiveBonuses.wongHpRegen)
          state.damageNumbers.push({
            id: generateId(),
            x: state.player.x,
            y: state.player.y - 45,
            damage: `${state.passiveBonuses.wongHpRegen} HP`,
            color: '#00FF00',
            createdAt: currentTime,
            isHeal: true,
          })
        }
      }

      // Heihachi Weapon: Heal on Kill (Level 3+)
      const heihachiWeapon = state.player.character.id === 'heihachi' ? MAIN_WEAPONS.heihachi.levelEffects[state.mainWeaponLevel] : null
      if (heihachiWeapon && heihachiWeapon.healOnKill) {
        let healAmount = heihachiWeapon.healAmountFixed || 0
        if (heihachiWeapon.healAmountPercent) {
          healAmount += state.stats.maxHp * heihachiWeapon.healAmountPercent
        }
        if (healAmount > 0 && state.stats.hp < state.stats.maxHp) {
          state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + healAmount)
          state.damageNumbers.push({
            id: generateId(),
            x: state.player.x,
            y: state.player.y - 45,
            damage: `+${Math.floor(healAmount)}`,
            color: '#00FF00',
            createdAt: currentTime,
            isHeal: true,
          })
        }

        // Awakening: Chain Lightning
        if (heihachiWeapon.awakeningLightning) {
          const targets = []
          state.enemies.forEach(other => {
            if (other.isDead || other.id === enemy.id) return
            if (distance(enemy, other) < 250) { // Chain range
              targets.push(other)
            }
          })
          // Sort by distance to dead enemy
          targets.sort((a, b) => distance(enemy, a) - distance(enemy, b))
          // Take top N
          const chains = targets.slice(0, heihachiWeapon.awakeningTargets || 2)

          chains.forEach(target => {
            const chainDamage = state.stats.damage * (heihachiWeapon.awakeningDamage || 1.0)
            target.currentHp -= chainDamage

            // Visual
            state.attackEffects.push({
              id: generateId(),
              type: 'chain_lightning', // We need to render this
              startX: enemy.x,
              startY: enemy.y,
              endX: target.x,
              endY: target.y,
              color: '#00FFFF',
              createdAt: currentTime,
              duration: 200
            })

            state.damageNumbers.push({
              id: generateId(),
              x: target.x,
              y: target.y,
              damage: Math.floor(chainDamage),
              color: '#00FFFF',
              createdAt: currentTime
            })
          })
        }
      }

      // Areata passive skill 3: chance to drop hair (Item Drop)
      if (state.passiveBonuses?.hairDropChance && Math.random() < state.passiveBonuses.hairDropChance) {
        state.fallenHairs.push({
          id: generateId(),
          x: enemy.x,
          y: enemy.y,
          createdAt: currentTime,
          value: 1 // Just a marker
        })
      }
    }

    // Garbage Collection: Remove far enemies OR fully dead enemies
    if (enemy.deathTimer > 0.5 || (dist > GAME_CONFIG.ENEMY_DESPAWN_DISTANCE && enemy.type !== 'boss')) {
      enemy.shouldRemove = true // Mark for removal
    }

    // Damage player on collision (Alive enemies only)
    if (!enemy.isDead && dist < 40 && enemy.attackType !== 'ranged') {
      if (state.player.invulnerableUntil && currentTime < state.player.invulnerableUntil) {
        // Invulnerable
      } else if (state.stats.shield > 0) {
        state.stats.shield -= 1
      } else {
        // Areata Skill 2: Scalp Numbness (Dodge + Shockwave)
        if (state.passiveBonuses.dodgeChance && Math.random() < state.passiveBonuses.dodgeChance) {
          // Successful Dodge!
          // Trigger Shockwave (Visual: Beam Explosion Style)
          state.attackEffects.push({
            id: generateId(),
            type: 'aoe',
            x: state.player.x,
            y: state.player.y,
            maxRadius: 100, // Reasonable shockwave size
            color: state.player.character.attackColor || '#32CD32', // Use character color (Green for Areata)
            createdAt: currentTime,
            duration: 300,
          })

          // Deal Shockwave Damage
          const shockDamage = state.stats.damage * (state.passiveBonuses.shockwaveDamage || 1.0)
          state.enemies.forEach(nearby => {
            if (distance(state.player, nearby) <= 100) {
              nearby.currentHp -= shockDamage
              state.damageNumbers.push({
                id: generateId(),
                x: nearby.x,
                y: nearby.y,
                damage: Math.floor(shockDamage),
                color: '#32CD32',
                createdAt: currentTime
              })
            }
          })

          // Visual feedback for Dodge
          state.damageNumbers.push({
            id: generateId(),
            x: state.player.x,
            y: state.player.y - 60,
            damage: 'Numb!',
            color: '#ADFF2F',
            createdAt: currentTime,
          })
          return // Skip damage
        }

        let rawDamage = (enemy.scaledDamage || enemy.damage)

        // Check for Shield Skill Stacks
        if (state.passiveBonuses.shieldSkill && (state.passiveBonuses.shieldStacks || 0) > 0) {
          state.passiveBonuses.shieldStacks--
          rawDamage *= (1 - state.passiveBonuses.shieldSkill.damageReduction)
          state.player.invulnerableUntil = currentTime + (state.passiveBonuses.shieldSkill.invulnerabilityDuration * 1000)

          // Visual feedback?
          state.damageNumbers.push({
            id: generateId(),
            x: state.player.x,
            y: state.player.y - 50,
            damage: 'Blocked!',
            color: '#8A2BE2',
            createdAt: currentTime,
          })
        }

        // Apply Damage Reduction from skills (Iron Skull)
        const damageReduction = state.passiveBonuses.damageReduction || 0
        const defenseMult = (1 - (state.stats.defense || 0)) * (1 - damageReduction)

        const takenDamage = Math.max(1, rawDamage * defenseMult)
        state.stats.hp -= takenDamage * deltaTime

        // Heihachi Passive: Electric Scalp (Heal on Hit)
        // Check cooldown to prevent 60 heals per second if stuck inside enemy
        if (state.passiveBonuses.electricScalp && (!state.lastHealOnHit || currentTime - state.lastHealOnHit > 500)) {
          if (Math.random() < state.passiveBonuses.electricScalp.chance) {
            const healPercent = state.passiveBonuses.electricScalp.percent
            const healAmount = state.stats.maxHp * healPercent
            state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + healAmount)
            state.lastHealOnHit = currentTime

            state.damageNumbers.push({
              id: generateId(),
              x: state.player.x,
              y: state.player.y - 50,
              damage: `${Math.floor(healAmount)} HP`,
              color: '#00FF00',
              createdAt: currentTime,
              isHeal: true,
            })
          }
        }
        if (state.stats.hp <= 0) {
          // Game Over
          onGameOver(buildFinalStats())
          return
        }
      }
    }
  })
  // Garbage Collection for Enemies
  state.enemies = state.enemies.filter(e => !e.shouldRemove)

  // Update Fallen Hairs (Pickup Logic)
  if (state.fallenHairs) {
    state.fallenHairs.forEach(hair => {
      // Magnet/Pickup check
      const distToPlayer = distance(state.player, hair)
      const pickupRange = 50 + (state.passiveBonuses.pickupRange || 0)

      if (distToPlayer < pickupRange) {
        // Picked up!
        hair.shouldRemove = true

        // Apply Buff (Refresh Duration, No Stacking)
        // Store the fixed fire rate from the current skill level
        if (state.passiveBonuses.hairBuffFireRate) {
          // Already active, just refresh
          state.passiveBonuses.areataHairStackExpire = currentTime + (state.passiveBonuses.hairBuffDuration || 5) * 1000
        } else {
          // Activate buff
          state.passiveBonuses.areataHairStackExpire = currentTime + (state.passiveBonuses.hairBuffDuration || 5) * 1000
          state.passiveBonuses.hairBuffFireRate = state.passiveBonuses.fixedFireRate || 0.5 // Default fallback
        }

        // Visual text
        state.damageNumbers.push({
          id: generateId(),
          x: state.player.x,
          y: state.player.y - 40,
          damage: 'Rapid Fire!',
          color: '#00FFFF',
          createdAt: currentTime,
          isHeal: true, // Reuse heal float behavior
        })
      }
    })
    state.fallenHairs = state.fallenHairs.filter(h => !h.shouldRemove)
  }

  // Update ground zones (여성형 탈모 장판)
  if (state.groundZones) {
    state.groundZones.forEach((zone) => {
      const age = currentTime - zone.createdAt
      if (age >= zone.duration) {
        zone.shouldRemove = true
        return
      }

      // Deal damage to enemies in zone
      state.enemies.forEach((enemy) => {
        if (enemy.isDead) return

        if (zone.radius) {
          const dist = distance(zone, enemy)
          if (dist < zone.radius) {
            if (zone.damageAmplification) {
              enemy.damageTakenMultiplier = (enemy.damageTakenMultiplier || 1) * (1 + zone.damageAmplification)
            }

            // Apply Slow from Zone
            if (zone.slowAmount) {
              enemy.slowed = true
              enemy.slowAmount = zone.slowAmount
              enemy.slowUntil = currentTime + 200 // Refresh for short duration while in zone
            }

            const damage = state.stats.damage * zone.damagePerSecond * deltaTime
            enemy.currentHp -= damage * (enemy.damageTakenMultiplier || 1)

            if (!enemy.lastZoneDamageNumber || currentTime - enemy.lastZoneDamageNumber > 200) {
              enemy.lastZoneDamageNumber = currentTime
              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(state.stats.damage * zone.damagePerSecond * 0.2),
                createdAt: currentTime,
                color: '#32CD32',
              })
            }
          }
          return
        }

        // Check if enemy is in rectangular zone
        const dx = enemy.x - zone.x
        const dy = enemy.y - zone.y
        const rotatedX = dx * Math.cos(-zone.angle) - dy * Math.sin(-zone.angle)
        const rotatedY = dx * Math.sin(-zone.angle) + dy * Math.cos(-zone.angle)

        if (Math.abs(rotatedX) < zone.length / 2 && Math.abs(rotatedY) < zone.width / 2) {
          // Apply zone damage with passive bonus
          const zoneDamageBonus = state.passiveBonuses.zoneDamageBonus || 0
          const damage = state.stats.damage * zone.damagePerSecond * (1 + zoneDamageBonus) * deltaTime
          enemy.currentHp -= damage

          // Apply Slow from Rectangular Zone
          if (zone.slowAmount) {
            enemy.slowed = true
            enemy.slowAmount = zone.slowAmount
            enemy.slowUntil = currentTime + 200
          }

          // Show damage numbers periodically (not every frame to avoid spam)
          if (!enemy.lastZoneDamageNumber || currentTime - enemy.lastZoneDamageNumber > 200) {
            enemy.lastZoneDamageNumber = currentTime
            state.damageNumbers.push({
              id: generateId(),
              x: enemy.x,
              y: enemy.y,
              damage: Math.floor(state.stats.damage * zone.damagePerSecond * (1 + zoneDamageBonus) * 0.2), // Show ~0.2s worth of damage
              createdAt: currentTime,
              isCritical: zone.isCrit,
              color: zone.isCrit ? '#FF0000' : '#FFFFFF' // Optional: explicit color override if needed, though isCritical usually handles it
            })
          }
        }
      })

      // Awakening: Shockwave at zone end
      if (zone.hasShockwave && currentTime - zone.lastShockwave >= zone.shockwaveInterval) {
        zone.lastShockwave = currentTime
        const shockwaveX = zone.x + Math.cos(zone.angle) * (zone.length / 2)
        const shockwaveY = zone.y + Math.sin(zone.angle) * (zone.length / 2)

        state.enemies.forEach((enemy) => {
          const dist = distance({ x: shockwaveX, y: shockwaveY }, enemy)
          if (dist < 60) {
            enemy.currentHp -= state.stats.damage * zone.shockwaveDamage
            // Knockback
            const angle = Math.atan2(enemy.y - shockwaveY, enemy.x - shockwaveX)
            if (!enemy.vx) enemy.vx = 0
            if (!enemy.vy) enemy.vy = 0
            enemy.vx += Math.cos(angle) * zone.shockwaveKnockback
            enemy.vy += Math.sin(angle) * zone.shockwaveKnockback

            state.damageNumbers.push({
              id: generateId(),
              x: enemy.x,
              y: enemy.y,
              damage: Math.floor(state.stats.damage * zone.shockwaveDamage),
              isCritical: zone.isCrit,
              createdAt: currentTime,
            })
          }
        })

        // Shockwave visual effect
        state.attackEffects.push({
          id: generateId(),
          type: 'shockwave',
          x: shockwaveX,
          y: shockwaveY,
          radius: 0,
          maxRadius: 60,
          color: '#FF69B4',
          createdAt: currentTime,
          duration: 300,
        })

        // Damage map objects with shockwave
        damageMapObjects(state, { x: shockwaveX, y: shockwaveY, radius: 60 }, state.stats.damage * zone.shockwaveDamage, currentTime, true)
      }

      // Damage map objects in zone (periodic, like enemy damage)
      if (!zone.lastMapObjectDamage || currentTime - zone.lastMapObjectDamage > 500) {
        zone.lastMapObjectDamage = currentTime
        if (zone.radius) {
          damageMapObjects(state, { x: zone.x, y: zone.y, radius: zone.radius }, state.stats.damage * zone.damagePerSecond * 0.5, currentTime, true)
        } else {
          // Rectangular zone - convert to bounding box
          const halfLength = zone.length / 2
          const halfWidth = zone.width / 2
          damageMapObjects(state, {
            x: zone.x - halfLength,
            y: zone.y - halfWidth,
            width: zone.length,
            height: zone.width
          }, state.stats.damage * zone.damagePerSecond * 0.5, currentTime, false)
        }
      }
    })
    state.groundZones = state.groundZones.filter(z => !z.shouldRemove)
  }

  // Update sub-weapon effects (Black Dye)
  if (state.subWeaponEffects) {
    state.subWeaponEffects.forEach(effect => {
      // Check duration
      if (currentTime - effect.createdAt >= effect.duration) {
        effect.shouldRemove = true
        return
      }

      if (effect.type === 'black_dye_zone') {
        // Damage enemies in zone
        state.enemies.forEach(enemy => {
          if (enemy.isDead) return

          if (distance(effect, enemy) < effect.radius) {
            // Apply Damage
            const damage = state.stats.damage * effect.damagePerSecond * deltaTime
            enemy.currentHp -= damage

            // Apply Debuffs
            if (effect.slowAmount > 0) {
              enemy.slowed = true
              enemy.slowAmount = effect.slowAmount
              enemy.slowUntil = currentTime + 200
            }

            // Visual Feedback (Throttled)
            if (!enemy.lastBlackDyeDamage || currentTime - enemy.lastBlackDyeDamage > 200) {
              enemy.lastBlackDyeDamage = currentTime

              // Calculate ~0.2s of damage for display
              const displayDamage = Math.floor(state.stats.damage * effect.damagePerSecond * 0.2)

              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: displayDamage,
                color: '#555555', // Dark Grey for Black Dye
                createdAt: currentTime,
              })
            }
          }
        })
      }
    })
    state.subWeaponEffects = state.subWeaponEffects.filter(e => !e.shouldRemove)
  }

  // Update enemy projectiles
  state.enemyProjectiles.forEach((proj) => {
    proj.x += proj.vx * deltaTime
    proj.y += proj.vy * deltaTime

    const pdist = distance(state.player, proj)
    if (pdist < 30) {
      if (state.stats.shield > 0) {
        state.stats.shield -= 1
      } else {
        const rawDamage = proj.damage
        const damageReduction = state.passiveBonuses.damageReduction || 0
        const defenseMult = (1 - (state.stats.defense || 0)) * (1 - damageReduction)

        state.stats.hp -= Math.max(1, rawDamage * defenseMult)
        if (state.stats.hp <= 0) {
          onGameOver(buildFinalStats())
          return
        }
      }
      proj.hit = true
    }
  })
  state.enemyProjectiles = state.enemyProjectiles.filter((p) => !p.hit && currentTime - p.createdAt < 3000)

  // Update transplant projectiles (탈모의사 공격 - 부메랑 스타일)
  if (state.transplantProjectiles) {
    state.transplantProjectiles.forEach((proj) => {
      // 회전 효과 (시각적)
      proj.rotation = (proj.rotation || 0) + deltaTime * 12

      if (!proj.returning) {
        // 날아가는 중
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime

        // 이동 거리 체크
        const distTraveled = distance({ x: proj.startX, y: proj.startY }, proj)
        if (distTraveled >= proj.range) {
          if (proj.returnsToPlayer) {
            // 부메랑처럼 돌아오기 시작
            proj.returning = true
          } else {
            proj.shouldRemove = true
            return
          }
        }
      } else {
        // 플레이어에게 돌아오는 중
        const dx = state.player.x - proj.x
        const dy = state.player.y - proj.y
        const distToPlayer = Math.sqrt(dx * dx + dy * dy)

        if (distToPlayer < 30) {
          // 플레이어에게 도착
          proj.shouldRemove = true
          return
        }

        // 플레이어 방향으로 이동 (돌아올 때 더 빠르게)
        const returnSpeed = 500
        proj.vx = (dx / distToPlayer) * returnSpeed
        proj.vy = (dy / distToPlayer) * returnSpeed
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime
      }

      // Check collision with enemies (piercing - can hit multiple)
      // 돌아올 때는 다른 hitEnemies 배열 사용
      const hitList = proj.returning ? proj.returnHitEnemies : proj.hitEnemies
      state.enemies.forEach((enemy) => {
        if (enemy.isDead || hitList.includes(enemy.id)) return
        const d = distance(proj, enemy)
        if (d < 40) {
          hitList.push(enemy.id)
          const isCrit = Math.random() < (state.stats.crit || 0)
          // 돌아올 때는 70% 데미지
          const returnDamageMultiplier = proj.returning ? 0.7 : 1.0
          const finalDamage = proj.damage * (isCrit ? 1.5 : 1.0) * returnDamageMultiplier
          enemy.currentHp -= finalDamage

          // Lifesteal - heal player for % of damage dealt
          if (proj.lifeSteal && proj.lifeSteal > 0) {
            const healAmount = finalDamage * proj.lifeSteal
            const maxHp = state.player.character.baseStats.hp
            const currentHp = state.stats.hp
            if (currentHp < maxHp) {
              state.stats.hp = Math.min(maxHp, currentHp + healAmount)

              // Visual feedback for heal
              state.damageNumbers.push({
                id: generateId(),
                x: state.player.x,
                y: state.player.y - 20,
                damage: `${Math.floor(healAmount)} HP`,
                isHeal: true,
                createdAt: currentTime,
              })
            }
          }

          // Fragment collection - chance to gain fragment
          if (proj.fragmentChance && Math.random() < proj.fragmentChance) {
            if (state.fragments < proj.maxFragments) {
              state.fragments += 1
            }
          }

          state.damageNumbers.push({
            id: generateId(),
            x: enemy.x,
            y: enemy.y,
            damage: Math.floor(finalDamage),
            isCritical: isCrit,
            createdAt: currentTime,
          })
        }
      })

      // Damage map objects at projectile position
      damageMapObjects(state, { x: proj.x, y: proj.y, radius: 40 }, proj.damage * 0.5, currentTime, true)
    })
    state.transplantProjectiles = state.transplantProjectiles.filter(p => !p.shouldRemove)
  }

  // Update boomerang projectiles (Mzamen 공격)
  if (state.boomerangProjectiles) {
    state.boomerangProjectiles.forEach((proj) => {
      // Update rotation for visual effect
      proj.rotation += deltaTime * 15

      if (!proj.returning) {
        // Moving outward
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime

        // Check distance traveled
        const distTraveled = distance({ x: proj.startX, y: proj.startY }, proj)
        if (distTraveled >= proj.range) {
          // Start returning
          proj.returning = true
        }
      } else {
        // Returning to player
        const dx = state.player.x - proj.x
        const dy = state.player.y - proj.y
        const distToPlayer = Math.sqrt(dx * dx + dy * dy)

        if (distToPlayer < 30) {
          // Reached player
          proj.shouldRemove = true
          return
        }

        // Move toward player
        proj.vx = (dx / distToPlayer) * proj.returnSpeed
        proj.vy = (dy / distToPlayer) * proj.returnSpeed
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime
      }

      // Check collision with enemies (can hit multiple times, but with cooldown per enemy)
      state.enemies.forEach((enemy) => {
        if (enemy.isDead) return

        // Check if this enemy was recently hit (cooldown 0.3s)
        const lastHitTime = proj.hitEnemies.find(h => h.id === enemy.id)?.time || 0
        if (currentTime - lastHitTime < 300) return

        const d = distance(proj, enemy)
        if (d < 45) {
          // Record hit
          const existingHit = proj.hitEnemies.find(h => h.id === enemy.id)
          if (existingHit) {
            existingHit.time = currentTime
          } else {
            proj.hitEnemies.push({ id: enemy.id, time: currentTime })
          }


          const isCrit = Math.random() < (state.stats.crit || 0)
          // Mzamen Skill 1: Return Damage Bonus
          let returnDamageMultiplier = proj.returning ? 0.8 : 1.0
          if (proj.returning && state.passiveBonuses?.returnDamageBonus) {
            returnDamageMultiplier += state.passiveBonuses.returnDamageBonus
          }
          const finalDamage = proj.damage * (isCrit ? 1.5 : 1.0) * returnDamageMultiplier

          enemy.currentHp -= finalDamage
          state.damageNumbers.push({
            id: generateId(),
            x: enemy.x,
            y: enemy.y,
            damage: Math.floor(finalDamage),
            isCritical: isCrit,
            createdAt: currentTime,
          })
        }
      })

      // Damage map objects at boomerang position
      damageMapObjects(state, { x: proj.x, y: proj.y, radius: 45 }, proj.damage * 0.5, currentTime, true)
    })

    // Awakening: Check for boomerang crossings during return phase
    if (state.boomerangProjectiles.length > 1) {
      for (let i = 0; i < state.boomerangProjectiles.length; i++) {
        const proj1 = state.boomerangProjectiles[i]
        if (!proj1.hasReturnExplosion || !proj1.returning || proj1.shouldRemove) continue

        for (let j = i + 1; j < state.boomerangProjectiles.length; j++) {
          const proj2 = state.boomerangProjectiles[j]
          if (!proj2.hasReturnExplosion || !proj2.returning || proj2.shouldRemove) continue

          // Check if boomerangs are close (crossing paths)
          const dist = distance(proj1, proj2)
          if (dist < 60) {
            // Create explosion at midpoint
            const explosionX = (proj1.x + proj2.x) / 2
            const explosionY = (proj1.y + proj2.y) / 2

            // Mark both projectiles for removal
            proj1.shouldRemove = true
            proj2.shouldRemove = true

            // Create explosion visual
            state.attackEffects.push({
              id: generateId(),
              type: 'explosion',
              x: explosionX,
              y: explosionY,
              radius: 0,
              maxRadius: proj1.returnExplosionRadius,
              color: proj1.color,
              createdAt: currentTime,
              duration: 400,
            })

            // Deal explosion damage to nearby enemies
            state.enemies.forEach((enemy) => {
              if (enemy.isDead) return
              const distToExplosion = distance({ x: explosionX, y: explosionY }, enemy)
              if (distToExplosion < proj1.returnExplosionRadius) {
                const explosionDamage = state.stats.damage * proj1.returnExplosionDamage
                enemy.currentHp -= explosionDamage

                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(explosionDamage),
                  isCritical: true, // Explosion damage shows as critical
                  createdAt: currentTime,
                })
              }
            })
          }
        }
      }
    }

    state.boomerangProjectiles = state.boomerangProjectiles.filter(p => !p.shouldRemove)
  }

  // Update explosions
  state.explosions.forEach((exp) => {
    if (currentTime - exp.createdAt < 100) {
      const edist = distance(state.player, exp)
      if (edist < exp.radius && !exp.damaged) {
        exp.damaged = true
        if (state.stats.shield > 0) {
          state.stats.shield -= 1
        } else {
          const rawDamage = exp.damage
          const damageReduction = state.passiveBonuses.damageReduction || 0
          const defenseMult = (1 - (state.stats.defense || 0)) * (1 - damageReduction)

          state.stats.hp -= Math.max(1, rawDamage * defenseMult)
          if (state.stats.hp <= 0) {
            onGameOver(buildFinalStats())
            return
          }
        }
      }
    }
  })
  state.explosions = state.explosions.filter((e) => currentTime - e.createdAt < 500)

  // Update character/weapon skill systems
  updateSkillSystems({ state, currentTime, deltaTime, gameStateRef })

  // Handle enemy debuffs
  state.enemies.forEach(enemy => {
    if (enemy.burning && currentTime < enemy.burnUntil) {
      enemy.currentHp -= enemy.burnDamage * deltaTime
    } else {
      enemy.burning = false
    }

    if (enemy.stunned && currentTime >= enemy.stunUntil) {
      enemy.stunned = false
    }

    if (enemy.slowed && currentTime >= enemy.slowUntil) {
      enemy.slowed = false
    }
  })

  // (Removed Duplicate Death Logic: Handled in main loop)
  // state.enemies = state.enemies.filter((e) => e.currentHp > 0)

  // Collect XP orbs
  const pickupRadius = 80 * (1 + (state.passiveBonuses.pickupRange || 0))
  const collectedOrbs = state.xpOrbs.filter((orb) => distance(state.player, orb) < pickupRadius)

  collectedOrbs.forEach((orb) => {
    const xpGain = orb.value * (state.stats.xpMultiplier || 1.0)
    state.xp += xpGain

    // Mzamen Skill 2: XP Heal (Chance based)
    if (state.passiveBonuses?.xpHealPercent && state.passiveBonuses?.xpHealChance) {
      if (Math.random() < state.passiveBonuses.xpHealChance) {
        const healAmount = state.stats.maxHp * state.passiveBonuses.xpHealPercent
        if (state.stats.hp < state.stats.maxHp) {
          state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + healAmount)
          state.damageNumbers.push({
            id: generateId(),
            x: state.player.x,
            y: state.player.y - 30,
            damage: `+${Math.floor(healAmount)}`,
            color: '#00FF00',
            createdAt: currentTime,
            isHeal: true,
          })
        }
      }
    }

    if (state.xp >= state.xpNeeded) {
      state.xp = 0
      state.level += 1
      state.xpNeeded = Math.floor(state.xpNeeded * GAME_CONFIG.LEVEL_XP_MULTIPLIER)

      // Generate level-up options
      const finalOptions = buildLevelUpOptions(state)
      setLevelUpOptions(finalOptions)
      setGamePhase('levelup')


    }
  })
  state.xpOrbs = state.xpOrbs.filter((orb) => !collectedOrbs.includes(orb))

  // Collect Coins
  const collectedCoinsList = state.coins.filter((coin) => distance(state.player, coin) < 60)
  collectedCoinsList.forEach((coin) => {
    state.collectedCoins += coin.value
    state.damageNumbers.push({
      id: generateId(),
      x: state.player.x,
      y: state.player.y - 60,
      damage: `+${coin.value} G`,
      color: '#FFD700',
      createdAt: currentTime,
      isCoin: true
    })
  })
  state.coins = state.coins.filter((coin) => !collectedCoinsList.includes(coin))

  // Update damage numbers
  state.damageNumbers = state.damageNumbers.filter((dn) => currentTime - dn.createdAt < 800)

  // Update UI stats
  setDisplayStats({
    level: state.level,
    xp: state.xp,
    xpNeeded: state.xpNeeded,
    kills: state.kills,
    time: state.gameTime,
    hp: Math.floor(state.stats.hp),
    maxHp: state.stats.maxHp,
    shield: state.stats.shield,
    coins: state.collectedCoins,
    fragments: state.fragments || 0,
    specialAbilityLastUsed: state.specialAbility?.lastUsedGameTime || 0,
    specialCooldownReduction: state.stats.specialCooldownReduction || 0,
    currentGameTime: state.gameTime,
    aimMode: state.aimMode || 'auto',
  })
}
