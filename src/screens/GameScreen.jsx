import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GAME_CONFIG, SPRITES, ENEMIES, BOSS, UPGRADES, SHOP_UPGRADES, getBaseStatsWithShop, getRankMultiplier } from '../constants'
import { generateMixedLevelUpOptions, handleSubWeaponSelection, getSubWeaponById } from '../SubWeapons'
import { getMainWeapon, getSpecialAbility, getPassiveSkillOptions, handlePassiveSkillSelection, CHARACTER_PASSIVE_SKILLS } from '../MainWeapons'
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
  characterRanks = {},
  characterProgress,
  loadedImages,
  onGameOver,
  onQuit,
}) => {
  // Debug Trace
  // console.log('GameScreen Rendered. Config:', GAME_CONFIG)

  const canvasRef = useRef(null)
  const gameStateRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Local state for UI
  const [gamePhase, setGamePhase] = useState('playing') // 'playing', 'levelup', 'paused'
  const [displayStats, setDisplayStats] = useState({
    level: 1, xp: 0, xpNeeded: 100, kills: 0, time: 0, hp: 100, maxHp: 100, shield: 0, fragments: 0, coins: 0, specialAbilityLastUsed: 0
  })
  const [levelUpOptions, setLevelUpOptions] = useState([])
  const [pauseTab, setPauseTab] = useState('main')

  // Initialize game
  const initGame = useCallback(() => {
    if (!selectedCharacter) return

    const baseStats = getBaseStatsWithShop(selectedCharacter, shopLevels, characterRanks)
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
        lastFacingDirection: 'right',
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
      mainWeaponLevel: 1, // 메인 무기 레벨 (1~7)
      passiveSkills: [], // 캐릭터 전용 패시브 스킬
      passiveBonuses: {}, // 패시브 스킬 효과 (매 프레임 계산)
      specialAbility: {
        cooldown: 0,
        lastUsed: 0,
        lastUsedGameTime: 0, // 게임 시간 기준 (초 단위)
        active: false,
        activeUntil: 0,
      },
      fragments: 0, // 탈모의사 전용 - 모근 조각
      coins: [],
      collectedCoins: 0,
      xp: 0,
      xpNeeded: getXpNeededForLevel(startingLevel),
      level: startingLevel,
      kills: 0,
      gameTime: 0,
      lastAttackTime: 0,
      lastEnemySpawn: 0,
      bossSpawned: false,
      keys: { w: false, a: false, s: false, d: false, shift: false, shiftPressed: false },
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
        case 'ShiftLeft':
        case 'ShiftRight':
          if (!gameStateRef.current.keys.shift) {
            console.log('[SHIFT] Shift key pressed!')
            gameStateRef.current.keys.shift = true;
            gameStateRef.current.keys.shiftPressed = true;
          }
          break
        case 'Escape':
          if (gamePhase === 'playing') {
            setGamePhase('paused')
            setPauseTab('main') // ESC를 누르면 항상 메인 메뉴로
          }
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
        case 'ShiftLeft':
        case 'ShiftRight':
          gameStateRef.current.keys.shift = false;
          break
      }
    }

    const handleBlur = () => {
      if (gameStateRef.current) {
        gameStateRef.current.keys = { w: false, a: false, s: false, d: false, shift: false }
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

      // Safety Init for Hot Reload / Existing Game States
      if (!state.coins) state.coins = []
      if (typeof state.collectedCoins === 'undefined') state.collectedCoins = 0

      const buildFinalStats = () => ({
        level: state.level,
        kills: state.kills,
        time: state.gameTime,
        hp: 0,
        maxHp: state.stats.maxHp,
        collectedCoins: state.collectedCoins,
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

      // Track last horizontal facing direction for attack placement
      if (dx !== 0) {
        state.player.lastFacingDirection = dx > 0 ? 'right' : 'left'
      }

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

        // Apply electrify DoT (Heihachi)
        if (enemy.electrified && currentTime < enemy.electrified.until) {
          const electrifyDamage = state.stats.damage * enemy.electrified.damagePerSecond * deltaTime
          enemy.currentHp -= electrifyDamage
        } else if (enemy.electrified) {
          delete enemy.electrified
        }

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
            // console.log('Coin Dropped!', value)
            state.coins.push({
              id: generateId(),
              x: enemy.x,
              y: enemy.y,
              value: value,
              createdAt: currentTime
            })
          }

          // Life Steal Check (Moved from duplicate block)
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

              // Show damage numbers periodically (not every frame to avoid spam)
              if (!enemy.lastZoneDamageNumber || currentTime - enemy.lastZoneDamageNumber > 200) {
                enemy.lastZoneDamageNumber = currentTime
                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(state.stats.damage * zone.damagePerSecond * (1 + zoneDamageBonus) * 0.2), // Show ~0.2s worth of damage
                  createdAt: currentTime,
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
                  isCritical: false,
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
          }
        })
        state.groundZones = state.groundZones.filter(z => !z.shouldRemove)
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

      // Update transplant projectiles (탈모의사 공격)
      if (state.transplantProjectiles) {
        state.transplantProjectiles.forEach((proj) => {
          proj.x += proj.vx * deltaTime
          proj.y += proj.vy * deltaTime

          // Check distance traveled
          const distTraveled = distance({ x: proj.startX, y: proj.startY }, proj)
          if (distTraveled >= proj.range) {
            proj.shouldRemove = true
            return
          }

          // Check collision with enemies (piercing - can hit multiple)
          state.enemies.forEach((enemy) => {
            if (enemy.isDead || proj.hitEnemies.includes(enemy.id)) return
            const d = distance(proj, enemy)
            if (d < 40) {
              proj.hitEnemies.push(enemy.id)
              const isCrit = Math.random() < (state.stats.crit || 0)
              const finalDamage = proj.damage * (isCrit ? 1.5 : 1.0)
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
                    damage: Math.floor(healAmount),
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
              const finalDamage = proj.damage * (isCrit ? 1.5 : 1.0) * (proj.returning ? 0.8 : 1.0)
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

            case 'attack_buff': // Heihachi - attack speed + lightning damage buff
              state.stats.attackSpeed *= (1 + effect.attackSpeedBonus)
              // Extra lightning damage handled in attack logic
              break
          }
        }
      }

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

      // Special Ability activation (Shift key)
      if (state.keys.shiftPressed && !state.specialAbility.active) {
        console.log('[SPECIAL] Shift pressed, attempting to use special ability')
        state.keys.shiftPressed = false // 한 번만 발동되도록 플래그 리셋
        const ability = getSpecialAbility(state.player.character.id)
        console.log('[SPECIAL] Ability found:', ability)
        if (ability) {
          // lastUsedGameTime이 0이면 한 번도 안 쓴 것 → 바로 사용 가능
          const neverUsed = state.specialAbility.lastUsedGameTime === 0
          const timeSinceLastUse = (state.gameTime - state.specialAbility.lastUsedGameTime) * 1000 // 초 → 밀리초
          const cooldownReady = neverUsed || timeSinceLastUse >= ability.cooldown
          console.log('[SPECIAL] Cooldown check:', { neverUsed, timeSinceLastUse, cooldown: ability.cooldown, ready: cooldownReady })
          if (cooldownReady) {
            console.log('[SPECIAL] Activating special ability:', ability.name)
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
              console.log('[SPECIAL] Consuming fragments:', fragments, 'threshold:', ability.effect.bonusThreshold)
              const healAmount = fragments * ability.effect.healPerFragment
              const maxHp = state.player.character.baseStats.hp
              state.stats.hp = Math.min(maxHp, state.stats.hp + healAmount * maxHp)
              console.log('[SPECIAL] Healed:', healAmount * maxHp, 'HP now:', state.stats.hp)

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
                console.log('[SPECIAL] Bonus threshold met! Applying buff')
                state.specialAbility.hasBonusBuff = true
              } else {
                console.log('[SPECIAL] Fragments below threshold, no bonus buff')
              }

              // Reset fragments
              state.fragments = 0
              console.log('[SPECIAL] Fragments reset to 0')
            }
          }
        }
      }

      // Attack logic
      const character = state.player.character
      const mainWeapon = getMainWeapon(character.id)
      const weaponEffect = mainWeapon ? mainWeapon.levelEffects[state.mainWeaponLevel] : null
      const attackSpeedBonus = weaponEffect?.attackSpeedBonus || 0
      const finalAttackSpeed = state.stats.attackSpeed * (1 + attackSpeedBonus)

      // For female character (aoe), use weapon's attackCooldown directly
      // For other characters, use attackSpeed-based interval
      let attackInterval
      if (character.attackType === 'aoe' && mainWeapon?.attackCooldown) {
        attackInterval = mainWeapon.attackCooldown // Fixed 5000ms cooldown
      } else {
        attackInterval = 1000 / finalAttackSpeed
      }

      if (currentTime - state.lastAttackTime >= attackInterval) {
        state.lastAttackTime = currentTime

        // Remove old effects (except for long-duration effects)
        state.attackEffects = state.attackEffects.filter((e) => {
          if (e.type === 'female_attack_zone' || e.type === 'female_special_zone') {
            return currentTime - e.createdAt < e.duration
          }
          return currentTime - e.createdAt < 300
        })


        switch (character.attackType) {
          case 'aoe':
            // 여성형 탈모 - 일자 탈모 장판 (Line Ground Zones)
            const femaleWeapon = getMainWeapon('female')
            if (femaleWeapon) {
              const weaponEffect = femaleWeapon.levelEffects[state.mainWeaponLevel]
              // Use lastFacingDirection for attack placement
              const facingDir = state.player.lastFacingDirection || 'right'
              const baseAngle = facingDir === 'right' ? 0 : Math.PI

              // Create line zones based on weapon level
              for (let i = 0; i < (weaponEffect.lines || 1); i++) {
                let offsetAngle = 0
                if (weaponEffect.lines > 1) {
                  // Spread lines if multiple (level 5+)
                  offsetAngle = (i - (weaponEffect.lines - 1) / 2) * 0.3
                }

                const zoneAngle = baseAngle + offsetAngle
                // Position zone adjacent to player based on facing direction
                const zoneX = state.player.x + Math.cos(zoneAngle) * (weaponEffect.length / 2)
                const zoneY = state.player.y + Math.sin(zoneAngle) * (weaponEffect.length / 2)

                // Create ground zone effect
                if (!state.groundZones) state.groundZones = []
                state.groundZones.push({
                  id: generateId(),
                  type: 'female_line_zone',
                  x: zoneX,
                  y: zoneY,
                  angle: zoneAngle,
                  length: weaponEffect.length,
                  width: weaponEffect.width,
                  damagePerSecond: weaponEffect.damagePerSecond,
                  duration: (weaponEffect.duration || 2) * 1000,
                  createdAt: currentTime,
                  color: character.attackColor,
                  facingDirection: facingDir,
                  // Awakening: shockwave
                  hasShockwave: weaponEffect.shockwave || false,
                  shockwaveDamage: weaponEffect.shockwaveDamage || 0,
                  shockwaveKnockback: weaponEffect.shockwaveKnockback || 0,
                  shockwaveInterval: weaponEffect.shockwaveInterval || 1000,
                  lastShockwave: currentTime,
                })

                // Visual effect with sprite support
                state.attackEffects.push({
                  id: generateId(),
                  type: 'female_attack_zone',
                  x: zoneX,
                  y: zoneY,
                  angle: zoneAngle,
                  length: weaponEffect.length,
                  width: weaponEffect.width,
                  color: character.attackColor,
                  createdAt: currentTime,
                  duration: (weaponEffect.duration || 2) * 1000,
                  useSprite: true,
                  facingDirection: facingDir,
                })
              }
            }
            break

          case 'beam':
            // 원형 탈모 - 탈모빔 (Hair Loss Beam - Single target with level scaling)
            const areataWeapon = getMainWeapon('areata')
            const areataEffect = areataWeapon ? areataWeapon.levelEffects[state.mainWeaponLevel] : { damage: 2.0 }

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
              const damage = state.stats.damage * areataEffect.damage
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
            // 황비홍 - 비홍 편두 (Ponytail Spin with level scaling)
            const wongWeapon = getMainWeapon('wongfeihung')
            const wongEffect = wongWeapon ? wongWeapon.levelEffects[state.mainWeaponLevel] : { damage: 1.0, range: 100 }

            // Create spinning hair visual effect
            state.attackEffects.push({
              id: generateId(),
              type: 'spin_hair',
              radius: wongEffect.range || state.stats.attackRange * 0.7,
              angle: (currentTime / 100) % (Math.PI * 2),
              color: character.attackColor,
              createdAt: currentTime,
              duration: 400,
            })

            // 범위 내 모든 적을 찾아서 최대 5명까지 공격
            const spinRange = wongEffect.range || state.stats.attackRange * 0.7
            const enemiesInRange = state.enemies.filter((enemy) =>
              !enemy.isDead && distance(state.player, enemy) <= spinRange
            )

            // 최대 5명까지만 공격
            const spinTargets = enemiesInRange.slice(0, 5)

            spinTargets.forEach((enemy) => {
              const isCrit = Math.random() < (state.stats.crit || 0)
              const meleeDamageBonus = state.passiveBonuses.meleeDamageBonus || 0
              const damage = state.stats.damage * wongEffect.damage * (1 + meleeDamageBonus) * (isCrit ? 1.5 : 1.0)
              enemy.currentHp -= damage

              // Stun chance (level 5+)
              if (wongEffect.stunChance && Math.random() < wongEffect.stunChance) {
                enemy.stunned = true
                enemy.stunUntil = currentTime + (wongEffect.stunDuration || 0.5) * 1000
              }

              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(damage),
                isCritical: isCrit,
                createdAt: currentTime,
              })
            })
            break

          case 'lightning':
            // 헤이하치 - 초 풍신권 (Lightning strikes with level scaling)
            const heihachiWeapon = getMainWeapon('heihachi')
            const heihachiEffect = heihachiWeapon ? heihachiWeapon.levelEffects[state.mainWeaponLevel] : { damage: 1.5 }

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

              // Apply bonus damage if enemy is already electrified (passive skill)
              const electrifiedDamageBonus = (enemy.electrified && currentTime < enemy.electrified.until)
                ? (state.passiveBonuses.electrifiedDamageBonus || 0)
                : 0
              const damage = state.stats.damage * heihachiEffect.damage * (1 + electrifiedDamageBonus)
              enemy.currentHp -= damage

              // Apply electrify debuff
              if (heihachiEffect.electrifyDuration) {
                enemy.electrified = {
                  damagePerSecond: heihachiEffect.electrifyDamagePerSecond || 0.40,
                  until: currentTime + heihachiEffect.electrifyDuration * 1000,
                }
              }

              state.damageNumbers.push({
                id: generateId(),
                x: enemy.x,
                y: enemy.y,
                damage: Math.floor(damage),
                createdAt: currentTime,
              })
            })
            break

          case 'transplant':
            // Hair Transplant Gun - Piercing projectile that hits all enemies in a line
            const talmoWeapon = getMainWeapon('talmo_docter')
            const talmoEffect = talmoWeapon ?
              talmoWeapon.levelEffects[state.mainWeaponLevel] :
              { damage: 1.20, range: 130, angle: 120, lifeSteal: 0.15 }

            const projectileRange = talmoEffect.range
            const projectileSpeed = character.projectileSpeed || 400

            // Find direction to nearest enemy, or use facing direction
            let targetAngle = state.player.facing === 1 ? 0 : Math.PI
            let nearestEnemy = null
            let nearestEnemyDist = Infinity

            state.enemies.forEach((enemy) => {
              const d = distance(state.player, enemy)
              if (d < nearestEnemyDist && d <= projectileRange * 1.5) {
                nearestEnemy = enemy
                nearestEnemyDist = d
              }
            })

            if (nearestEnemy) {
              targetAngle = Math.atan2(nearestEnemy.y - state.player.y, nearestEnemy.x - state.player.x)
            }

            // Calculate damage with fragment bonus (awakening)
            let baseDamage = state.stats.damage * talmoEffect.damage
            if (talmoEffect.fragmentBonus &&
              state.fragments >= talmoEffect.fragmentBonusThreshold) {
              baseDamage *= (1 + talmoEffect.fragmentBonusDamage)
            }

            // Create piercing projectile(s)
            if (!state.transplantProjectiles) state.transplantProjectiles = []

            const swingCount = talmoEffect.multiSwing || 1
            for (let i = 0; i < swingCount; i++) {
              // Slight angle offset for multiple swings
              const swingAngleOffset = (i - (swingCount - 1) / 2) * 0.2
              const finalAngle = targetAngle + swingAngleOffset

              state.transplantProjectiles.push({
                id: generateId(),
                x: state.player.x,
                y: state.player.y,
                startX: state.player.x,
                startY: state.player.y,
                vx: Math.cos(finalAngle) * projectileSpeed,
                vy: Math.sin(finalAngle) * projectileSpeed,
                angle: finalAngle,
                damage: baseDamage,
                range: projectileRange,
                size: character.projectileSize || 100,
                hitEnemies: [],
                createdAt: currentTime,
                color: character.attackColor,
                // Talmo Docter specific effects
                lifeSteal: talmoEffect.lifeSteal,
                fragmentChance: talmoEffect.fragmentChance || 0,
                maxFragments: talmoEffect.maxFragments || 15,
              })
            }
            break

          case 'boomerang':
            // Boomerang - Throws and returns, hitting enemies multiple times
            if (!state.boomerangProjectiles) state.boomerangProjectiles = []

            // Get weapon level effects
            const mzamenWeapon = getMainWeapon('mzamen')
            const mzamenEffect = mzamenWeapon ?
              mzamenWeapon.levelEffects[state.mainWeaponLevel] :
              { waveCount: 1, damage: 1.00, speed: 300, range: 250 }

            // Check if we've reached the max active boomerangs
            if (state.boomerangProjectiles.length >= mzamenEffect.waveCount) break

            const boomerangRange = mzamenEffect.range
            const boomerangSpeed = mzamenEffect.speed
            const returnSpeed = character.returnSpeed || 450

            // Find direction to nearest enemy, or use facing direction
            let boomerangAngle = state.player.facing === 1 ? 0 : Math.PI
            let nearestBoomerangEnemy = null
            let nearestBoomerangDist = Infinity

            state.enemies.forEach((enemy) => {
              const d = distance(state.player, enemy)
              if (d < nearestBoomerangDist && d <= boomerangRange * 1.5) {
                nearestBoomerangEnemy = enemy
                nearestBoomerangDist = d
              }
            })

            if (nearestBoomerangEnemy) {
              boomerangAngle = Math.atan2(nearestBoomerangEnemy.y - state.player.y, nearestBoomerangEnemy.x - state.player.x)
            }

            // Create multiple boomerangs in a spread pattern
            const spreadAngle = 0.3 // 30 degree spread between boomerangs
            for (let i = 0; i < mzamenEffect.waveCount; i++) {
              let offsetAngle = 0
              if (mzamenEffect.waveCount > 1) {
                offsetAngle = (i - (mzamenEffect.waveCount - 1) / 2) * spreadAngle
              }

              const finalAngle = boomerangAngle + offsetAngle

              // Create boomerang projectile
              state.boomerangProjectiles.push({
                id: generateId(),
                x: state.player.x,
                y: state.player.y,
                startX: state.player.x,
                startY: state.player.y,
                vx: Math.cos(finalAngle) * boomerangSpeed,
                vy: Math.sin(finalAngle) * boomerangSpeed,
                angle: finalAngle,
                rotation: 0,
                damage: state.stats.damage * mzamenEffect.damage,
                range: boomerangRange,
                speed: boomerangSpeed,
                returnSpeed: returnSpeed,
                size: character.projectileSize || 80,
                hitEnemies: [],
                returning: false,
                createdAt: currentTime,
                color: character.attackColor,
                // Awakening effect
                hasReturnExplosion: mzamenEffect.returnExplosion || false,
                returnExplosionDamage: mzamenEffect.returnExplosionDamage || 0,
                returnExplosionRadius: mzamenEffect.returnExplosionRadius || 0,
                armorPenetration: mzamenEffect.armorPenetration || 0,
              })
            }
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

      // (Removed Duplicate Death Logic: Handled in main loop)
      // state.enemies = state.enemies.filter((e) => e.currentHp > 0)

      // Collect XP orbs
      const collectedOrbs = state.xpOrbs.filter((orb) => distance(state.player, orb) < 80)
      collectedOrbs.forEach((orb) => {
        const xpGain = orb.value * (state.stats.xpMultiplier || 1.0)
        state.xp += xpGain
        if (state.xp >= state.xpNeeded) {
          state.xp = 0
          state.level += 1
          state.xpNeeded = Math.floor(state.xpNeeded * GAME_CONFIG.LEVEL_XP_MULTIPLIER)

          // Generate level-up options - create a pool of all available options
          const optionPool = []

          // 1. Main Weapon Upgrade (if not maxed) - add to pool
          if (state.mainWeaponLevel < 7) {
            const mainWeapon = getMainWeapon(state.player.character.id)
            if (mainWeapon) {
              const nextLevel = state.mainWeaponLevel + 1
              const nextEffect = mainWeapon.levelEffects[nextLevel]
              optionPool.push({
                id: mainWeapon.id,
                name: mainWeapon.name,
                type: nextLevel === 7 ? '무기 (각성)' : '무기',
                description: mainWeapon.description,
                icon: nextLevel === 7 ? `${state.player.character.id}_gaksung` : `${state.player.character.id}_mainattack`,
                isMainWeapon: true,
                currentLevel: state.mainWeaponLevel,
                nextLevel,
                effect: nextEffect,
              })
            }
          }

          // 2. Passive Skills - add all available to pool
          const passiveOptions = getPassiveSkillOptions(state.player.character.id, state.passiveSkills)
          passiveOptions.forEach(skill => {
            optionPool.push({
              ...skill,
              type: '패시브 스킬',
              icon: skill.icon,
            })
          })

          // 3. Sub Weapons and Items - add to pool
          const mixedOptions = generateMixedLevelUpOptions(UPGRADES, state.inventory, 5)
          optionPool.push(...mixedOptions)

          // Randomly select 3 options from the pool
          const shuffled = [...optionPool].sort(() => Math.random() - 0.5)
          const finalOptions = shuffled.slice(0, 3)
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
        currentGameTime: state.gameTime,
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

      // Draw Coins (Pixel Art)
      const coinImg = loadedImages[SPRITES.items?.coin]
      state.coins.forEach((coin) => {
        const sx = coin.x - state.camera.x
        const sy = coin.y - state.camera.y
        if (sx > -30 && sx < canvas.width + 30 && sy > -30 && sy < canvas.height + 30) {
          if (coinImg && coinImg.complete && coinImg.naturalWidth > 0) {
            const size = 24
            ctx.drawImage(coinImg, sx - size / 2, sy - size / 2, size, size)
          } else {
            // Fallback: Yellow circle with border
            ctx.fillStyle = '#FFD700'
            ctx.strokeStyle = '#DAA520'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(sx, sy, 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Inner detail
            ctx.fillStyle = '#FFA500'
            ctx.beginPath()
            ctx.arc(sx, sy, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

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

      // Draw transplant projectiles (탈모의사 식모기)
      if (state.transplantProjectiles) {
        state.transplantProjectiles.forEach((proj) => {
          const sx = proj.x - state.camera.x
          const sy = proj.y - state.camera.y

          if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return

          // Try to draw sprite
          const transplantImg = loadedImages[SPRITES.attacks?.talmo_docter_projectile]
          if (transplantImg) {
            ctx.save()
            ctx.translate(sx, sy)
            // 이미지의 12시 방향이 진행 방향이 되도록 +90도 회전
            ctx.rotate(proj.angle + Math.PI / 2)
            // 식모기 이미지 크기를 크게 키워서 날아가는 느낌
            const imgSize = proj.size || 100
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(transplantImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize)
            ctx.restore()
          } else {
            // Fallback: Draw a stylized syringe/transplant tool
            ctx.save()
            ctx.translate(sx, sy)
            ctx.rotate(proj.angle)

            // Glow effect
            ctx.shadowColor = proj.color || '#00CED1'
            ctx.shadowBlur = 15

            // Main body (syringe shape)
            ctx.fillStyle = '#E0FFFF'
            ctx.fillRect(-25, -6, 40, 12)

            // Needle part
            ctx.fillStyle = '#C0C0C0'
            ctx.beginPath()
            ctx.moveTo(15, -4)
            ctx.lineTo(30, 0)
            ctx.lineTo(15, 4)
            ctx.closePath()
            ctx.fill()

            // Plunger
            ctx.fillStyle = '#00CED1'
            ctx.fillRect(-30, -4, 8, 8)

            // Hair follicle detail
            ctx.fillStyle = '#8B4513'
            ctx.beginPath()
            ctx.arc(25, 0, 3, 0, Math.PI * 2)
            ctx.fill()

            ctx.shadowBlur = 0
            ctx.restore()
          }
        })
      }

      // Draw boomerang projectiles (Mzamen 부메랑)
      if (state.boomerangProjectiles) {
        state.boomerangProjectiles.forEach((proj) => {
          const sx = proj.x - state.camera.x
          const sy = proj.y - state.camera.y

          if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return

          // Try to draw sprite
          const boomerangImg = loadedImages[SPRITES.attacks?.mzamen_boomerang]
          if (boomerangImg) {
            ctx.save()
            ctx.translate(sx, sy)
            // 회전 효과 (부메랑이 빙글빙글 돌면서 날아감)
            ctx.rotate(proj.rotation)
            const imgSize = proj.size || 80
            ctx.imageSmoothingEnabled = false

            // Returning일 때 약간 크기 감소 효과
            const scale = proj.returning ? 0.85 : 1.0
            const drawSize = imgSize * scale

            // Glow effect
            if (proj.returning) {
              ctx.shadowColor = proj.color || '#FF6B35'
              ctx.shadowBlur = 20
            }

            ctx.drawImage(boomerangImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize)
            ctx.restore()
          } else {
            // Fallback: Draw a stylized boomerang
            ctx.save()
            ctx.translate(sx, sy)
            ctx.rotate(proj.rotation)

            // Glow effect
            ctx.shadowColor = proj.color || '#FF6B35'
            ctx.shadowBlur = proj.returning ? 20 : 15

            // Boomerang shape (curved)
            ctx.fillStyle = '#FF6B35'
            ctx.strokeStyle = '#FFD700'
            ctx.lineWidth = 2

            ctx.beginPath()
            ctx.moveTo(-25, -8)
            ctx.quadraticCurveTo(-15, -15, 0, -12)
            ctx.quadraticCurveTo(15, -15, 25, -8)
            ctx.lineTo(20, 0)
            ctx.quadraticCurveTo(10, 8, 0, 6)
            ctx.quadraticCurveTo(-10, 8, -20, 0)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()

            // M shape detail
            ctx.fillStyle = '#FFD700'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('M', 0, 0)

            ctx.shadowBlur = 0
            ctx.restore()
          }
        })
      }

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

          case 'line_zone':
            // 여성형 탈모 - 일자 장판 렌더링
            ctx.save()
            const lineX = effect.x - state.camera.x
            const lineY = effect.y - state.camera.y

            ctx.translate(lineX, lineY)
            ctx.rotate(effect.angle)

            // Draw rectangle
            ctx.fillStyle = effect.color
            ctx.globalAlpha = 0.4 * (1 - progress)
            ctx.fillRect(-effect.length / 2, -effect.width / 2, effect.length, effect.width)

            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.globalAlpha = 0.7 * (1 - progress)
            ctx.strokeRect(-effect.length / 2, -effect.width / 2, effect.length, effect.width)

            ctx.restore()
            ctx.globalAlpha = 1
            break

          case 'female_attack_zone':
            // 여성형 탈모 - 장판 스프라이트 렌더링
            ctx.save()
            const femaleZoneX = effect.x - state.camera.x
            const femaleZoneY = effect.y - state.camera.y

            ctx.translate(femaleZoneX, femaleZoneY)

            // Flip horizontally if facing left
            if (effect.facingDirection === 'left') {
              ctx.scale(-1, 1)
            }

            // Try to draw sprite image
            const femaleAttackImg = loadedImages[SPRITES.attacks?.femalebald_mainattack]
            if (femaleAttackImg && femaleAttackImg.complete && femaleAttackImg.naturalWidth > 0) {
              // Calculate fade based on remaining duration
              const fadeProgress = progress
              ctx.globalAlpha = Math.max(0.3, 1 - fadeProgress * 0.7) // Keep visible for the duration

              // Scale sprite to match attack hitbox
              const spriteWidth = effect.length
              const spriteHeight = effect.width
              ctx.drawImage(
                femaleAttackImg,
                -spriteWidth / 2,
                -spriteHeight / 2,
                spriteWidth,
                spriteHeight
              )
            } else {
              // Fallback: Draw colored rectangle
              ctx.rotate(effect.angle)
              ctx.fillStyle = effect.color
              ctx.globalAlpha = 0.5 * (1 - progress * 0.5)
              ctx.fillRect(-effect.length / 2, -effect.width / 2, effect.length, effect.width)

              ctx.strokeStyle = '#fff'
              ctx.lineWidth = 2
              ctx.globalAlpha = 0.8 * (1 - progress * 0.5)
              ctx.strokeRect(-effect.length / 2, -effect.width / 2, effect.length, effect.width)
            }

            ctx.restore()
            ctx.globalAlpha = 1
            break

          case 'female_special_zone':
            // 여성형 탈모 - 스페셜 어빌리티 (대형 수직 장판)
            ctx.save()
            const specialZoneX = effect.x - state.camera.x
            const specialZoneY = effect.y - state.camera.y

            ctx.translate(specialZoneX, specialZoneY)

            // Try to draw sprite image (femalebaldability.png)
            // Try multiple lookup methods in case of path issues
            const abilityPath = SPRITES.abilities?.female_ability || '/sprites/femalebald/femalebaldability.png'
            const femaleAbilityImg = loadedImages[abilityPath]

            if (femaleAbilityImg && femaleAbilityImg.complete && femaleAbilityImg.naturalWidth > 0) {
              // Keep visible during the ability
              ctx.globalAlpha = 0.8

              // Scale sprite to cover full screen height
              const spriteWidth = effect.width
              const spriteHeight = effect.length
              ctx.drawImage(
                femaleAbilityImg,
                -spriteWidth / 2,
                -spriteHeight / 2,
                spriteWidth,
                spriteHeight
              )
            } else {
              // Fallback: Draw colored rectangle with glow effect
              ctx.fillStyle = effect.color
              ctx.globalAlpha = 0.6
              ctx.shadowColor = effect.color
              ctx.shadowBlur = 30
              ctx.fillRect(-effect.width / 2, -effect.length / 2, effect.width, effect.length)

              ctx.strokeStyle = '#fff'
              ctx.lineWidth = 4
              ctx.globalAlpha = 0.9
              ctx.strokeRect(-effect.width / 2, -effect.length / 2, effect.width, effect.length)
              ctx.shadowBlur = 0
            }

            ctx.restore()
            ctx.globalAlpha = 1
            break

          case 'shockwave':
            // 충격파 렌더링
            const swX = effect.x - state.camera.x
            const swY = effect.y - state.camera.y
            const swRadius = effect.maxRadius * progress

            ctx.strokeStyle = effect.color
            ctx.lineWidth = 3
            ctx.globalAlpha = 0.8 * (1 - progress)
            ctx.beginPath()
            ctx.arc(swX, swY, swRadius, 0, Math.PI * 2)
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

          case 'spin_hair':
            // 황비홍 spinning hair with sprites
            const hairX = state.player.x - state.camera.x
            const hairY = state.player.y - state.camera.y
            const hairAngle = effect.angle + (progress * Math.PI * 4)

            ctx.save()
            ctx.translate(hairX, hairY)
            ctx.rotate(hairAngle)
            ctx.globalAlpha = 0.9 * (1 - progress * 0.3)

            // Draw hair sprite if loaded
            if (loadedImages[SPRITES.attacks.wongfeihung_hair]) {
              const hairImg = loadedImages[SPRITES.attacks.wongfeihung_hair]
              const hairSize = effect.radius * 2
              ctx.drawImage(hairImg, -hairSize / 2, -hairSize / 2, hairSize, hairSize)
            }

            // Draw slash effect trailing behind
            ctx.rotate(Math.PI / 4)
            if (loadedImages[SPRITES.attacks.wongfeihung_slash]) {
              const slashImg = loadedImages[SPRITES.attacks.wongfeihung_slash]
              const slashSize = effect.radius * 1.5
              ctx.drawImage(slashImg, -slashSize / 2, -slashSize / 2, slashSize, slashSize)
            }

            ctx.restore()
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
              const shrinkScale = 1 - (enemy.deathTimer / 0.5) // 0.5초 동안 1 -> 0으로 작아짐
              ctx.scale(shrinkScale, shrinkScale)
            }
            if (enemy.rotation) ctx.rotate(enemy.rotation)

            ctx.drawImage(img, -enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size)

            // Draw electrify visual effect
            if (enemy.electrified && currentTime < enemy.electrified.until) {
              const sparkCount = 4
              const sparkRadius = enemy.size / 2 + 10
              const sparkProgress = (currentTime % 300) / 300 // Cycle every 300ms

              for (let i = 0; i < sparkCount; i++) {
                const angle = (i / sparkCount) * Math.PI * 2 + sparkProgress * Math.PI * 2
                const sparkX = Math.cos(angle) * sparkRadius
                const sparkY = Math.sin(angle) * sparkRadius

                // Draw spark
                ctx.fillStyle = `rgba(255, 255, 100, ${0.8 - sparkProgress})`
                ctx.beginPath()
                ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2)
                ctx.fill()

                // Draw lightning bolt to center
                ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 - sparkProgress * 0.5})`
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(sparkX, sparkY)
                ctx.lineTo(0, 0)
                ctx.stroke()
              }

              // Glow effect
              ctx.shadowColor = 'rgba(100, 200, 255, 0.5)'
              ctx.shadowBlur = 10
              ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 - sparkProgress * 0.2})`
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.arc(0, 0, enemy.size / 2 + 5, 0, Math.PI * 2)
              ctx.stroke()
              ctx.shadowBlur = 0
            }

            ctx.restore()
          }
        }
      })

      // Draw player
      const playerSx = state.player.x - state.camera.x
      const playerSy = state.player.y - state.camera.y

      // Draw aura if buff is active (탈모의사 스페셜 버프)
      if (state.specialAbility.hasBonusBuff && state.specialAbility.active) {
        const pulseTime = currentTime % 1000
        const pulseScale = 1 + Math.sin(pulseTime / 1000 * Math.PI * 2) * 0.1
        const pulseAlpha = 0.3 + Math.sin(pulseTime / 1000 * Math.PI * 2) * 0.15

        // Outer aura glow
        ctx.save()
        ctx.globalAlpha = pulseAlpha
        const gradient = ctx.createRadialGradient(playerSx, playerSy, 0, playerSx, playerSy, 80 * pulseScale)
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)')
        gradient.addColorStop(0.5, 'rgba(0, 206, 209, 0.3)')
        gradient.addColorStop(1, 'rgba(0, 206, 209, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(playerSx, playerSy, 80 * pulseScale, 0, Math.PI * 2)
        ctx.fill()

        // Inner bright core
        ctx.globalAlpha = pulseAlpha * 1.5
        const coreGradient = ctx.createRadialGradient(playerSx, playerSy, 0, playerSx, playerSy, 40 * pulseScale)
        coreGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)')
        coreGradient.addColorStop(1, 'rgba(0, 206, 209, 0)')
        ctx.fillStyle = coreGradient
        ctx.beginPath()
        ctx.arc(playerSx, playerSy, 40 * pulseScale, 0, Math.PI * 2)
        ctx.fill()

        // Rotating particles
        const particleCount = 8
        for (let i = 0; i < particleCount; i++) {
          const angle = (currentTime / 1000) * Math.PI * 2 + (i / particleCount) * Math.PI * 2
          const radius = 50 + Math.sin(currentTime / 500 + i) * 10
          const px = playerSx + Math.cos(angle) * radius
          const py = playerSy + Math.sin(angle) * radius

          ctx.globalAlpha = pulseAlpha * 0.8
          ctx.fillStyle = '#00FFFF'
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

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

        // 캐릭터별 스프라이트 크기 조절
        const spriteScale = state.player.character.spriteScale || 1
        const spriteW = 64 * spriteScale
        const spriteH = 64 * spriteScale
        ctx.imageSmoothingEnabled = false // 픽셀 아트 선명하게
        ctx.drawImage(playerImg, -spriteW / 2, -spriteH / 2 - 8, spriteW, spriteH)
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

        // Heal numbers: green and upward, Critical damage: large red, Normal damage: white
        if (dn.isHeal) {
          ctx.font = '16px "Press Start 2P", cursive'
          ctx.fillStyle = `rgba(50, 255, 50, ${1 - progress})`
        } else if (dn.isCritical) {
          ctx.font = '20px "Press Start 2P", cursive'
          ctx.fillStyle = `rgba(255, 82, 82, ${1 - progress})`
        } else {
          ctx.font = '14px "Press Start 2P", cursive'
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`
        }

        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - progress})`
        ctx.lineWidth = 4
        ctx.lineJoin = 'round'
        ctx.textAlign = 'center'
        const displayText = dn.isHeal ? `+${dn.damage}` : dn.damage.toString()
        ctx.strokeText(displayText, 0, 0)
        ctx.fillText(displayText, 0, 0)
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
      if (upgrade.isMainWeapon) {
        // Main Weapon Level Up
        gameStateRef.current.mainWeaponLevel = upgrade.nextLevel
      } else if (upgrade.isPassiveSkill) {
        // Passive Skill Selection
        gameStateRef.current.passiveSkills = handlePassiveSkillSelection(
          upgrade,
          gameStateRef.current.passiveSkills
        )
      } else if (upgrade.isSubWeapon) {
        // Sub Weapon Selection
        const weaponData = upgrade.weaponData || getSubWeaponById(upgrade.id)
        if (weaponData) {
          gameStateRef.current.inventory = handleSubWeaponSelection(
            weaponData,
            gameStateRef.current.inventory
          )
        }
      } else {
        // Regular Item
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
          {/* Character Portrait + Skill Icon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Portrait */}
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

            {/* Special Ability Icon (Below Portrait) */}
            {(() => {
              const ability = getSpecialAbility(selectedCharacter?.id)
              if (!ability) return null

              const lastUsedGameTime = displayStats.specialAbilityLastUsed
              const currentGameTime = displayStats.currentGameTime || 0
              // 아직 한 번도 사용 안 했으면 쿨타임 없음 (lastUsedGameTime이 0)
              const hasBeenUsed = lastUsedGameTime > 0
              const timeSinceLastUse = hasBeenUsed ? (currentGameTime - lastUsedGameTime) * 1000 : Infinity // 초 → 밀리초
              const cooldownRemaining = hasBeenUsed ? Math.max(0, ability.cooldown - timeSinceLastUse) : 0
              const isOnCooldown = cooldownRemaining > 0
              const cooldownPercent = isOnCooldown ? (cooldownRemaining / ability.cooldown) * 100 : 0
              const cooldownSeconds = Math.ceil(cooldownRemaining / 1000)

              // Build icon path
              const iconPath = SPRITES.abilities?.[`${selectedCharacter.id}_ability`]

              return (
                <div style={{
                  background: 'rgba(13, 13, 26, 0.9)',
                  border: `2px solid ${isOnCooldown ? COLORS.panelBorder : COLORS.warning}`,
                  boxShadow: isOnCooldown ? '2px 2px 0 0 rgba(0,0,0,0.5)' : `0 0 8px ${COLORS.warning}80`,
                  padding: '3px',
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  alignSelf: 'center',
                }}>
                  {/* Ability Icon */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: isOnCooldown ? 'brightness(0.3)' : 'none',
                  }}>
                    {iconPath && loadedImages[iconPath] ? (
                      <img
                        src={iconPath}
                        alt="Special"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '18px' }}>⚡</span>
                    )}
                  </div>

                  {/* Cooldown Overlay */}
                  {isOnCooldown && (
                    <>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: `conic-gradient(
                          transparent ${100 - cooldownPercent}%, 
                          rgba(0, 0, 0, 0.7) ${100 - cooldownPercent}%
                        )`,
                        pointerEvents: 'none',
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: PIXEL_STYLES.fontFamily,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                      }}>
                        {cooldownSeconds}
                      </div>
                    </>
                  )}

                  {/* Shift Key Hint */}
                  {!isOnCooldown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '8px',
                      color: COLORS.warning,
                      textShadow: '1px 1px 0 #000',
                      whiteSpace: 'nowrap',
                    }}>
                      Shift
                    </div>
                  )}
                </div>
              )
            })()}
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

          {/* Fragment Counter (Talmo Docter only) */}
          {selectedCharacter?.id === 'talmo_docter' && (
            <div style={{
              background: 'rgba(13, 13, 26, 0.9)',
              border: `3px solid ${COLORS.panelBorder}`,
              boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
              padding: '8px 12px',
              minWidth: '100px',
            }}>
              <div style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textWhite,
                fontSize: '13px',
                marginBottom: '4px',
                textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
              }}>
                🧬 모근조각
              </div>
              <div style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: displayStats.fragments >= 5 ? COLORS.primary : COLORS.textGray,
                fontSize: '16px',
                fontWeight: 'bold',
                textShadow: '1px 1px 0 #000',
              }}>
                {displayStats.fragments || 0} / 15
                {displayStats.fragments >= 5 && (
                  <span style={{ marginLeft: '5px', fontSize: '12px', color: COLORS.warning }}>
                    ⚡
                  </span>
                )}
              </div>
            </div>
          )}
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
            <span style={{ color: '#FFD700' }}>💰{displayStats.coins || 0}</span>
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
                    border: `2px solid ${upgrade.isMainWeapon || upgrade.isPassiveSkill ? COLORS.warning : upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    {upgrade.isMainWeapon || upgrade.isPassiveSkill ? (
                      SPRITES.abilities && SPRITES.abilities[upgrade.icon] ? (
                        <img
                          src={SPRITES.abilities[upgrade.icon]}
                          alt={upgrade.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            imageRendering: 'pixelated',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '30px' }}>{upgrade.isMainWeapon ? '⚔️' : '✨'}</span>
                      )
                    ) : upgrade.isSubWeapon ? (
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
                          ? (upgrade.currentLevel > 0 ? `LV${upgrade.currentLevel}→${upgrade.nextLevel}` : '🆕무기')
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
                        { icon: '⚡', label: 'AS', value: `${(gameStateRef.current?.stats?.attackSpeed || 1).toFixed(1)}x`, color: COLORS.warning },
                        { icon: '🛡️', label: 'DEF', value: `${Math.round((gameStateRef.current?.stats?.defense || 0) * 100)}%`, color: COLORS.textGray },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: PIXEL_STYLES.fontFamily,
                          fontSize: '14px',
                        }}>
                          <span style={{ width: '24px', fontSize: '16px' }}>{stat.icon}</span>
                          <span style={{ color: COLORS.textGray, width: '50px' }}>{stat.label}</span>
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
