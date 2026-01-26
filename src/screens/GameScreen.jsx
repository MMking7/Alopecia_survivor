import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GAME_CONFIG, SPRITES, ENEMIES, BOSS, UPGRADES, SHOP_UPGRADES, getBaseStatsWithShop } from '../constants'
import { generateMixedLevelUpOptions, handleSubWeaponSelection, getSubWeaponById } from '../SubWeapons'
import {
  PixelPanel,
  PixelButton,
  PixelTitle,
  StatBar,
  COLORS,
  PIXEL_STYLES
} from '../styles/PixelUI'

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)
const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const lerp = (a, b, t) => a + (b - a) * t

// Difficulty scaling function
const getDifficultyMultiplier = (gameTime) => {
  const minute = gameTime / 60
  return {
    hpMultiplier: 1 + minute * 0.3,
    damageMultiplier: 1 + minute * 0.15,
    speedMultiplier: 1 + minute * 0.1,
    spawnRate: Math.max(500, 2000 - minute * 200),
    enemyCount: Math.min(10, (1 + Math.floor(minute / 2)) * 2),
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getXpNeededForLevel = (level) => {
  const base = 100
  if (level <= 1) return base
  return Math.floor(base * Math.pow(GAME_CONFIG.LEVEL_XP_MULTIPLIER, level - 1))
}

/**
 * GameScreen Component
 * Handles all gameplay logic including:
 * - Game loop & rendering
 * - Player movement
 * - Enemy AI
 * - Combat system
 * - Sub weapons
 * - HUD
 * - Level-up modal
 * - Pause menu
 */
const GameScreen = ({
  selectedCharacter,
  shopLevels,
  characterProgress,
  loadedImages,
  onGameOver,
  onQuit,
}) => {
  const canvasRef = useRef(null)
  const gameStateRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Local state for UI
  const [gamePhase, setGamePhase] = useState('playing') // 'playing', 'levelup', 'paused'
  const [displayStats, setDisplayStats] = useState({
    level: 1, xp: 0, xpNeeded: 100, kills: 0, time: 0, hp: 100, maxHp: 100, shield: 0
  })
  const [levelUpOptions, setLevelUpOptions] = useState([])
  const [pauseTab, setPauseTab] = useState('main')

  // Initialize game
  const initGame = useCallback(() => {
    if (!selectedCharacter) return

    const baseStats = getBaseStatsWithShop(selectedCharacter, shopLevels)
    const bonusStats = characterProgress?.bonusStats || {}
    const startingLevel = Math.max(1, characterProgress?.level || 1)
    const startingMaxHp = baseStats.maxHp + (bonusStats.maxHp || 0)
    const startingCrit = baseStats.crit + (bonusStats.crit || 0)
    const startingLifeSteal = baseStats.lifeSteal + (bonusStats.lifeSteal || 0)
    const startingXpMultiplier = baseStats.xpMultiplier + (bonusStats.xpMultiplier || 0)
    const startingSpawnRateMultiplier = baseStats.spawnRateMultiplier + (bonusStats.spawnRateMultiplier || 0)

    gameStateRef.current = {
      player: {
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2,
        character: selectedCharacter,
        facing: 1,
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
      damageNumbers: [],
      subWeaponEffects: [],
      subWeaponProjectiles: [],
      inventory: [],
      xp: 0,
      xpNeeded: getXpNeededForLevel(startingLevel),
      level: startingLevel,
      kills: 0,
      gameTime: 0,
      lastAttackTime: 0,
      lastEnemySpawn: 0,
      bossSpawned: false,
      keys: { w: false, a: false, s: false, d: false },
      camera: { x: 0, y: 0 },
    }
  }, [selectedCharacter, shopLevels, characterProgress])

  // Initialize on mount
  useEffect(() => {
    initGame()
  }, [initGame])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = true; break
        case 'KeyS': gameStateRef.current.keys.s = true; break
        case 'KeyA': gameStateRef.current.keys.a = true; break
        case 'KeyD': gameStateRef.current.keys.d = true; break
        case 'Escape':
          if (gamePhase === 'playing') setGamePhase('paused')
          else if (gamePhase === 'paused') setGamePhase('playing')
          break
      }
    }

    const handleKeyUp = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = false; break
        case 'KeyS': gameStateRef.current.keys.s = false; break
        case 'KeyA': gameStateRef.current.keys.a = false; break
        case 'KeyD': gameStateRef.current.keys.d = false; break
      }
    }

    const handleBlur = () => {
      if (gameStateRef.current) {
        gameStateRef.current.keys = { w: false, a: false, s: false, d: false }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [gamePhase])

  // Main game loop
  useEffect(() => {
    if (gamePhase !== 'playing' || !canvasRef.current || !gameStateRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let lastTime = performance.now()

    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      const state = gameStateRef.current
      if (!state) return

      const buildFinalStats = () => ({
        level: state.level,
        kills: state.kills,
        time: state.gameTime,
        hp: 0,
        maxHp: state.stats.maxHp,
        statsSnapshot: {
          maxHp: state.stats.maxHp,
          damage: state.stats.damage,
          attackSpeed: state.stats.attackSpeed,
          attackRange: state.stats.attackRange,
          moveSpeed: state.stats.moveSpeed,
          crit: state.stats.crit,
          defense: state.stats.defense,
          lifeSteal: state.stats.lifeSteal,
          xpMultiplier: state.stats.xpMultiplier,
          spawnRateMultiplier: state.stats.spawnRateMultiplier,
        },
      })

      // Update game time
      state.gameTime += deltaTime

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
      }

      const speed = GAME_CONFIG.PLAYER_SPEED * state.stats.moveSpeed * deltaTime
      state.player.x += dx * speed
      state.player.y += dy * speed

      // Update camera
      state.camera.x = state.player.x - GAME_CONFIG.CANVAS_WIDTH / 2
      state.camera.y = state.player.y - GAME_CONFIG.CANVAS_HEIGHT / 2

      // 난이도 계산
      const difficulty = getDifficultyMultiplier(state.gameTime)

      // Spawn enemies with difficulty scaling
      const adjustedSpawnRate = difficulty.spawnRate / (state.stats.spawnRateMultiplier || 1.0)
      if (currentTime - state.lastEnemySpawn > adjustedSpawnRate) {
        state.lastEnemySpawn = currentTime

        // 한번에 여러 적 스폰
        for (let i = 0; i < difficulty.enemyCount; i++) {
          // 담배 몹은 20% 확률로만 소환
          let enemyType
          if (Math.random() < 0.2) {
            enemyType = ENEMIES[Math.floor(Math.random() * ENEMIES.length)]
          } else {
            // 담배를 제외한 다른 몹 중에서 선택
            const nonCigaretteEnemies = ENEMIES.filter(e => e.type !== 'cigarette')
            enemyType = nonCigaretteEnemies[Math.floor(Math.random() * nonCigaretteEnemies.length)]
          }
          const angle = Math.random() * Math.PI * 2
          const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)

          state.enemies.push({
            id: generateId(),
            ...enemyType,
            x: state.player.x + Math.cos(angle) * dist,
            y: state.player.y + Math.sin(angle) * dist,
            currentHp: Math.floor(enemyType.hp * difficulty.hpMultiplier),
            maxHp: Math.floor(enemyType.hp * difficulty.hpMultiplier),
            scaledDamage: enemyType.damage * difficulty.damageMultiplier,
            scaledSpeed: enemyType.speed * difficulty.speedMultiplier,
            rotation: 0,
            lastAttack: 0,
            isDashing: false,
            dashTarget: null,
            isDead: false,
            deathTimer: 0,
            vx: 0,
            vy: 0,
          })
        }
      }

      // Spawn boss
      if (state.gameTime >= GAME_CONFIG.BOSS_SPAWN_TIME && !state.bossSpawned) {
        state.bossSpawned = true
        const angle = Math.random() * Math.PI * 2
        state.enemies.push({
          id: generateId(),
          ...BOSS,
          x: state.player.x + Math.cos(angle) * 500,
          y: state.player.y + Math.sin(angle) * 500,
          currentHp: Math.floor(BOSS.hp * difficulty.hpMultiplier),
          maxHp: Math.floor(BOSS.hp * difficulty.hpMultiplier),
          scaledDamage: BOSS.damage * difficulty.damageMultiplier,
          scaledSpeed: BOSS.speed,
          rotation: 0,
          lastAttack: 0,
        })
      }

      // Move and update enemies with unique behaviors
      state.enemies.forEach((enemy) => {
        const edx = state.player.x - enemy.x
        const edy = state.player.y - enemy.y
        const dist = Math.sqrt(edx * edx + edy * edy)
        const effectiveSpeed = enemy.scaledSpeed || enemy.speed

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
          // Knockback physics
          enemy.x += enemy.vx * deltaTime
          enemy.y += enemy.vy * deltaTime
          enemy.vx *= 0.9 // Friction
          enemy.vy *= 0.9
        } else if (enemy.currentHp <= 0) {
          enemy.isDead = true
          enemy.deathTimer = 0
          // Apply Knockback away from player
          const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
          const force = 300 // Knockback strength
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

          // Increment Kill Count immediately for satisfaction
          state.kills += 1
        }

        // Garbage Collection: Remove far enemies OR fully dead enemies
        if (enemy.deathTimer > 0.5 || (dist > GAME_CONFIG.ENEMY_DESPAWN_DISTANCE && enemy.type !== 'boss')) {
          enemy.shouldRemove = true // Mark for removal
        }

        // Damage player on collision (Alive enemies only)
        if (!enemy.isDead && dist < 40 && enemy.attackType !== 'ranged') {
          if (state.stats.shield > 0) {
            state.stats.shield -= 1
          } else {
            const rawDamage = (enemy.scaledDamage || enemy.damage)
            const takenDamage = Math.max(1, rawDamage * (1 - (state.stats.defense || 0))) // Defense 적용
            state.stats.hp -= takenDamage * deltaTime
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

      // Update enemy projectiles
      state.enemyProjectiles.forEach((proj) => {
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime

        const pdist = distance(state.player, proj)
        if (pdist < 30) {
          if (state.stats.shield > 0) {
            state.stats.shield -= 1
          } else {
            state.stats.hp -= proj.damage
            if (state.stats.hp <= 0) {
              onGameOver(buildFinalStats())
              return
            }
          }
          proj.hit = true
        }
      })
      state.enemyProjectiles = state.enemyProjectiles.filter((p) => !p.hit && currentTime - p.createdAt < 3000)

      // Update explosions
      state.explosions.forEach((exp) => {
        if (currentTime - exp.createdAt < 100) {
          const edist = distance(state.player, exp)
          if (edist < exp.radius && !exp.damaged) {
            exp.damaged = true
            if (state.stats.shield > 0) {
              state.stats.shield -= 1
            } else {
              state.stats.hp -= exp.damage
              if (state.stats.hp <= 0) {
                onGameOver(buildFinalStats())
                return
              }
            }
          }
        }
      })
      state.explosions = state.explosions.filter((e) => currentTime - e.createdAt < 500)

      // Attack logic
      const attackInterval = 1000 / state.stats.attackSpeed
      if (currentTime - state.lastAttackTime >= attackInterval) {
        state.lastAttackTime = currentTime
        const character = state.player.character

        // Remove old effects
        state.attackEffects = state.attackEffects.filter((e) => currentTime - e.createdAt < 300)

        switch (character.attackType) {
          case 'aoe':
            // Equalizer - AoE around player (확산 효과)
            state.attackEffects.push({
              id: generateId(),
              type: 'aoe',
              x: state.player.x,
              y: state.player.y,
              radius: state.stats.attackRange,
              maxRadius: state.stats.attackRange,
              color: character.attackColor,
              createdAt: currentTime,
              duration: 400,
            })
            state.enemies.forEach((enemy) => {
              if (distance(state.player, enemy) <= state.stats.attackRange) {
                const isCrit = Math.random() < (state.stats.crit || 0)
                const finalDamage = state.stats.damage * (isCrit ? 1.5 : 1.0)

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
            break

          case 'beam':
            // Hair Loss Beam - Single target
            let nearest = null
            let nearestDist = Infinity
            state.enemies.forEach((enemy) => {
              const d = distance(state.player, enemy)
              if (d < nearestDist && d <= state.stats.attackRange * 2) {
                nearest = enemy
                nearestDist = d
              }
            })
            if (nearest) {
              state.attackEffects.push({
                id: generateId(),
                type: 'beam',
                target: { x: nearest.x, y: nearest.y },
                x2: nearest.x,
                y2: nearest.y,
                color: character.attackColor,
                createdAt: currentTime,
                duration: 200,
              })
              const damage = state.stats.damage * 2
              nearest.currentHp -= damage
              state.damageNumbers.push({
                id: generateId(),
                x: nearest.x,
                y: nearest.y,
                damage: Math.floor(damage),
                createdAt: currentTime,
              })
            }
            break

          case 'spin':
            // Ponytail Spin - Melee AoE
            state.attackEffects.push({
              id: generateId(),
              type: 'spin',
              radius: state.stats.attackRange * 0.7,
              angle: (currentTime / 100) % (Math.PI * 2),
              color: character.attackColor,
              createdAt: currentTime,
              duration: 300,
            })
            state.enemies.forEach((enemy) => {
              if (distance(state.player, enemy) <= state.stats.attackRange * 0.7) {
                const damage = state.stats.damage * 1.2
                enemy.currentHp -= damage
                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(damage),
                  createdAt: currentTime,
                })
              }
            })
            break

          case 'lightning':
            // Lightning - Random strikes
            const inRange = state.enemies.filter((e) => distance(state.player, e) <= state.stats.attackRange * 1.5)
            const targets = inRange.sort(() => Math.random() - 0.5).slice(0, 4)
            targets.forEach((enemy) => {
              state.attackEffects.push({
                id: generateId(),
                type: 'lightning',
                x: enemy.x,
                y: enemy.y,
                color: character.attackColor,
                createdAt: currentTime,
              })
              const damage = state.stats.damage * 1.3
              enemy.currentHp -= damage
              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(damage),
                createdAt: currentTime,
              })
            })
            break
        }
      }

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
            const facingAngle = state.player.facing === 1 ? 0 : Math.PI

            state.enemies.forEach(enemy => {
              if (enemy.isDead) return
              const dx = enemy.x - state.player.x
              const dy = enemy.y - state.player.y
              const d = Math.sqrt(dx * dx + dy * dy)

              if (d <= range) {
                const enemyAngle = Math.atan2(dy, dx)
                let angleDiff = enemyAngle - facingAngle
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

                  state.damageNumbers.push({
                    id: generateId(),
                    x: enemy.x,
                    y: enemy.y,
                    damage: Math.floor(damage),
                    color: '#FF6600',
                    createdAt: currentTime,
                  })
                }
              }
            })

            state.attackEffects.push({
              id: generateId(),
              type: 'hair_dryer_cone',
              angle: facingAngle,
              coneAngle,
              range,
              createdAt: currentTime,
              duration: 100,
            })
            break
          }

          case 'electric_clipper': {
            if (!weapon.state) weapon.state = { comboCount: 0 }

            const range = effect.range || 50
            const facing = state.player.facing
            const attackAngle = facing === 1 ? 0 : Math.PI

            state.enemies.forEach(enemy => {
              if (enemy.isDead) return
              const dx = enemy.x - state.player.x
              const dy = enemy.y - state.player.y
              const d = Math.sqrt(dx * dx + dy * dy)

              if (d <= range) {
                let damage = state.stats.damage * (effect.damagePercent || 0.5)

                weapon.state.comboCount++
                const threshold = effect.comboThreshold || 5
                if (effect.unlimitedCombo || (threshold > 0 && weapon.state.comboCount >= threshold)) {
                  if (effect.comboStrike) {
                    damage = state.stats.damage * effect.comboStrike
                    weapon.state.comboCount = 0
                  }
                }

                const critBonus = effect.critBonus || 0
                const isCrit = Math.random() < (state.stats.crit + critBonus)
                if (isCrit) damage *= 1.5

                enemy.currentHp -= damage
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
                  weapon.state.bombs.push({
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
            break
          }
        }
      })

      // Update sub weapon projectiles
      state.subWeaponProjectiles = state.subWeaponProjectiles.filter(proj => {
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime

        let hit = false
        state.enemies.forEach(enemy => {
          if (enemy.isDead || hit) return
          if (distance(proj, enemy) < 30) {
            hit = true
          }
        })

        if (hit || currentTime - proj.createdAt > 5000) {
          if (proj.type === 'hair_spray_missile') {
            state.enemies.forEach(enemy => {
              if (enemy.isDead) return
              if (distance(proj, enemy) < proj.radius) {
                enemy.currentHp -= proj.damage
                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(proj.damage),
                  color: '#88FF88',
                  createdAt: currentTime,
                })
              }
            })

            state.subWeaponEffects.push({
              id: generateId(),
              type: 'spray_cloud',
              x: proj.x,
              y: proj.y,
              radius: proj.radius,
              damagePerSecond: proj.cloudDamage,
              duration: 800, // 0.8 seconds for explosion animation
              createdAt: currentTime,
            })
          }
          return false
        }
        return true
      })

      // Update sub weapon effects
      state.subWeaponEffects = state.subWeaponEffects.filter(effect => {
        const elapsed = currentTime - effect.createdAt
        if (elapsed > effect.duration) return false

        if (effect.damagePerSecond) {
          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            if (distance(effect, enemy) < effect.radius) {
              const damage = state.stats.damage * effect.damagePerSecond * deltaTime
              enemy.currentHp -= damage

              if (effect.slowAmount) {
                enemy.slowed = true
                enemy.slowAmount = effect.slowAmount
                enemy.slowUntil = currentTime + 500
              }
            }
          })
        }

        return true
      })

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

      // Handle dead enemies
      const deadEnemies = state.enemies.filter((e) => e.currentHp <= 0)
      deadEnemies.forEach((enemy) => {
        state.kills += 1

        if (state.stats.lifeSteal > 0 && Math.random() < 0.2) {
          if (Math.random() < state.stats.lifeSteal) {
            state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + 3)
            state.damageNumbers.push({
              id: generateId(),
              x: state.player.x,
              y: state.player.y - 40,
              damage: "+3 HP",
              color: '#00FF00',
              createdAt: currentTime,
            })
          }
        }

        state.xpOrbs.push({
          id: generateId(),
          x: enemy.x,
          y: enemy.y,
          value: enemy.xp,
        })
      })
      state.enemies = state.enemies.filter((e) => e.currentHp > 0)

      // Collect XP orbs
      const collectedOrbs = state.xpOrbs.filter((orb) => distance(state.player, orb) < 80)
      collectedOrbs.forEach((orb) => {
        const xpGain = orb.value * (state.stats.xpMultiplier || 1.0)
        state.xp += xpGain
        if (state.xp >= state.xpNeeded) {
          state.xp = 0
          state.level += 1
          state.xpNeeded = Math.floor(state.xpNeeded * GAME_CONFIG.LEVEL_XP_MULTIPLIER)
          const options = generateMixedLevelUpOptions(UPGRADES, state.inventory, 3)
          setLevelUpOptions(options)
          setGamePhase('levelup')
        }
      })
      state.xpOrbs = state.xpOrbs.filter((orb) => !collectedOrbs.includes(orb))

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
      })

      // ============================================================
      // RENDERING
      // ============================================================
      // Draw background
      const bgImg = loadedImages[SPRITES.background]
      if (bgImg) {
        try {
          const pattern = ctx.createPattern(bgImg, 'repeat')
          ctx.fillStyle = pattern
          ctx.save()
          ctx.translate(-state.camera.x, -state.camera.y)
          ctx.fillRect(state.camera.x, state.camera.y, canvas.width, canvas.height)
          ctx.restore()
        } catch (e) {
          ctx.fillStyle = '#2d5a27'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      } else {
        ctx.fillStyle = '#2d5a27'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Draw XP orbs
      state.xpOrbs.forEach((orb) => {
        const sx = orb.x - state.camera.x
        const sy = orb.y - state.camera.y
        if (sx > -20 && sx < canvas.width + 20 && sy > -20 && sy < canvas.height + 20) {
          const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 15)
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)')
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(sx, sy, 15, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#00FFFF'
          ctx.beginPath()
          ctx.arc(sx, sy, 6, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw attack effects
      state.attackEffects.forEach((effect) => {
        const elapsed = currentTime - effect.createdAt
        const duration = effect.duration || 300
        if (elapsed > duration) return

        const progress = elapsed / duration

        switch (effect.type) {
          case 'aoe':
            const aoeX = (state.player.x - state.camera.x)
            const aoeY = (state.player.y - state.camera.y)
            const currentRadius = effect.maxRadius * progress

            ctx.shadowBlur = 0
            ctx.fillStyle = effect.color
            ctx.globalAlpha = 0.5 * (1 - progress)
            ctx.beginPath()
            ctx.arc(aoeX, aoeY, currentRadius, 0, Math.PI * 2)
            ctx.fill()

            ctx.globalAlpha = 0.8 * (1 - progress)
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(aoeX, aoeY, currentRadius, 0, Math.PI * 2)
            ctx.stroke()

            ctx.globalAlpha = 1
            break

          case 'beam':
            const startX = state.player.x - state.camera.x
            const startY = state.player.y - state.camera.y
            const endX = effect.x2 - state.camera.x
            const endY = effect.y2 - state.camera.y

            ctx.globalAlpha = 1 - progress

            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()

            ctx.strokeStyle = effect.color
            ctx.lineWidth = 8 + Math.sin(progress * Math.PI * 10) * 4
            ctx.shadowColor = effect.color
            ctx.shadowBlur = 20
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()

            ctx.shadowBlur = 0
            ctx.globalAlpha = 1
            break

          case 'spin':
            const spinX = state.player.x - state.camera.x
            const spinY = state.player.y - state.camera.y
            const spinAngle = effect.angle + (progress * Math.PI * 4)

            ctx.save()
            ctx.translate(spinX, spinY)
            ctx.rotate(spinAngle)

            const bladeGrad = ctx.createLinearGradient(0, -effect.radius, 0, effect.radius)
            bladeGrad.addColorStop(0, '#8B4513')
            bladeGrad.addColorStop(0.5, '#D2691E')
            bladeGrad.addColorStop(1, 'rgba(210, 105, 30, 0)')

            ctx.fillStyle = bladeGrad
            ctx.beginPath()
            ctx.arc(0, 0, effect.radius, 0, Math.PI * 1.5, false)
            ctx.arc(0, 0, effect.radius * 0.7, Math.PI * 1.5, 0, true)
            ctx.closePath()
            ctx.fill()

            ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)'
            ctx.lineWidth = 2
            for (let i = 0; i < 5; i++) {
              ctx.beginPath()
              ctx.arc(0, 0, effect.radius * (0.75 + i * 0.05), 0, Math.PI * 1.2)
              ctx.stroke()
            }

            ctx.strokeStyle = '#FFF8DC'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(0, 0, effect.radius, 0, Math.PI * 1.0)
            ctx.stroke()

            ctx.restore()

            ctx.fillStyle = effect.color
            ctx.globalAlpha = 0.05
            ctx.beginPath()
            ctx.arc(spinX, spinY, effect.radius, 0, Math.PI * 2)
            ctx.fill()

            ctx.globalAlpha = 1
            break

          case 'lightning':
            const lx = effect.x - state.camera.x
            const ly = effect.y - state.camera.y
            ctx.strokeStyle = effect.color
            ctx.lineWidth = 3
            ctx.shadowColor = effect.color
            ctx.shadowBlur = 15
            ctx.beginPath()
            ctx.moveTo(lx, ly - 200)
            let currY = ly - 200
            while (currY < ly) {
              currY += 20
              ctx.lineTo(lx + (Math.random() - 0.5) * 30, currY)
            }
            ctx.stroke()
            ctx.shadowBlur = 0
            break
        }
      })

      // ============================================================
      // RENDER SUB WEAPON EFFECTS
      // ============================================================
      state.subWeaponEffects.forEach(effect => {
        const sx = effect.x - state.camera.x
        const sy = effect.y - state.camera.y

        if (sx < -200 || sx > canvas.width + 200 || sy < -200 || sy > canvas.height + 200) return

        const elapsed = currentTime - effect.createdAt
        const progress = elapsed / effect.duration

        switch (effect.type) {
          case 'black_dye_zone': {
            // Sprite-based animation using blackspray.png (9 frames, 158x158 each)
            const blackSprayImg = loadedImages[SPRITES.subweapons.black_dye_anim]
            if (blackSprayImg) {
              const totalFrames = 9
              const frameWidth = 158
              const frameHeight = 158

              // Calculate current frame based on progress (0 to 1)
              // Animation is 1.3x faster, but frame 5 (largest pool) holds for the saved time
              // Timeline: 0-19% = frames 0-4 (appearing), 19-81% = frame 5 (hold), 81-100% = frames 6-8 (disappearing)
              let frameIndex
              if (progress < 0.19) {
                // Appearing: frames 0 to 4 (1.3x speed)
                frameIndex = Math.floor(progress / 0.19 * 5)
              } else if (progress < 0.81) {
                // Hold at frame 5 (largest pool)
                frameIndex = 5
              } else {
                // Disappearing: frames 6 to 8 (1.3x speed)
                frameIndex = 6 + Math.floor((progress - 0.81) / 0.19 * 3)
              }
              frameIndex = Math.min(frameIndex, totalFrames - 1)

              // Calculate source position in sprite sheet (horizontal strip)
              const srcX = frameIndex * frameWidth
              const srcY = 0

              // Draw size based on effect.radius (scale to match game world)
              const drawSize = effect.radius * 2.5

              ctx.save()
              ctx.globalAlpha = progress > 0.85 ? (1 - progress) / 0.15 : 1
              ctx.drawImage(
                blackSprayImg,
                srcX, srcY, frameWidth, frameHeight,
                sx - drawSize / 2, sy - drawSize / 2, drawSize, drawSize
              )
              ctx.restore()
            } else {
              // Fallback to gradient if image not loaded
              const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1
              ctx.globalAlpha = 0.6 * fadeOut

              const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, effect.radius)
              gradient.addColorStop(0, 'rgba(20, 20, 20, 0.9)')
              gradient.addColorStop(0.5, 'rgba(40, 40, 40, 0.7)')
              gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(sx, sy, effect.radius, 0, Math.PI * 2)
              ctx.fill()

              ctx.globalAlpha = 1
            }
            break
          }

          case 'spray_cloud': {
            // Sprite-based explosion animation using hairsprayexplosion110x118.png (5 frames, 110x118 each)
            const explosionImg = loadedImages[SPRITES.subweapons.hair_spray_explosion]
            if (explosionImg) {
              const totalFrames = 5
              const frameWidth = 110
              const frameHeight = 118

              // Calculate frame based on progress (0 to 1)
              const frameIndex = Math.min(Math.floor(progress * totalFrames), totalFrames - 1)
              const srcX = frameIndex * frameWidth
              const srcY = 0

              // Draw size based on effect radius
              const drawSize = effect.radius * 2.5
              const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1

              ctx.save()
              ctx.globalAlpha = fadeOut
              ctx.drawImage(
                explosionImg,
                srcX, srcY, frameWidth, frameHeight,
                sx - drawSize / 2, sy - drawSize / 2, drawSize, drawSize
              )
              ctx.restore()
            } else {
              // Fallback to gradient
              const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1
              ctx.globalAlpha = 0.4 * fadeOut

              const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, effect.radius)
              gradient.addColorStop(0, 'rgba(150, 255, 150, 0.6)')
              gradient.addColorStop(0.6, 'rgba(100, 200, 100, 0.4)')
              gradient.addColorStop(1, 'rgba(50, 150, 50, 0)')

              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(sx, sy, effect.radius * (1 + progress * 0.3), 0, Math.PI * 2)
              ctx.fill()

              ctx.globalAlpha = 1
            }
            break
          }
        }
      })

      // Draw hair brush barrier
      state.attackEffects.filter(e => e.type === 'hair_brush_spin').forEach(effect => {
        const cx = state.player.x - state.camera.x
        const cy = state.player.y - state.camera.y

        // Sprite-based animation using comb250.png (4 frames, 249x249 each)
        const combImg = loadedImages[SPRITES.subweapons.hair_brush_anim]
        if (combImg) {
          const totalFrames = 4
          const frameWidth = 249
          const frameHeight = 249
          const combSize = 60 // Draw size for each comb

          for (let i = 0; i < effect.teethCount; i++) {
            const angle = effect.rotation + (Math.PI * 2 * i) / effect.teethCount
            const tx = cx + Math.cos(angle) * effect.range
            const ty = cy + Math.sin(angle) * effect.range

            // Select frame based on rotation angle (cycles through all 4 frames)
            const frameIndex = Math.floor(((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * totalFrames) % totalFrames
            const srcX = frameIndex * frameWidth
            const srcY = 0

            ctx.save()
            ctx.translate(tx, ty)
            ctx.drawImage(
              combImg,
              srcX, srcY, frameWidth, frameHeight,
              -combSize / 2, -combSize / 2, combSize, combSize
            )
            ctx.restore()
          }

          // Draw faint orbit circle
          ctx.strokeStyle = 'rgba(255, 182, 193, 0.3)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(cx, cy, effect.range, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          // Fallback to original rendering
          for (let i = 0; i < effect.teethCount; i++) {
            const angle = effect.rotation + (Math.PI * 2 * i) / effect.teethCount
            const tx = cx + Math.cos(angle) * effect.range
            const ty = cy + Math.sin(angle) * effect.range

            ctx.fillStyle = '#8B4513'
            ctx.beginPath()
            ctx.ellipse(tx, ty, 15, 8, angle, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.beginPath()
            ctx.ellipse(tx - 3, ty - 3, 6, 3, angle, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'
          ctx.lineWidth = 10
          ctx.beginPath()
          ctx.arc(cx, cy, effect.range, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      // Draw hair dryer cone
      state.attackEffects.filter(e => e.type === 'hair_dryer_cone').forEach(effect => {
        const cx = state.player.x - state.camera.x
        const cy = state.player.y - state.camera.y

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(effect.angle)

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.range)
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)')
        gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, effect.range, -effect.coneAngle / 2, effect.coneAngle / 2)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      })

      // Draw electric clipper slash
      state.attackEffects.filter(e => e.type === 'electric_clipper_slash').forEach(effect => {
        const elapsed = currentTime - effect.createdAt
        const progress = elapsed / effect.duration

        if (progress < 1) {
          const slashImg = loadedImages[SPRITES.subweapons.electric_clipper_slash]
          if (slashImg) {
            const sx = effect.x - state.camera.x
            const sy = effect.y - state.camera.y
            const slashSize = 80
            const fadeOut = progress > 0.5 ? (1 - progress) / 0.5 : 1

            ctx.save()
            ctx.translate(sx, sy)
            // Flip if facing left
            if (effect.facing === -1) {
              ctx.scale(-1, 1)
            }
            ctx.globalAlpha = fadeOut
            ctx.drawImage(
              slashImg,
              -slashSize / 2, -slashSize / 2, slashSize, slashSize
            )
            ctx.restore()
          }
        }
      })

      // Draw sub weapon projectiles
      state.subWeaponProjectiles.forEach(proj => {
        const px = proj.x - state.camera.x
        const py = proj.y - state.camera.y

        if (proj.type === 'hair_spray_missile') {
          const missileImg = loadedImages[SPRITES.subweapons.hair_spray_missile]
          if (missileImg) {
            const missileSize = 50
            // Calculate rotation angle based on velocity (sprite faces upper-right by default)
            const angle = Math.atan2(proj.vy, proj.vx) + Math.PI / 4 // Adjust for sprite orientation

            ctx.save()
            ctx.translate(px, py)
            ctx.rotate(angle)
            ctx.drawImage(
              missileImg,
              -missileSize / 2, -missileSize / 2, missileSize, missileSize
            )
            ctx.restore()
          } else {
            // Fallback
            ctx.fillStyle = '#00FF00'
            ctx.beginPath()
            ctx.arc(px, py, 8, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px - proj.vx * 0.05, py - proj.vy * 0.05)
            ctx.stroke()
          }
        }
      })

      // Draw dandruff bombs
      const dandruffWeapon = state.inventory.find(w => w.id === 'dandruff_bomb')
      if (dandruffWeapon && dandruffWeapon.state && dandruffWeapon.state.bombs) {
        dandruffWeapon.state.bombs.forEach(bomb => {
          const bx = bomb.x - state.camera.x
          const by = bomb.y - state.camera.y

          const elapsed = currentTime - bomb.createdAt
          const pulse = 1 + Math.sin(elapsed / 200) * 0.1

          // Render bomb sprite instead of white circle
          const bombImg = loadedImages[SPRITES.subweapons.dandruff_bomb]
          if (bombImg) {
            const bombSize = 40 * pulse
            ctx.save()
            ctx.translate(bx, by)
            ctx.drawImage(
              bombImg,
              -bombSize / 2, -bombSize / 2, bombSize, bombSize
            )
            ctx.restore()
          } else {
            // Fallback to white circle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.beginPath()
            ctx.arc(bx, by, 12 * pulse, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#888'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(bx, by, 12 * pulse, 0, Math.PI * 2)
            ctx.stroke()
          }

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.arc(bx, by, bomb.radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        })
      }

      // Draw enemies
      state.enemies.forEach((enemy) => {
        const sx = enemy.x - state.camera.x
        const sy = enemy.y - state.camera.y

        if (sx > -100 && sx < canvas.width + 100 && sy > -100 && sy < canvas.height + 100) {
          const img = loadedImages[enemy.type === 'boss' ? SPRITES.boss : SPRITES.enemies[enemy.type]]
          if (img) {
            ctx.save()
            ctx.translate(sx, sy)
            if (enemy.isDead) {
              ctx.globalAlpha = 1 - (enemy.deathTimer / 0.5)
              ctx.scale(1 + enemy.deathTimer, 1 - enemy.deathTimer)
            }
            if (enemy.rotation) ctx.rotate(enemy.rotation)

            ctx.drawImage(img, -enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size)
            ctx.restore()
          }
        }
      })

      // Draw player
      const playerSx = state.player.x - state.camera.x
      const playerSy = state.player.y - state.camera.y
      const playerImg = loadedImages[SPRITES.characters[state.player.character.id]]
      if (playerImg) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        ctx.ellipse(playerSx, playerSy + 30, 25, 10, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.translate(playerSx, playerSy)

        const isMoving = state.keys.w || state.keys.s || state.keys.a || state.keys.d
        if (isMoving) {
          const waddle = Math.sin(state.gameTime * 15) * 0.1
          ctx.rotate(waddle)

          const bob = Math.abs(Math.sin(state.gameTime * 20)) * 5
          ctx.translate(0, -bob)
        }

        if (state.keys.a) {
          ctx.scale(-1, 1)
        }

        ctx.drawImage(playerImg, -32, -40, 64, 64)
        ctx.restore()
      }

      // Draw enemy projectiles
      state.enemyProjectiles.forEach((proj) => {
        const px = proj.x - state.camera.x
        const py = proj.y - state.camera.y
        if (px > -50 && px < canvas.width + 50 && py > -50 && py < canvas.height + 50) {
          if (proj.type === 'cigarette_projectile') {
            const img = loadedImages[SPRITES.enemies.cigarette_projectile]
            if (img) {
              // User preferred the "Previous" direction (which was -Math.PI / 2).
              // Also fixing the "stretched" look by respecting aspect ratio.
              const angle = Math.atan2(proj.vy, proj.vx) - Math.PI / 2
              
              const aspect = img.width / img.height
              const baseSize = 80 // Target size
              let w = baseSize
              let h = baseSize
              
              // Maintain aspect ratio
              if (aspect > 1) {
                h = baseSize / aspect
              } else {
                w = baseSize * aspect
              }

              ctx.save()
              ctx.translate(px, py)
              ctx.rotate(angle)
              ctx.drawImage(img, -w / 2, -h / 2, w, h)
              ctx.restore()
            } else {
               // Fallback
              const gradient = ctx.createRadialGradient(px, py, 0, px, py, proj.size + 5)
              gradient.addColorStop(0, 'rgba(255, 100, 50, 0.9)')
              gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.5)')
              gradient.addColorStop(1, 'rgba(100, 50, 0, 0)')
              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(px, py, proj.size + 5, 0, Math.PI * 2)
              ctx.fill()

              ctx.fillStyle = '#FF6600'
              ctx.beginPath()
              ctx.arc(px, py, proj.size, 0, Math.PI * 2)
              ctx.fill()
            }
          } else {
            // Default projectile handling
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, proj.size + 5)
            gradient.addColorStop(0, 'rgba(255, 100, 50, 0.9)')
            gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.5)')
            gradient.addColorStop(1, 'rgba(100, 50, 0, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(px, py, proj.size + 5, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#FF6600'
            ctx.beginPath()
            ctx.arc(px, py, proj.size, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      // Draw explosions
      state.explosions.forEach((exp) => {
        const ex = exp.x - state.camera.x
        const ey = exp.y - state.camera.y
        const elapsed = currentTime - exp.createdAt
        const duration = 1000 // 1 second total animation
        const progress = elapsed / duration

        // Sprite-based explosion using bomb225.png (5 frames, 225x225 each)
        const bombExplosionImg = loadedImages[SPRITES.subweapons.dandruff_bomb_anim]
        if (bombExplosionImg && progress < 1) {
          const totalFrames = 5
          const frameWidth = 225
          const frameHeight = 225

          const frameIndex = Math.min(Math.floor(progress * totalFrames), totalFrames - 1)
          const srcX = frameIndex * frameWidth
          const srcY = 0

          // Draw size based on explosion radius
          const drawSize = exp.radius * 3
          const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1

          ctx.save()
          ctx.globalAlpha = fadeOut
          ctx.drawImage(
            bombExplosionImg,
            srcX, srcY, frameWidth, frameHeight,
            ex - drawSize / 2, ey - drawSize / 2, drawSize, drawSize
          )
          ctx.restore()
        } else if (progress < 1) {
          // Fallback to original gradient rendering
          const radius = exp.radius * Math.min(1, progress * 2)
          const alpha = 1 - progress

          ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`
          ctx.lineWidth = 8 * (1 - progress)
          ctx.beginPath()
          ctx.arc(ex, ey, radius, 0, Math.PI * 2)
          ctx.stroke()

          const gradient = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius)
          gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.5})`)
          gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.3})`)
          gradient.addColorStop(1, 'rgba(255, 50, 0, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(ex, ey, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw damage numbers
      state.damageNumbers.forEach((dn) => {
        const elapsed = currentTime - dn.createdAt
        const progress = elapsed / 800
        const sx = dn.x - state.camera.x
        const sy = dn.y - state.camera.y - progress * 40

        const scale = 1 + Math.sin(progress * Math.PI) * 0.5
        ctx.save()
        ctx.translate(sx, sy)
        ctx.scale(scale, scale)
        ctx.font = '20px "Press Start 2P", cursive'
        ctx.fillStyle = `rgba(255, 235, 59, ${1 - progress})`
        if (dn.isCrit) ctx.fillStyle = `rgba(255, 82, 82, ${1 - progress})`
        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - progress})`
        ctx.lineWidth = 4
        ctx.lineJoin = 'round'
        ctx.textAlign = 'center'
        ctx.strokeText(dn.damage.toString(), 0, 0)
        ctx.fillText(dn.damage.toString(), 0, 0)
        ctx.restore()
      })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gamePhase, loadedImages, onGameOver])

  // Handle upgrade selection
  const handleUpgrade = useCallback((upgrade) => {
    if (gameStateRef.current) {
      if (upgrade.isSubWeapon) {
        const weaponData = upgrade.weaponData || getSubWeaponById(upgrade.id)
        if (weaponData) {
          gameStateRef.current.inventory = handleSubWeaponSelection(
            weaponData,
            gameStateRef.current.inventory
          )
        }
      } else {
        gameStateRef.current.stats = upgrade.effect(gameStateRef.current.stats)
        gameStateRef.current.inventory.push(upgrade)
      }
    }
    setLevelUpOptions([])
    setGamePhase('playing')
  }, [])

  // Handle quit
  const handleQuit = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    gameStateRef.current = null
    onQuit()
  }, [onQuit])

  return (
    <>
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* XP Bar - Top Full Width */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '12px',
        background: 'rgba(13, 13, 26, 0.95)',
        borderBottom: `3px solid ${COLORS.panelBorder}`,
        boxShadow: '0 3px 0 0 rgba(0,0,0,0.5)',
        zIndex: 100,
      }}>
        <div style={{
          width: `${Math.min(100, (displayStats.xp / displayStats.xpNeeded) * 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
          transition: 'width 0.3s ease',
          boxShadow: `inset 0 0 10px ${COLORS.secondary}80`,
        }} />
      </div>

      {/* HUD - Top Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: 0,
        right: 0,
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        {/* Left HUD Group */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          pointerEvents: 'auto',
        }}>
          {/* Character Portrait */}
          <div style={{
            background: 'rgba(13, 13, 26, 0.9)',
            border: `3px solid ${COLORS.panelBorder}`,
            boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
            padding: '6px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: COLORS.bgLight,
              border: `2px solid ${selectedCharacter?.color || COLORS.panelBorder}`,
              overflow: 'hidden',
            }}>
              <img
                src={SPRITES.characters[selectedCharacter?.id]}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* HP Bar */}
          <div style={{
            background: 'rgba(13, 13, 26, 0.9)',
            border: `3px solid ${COLORS.panelBorder}`,
            boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
            padding: '8px 12px',
          }}>
            <div style={{
              fontFamily: PIXEL_STYLES.fontFamily,
              color: COLORS.textWhite, 
              fontSize: '13px', 
              marginBottom: '4px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap',
            }}>
              ❤️ {displayStats.hp}/{displayStats.maxHp}
              {displayStats.shield > 0 && <span style={{ color: COLORS.secondary }}> 🛡️{displayStats.shield}</span>}
            </div>
            <div style={{
              width: 'clamp(100px, 15vw, 180px)',
              height: '12px',
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
            }}>
              <div style={{
                width: `${Math.min(100, (displayStats.hp / displayStats.maxHp) * 100)}%`,
                height: '100%',
                background: displayStats.hp > displayStats.maxHp * 0.3 ? COLORS.hp : '#8b0000',
                transition: 'width 0.2s',
              }} />
            </div>
          </div>
        </div>

        {/* Right HUD Group */}
        <div style={{
          background: 'rgba(13, 13, 26, 0.9)',
          border: `3px solid ${COLORS.panelBorder}`,
          boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
          padding: '8px 12px',
          textAlign: 'right',
          pointerEvents: 'auto',
        }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.primary,
            fontSize: 'clamp(14px, 2vw, 18px)',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 #000',
          }}>
            LV.{displayStats.level}
          </div>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.textGray,
            fontSize: 'clamp(10px, 1.5vw, 12px)',
            marginTop: '4px',
            textShadow: '1px 1px 0 #000',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}>
            <span style={{ color: COLORS.info }}>⏱️{formatTime(displayStats.time)}</span>
            <span style={{ color: COLORS.danger }}>💀{displayStats.kills}</span>
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      {gamePhase === 'levelup' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }} />

          {/* Modal Container */}
          <div style={{
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(13, 13, 26, 0.98)',
            border: `4px solid ${COLORS.primary}`,
            boxShadow: `
              6px 6px 0 0 rgba(0,0,0,0.6),
              inset 0 0 0 2px rgba(255,215,0,0.2)
            `,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              padding: '12px 20px',
              textAlign: 'center',
              borderBottom: '4px solid #000',
            }}>
              <h1 style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                fontSize: 'clamp(20px, 4vw, 32px)',
                color: '#000',
                margin: 0,
                letterSpacing: '4px',
                textShadow: '2px 2px 0 rgba(255,255,255,0.3)',
              }}>
                ⬆️ LEVEL UP!
              </h1>
            </div>

            {/* Character Info Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '12px 20px',
              background: 'rgba(0,0,0,0.5)',
              borderBottom: `2px solid ${COLORS.panelBorder}`,
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: COLORS.bgLight,
                border: `3px solid ${selectedCharacter?.color || COLORS.secondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src={SPRITES.characters[selectedCharacter.id]}
                  alt=""
                  style={{ width: '40px', height: '40px', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.textWhite, fontSize: '12px' }}>
                  ❤️ {displayStats.hp}/{displayStats.maxHp}
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.atk, fontSize: '12px' }}>
                  ⚔️ +{Math.floor((gameStateRef.current?.stats?.damage / 30 - 1) * 100)}%
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.spd, fontSize: '12px' }}>
                  🏃 +{Math.floor((gameStateRef.current?.stats?.moveSpeed - 1) * 100)}%
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.crit, fontSize: '12px' }}>
                  💥 {Math.round((gameStateRef.current?.stats?.crit || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Upgrade Options - Scrollable */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <p style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textGray,
                fontSize: '11px',
                textAlign: 'center',
                margin: '0 0 5px 0',
              }}>
                SELECT AN UPGRADE
              </p>

              {levelUpOptions.map((upgrade, index) => (
                <button
                  key={upgrade.id + index}
                  onClick={() => handleUpgrade(upgrade)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: upgrade.isSubWeapon
                      ? `linear-gradient(90deg, rgba(255,215,0,0.15) 0%, ${COLORS.bgLight} 100%)`
                      : COLORS.bgLight,
                    border: `3px solid ${upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                    boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(5px)'
                    e.currentTarget.style.borderColor = upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary
                    e.currentTarget.style.boxShadow = `0 0 15px ${upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary}40, 3px 3px 0 0 rgba(0,0,0,0.5)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.borderColor = upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder
                    e.currentTarget.style.boxShadow = '3px 3px 0 0 rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: COLORS.bgDark,
                    border: `2px solid ${upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    {upgrade.isSubWeapon ? (
                      <img src={SPRITES.subweapons[upgrade.icon]} alt="" style={{ width: '40px', height: '40px', imageRendering: 'pixelated', objectFit: 'contain' }} />
                    ) : (
                      <img src={SPRITES.items[upgrade.icon]} alt="" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />
                    )}
                    {upgrade.isSubWeapon && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: upgrade.grade === 3 ? COLORS.primary : upgrade.grade === 2 ? '#C0C0C0' : '#CD7F32',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        fontFamily: PIXEL_STYLES.fontFamily,
                        padding: '1px 4px',
                        border: '1px solid #000',
                      }}>
                        ★{upgrade.grade}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: COLORS.textWhite,
                        fontSize: 'clamp(12px, 2vw, 14px)',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 0 #000',
                      }}>
                        {upgrade.name}
                      </span>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary,
                        fontSize: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '2px 6px',
                      }}>
                        {upgrade.isSubWeapon
                          ? (upgrade.currentLevel > 0 ? `LV${upgrade.currentLevel}→${upgrade.nextLevel}` : '🆕WEAPON')
                          : `🆕${upgrade.type}`
                        }
                      </span>
                    </div>
                    <div style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      fontSize: '10px',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {upgrade.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU */}
      {gamePhase === 'paused' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }} />

          {/* Main Pause Menu */}
          {pauseTab === 'main' && (
            <div style={{
              width: '100%',
              maxWidth: '280px',
              background: 'rgba(13, 13, 26, 0.98)',
              border: `4px solid ${COLORS.panelBorder}`,
              boxShadow: '6px 6px 0 0 rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                background: `linear-gradient(180deg, ${COLORS.bgLight} 0%, ${COLORS.bgDark} 100%)`,
                padding: '15px',
                textAlign: 'center',
                borderBottom: `3px solid ${COLORS.panelBorder}`,
              }}>
                <h2 style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  color: COLORS.textWhite,
                  fontSize: '24px',
                  margin: 0,
                  letterSpacing: '4px',
                  textShadow: '2px 2px 0 #000',
                }}>
                  ⏸️ PAUSED
                </h2>
              </div>

              {/* Menu Buttons */}
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: '📊 CHARACTER', action: () => setPauseTab('character'), variant: 'dark' },
                  { label: '⚙️ SETTINGS', disabled: true, variant: 'ghost' },
                  { label: '▶ RESUME', action: () => setGamePhase('playing'), variant: 'primary' },
                  { label: '✖ QUIT', action: handleQuit, variant: 'danger' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.disabled ? undefined : btn.action}
                    disabled={btn.disabled}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      cursor: btn.disabled ? 'not-allowed' : 'pointer',
                      border: '3px solid',
                      borderColor: btn.disabled ? '#333'
                        : btn.variant === 'primary' ? '#000'
                          : btn.variant === 'danger' ? '#8B0000'
                            : COLORS.panelBorder,
                      background: btn.disabled ? '#333'
                        : btn.variant === 'primary' ? `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                          : btn.variant === 'danger' ? `linear-gradient(180deg, ${COLORS.danger} 0%, #CC5555 100%)`
                            : COLORS.bgLight,
                      color: btn.disabled ? '#666'
                        : btn.variant === 'primary' ? '#000'
                          : btn.variant === 'danger' ? '#fff'
                            : COLORS.textWhite,
                      boxShadow: btn.disabled ? 'none' : '3px 3px 0 0 rgba(0,0,0,0.5)',
                      textShadow: (btn.variant === 'primary') ? 'none' : '1px 1px 0 #000',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!btn.disabled) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)'
                        e.currentTarget.style.boxShadow = '1px 1px 0 0 rgba(0,0,0,0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(0, 0)'
                      e.currentTarget.style.boxShadow = btn.disabled ? 'none' : '3px 3px 0 0 rgba(0,0,0,0.5)'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Character Details Screen */}
          {pauseTab === 'character' && (
            <div style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(13, 13, 26, 0.98)',
              border: `4px solid ${COLORS.panelBorder}`,
              boxShadow: '6px 6px 0 0 rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header with Back Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 15px',
                background: `linear-gradient(180deg, ${COLORS.bgLight} 0%, ${COLORS.bgDark} 100%)`,
                borderBottom: `3px solid ${COLORS.panelBorder}`,
              }}>
                <button
                  onClick={() => setPauseTab('main')}
                  style={{
                    padding: '8px 12px',
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '12px',
                    background: 'transparent',
                    border: `2px solid ${COLORS.panelBorder}`,
                    color: COLORS.textWhite,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
                  }}
                >
                  ◀ BACK
                </button>
                <h2 style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  color: COLORS.textWhite,
                  fontSize: '18px',
                  margin: 0,
                  letterSpacing: '2px',
                  textShadow: '2px 2px 0 #000',
                }}>
                  📊 CHARACTER
                </h2>
                <div style={{ width: '70px' }} /> {/* Spacer for centering */}
              </div>

              {/* Content Area */}
              <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                flexDirection: 'row',
                '@media (max-width: 600px)': { flexDirection: 'column' },
              }}>
                {/* Left - Character Stats */}
                <div style={{
                  width: '250px',
                  minWidth: '200px',
                  padding: '15px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRight: `2px solid ${COLORS.panelBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Character Info */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: COLORS.bgLight,
                      border: `3px solid ${selectedCharacter?.color || COLORS.secondary}`,
                      boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <img
                        src={SPRITES.characters[selectedCharacter.id]}
                        alt=""
                        style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      <h3 style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        margin: 0,
                        fontSize: '14px',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000',
                      }}>
                        {selectedCharacter.name}
                      </h3>
                      <p style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        margin: '4px 0 0',
                        color: selectedCharacter.color,
                        fontSize: '12px',
                      }}>
                        Level {displayStats.level}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `2px solid ${COLORS.panelBorder}`,
                    padding: '10px',
                  }}>
                    <h4 style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      fontSize: '10px',
                      margin: '0 0 8px 0',
                      letterSpacing: '1px',
                    }}>
                      STATS
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { icon: '❤️', label: 'HP', value: `${displayStats.hp}/${displayStats.maxHp}`, color: COLORS.hp },
                        { icon: '⚔️', label: 'ATK', value: Math.round(gameStateRef.current?.stats?.damage || 0), color: COLORS.atk },
                        { icon: '🏃', label: 'SPD', value: `${Math.round((gameStateRef.current?.stats?.moveSpeed || 1) * 100)}%`, color: COLORS.spd },
                        { icon: '💥', label: 'CRT', value: `${Math.round((gameStateRef.current?.stats?.crit || 0) * 100)}%`, color: COLORS.crit },
                        { icon: '🛡️', label: 'DEF', value: `${Math.round((gameStateRef.current?.stats?.defense || 0) * 100)}%`, color: COLORS.textGray },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: PIXEL_STYLES.fontFamily,
                          fontSize: '11px',
                        }}>
                          <span style={{ width: '20px' }}>{stat.icon}</span>
                          <span style={{ color: COLORS.textGray, width: '40px' }}>{stat.label}</span>
                          <span style={{ color: stat.color, fontWeight: 'bold', marginLeft: 'auto' }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right - Inventory */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 15px',
                    borderBottom: `2px solid ${COLORS.panelBorder}`,
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    <h3 style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textWhite,
                      fontSize: '12px',
                      margin: 0,
                      letterSpacing: '1px',
                    }}>
                      📦 INVENTORY ({gameStateRef.current?.inventory?.length || 0})
                    </h3>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {(!gameStateRef.current?.inventory || gameStateRef.current?.inventory?.length === 0) && (
                      <p style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: COLORS.textDark,
                        textAlign: 'center',
                        marginTop: '30px',
                        fontSize: '12px',
                      }}>
                        No items collected yet.
                      </p>
                    )}

                    {gameStateRef.current?.inventory?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: item.isSubWeapon
                            ? `linear-gradient(90deg, rgba(255,215,0,0.1) 0%, ${COLORS.bgLight} 100%)`
                            : COLORS.bgLight,
                          border: `2px solid ${item.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                          boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          background: COLORS.bgDark,
                          border: `2px solid ${item.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          flexShrink: 0,
                        }}>
                          {item.isSubWeapon ? (
                            <span style={{ fontSize: '18px' }}>
                              {item.id === 'black_dye' && '🖤'}
                              {item.id === 'hair_brush' && '🪥'}
                              {item.id === 'hair_spray' && '💨'}
                              {item.id === 'hair_dryer' && '🔥'}
                              {item.id === 'electric_clipper' && '⚡'}
                              {item.id === 'dandruff_bomb' && '💣'}
                            </span>
                          ) : (
                            <img src={SPRITES.items[item.icon]} style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            fontWeight: 'bold',
                            color: item.isSubWeapon ? COLORS.primary : COLORS.textWhite,
                            fontSize: '11px',
                            textShadow: '1px 1px 0 #000',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            {item.name}
                            {item.isSubWeapon && (
                              <span style={{
                                fontSize: '8px',
                                color: COLORS.bgDark,
                                background: COLORS.primary,
                                padding: '1px 4px',
                              }}>WPN</span>
                            )}
                          </div>
                          <div style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            fontSize: '9px',
                            color: COLORS.textGray,
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.description}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: PIXEL_STYLES.fontFamily,
                          fontSize: '10px',
                          color: COLORS.primary,
                          fontWeight: 'bold',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '2px 6px',
                          marginLeft: '8px',
                        }}>
                          LV{item.level || 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default GameScreen
