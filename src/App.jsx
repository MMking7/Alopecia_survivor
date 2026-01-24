import { useState, useEffect, useRef, useCallback } from 'react'
import {
  GAME_CONFIG,
  SPRITES,
  CHARACTERS,
  ENEMIES,
  BOSS,
  UPGRADES,
  SHOP_UPGRADES
} from './constants'
import TitleScreen from './screens/TitleScreen'
import CharacterSelectScreen from './screens/CharacterSelectScreen'
import ShopScreen from './screens/ShopScreen'
import GameOverScreen from './screens/GameOverScreen'
import {
  SUB_WEAPONS,
  SUB_WEAPON_SPRITES,
  generateMixedLevelUpOptions,
  handleSubWeaponSelection,
  getSubWeaponById
} from './SubWeapons'

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const generateId = () => Math.random().toString(36).substr(2, 9)
const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const lerp = (a, b, t) => a + (b - a) * t

// 시간 기반 난이도 배수 계산
const getDifficultyMultiplier = (gameTime) => {
  const minutes = gameTime / 60
  return {
    hpMultiplier: 1 + minutes * 0.25,
    damageMultiplier: 1 + minutes * 0.2,
    spawnRate: Math.max(150, 800 - minutes * 80),
    enemyCount: Math.floor(1 + minutes * 0.5),
    speedMultiplier: 1 + minutes * 0.05,
  }
}

// ============================================================
// IMAGE LOADER
// ============================================================
const loadedImages = {}
const loadImage = (src) => {
  return new Promise((resolve) => {
    if (loadedImages[src]) {
      resolve(loadedImages[src])
      return
    }
    const img = new Image()
    img.onload = () => {
      loadedImages[src] = img
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ============================================================
// MAIN GAME COMPONENT
// ============================================================
function App() {
  const canvasRef = useRef(null)
  const gameStateRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Aim mode state (UI용)
  const [isAutoAim, setIsAutoAim] = useState(false)
  const [pauseTab, setPauseTab] = useState('main') // main, character, settings
  // Game state
  const [gamePhase, setGamePhase] = useState('menu')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Stats for UI
  const [displayStats, setDisplayStats] = useState({
    level: 1,
    xp: 0,
    xpNeeded: GAME_CONFIG.XP_PER_LEVEL,
    kills: 0,
    time: 0,
    hp: 100,
    maxHp: 100,
    shield: 0,
  })

  // Level up state
  const [levelUpOptions, setLevelUpOptions] = useState([])

  // Shop state - load from localStorage
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('hairSurvivor_coins')
    return saved ? parseInt(saved) : 1000
  })
  const [shopLevels, setShopLevels] = useState(() => {
    const saved = localStorage.getItem('hairSurvivor_shopLevels')
    return saved ? JSON.parse(saved) : {}
  })
  // const [selectedShopItem, setSelectedShopItem] = useState(null) // Moved inside ShopScreen
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('hairSurvivor_highScore')
    return saved ? parseInt(saved) : 0
  })

  // Load images
  useEffect(() => {
    const loadAllImages = async () => {
      const imageSources = [
        SPRITES.background,
        ...Object.values(SPRITES.characters),
        ...Object.values(SPRITES.enemies),
        SPRITES.boss,
        ...Object.values(SPRITES.ui),
        ...Object.values(SPRITES.items),
      ]
      await Promise.all(imageSources.map(loadImage))
      setImagesLoaded(true)
    }
    loadAllImages()
  }, [])

  // Initialize game state (using character stats)
  const initGame = useCallback((character) => {
    // Basic defaults if characters don't have stats yet (fallback)
    const base = character.baseStats || { hp: 100, maxHp: 100, damage: 30, speed: 1.0, attackSpeed: 1.5, defense: 0, crit: 0 }

    // Apply Shop Upgrades
    const upgradeStats = (stat, upgradeId, perLevel) => {
      return (shopLevels[upgradeId] || 0) * perLevel
    }

    const maxHp = Math.floor(base.maxHp * (1 + upgradeStats(0, 'maxHp', 0.05)))
    const hp = maxHp // Start full HP

    gameStateRef.current = {
      player: {
        x: 0,
        y: 0,
        size: 64,
        character,
        facing: 1, // 1: right, -1: left
      },
      stats: {
        hp: hp,
        maxHp: maxHp,
        damage: base.damage * (1 + upgradeStats(0, 'atk', 0.03)),
        attackSpeed: base.attackSpeed * (1 + upgradeStats(0, 'haste', 0.02)),
        attackRange: 150,
        moveSpeed: base.speed * (1 + upgradeStats(0, 'spd', 0.02)),
        shield: 0,
        defense: base.defense,
        crit: base.crit + upgradeStats(0, 'crt', 0.02),
        xpMultiplier: 1.0,
        lifeSteal: 0,
        pickupRange: 1.0 + upgradeStats(0, 'pickup', 0.05),
        spawnRateMultiplier: 1.0,
      },
      inventory: [],
      enemies: [],
      enemyProjectiles: [],
      xpOrbs: [],
      damageNumbers: [],
      attackEffects: [],
      poisonZones: [],
      explosions: [],
      // Sub Weapon 관련 상태
      subWeaponProjectiles: [],  // 서브 웨폰 투사체
      subWeaponEffects: [],      // 서브 웨폰 이펙트 (장판, 구름 등)
      level: 1,
      xp: 0,
      xpNeeded: GAME_CONFIG.XP_PER_LEVEL,
      kills: 0,
      gameTime: 0,
      lastAttackTime: 0,
      lastEnemySpawn: 0,
      bossSpawned: false,
      keys: { w: false, a: false, s: false, d: false },
      camera: { x: 0, y: 0 },
      isAutoAim: isAutoAim, // Sync with UI select
      mouseX: 0,
      mouseY: 0,
    }
  }, [shopLevels, isAutoAim])







  // Handle keyboard input
  useEffect(() => {
    // 상태가 변할 때마다 키 입력 초기화 (무한 이동 방지)
    if (gameStateRef.current) {
      gameStateRef.current.keys = { w: false, a: false, s: false, d: false }
    }

    if (gamePhase !== 'playing' && gamePhase !== 'paused') return

    const handleKeyDown = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = true; break;
        case 'KeyS': gameStateRef.current.keys.s = true; break;
        case 'KeyA': gameStateRef.current.keys.a = true; break;
        case 'KeyD': gameStateRef.current.keys.d = true; break;
        case 'Escape':
          if (gamePhase === 'playing') setGamePhase('paused')
          else if (gamePhase === 'paused') setGamePhase('playing')
          break;
      }
    }

    const handleKeyUp = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = false; break;
        case 'KeyS': gameStateRef.current.keys.s = false; break;
        case 'KeyA': gameStateRef.current.keys.a = false; break;
        case 'KeyD': gameStateRef.current.keys.d = false; break;
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
          const enemyType = ENEMIES[Math.floor(Math.random() * ENEMIES.length)]
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
                x: enemy.x,
                y: enemy.y,
                vx: (edx / dist) * projSpeed,
                vy: (edy / dist) * projSpeed,
                damage: enemy.scaledDamage || enemy.damage,
                size: 12,
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
          // Check for Item Drop (Health/Coins) - simple 1% chance for now
          if (Math.random() < 0.05) {
            // Drop Coin logic could go here
          }
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
              setGamePhase('gameover')
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
              setGamePhase('gameover')
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
                setGamePhase('gameover')
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
              maxRadius: state.stats.attackRange, // 목표 반경
              color: character.attackColor,
              createdAt: currentTime,
              duration: 400, // 지속 시간 조금 증가
            })
            state.enemies.forEach((enemy) => {
              if (distance(state.player, enemy) <= state.stats.attackRange) {
                // Crit check
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
            // Hair Loss Beam - Single target (플레이어 추적)
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
                // x1, y1을 저장하지 않고 렌더링 시 플레이어 위치 사용
                target: { x: nearest.x, y: nearest.y }, // 목표 지점 고정 (또는 적 추적 가능)
                x2: nearest.x,
                y2: nearest.y,
                color: character.attackColor,
                createdAt: currentTime,
                duration: 200, // 짧고 강렬하게
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
            // Ponytail Spin - Melee AoE (명확한 궤적)
            state.attackEffects.push({
              id: generateId(),
              type: 'spin',
              // 중심점은 렌더링 시 플레이어 위치 사용
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

        // 쿨다운 체크 (0이면 지속 효과)
        const cooldown = weapon.attackCooldown || 0
        if (cooldown > 0) {
          if (currentTime - (weapon.lastAttackTime || 0) < cooldown) return
          weapon.lastAttackTime = currentTime
        }

        switch (weapon.id) {
          case 'black_dye': {
            // 흑채 뿌리기 - 전방에 장판 생성
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
            // 빗 돌리기 - 지속 회전 (매 프레임 처리)
            if (!weapon.state) weapon.state = { rotation: 0 }
            weapon.state.rotation += deltaTime * 5 * (effect.rotationSpeed || 1)

            const teethCount = effect.teethCount || 3
            const range = effect.range || 80

            for (let i = 0; i < teethCount; i++) {
              const angle = weapon.state.rotation + (Math.PI * 2 * i) / teethCount
              const toothX = state.player.x + Math.cos(angle) * range
              const toothY = state.player.y + Math.sin(angle) * range

              // 각 빗니와 충돌 체크
              state.enemies.forEach(enemy => {
                if (enemy.isDead) return
                const d = distance({ x: toothX, y: toothY }, enemy)
                if (d < 30) {
                  const damage = state.stats.damage * (effect.damagePercent || 0.4)
                  enemy.currentHp -= damage * deltaTime * 3

                  // 넉백 적용
                  const knockbackAngle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
                  const knockbackForce = effect.knockbackForce || 100
                  enemy.x += Math.cos(knockbackAngle) * knockbackForce * deltaTime
                  enemy.y += Math.sin(knockbackAngle) * knockbackForce * deltaTime

                  // 기절 체크
                  if (effect.stunChance && Math.random() < effect.stunChance * deltaTime) {
                    enemy.stunned = true
                    enemy.stunUntil = currentTime + (effect.stunDuration || 0.5) * 1000
                  }
                }
              })
            }

            // 시각 효과
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
            // 헤어스프레이 미사일 - 가장 가까운 적에게 발사
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
            // 헤어드라이어 열파 - 전방 부채꼴 지속 공격
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

                  // 화상 효과
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

            // 시각 효과
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
            // 전동 클리퍼 - 근접 빠른 연속 공격
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

                // 콤보 체크
                weapon.state.comboCount++
                const threshold = effect.comboThreshold || 5
                if (effect.unlimitedCombo || (threshold > 0 && weapon.state.comboCount >= threshold)) {
                  if (effect.comboStrike) {
                    damage = state.stats.damage * effect.comboStrike
                    weapon.state.comboCount = 0
                  }
                }

                // 치명타 보너스
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
            break
          }

          case 'dandruff_bomb': {
            // 비듬 폭탄 - 주기적으로 폭탄 생성
            if (!weapon.state) weapon.state = { bombs: [], lastGeneration: 0 }

            const genInterval = effect.generationInterval || 5000
            const maxBombs = effect.maxBombs || 3

            // 폭탄 생성
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
                  lifeTime: 10000, // 10초 후 자동 폭발
                })
                weapon.state.lastGeneration = currentTime
              }
            }

            // 폭탄 업데이트 & 충돌 체크
            weapon.state.bombs = weapon.state.bombs.filter(bomb => {
              // 적과 충돌 또는 시간 초과
              let shouldExplode = currentTime - bomb.createdAt > bomb.lifeTime

              state.enemies.forEach(enemy => {
                if (enemy.isDead) return
                if (distance(bomb, enemy) < 30) {
                  shouldExplode = true
                }
              })

              if (shouldExplode) {
                // 폭발!
                state.enemies.forEach(enemy => {
                  if (enemy.isDead) return
                  if (distance(bomb, enemy) < bomb.radius) {
                    enemy.currentHp -= bomb.damage

                    // 슬로우 적용
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

                // 폭발 이펙트
                state.explosions.push({
                  id: generateId(),
                  x: bomb.x,
                  y: bomb.y,
                  radius: bomb.radius,
                  createdAt: currentTime,
                })

                // 연쇄 폭발 체크
                if (bomb.chainChance > 0 && Math.random() < bomb.chainChance) {
                  // 새 폭탄 생성
                  const angle = Math.random() * Math.PI * 2
                  weapon.state.bombs.push({
                    ...bomb,
                    id: generateId(),
                    x: bomb.x + Math.cos(angle) * 40,
                    y: bomb.y + Math.sin(angle) * 40,
                    createdAt: currentTime,
                  })
                }

                return false // 폭탄 제거
              }
              return true // 폭탄 유지
            })
            break
          }
        }
      })

      // Update sub weapon projectiles (미사일 등)
      state.subWeaponProjectiles = state.subWeaponProjectiles.filter(proj => {
        proj.x += proj.vx * deltaTime
        proj.y += proj.vy * deltaTime

        // 적과 충돌 체크
        let hit = false
        state.enemies.forEach(enemy => {
          if (enemy.isDead || hit) return
          if (distance(proj, enemy) < 30) {
            hit = true
          }
        })

        if (hit || currentTime - proj.createdAt > 5000) {
          // 폭발
          if (proj.type === 'hair_spray_missile') {
            // 폭발 피해
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

            // 스프레이 구름 생성
            state.subWeaponEffects.push({
              id: generateId(),
              type: 'spray_cloud',
              x: proj.x,
              y: proj.y,
              radius: proj.radius,
              damagePerSecond: proj.cloudDamage,
              duration: proj.cloudDuration * 1000,
              createdAt: currentTime,
            })

            state.explosions.push({
              id: generateId(),
              x: proj.x,
              y: proj.y,
              radius: proj.radius,
              createdAt: currentTime,
            })
          }
          return false
        }
        return true
      })

      // Update sub weapon effects (장판, 구름 등)
      state.subWeaponEffects = state.subWeaponEffects.filter(effect => {
        const elapsed = currentTime - effect.createdAt
        if (elapsed > effect.duration) return false

        // 지속 피해 적용
        if (effect.damagePerSecond) {
          state.enemies.forEach(enemy => {
            if (enemy.isDead) return
            if (distance(effect, enemy) < effect.radius) {
              const damage = state.stats.damage * effect.damagePerSecond * deltaTime
              enemy.currentHp -= damage

              // 슬로우
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

      // Handle enemy debuffs (burning, stunned, slowed)
      state.enemies.forEach(enemy => {
        // 화상 피해
        if (enemy.burning && currentTime < enemy.burnUntil) {
          enemy.currentHp -= enemy.burnDamage * deltaTime
        } else {
          enemy.burning = false
        }

        // 기절 해제
        if (enemy.stunned && currentTime >= enemy.stunUntil) {
          enemy.stunned = false
        }

        // 슬로우 해제
        if (enemy.slowed && currentTime >= enemy.slowUntil) {
          enemy.slowed = false
        }
      })

      // Handle dead enemies
      const deadEnemies = state.enemies.filter((e) => e.currentHp <= 0)
      deadEnemies.forEach((enemy) => {
        state.kills += 1

        // Life Steal Check
        if (state.stats.lifeSteal > 0 && Math.random() < 0.2) { // 20% chance to trigger lifesteal calculation
          // Minoxidil: "Chance to heal 3 HP" -> handled as chance here or in stat logic
          // Let's simplified: lifeSteal = chance to heal 1HP or value
          // Current logic: lifeSteal is just a flag/value. 
          // Updated logic: if (Math.random() < state.stats.lifeSteal)
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
          // 서브 웨폰 + 아이템 혼합 옵션 생성
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
          // Glow
          const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 15)
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)')
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(sx, sy, 15, 0, Math.PI * 2)
          ctx.fill()

          // Core
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
        if (elapsed > duration) return // 만료된 이펙트 건너뛰기

        const progress = elapsed / duration

        switch (effect.type) {
          case 'aoe':
            // 플레이어 중심으로 확산
            const aoeX = (state.player.x - state.camera.x)
            const aoeY = (state.player.y - state.camera.y)
            const currentRadius = effect.maxRadius * progress // 0 -> maxRadius 확산

            ctx.shadowBlur = 0
            ctx.fillStyle = effect.color
            ctx.globalAlpha = 0.5 * (1 - progress) // 점점 투명해짐
            ctx.beginPath()
            ctx.arc(aoeX, aoeY, currentRadius, 0, Math.PI * 2)
            ctx.fill()

            // 경계선 (충격파 느낌)
            ctx.globalAlpha = 0.8 * (1 - progress)
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(aoeX, aoeY, currentRadius, 0, Math.PI * 2)
            ctx.stroke()

            ctx.globalAlpha = 1
            break

          case 'beam':
            // 플레이어 위치(현재)에서 타겟 위치로
            const startX = state.player.x - state.camera.x
            const startY = state.player.y - state.camera.y
            const endX = effect.x2 - state.camera.x
            const endY = effect.y2 - state.camera.y

            ctx.globalAlpha = 1 - progress

            // Core Beam
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()

            // Outer Glow
            ctx.strokeStyle = effect.color
            ctx.lineWidth = 8 + Math.sin(progress * Math.PI * 10) * 4 // 펄스 효과
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
            // 플레이어 중심 회전 (낫/머리카락 이펙트)
            const spinX = state.player.x - state.camera.x
            const spinY = state.player.y - state.camera.y
            const spinAngle = effect.angle + (progress * Math.PI * 4)

            ctx.save()
            ctx.translate(spinX, spinY)
            ctx.rotate(spinAngle)

            // 1. Main Scythe/Hair Blade (초승달 모양)
            // 갈색 그라데이션
            const bladeGrad = ctx.createLinearGradient(0, -effect.radius, 0, effect.radius)
            bladeGrad.addColorStop(0, '#8B4513') // 진한 갈색
            bladeGrad.addColorStop(0.5, '#D2691E') // 초콜릿색
            bladeGrad.addColorStop(1, 'rgba(210, 105, 30, 0)') // 투명

            ctx.fillStyle = bladeGrad
            ctx.beginPath()
            // 바깥쪽 호
            ctx.arc(0, 0, effect.radius, 0, Math.PI * 1.5, false)
            // 안쪽 호 (더 작게) - 초승달 모양 만들기
            ctx.arc(0, 0, effect.radius * 0.7, Math.PI * 1.5, 0, true)
            ctx.closePath()
            ctx.fill()

            // 2. Hair Details (머리카락 결)
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)'
            ctx.lineWidth = 2
            for (let i = 0; i < 5; i++) {
              ctx.beginPath()
              // 약간씩 다른 반지름으로 선 그리기
              ctx.arc(0, 0, effect.radius * (0.75 + i * 0.05), 0, Math.PI * 1.2)
              ctx.stroke()
            }

            // 3. Sharp Edge (날카로운 끝부분)
            ctx.strokeStyle = '#FFF8DC' // 크림색 (하이라이트)
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(0, 0, effect.radius, 0, Math.PI * 1.0) // 앞부분만
            ctx.stroke()

            ctx.restore()

            // 옅은 범위 표시 (보조)
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

      // Draw sub weapon effects (zones, clouds, etc.)
      state.subWeaponEffects.forEach(effect => {
        const sx = effect.x - state.camera.x
        const sy = effect.y - state.camera.y

        if (sx < -200 || sx > canvas.width + 200 || sy < -200 || sy > canvas.height + 200) return

        const elapsed = currentTime - effect.createdAt
        const progress = elapsed / effect.duration

        switch (effect.type) {
          case 'black_dye_zone': {
            // 검은 장판
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

            // 어두운 테두리
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(sx, sy, effect.radius * 0.9, 0, Math.PI * 2)
            ctx.stroke()

            ctx.globalAlpha = 1
            break
          }

          case 'spray_cloud': {
            // 스프레이 구름
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
            break
          }
        }
      })

      // Draw hair brush barrier (if active)
      state.attackEffects.filter(e => e.type === 'hair_brush_spin').forEach(effect => {
        const cx = state.player.x - state.camera.x
        const cy = state.player.y - state.camera.y

        // 빗니 그리기
        for (let i = 0; i < effect.teethCount; i++) {
          const angle = effect.rotation + (Math.PI * 2 * i) / effect.teethCount
          const tx = cx + Math.cos(angle) * effect.range
          const ty = cy + Math.sin(angle) * effect.range

          // 빗니 본체
          ctx.fillStyle = '#8B4513'
          ctx.beginPath()
          ctx.ellipse(tx, ty, 15, 8, angle, 0, Math.PI * 2)
          ctx.fill()

          // 빗니 하이라이트
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.beginPath()
          ctx.ellipse(tx - 3, ty - 3, 6, 3, angle, 0, Math.PI * 2)
          ctx.fill()
        }

        // 궤적 표시
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(cx, cy, effect.range, 0, Math.PI * 2)
        ctx.stroke()
      })

      // Draw hair dryer cone
      state.attackEffects.filter(e => e.type === 'hair_dryer_cone').forEach(effect => {
        const cx = state.player.x - state.camera.x
        const cy = state.player.y - state.camera.y

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(effect.angle)

        // 열파 부채꼴
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

      // Draw sub weapon projectiles
      state.subWeaponProjectiles.forEach(proj => {
        const px = proj.x - state.camera.x
        const py = proj.y - state.camera.y

        if (proj.type === 'hair_spray_missile') {
          // 미사일 본체
          ctx.fillStyle = '#00FF00'
          ctx.beginPath()
          ctx.arc(px, py, 8, 0, Math.PI * 2)
          ctx.fill()

          // 트레일
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px - proj.vx * 0.05, py - proj.vy * 0.05)
          ctx.stroke()
        }
      })

      // Draw dandruff bombs (from weapon state)
      const dandruffWeapon = state.inventory.find(w => w.id === 'dandruff_bomb')
      if (dandruffWeapon && dandruffWeapon.state && dandruffWeapon.state.bombs) {
        dandruffWeapon.state.bombs.forEach(bomb => {
          const bx = bomb.x - state.camera.x
          const by = bomb.y - state.camera.y

          const elapsed = currentTime - bomb.createdAt
          const pulse = 1 + Math.sin(elapsed / 200) * 0.1

          // 폭탄 본체
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(bx, by, 12 * pulse, 0, Math.PI * 2)
          ctx.fill()

          // 테두리
          ctx.strokeStyle = '#888'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(bx, by, 12 * pulse, 0, Math.PI * 2)
          ctx.stroke()

          // 폭발 범위 표시 (희미하게)
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
              ctx.globalAlpha = 1 - (enemy.deathTimer / 0.5) // Fade Out
              ctx.scale(1 + enemy.deathTimer, 1 - enemy.deathTimer) // Squash/Stretch effect? Or just fade
            }
            if (enemy.rotation) ctx.rotate(enemy.rotation)

            // Flash white on hit could be cool but keeping it simple first

            ctx.drawImage(img, -enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size)
            ctx.restore()

            // HP bar (Only if alive)
            if (!enemy.isDead) {
              const hpPercent = enemy.currentHp / (enemy.maxHp || enemy.hp)
              const barWidth = enemy.size * 0.8
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
              ctx.fillRect(sx - barWidth / 2, sy + enemy.size / 2 + 5, barWidth, 6)
              ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#f44336'
              ctx.fillRect(sx - barWidth / 2, sy + enemy.size / 2 + 5, barWidth * Math.max(0, hpPercent), 6)
            }
          }
        }
      })

      // Draw player
      // Draw player
      const playerSx = state.player.x - state.camera.x
      const playerSy = state.player.y - state.camera.y
      const playerImg = loadedImages[SPRITES.characters[state.player.character.id]]
      if (playerImg) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        ctx.ellipse(playerSx, playerSy + 30, 25, 10, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.translate(playerSx, playerSy)

        // Walking Animation
        const isMoving = state.keys.w || state.keys.s || state.keys.a || state.keys.d
        if (isMoving) {
          // 뒤뚱거림 (Waddle)
          const waddle = Math.sin(state.gameTime * 15) * 0.1
          ctx.rotate(waddle)

          // 통통 튐 (Bobbing)
          const bob = Math.abs(Math.sin(state.gameTime * 20)) * 5
          ctx.translate(0, -bob)
        }

        // 왼쪽으로 이동 시 좌우 반전
        if (state.keys.a) {
          ctx.scale(-1, 1)
        }

        ctx.drawImage(playerImg, -32, -40, 64, 64)
        ctx.restore()
      }

      // Draw enemy projectiles (담배 탄막)
      state.enemyProjectiles.forEach((proj) => {
        const px = proj.x - state.camera.x
        const py = proj.y - state.camera.y
        if (px > -20 && px < canvas.width + 20 && py > -20 && py < canvas.height + 20) {
          // Glow effect
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, proj.size + 5)
          gradient.addColorStop(0, 'rgba(255, 100, 50, 0.9)')
          gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.5)')
          gradient.addColorStop(1, 'rgba(100, 50, 0, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(px, py, proj.size + 5, 0, Math.PI * 2)
          ctx.fill()
          // Core
          ctx.fillStyle = '#FF6600'
          ctx.beginPath()
          ctx.arc(px, py, proj.size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw explosions (소주 폭발)
      state.explosions.forEach((exp) => {
        const ex = exp.x - state.camera.x
        const ey = exp.y - state.camera.y
        const elapsed = currentTime - exp.createdAt
        const progress = elapsed / 500
        const radius = exp.radius * Math.min(1, progress * 2)
        const alpha = 1 - progress

        // Explosion ring
        ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`
        ctx.lineWidth = 8 * (1 - progress)
        ctx.beginPath()
        ctx.arc(ex, ey, radius, 0, Math.PI * 2)
        ctx.stroke()

        // Inner glow
        const gradient = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius)
        gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.5})`)
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.3})`)
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(ex, ey, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw damage numbers
      state.damageNumbers.forEach((dn) => {
        const elapsed = currentTime - dn.createdAt
        const progress = elapsed / 800
        const sx = dn.x - state.camera.x
        const sy = dn.y - state.camera.y - progress * 40

        const scale = 1 + Math.sin(progress * Math.PI) * 0.5 // Pop effect
        ctx.save()
        ctx.translate(sx, sy)
        ctx.scale(scale, scale)
        ctx.font = '20px "Press Start 2P", cursive'
        ctx.fillStyle = `rgba(255, 235, 59, ${1 - progress})` // Yellowish
        if (dn.isCrit) ctx.fillStyle = `rgba(255, 82, 82, ${1 - progress})` // Red for crit (if property exists)
        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - progress})`
        ctx.lineWidth = 4
        ctx.lineJoin = 'round' // Rounded corners on stroke prevent spikes
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
  }, [gamePhase])

  // Start game
  const startGame = useCallback(() => {
    if (!selectedCharacter) return
    initGame(selectedCharacter)
    setGamePhase('playing')
  }, [selectedCharacter, initGame])

  // Handle upgrade selection
  const handleUpgrade = useCallback((upgrade) => {
    if (gameStateRef.current) {
      if (upgrade.isSubWeapon) {
        // 서브 웨폰 처리
        const weaponData = upgrade.weaponData || getSubWeaponById(upgrade.id)
        if (weaponData) {
          gameStateRef.current.inventory = handleSubWeaponSelection(
            weaponData,
            gameStateRef.current.inventory
          )
        }
      } else {
        // 기존 아이템 처리
        gameStateRef.current.stats = upgrade.effect(gameStateRef.current.stats)
        gameStateRef.current.inventory.push(upgrade)
      }
    }
    setLevelUpOptions([])
    setGamePhase('playing')
  }, [])

  // Restart game
  const restart = useCallback(() => {
    setGamePhase('menu')
    setSelectedCharacter(null)
    gameStateRef.current = null
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#111',
      overflow: 'hidden',
      fontFamily: '"Noto Sans KR", sans-serif',
    }}>
      {/* Main App Container - Fixed Resolution */}
      <div style={{
        width: GAME_CONFIG.CANVAS_WIDTH,
        height: GAME_CONFIG.CANVAS_HEIGHT,
        position: 'relative',
        background: '#000',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* MENU SCREEN - HoloCure Style */}
        {gamePhase === 'menu' && (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${SPRITES.ui.menu})`, // Use Holo Menu BG
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '60px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
            {/* Decorative triangles - REMOVED (Conflicting with Image BG) */}

            {/* Floating character silhouettes */}
            {CHARACTERS.map((char, i) => (
              <div key={char.id} style={{
                position: 'absolute',
                bottom: '5%',
                left: `${15 + i * 18}%`,
                opacity: 0.2,
                filter: `hue-rotate(${i * 60}deg)`,
                transform: `scale(${1 + i * 0.1})`,
              }}>
                <img src={SPRITES.characters[char.id]} alt="" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
              </div>
            ))}


            {/* Left Side - Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 1 }}>
              {/* Main Title - Text with Pixel Style */}
              <div style={{ position: 'relative', marginBottom: '40px' }}>
                <h1 style={{
                  fontFamily: '"NeoDunggeunmo", "Press Start 2P", cursive, sans-serif',
                  fontSize: '64px',
                  color: '#FFD700',
                  textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                  lineHeight: '1.2',
                  textAlign: 'left'
                }}>
                  머리카락<br />
                  <span style={{ fontSize: '80px', color: '#fff', textShadow: '6px 6px 0 #333' }}>서바이버</span>
                </h1>
                <p style={{
                  fontFamily: '"NeoDunggeunmo", monospace',
                  fontSize: '24px',
                  color: '#fff',
                  marginTop: '20px',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '5px 15px',
                  borderRadius: '5px'
                }}>
                  - ALOPECIA SURVIVOR -
                </p>
              </div>

              {/* Version */}
              <p style={{ color: '#5A8AA8', fontSize: '14px', marginTop: '40px' }}>
                version DEMO 1.0.0
              </p>
            </div>

            {/* Right Side - Menu Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1 }}>
              {[
                { label: 'Play', icon: '🎮', action: () => setGamePhase('characterSelect') },
                { label: 'Shop', icon: '🏪', action: () => setGamePhase('shop') },
                { label: 'Leaderboard', icon: '🏆', disabled: true },
                { label: 'Achievements', icon: '🎖️', disabled: true },
                { label: 'Settings', icon: '⚙️', disabled: true },
                { label: 'Credits', icon: '📜', disabled: true },
              ].map((btn, i) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  style={{
                    width: '220px',
                    padding: '16px 24px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    background: i === 0 ? '#fff' : 'rgba(50, 80, 100, 0.85)',
                    color: i === 0 ? '#333' : '#fff',
                    border: i === 0 ? '4px solid #333' : '3px solid #234',
                    borderRadius: '8px',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    opacity: btn.disabled ? 0.6 : 1,
                    boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { if (!btn.disabled) e.target.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)' }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            {/* Coins display */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'rgba(0,0,0,0.7)',
              padding: '10px 20px',
              borderRadius: '8px',
              color: '#FFD700',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              💰 {coins.toLocaleString()}
            </div>
          </div>
        )}

        {/* CHARACTER SELECT SCREEN */}
        {gamePhase === 'characterSelect' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            padding: '40px',
            gap: '40px',
            boxSizing: 'border-box',
          }}>
            {/* Left - Selected Character Detail */}
            <div style={{
              width: '300px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '16px',
              padding: '30px',
              border: '3px solid #444',
            }}>
              {selectedCharacter ? (
                <>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto 20px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${selectedCharacter.color}40, ${selectedCharacter.color}20)`,
                    border: `3px solid ${selectedCharacter.color}`,
                  }}>
                    <img src={SPRITES.characters[selectedCharacter.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <h2 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px' }}>{selectedCharacter.name}</h2>
                  <p style={{ color: selectedCharacter.color, textAlign: 'center', fontWeight: 'bold', margin: '0 0 20px' }}>{selectedCharacter.weapon}</p>

                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: '❤️', label: 'HP', value: '100', color: '#ff6b6b' },
                      { icon: '⚔️', label: 'ATK', value: '+0%', color: '#ffd700' },
                      { icon: '🏃', label: 'SPD', value: '+0%', color: '#87ceeb' },
                      { icon: '💥', label: 'CRT', value: '+5%', color: '#ff69b4' },
                      { icon: '🧲', label: 'Pickup', value: '+0%', color: '#00ffff' },
                      { icon: '⚡', label: 'Haste', value: '+0%', color: '#ffff00' },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px' }}>
                        <span>{stat.icon} {stat.label}</span>
                        <span style={{ color: stat.color }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: '#888', textAlign: 'center' }}>캐릭터를 선택하세요</p>
              )}
            </div>

            {/* Right - Character Grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ color: '#FFD700', fontSize: '36px', marginBottom: '30px' }}>🎮 캐릭터 선택</h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {CHARACTERS.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    style={{
                      background: selectedCharacter?.id === char.id ? `linear-gradient(135deg, ${char.color}60, ${char.color}30)` : 'rgba(30, 40, 60, 0.9)',
                      border: `4px solid ${selectedCharacter?.id === char.id ? char.color : '#444'}`,
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '80px', height: '80px', margin: '0 auto 10px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                      <img src={SPRITES.characters[char.id]} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h3 style={{ color: '#fff', margin: '0 0 5px', fontSize: '16px' }}>{char.name}</h3>
                    <p style={{ color: char.color, margin: 0, fontSize: '12px' }}>{char.weapon}</p>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
                <button onClick={() => setGamePhase('menu')} style={{ padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}>
                  ← 뒤로가기
                </button>
                <button
                  onClick={startGame}
                  disabled={!selectedCharacter || !imagesLoaded}
                  style={{
                    padding: '15px 60px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: selectedCharacter ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(100,100,100,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedCharacter ? 'pointer' : 'not-allowed',
                    boxShadow: selectedCharacter ? '0 4px 20px rgba(102,126,234,0.5)' : 'none',
                  }}
                >
                  {!imagesLoaded ? '로딩 중...' : '🎮 게임 시작'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SHOP SCREEN */}
        {gamePhase === 'shop' && (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #87CEEB 0%, #B0E2FF 100%)',
            display: 'flex',
            padding: '40px',
            position: 'relative',
            boxSizing: 'border-box',
          }}>
            {/* Left - Shop NPC */}
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h1 style={{ color: '#234', fontSize: '48px', fontWeight: 'bold', textShadow: '2px 2px 0 #fff', marginBottom: '20px' }}>SHOP</h1>
              <div style={{ fontSize: '150px', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))' }}>🧑‍💼</div>
            </div>

            {/* Right - Items Grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Coins */}
              <div style={{ alignSelf: 'flex-end', background: 'rgba(0,0,0,0.7)', padding: '12px 25px', borderRadius: '8px', marginBottom: '20px' }}>
                <span style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>💰 {coins.toLocaleString()}</span>
              </div>

              {/* Items Grid */}
              <div style={{
                background: 'rgba(50,80,100,0.85)',
                borderRadius: '12px',
                padding: '20px',
                border: '3px solid #345',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {SHOP_UPGRADES.map((item) => {
                    const level = shopLevels[item.id] || 0
                    const isMaxed = level >= item.maxLevel
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedShopItem(item)}
                        style={{
                          width: '70px',
                          height: '70px',
                          background: selectedShopItem?.id === item.id ? 'rgba(0,200,255,0.3)' : 'rgba(30,50,70,0.8)',
                          border: selectedShopItem?.id === item.id ? '3px solid #00BFFF' : '2px solid #456',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <span style={{ fontSize: '28px' }}>{item.icon}</span>
                        <div style={{ position: 'absolute', bottom: '2px', display: 'flex', gap: '2px' }}>
                          {Array.from({ length: item.maxLevel }, (_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', background: i < level ? '#FFD700' : '#555', borderRadius: '1px' }} />
                          )).slice(0, 5)}
                        </div>
                        {isMaxed && <div style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '10px', color: '#FFD700' }}>MAX</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Item Description */}
              {selectedShopItem && (
                <div style={{
                  background: 'rgba(30,50,70,0.9)',
                  borderRadius: '8px',
                  padding: '15px 20px',
                  border: '2px solid #00BFFF',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '40px' }}>{selectedShopItem.icon}</span>
                    <div>
                      <h3 style={{ color: '#fff', margin: 0 }}>{selectedShopItem.name}</h3>
                      <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>{selectedShopItem.description}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#FF6B6B', fontSize: '18px', fontWeight: 'bold' }}>
                      Cost: {selectedShopItem.cost * ((shopLevels[selectedShopItem.id] || 0) + 1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() => {
                    if (!selectedShopItem) return
                    const level = shopLevels[selectedShopItem.id] || 0
                    const cost = selectedShopItem.cost * (level + 1)
                    if (coins >= cost && level < selectedShopItem.maxLevel) {
                      setCoins(prev => { localStorage.setItem('hairSurvivor_coins', prev - cost); return prev - cost })
                      setShopLevels(prev => { const next = { ...prev, [selectedShopItem.id]: level + 1 }; localStorage.setItem('hairSurvivor_shopLevels', JSON.stringify(next)); return next })
                    }
                  }}
                  disabled={!selectedShopItem || coins < (selectedShopItem?.cost * ((shopLevels[selectedShopItem?.id] || 0) + 1)) || (shopLevels[selectedShopItem?.id] || 0) >= selectedShopItem?.maxLevel}
                  style={{ padding: '15px 50px', fontSize: '18px', fontWeight: 'bold', background: '#4A7C99', color: '#fff', border: '3px solid #345', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Buy
                </button>
                <button
                  onClick={() => {
                    if (!selectedShopItem) return
                    const level = shopLevels[selectedShopItem.id] || 0
                    if (level > 0) {
                      const refund = Math.floor(selectedShopItem.cost * level * 0.8)
                      setCoins(prev => { localStorage.setItem('hairSurvivor_coins', prev + refund); return prev + refund })
                      setShopLevels(prev => { const next = { ...prev, [selectedShopItem.id]: level - 1 }; localStorage.setItem('hairSurvivor_shopLevels', JSON.stringify(next)); return next })
                    }
                  }}
                  disabled={!selectedShopItem || (shopLevels[selectedShopItem?.id] || 0) <= 0}
                  style={{ padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Refund
                </button>
                <button onClick={() => setGamePhase('menu')} style={{ marginLeft: 'auto', padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}>
                  ← 뒤로가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME SCREEN */}
        {(gamePhase === 'playing' || gamePhase === 'levelup' || gamePhase === 'paused') && (
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

            {/* HUD */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              gap: '15px',
              alignItems: 'flex-start',
            }}>
              {/* Character Portrait */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '12px',
                padding: '10px',
                border: '3px solid #444',
              }}>
                <img
                  src={SPRITES.characters[selectedCharacter?.id]}
                  alt=""
                  style={{ width: '60px', height: '60px', borderRadius: '8px' }}
                />
                <div style={{
                  marginTop: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(displayStats.xp / displayStats.xpNeeded) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00BFFF, #00FFFF)',
                  }} />
                </div>
              </div>

              {/* HP Bar */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '8px',
                padding: '8px 15px',
                border: '2px solid #444',
              }}>
                <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                  ❤️ HP {displayStats.hp} / {displayStats.maxHp}
                  {displayStats.shield > 0 && <span style={{ color: '#00BFFF' }}> 🛡️x{displayStats.shield}</span>}
                </div>
                <div style={{
                  width: '200px',
                  height: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(displayStats.hp / displayStats.maxHp) * 100}%`,
                    height: '100%',
                    background: displayStats.hp > displayStats.maxHp * 0.3
                      ? 'linear-gradient(90deg, #ff6b6b, #ff4757)'
                      : 'linear-gradient(90deg, #ff0000, #8b0000)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>

            {/* Top Right HUD */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '12px',
              padding: '15px',
              border: '3px solid #444',
              textAlign: 'right',
            }}>
              <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>
                LV. {displayStats.level}
              </div>
              <div style={{ color: '#87CEEB', fontSize: '18px', marginTop: '5px' }}>
                ⏱️ {formatTime(displayStats.time)}
              </div>
              <div style={{ color: '#FF6B6B', fontSize: '18px', marginTop: '5px' }}>
                💀 {displayStats.kills}
              </div>
            </div>

            {/* Level Up Modal - HoloCure Style */}
            {gamePhase === 'levelup' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  position: 'relative',
                  width: '800px',
                  height: '450px',
                  backgroundImage: `url(${SPRITES.ui.bg_levelup})`,
                  backgroundSize: '100% 100%',
                  display: 'flex',
                  padding: '20px 40px',
                  gap: '20px',
                  imageRendering: 'pixelated'
                }}>
                  {/* Left Panel - Character & Stats */}
                  <div style={{
                    width: '30%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '30px'
                  }}>
                    {/* Portrait */}
                    <div style={{
                      position: 'relative',
                      width: '120px',
                      height: '140px',
                      marginBottom: '10px'
                    }}>
                      {/* Character BG & Frame */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${SPRITES.ui.char_bg})`,
                        backgroundSize: '100% 100%',
                        zIndex: 0
                      }} />
                      <img
                        src={SPRITES.characters[selectedCharacter.id]}
                        alt=""
                        style={{
                          position: 'absolute',
                          bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                          width: '80px', height: '80px', objectFit: 'contain',
                          imageRendering: 'pixelated', zIndex: 1
                        }}
                      />
                      <div style={{
                        position: 'absolute', inset: -5,
                        backgroundImage: `url(${SPRITES.ui.char_frame})`,
                        backgroundSize: '100% 100%',
                        zIndex: 2
                      }} />
                    </div>

                    <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '15px' }}>{selectedCharacter.name.toUpperCase()}</h2>

                    {/* Stats List */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {[
                        { icon: SPRITES.ui.icon_hp, label: 'HP', value: `${displayStats.hp} / ${displayStats.maxHp}`, color: '#ff6b6b' },
                        { icon: SPRITES.ui.icon_atk, label: 'ATK', value: `+${Math.floor((gameStateRef.current?.stats?.damage / 30 - 1) * 100)}%`, color: '#ffd700' },
                        { icon: SPRITES.ui.icon_spd, label: 'SPD', value: `+${Math.floor((gameStateRef.current?.stats?.moveSpeed - 1) * 100)}%`, color: '#87ceeb' },
                        { icon: SPRITES.ui.icon_crt, label: 'CRT', value: '+5%', color: '#ff69b4' },
                        { icon: SPRITES.ui.icon_pickup, label: 'Pickup', value: '+0%', color: '#00ffff' },
                        { icon: SPRITES.ui.icon_haste, label: 'Haste', value: `+${Math.floor((gameStateRef.current?.stats?.attackSpeed / 1.5 - 1) * 100)}%`, color: '#ffff00' },
                      ].map(stat => (
                        <div key={stat.label} style={{ display: 'flex', alignItems: 'center', color: '#fff', fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '2px 5px' }}>
                          <img src={stat.icon} alt="" style={{ width: '16px', height: '16px', marginRight: '5px' }} />
                          <span style={{ width: '50px' }}>{stat.label}</span>
                          <span style={{ marginLeft: 'auto', color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Upgrade Options */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingTop: '20px',
                    overflowY: 'auto'
                  }}>
                    <h1 style={{
                      fontFamily: '"Press Start 2P", cursive, sans-serif',
                      color: '#fff',
                      fontSize: '48px',
                      margin: '0 0 20px',
                      textAlign: 'center',
                      textShadow: '4px 4px 0 #000, -2px -2px 0 #000',
                      letterSpacing: '2px'
                    }}>
                      LEVEL UP!
                    </h1>

                    {levelUpOptions.map((upgrade, index) => (
                      <div
                        key={upgrade.id + index}
                        onClick={() => handleUpgrade(upgrade)}
                        style={{
                          position: 'relative',
                          height: '80px',
                          background: upgrade.isSubWeapon
                            ? 'linear-gradient(90deg, rgba(80,40,0,0.8) 0%, rgba(40,20,0,0.4) 100%)'
                            : 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
                          border: upgrade.isSubWeapon ? '2px solid #FFD700' : '2px solid #00BFFF',
                          borderRadius: '0 20px 20px 0',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '0 20px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = upgrade.isSubWeapon
                            ? 'linear-gradient(90deg, rgba(255,200,0,0.4) 0%, rgba(40,20,0,0.4) 100%)'
                            : 'linear-gradient(90deg, rgba(0,191,255,0.4) 0%, rgba(0,0,0,0.4) 100%)'
                          e.currentTarget.style.transform = 'translateX(10px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = upgrade.isSubWeapon
                            ? 'linear-gradient(90deg, rgba(80,40,0,0.8) 0%, rgba(40,20,0,0.4) 100%)'
                            : 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        {/* Icon Box */}
                        <div style={{
                          width: '60px', height: '60px',
                          backgroundImage: `url(${SPRITES.ui.box_item})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginRight: '15px',
                          position: 'relative'
                        }}>
                          {upgrade.isSubWeapon ? (
                            // 서브 웨폰 아이콘 (임시 이모지)
                            <span style={{ fontSize: '28px' }}>
                              {upgrade.id === 'black_dye' && '🖤'}
                              {upgrade.id === 'hair_brush' && '🪥'}
                              {upgrade.id === 'hair_spray' && '💨'}
                              {upgrade.id === 'hair_dryer' && '🔥'}
                              {upgrade.id === 'electric_clipper' && '⚡'}
                              {upgrade.id === 'dandruff_bomb' && '💣'}
                            </span>
                          ) : (
                            <img src={SPRITES.items[upgrade.icon]} alt="" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} />
                          )}
                          {/* 등급 배지 */}
                          {upgrade.isSubWeapon && (
                            <div style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: upgrade.grade === 3 ? '#FFD700' : upgrade.grade === 2 ? '#C0C0C0' : '#CD7F32',
                              color: '#000',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '2px 5px',
                              borderRadius: '4px'
                            }}>
                              ★{upgrade.grade}
                            </div>
                          )}
                        </div>

                        {/* Text Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{upgrade.name}</span>
                            <span style={{ color: upgrade.isSubWeapon ? '#FFD700' : '#FFD700', fontSize: '12px' }}>
                              {upgrade.isSubWeapon
                                ? (upgrade.currentLevel > 0 ? `LV ${upgrade.currentLevel} → ${upgrade.nextLevel}` : 'NEW! >> 무기')
                                : `NEW! >> ${upgrade.type}`
                              }
                            </span>
                          </div>
                          <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.2' }}>
                            {upgrade.description}
                          </div>
                        </div>
                      </div>
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
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Main Pause Menu */}
                {pauseTab === 'main' && (
                  <div style={{
                    width: '300px',
                    background: 'linear-gradient(180deg, #4AA9FF 0%, #0077EA 100%)',
                    borderRadius: '10px',
                    padding: '20px',
                    border: '4px solid #fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    alignItems: 'center',
                    boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                  }}>
                    <h2 style={{ color: '#fff', fontSize: '32px', margin: '0 0 10px', textShadow: '2px 2px 0 #000', fontFamily: 'Impact, sans-serif' }}>PAUSED</h2>

                    {[
                      { label: 'Character', action: () => setPauseTab('character') },
                      { label: 'Settings', disabled: true },
                      { label: 'Resume', action: () => setGamePhase('playing') },
                      { label: 'Quit', action: () => { setGamePhase('menu'); setSelectedCharacter(null); gameStateRef.current = null; } }
                    ].map((btn, i) => (
                      <div
                        key={btn.label}
                        onClick={btn.action}
                        style={{
                          width: '100%',
                          height: '50px',
                          backgroundImage: `url(${SPRITES.ui.button})`, // Use Imported Button Sprite
                          backgroundSize: '100% 100%', // Stretch
                          backgroundRepeat: 'no-repeat',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: btn.disabled ? '#888' : '#333',
                          fontSize: '20px', fontWeight: 'bold',
                          cursor: btn.disabled ? 'not-allowed' : 'pointer',
                          opacity: btn.disabled ? 0.7 : 1,
                          imageRendering: 'pixelated',
                          textShadow: '1px 1px 0 #fff'
                        }}
                      >
                        {btn.label}
                      </div>
                    ))}
                  </div>
                )}

                {/* Character Details Screen */}
                {pauseTab === 'character' && (
                  <div style={{
                    position: 'relative',
                    width: '900px',
                    height: '550px',
                    background: 'rgba(20, 20, 30, 0.95)',
                    borderRadius: '16px',
                    border: '2px solid #444',
                    display: 'flex',
                    padding: '30px',
                    gap: '30px',
                    color: '#fff'
                  }}>
                    {/* Close Button */}
                    <button
                      onClick={() => setPauseTab('main')}
                      style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                    >
                      ESC / BACK
                    </button>

                    {/* Left - Character Stats */}
                    <div style={{ width: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <img
                          src={SPRITES.characters[selectedCharacter.id]}
                          alt=""
                          style={{ width: '80px', height: '80px', border: '2px solid #fff', borderRadius: '50%', background: '#334', imageRendering: 'pixelated' }}
                        />
                        <div style={{ marginLeft: '15px' }}>
                          <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedCharacter.name}</h2>
                          <p style={{ margin: 0, color: selectedCharacter.color }}>Level {displayStats.level}</p>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px' }}>
                        {[
                          { label: 'HP', val: `${displayStats.hp}/${displayStats.maxHp}`, icon: SPRITES.ui.icon_hp, color: '#ff6b6b' },
                          { label: 'ATK', val: `${Math.round(gameStateRef.current.stats.damage)}`, icon: SPRITES.ui.icon_atk, color: '#ffd700' },
                          { label: 'SPD', val: `${Math.round(gameStateRef.current.stats.moveSpeed * 100)}%`, icon: SPRITES.ui.icon_spd, color: '#87ceeb' },
                          { label: 'CRT', val: `${Math.round((gameStateRef.current.stats.crit || 0) * 100)}%`, icon: SPRITES.ui.icon_crt, color: '#ff69b4' },
                          { label: 'DEF', val: `${Math.round((gameStateRef.current.stats.defense || 0) * 100)}%`, icon: SPRITES.ui.icon_pickup, color: '#aaa' }, // using pickup as placeholder
                        ].map(s => (
                          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <img src={s.icon} style={{ width: '20px', marginRight: '10px' }} />
                              <span>{s.label}</span>
                            </div>
                            <span style={{ color: s.color, fontWeight: 'bold' }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right - Inventory List */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '15px' }}>Inventory</h3>
                      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {gameStateRef.current.inventory.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>No items collected yet.</p>}

                        {gameStateRef.current.inventory.map((item, idx) => (
                          <div key={idx} style={{
                            background: item.isSubWeapon ? 'rgba(80,40,0,0.3)' : 'rgba(255,255,255,0.1)',
                            padding: '10px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            border: item.isSubWeapon ? '1px solid #FFD700' : 'none'
                          }}>
                            <div style={{
                              width: '48px', height: '48px',
                              backgroundImage: `url(${SPRITES.ui.box_item})`,
                              backgroundSize: '100% 100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginRight: '15px'
                            }}>
                              {item.isSubWeapon ? (
                                <span style={{ fontSize: '24px' }}>
                                  {item.id === 'black_dye' && '🖤'}
                                  {item.id === 'hair_brush' && '🪥'}
                                  {item.id === 'hair_spray' && '💨'}
                                  {item.id === 'hair_dryer' && '🔥'}
                                  {item.id === 'electric_clipper' && '⚡'}
                                  {item.id === 'dandruff_bomb' && '💣'}
                                </span>
                              ) : (
                                <img src={SPRITES.items[item.icon]} style={{ width: '24px', height: '24px', imageRendering: 'pixelated' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', color: item.isSubWeapon ? '#FFD700' : '#fff' }}>
                                {item.name}
                                {item.isSubWeapon && <span style={{ fontSize: '10px', marginLeft: '8px', color: '#888' }}>[무기]</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: '#bbb' }}>{item.description}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#FFD700' }}>
                              LV {item.level || 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* GAME OVER - HoloCure Style */}
        {gamePhase === 'gameover' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            zIndex: 20,
          }}>
            {/* Game Over Title */}
            <h1 style={{
              fontFamily: '"Press Start 2P", cursive, sans-serif',
              fontSize: '48px',
              color: '#fff',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #000',
              marginBottom: '30px',
              letterSpacing: '4px'
            }}>
              GAME OVER
            </h1>

            {/* Stats Summary */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '20px 40px',
              borderRadius: '12px',
              marginBottom: '40px',
              textAlign: 'center',
              border: '2px solid #444'
            }}>
              <div style={{ fontSize: '24px', color: '#ccc', marginBottom: '10px' }}>
                Score: <span style={{ color: '#fff', fontWeight: 'bold' }}>{(displayStats.kills * 50 + displayStats.time * 10 + displayStats.level * 500).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '24px', color: '#FFD700' }}>
                HoloCoins Gained: <span style={{ fontWeight: 'bold' }}>+{(displayStats.kills + Math.floor(displayStats.time / 5)).toLocaleString()}</span>
              </div>
            </div>

            {/* Buttons Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
              {/* Retry - White Button */}
              <button
                onClick={restart}
                style={{
                  padding: '15px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: '#fff',
                  color: '#000',
                  border: '3px solid #000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #bbb',
                  fontFamily: 'monospace'
                }}
              >
                Retry
              </button>

              {/* Character Select - Dark Button */}
              <button
                onClick={() => {
                  setGamePhase('characterSelect')
                  setSelectedCharacter(null)
                  gameStateRef.current = null
                }}
                style={{
                  padding: '12px',
                  fontSize: '18px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                Character Select
              </button>

              {/* Main Menu - Dark Button */}
              <button
                onClick={() => {
                  setGamePhase('menu')
                  setSelectedCharacter(null)
                  gameStateRef.current = null
                }}
                style={{
                  padding: '12px',
                  fontSize: '18px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
