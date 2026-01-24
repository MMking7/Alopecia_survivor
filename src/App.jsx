import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// GAME CONSTANTS
// ============================================================
const GAME_CONFIG = {
  CANVAS_WIDTH: 1024,
  CANVAS_HEIGHT: 768,
  PLAYER_SPEED: 200,
  ENEMY_SPAWN_INTERVAL: 800,
  BOSS_SPAWN_TIME: 120,
  XP_PER_LEVEL: 50,
  LEVEL_XP_MULTIPLIER: 1.3,
  ENEMY_DESPAWN_DISTANCE: 800,
  SPAWN_DISTANCE_MIN: 450,
  SPAWN_DISTANCE_MAX: 600,
}

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

// Sprite paths - using generated pixel art
const SPRITES = {
  background: '/sprites/grass_bg.webp',
  characters: {
    female: '/sprites/char_female_baldness_1769163428088.webp',
    areata: '/sprites/char_areata_1769163447640.webp',
    wongfeihung: '/sprites/char_wong_feihung_1769163464961.webp',
    heihachi: '/sprites/char_heihachi_1769163501406.webp',
  },
  enemies: {
    clipper: '/sprites/enemy_clipper_1769163541753.webp',
    zombie: '/sprites/enemy_zombie_1769163560887.webp',
    dna: '/sprites/enemy_dna_1769163577183.webp',
    cigarette: '/sprites/enemy_cigarette_1769163592604.webp',
    soju: '/sprites/enemy_soju_1769163624862.webp',
  },
  boss: '/sprites/boss_complainant_1769163642840.webp',
}

const CHARACTERS = [
  {
    id: 'female',
    name: '여성형 탈모',
    weapon: 'Equalizer',
    description: '충격파 AoE 공격',
    color: '#FF69B4',
    attackType: 'aoe',
    attackColor: 'rgba(255, 105, 180, 0.4)',
  },
  {
    id: 'areata',
    name: '원형 탈모',
    weapon: 'Hair Loss Beam',
    description: '단일 대상 고데미지 레이저',
    color: '#32CD32',
    attackType: 'beam',
    attackColor: '#00FF00',
  },
  {
    id: 'wongfeihung',
    name: '황비홍',
    weapon: 'Ponytail Spin',
    description: '근접 회전 공격',
    color: '#8B4513',
    attackType: 'spin',
    attackColor: 'rgba(210, 105, 30, 0.6)',
  },
  {
    id: 'heihachi',
    name: '헤이하치',
    weapon: 'Lightning',
    description: '랜덤 번개 공격',
    color: '#FFD700',
    attackType: 'lightning',
    attackColor: '#FFFF00',
  },
]

const ENEMIES = [
  { type: 'clipper', name: '바리깡', speed: 120, hp: 30, damage: 10, xp: 15, size: 48, attackType: 'dash', dashSpeed: 300, dashCooldown: 2000 },
  { type: 'zombie', name: '야근 좀비', speed: 50, hp: 50, damage: 15, xp: 20, size: 56, attackType: 'poison', poisonDuration: 3000 },
  { type: 'dna', name: '유전', speed: 70, hp: 40, damage: 12, xp: 25, size: 52, attackType: 'spiral' },
  { type: 'cigarette', name: '담배', speed: 60, hp: 25, damage: 8, xp: 10, size: 48, attackType: 'ranged', projectileSpeed: 200, attackRange: 280, attackCooldown: 1500 },
  { type: 'soju', name: '소주', speed: 90, hp: 35, damage: 20, xp: 15, size: 52, attackType: 'explosion', explosionRadius: 80 },
]

const BOSS = {
  type: 'boss',
  name: '악성 민원인',
  speed: 80,
  hp: 1500,
  damage: 40,
  xp: 500,
  size: 140,
  attackType: 'boss',
  attackCooldown: 800,
}

const UPGRADES = [
  { id: 'damage', name: '모발 두께', description: '공격력 +20%', icon: '💪', effect: (stats) => ({ ...stats, damage: stats.damage * 1.2 }) },
  { id: 'range', name: '모발 연장', description: '공격 범위 +25%', icon: '📏', effect: (stats) => ({ ...stats, attackRange: stats.attackRange * 1.25 }) },
  { id: 'speed', name: '미역 섭취', description: '공격 속도 +15%', icon: '🥬', effect: (stats) => ({ ...stats, attackSpeed: stats.attackSpeed * 1.15 }) },
  { id: 'heal', name: '검은콩', description: 'HP 20% 회복', icon: '🫘', effect: (stats) => ({ ...stats, hp: Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.2) }) },
  { id: 'shield', name: '글루건', description: '쉴드 1회 추가', icon: '🛡️', effect: (stats) => ({ ...stats, shield: stats.shield + 1 }) },
  { id: 'maxhp', name: '프로페시아', description: '최대 HP +30', icon: '💊', effect: (stats) => ({ ...stats, maxHp: stats.maxHp + 30, hp: stats.hp + 30 }) },
  { id: 'movespeed', name: '칼퇴 본능', description: '이동 속도 +15%', icon: '🏃', effect: (stats) => ({ ...stats, moveSpeed: stats.moveSpeed * 1.15 }) },
]

// Shop permanent upgrades
const SHOP_UPGRADES = [
  { id: 'maxHp', name: 'HP 강화', description: '최대 HP +5% per level', icon: '❤️', cost: 100, maxLevel: 10 },
  { id: 'atk', name: 'ATK 강화', description: '공격력 +3% per level', icon: '⚔️', cost: 150, maxLevel: 10 },
  { id: 'spd', name: 'SPD 강화', description: '이동속도 +2% per level', icon: '🏃', cost: 120, maxLevel: 10 },
  { id: 'crt', name: 'CRT 강화', description: '크리티컬 +2% per level', icon: '💥', cost: 200, maxLevel: 10 },
  { id: 'pickup', name: 'Pickup 강화', description: '습득 범위 +5% per level', icon: '🧲', cost: 80, maxLevel: 10 },
  { id: 'haste', name: 'Haste 강화', description: '공격속도 +2% per level', icon: '⚡', cost: 180, maxLevel: 10 },
  { id: 'heal', name: 'Heal 강화', description: '회복량 +3% per level', icon: '💊', cost: 150, maxLevel: 10 },
  { id: 'luck', name: 'Luck 강화', description: '드랍률 +2% per level', icon: '🎲', cost: 250, maxLevel: 10 },
  { id: 'revival', name: 'Revival', description: '부활 횟수 +1', icon: '💖', cost: 500, maxLevel: 3 },
]

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const generateId = () => Math.random().toString(36).substr(2, 9)
const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const lerp = (a, b, t) => a + (b - a) * t

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
  const [selectedShopItem, setSelectedShopItem] = useState(null)
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
      ]
      await Promise.all(imageSources.map(loadImage))
      setImagesLoaded(true)
    }
    loadAllImages()
  }, [])

  // Initialize game state
  const initGame = useCallback((character) => {
    gameStateRef.current = {
      player: {
        x: 0,
        y: 0,
        size: 64,
        character,
      },
      stats: {
        hp: 100,
        maxHp: 100,
        damage: 30,
        attackSpeed: 1.5,
        attackRange: 150,
        moveSpeed: 1,
        shield: 0,
      },
      enemies: [],
      enemyProjectiles: [],
      xpOrbs: [],
      damageNumbers: [],
      attackEffects: [],
      poisonZones: [],
      explosions: [],
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
    }
  }, [])

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
      if (currentTime - state.lastEnemySpawn > difficulty.spawnRate) {
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

        // 거리가 너무 멀면 제거
        if (dist > GAME_CONFIG.ENEMY_DESPAWN_DISTANCE && enemy.type !== 'boss') {
          enemy.currentHp = -999
        }

        // Damage player on collision (근접 공격)
        if (dist < 40 && enemy.attackType !== 'ranged') {
          if (state.stats.shield > 0) {
            state.stats.shield -= 1
          } else {
            state.stats.hp -= (enemy.scaledDamage || enemy.damage) * deltaTime
            if (state.stats.hp <= 0) {
              setGamePhase('gameover')
            }
          }
        }
      })

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
                enemy.currentHp -= state.stats.damage
                state.damageNumbers.push({
                  id: generateId(),
                  x: enemy.x,
                  y: enemy.y,
                  damage: Math.floor(state.stats.damage),
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

      // Handle dead enemies
      const deadEnemies = state.enemies.filter((e) => e.currentHp <= 0)
      deadEnemies.forEach((enemy) => {
        state.kills += 1
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
        state.xp += orb.value
        if (state.xp >= state.xpNeeded) {
          state.xp = 0
          state.level += 1
          state.xpNeeded = Math.floor(state.xpNeeded * GAME_CONFIG.LEVEL_XP_MULTIPLIER)
          const options = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3)
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

      // Draw enemies
      state.enemies.forEach((enemy) => {
        const sx = enemy.x - state.camera.x
        const sy = enemy.y - state.camera.y

        if (sx > -100 && sx < canvas.width + 100 && sy > -100 && sy < canvas.height + 100) {
          const img = loadedImages[enemy.type === 'boss' ? SPRITES.boss : SPRITES.enemies[enemy.type]]
          if (img) {
            ctx.save()
            ctx.translate(sx, sy)
            if (enemy.rotation) ctx.rotate(enemy.rotation)
            ctx.drawImage(img, -enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size)
            ctx.restore()

            // HP bar
            const hpPercent = enemy.currentHp / (enemy.maxHp || enemy.hp)
            const barWidth = enemy.size * 0.8
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(sx - barWidth / 2, sy + enemy.size / 2 + 5, barWidth, 6)
            ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#f44336'
            ctx.fillRect(sx - barWidth / 2, sy + enemy.size / 2 + 5, barWidth * Math.max(0, hpPercent), 6)
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

        ctx.font = 'bold 20px Arial'
        ctx.fillStyle = `rgba(255, 255, 0, ${1 - progress})`
        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - progress})`
        ctx.lineWidth = 3
        ctx.textAlign = 'center'
        ctx.strokeText(dn.damage.toString(), sx, sy)
        ctx.fillText(dn.damage.toString(), sx, sy)
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
      gameStateRef.current.stats = upgrade.effect(gameStateRef.current.stats)
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
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      overflow: 'hidden',
      fontFamily: '"Noto Sans KR", sans-serif',
    }}>
      {/* MENU SCREEN - HoloCure Style */}
      {gamePhase === 'menu' && (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #87CEEB 0%, #98D8F0 50%, #B0E2FF 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative triangles */}
          <div style={{ position: 'absolute', top: '10%', left: '60%', width: 0, height: 0, borderLeft: '40px solid transparent', borderRight: '40px solid transparent', borderBottom: '60px solid rgba(100, 180, 255, 0.3)', transform: 'rotate(15deg)' }} />
          <div style={{ position: 'absolute', top: '30%', right: '25%', width: 0, height: 0, borderLeft: '25px solid transparent', borderRight: '25px solid transparent', borderBottom: '40px solid rgba(100, 180, 255, 0.2)', transform: 'rotate(-10deg)' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '55%', width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent', borderBottom: '50px solid rgba(100, 180, 255, 0.25)', transform: 'rotate(25deg)' }} />
          
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
            {/* Main Title */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ position: 'absolute', top: '-15px', left: '-10px', fontSize: '12px', color: '#FF69B4' }}>⭐</div>
              <div style={{ position: 'absolute', top: '-20px', right: '20px', fontSize: '14px', color: '#FF69B4' }}>💕</div>
              <div style={{ position: 'absolute', bottom: '-10px', right: '-15px', fontSize: '12px', color: '#FFD700' }}>⭐</div>
              
              <div style={{
                background: 'linear-gradient(180deg, #fff 0%, #f0f0f0 100%)',
                borderRadius: '50px',
                padding: '10px 40px',
                marginBottom: '10px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}>
                <span style={{ fontFamily: 'Arial', fontSize: '14px', color: '#888' }}>머리카락!</span>
              </div>
              
              <h1 style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '3px 3px 0 #FF69B4, 6px 6px 0 #87CEEB, -2px -2px 0 #333',
                margin: 0,
                lineHeight: 1,
              }}>
                머리카락
              </h1>
              <h1 style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '3px 3px 0 #87CEEB, 6px 6px 0 #FF69B4, -2px -2px 0 #333',
                margin: 0,
                lineHeight: 1,
              }}>
                서바이벌!?
              </h1>
              <p style={{
                fontSize: '20px',
                color: '#4A7C99',
                fontWeight: 'bold',
                marginTop: '15px',
                textShadow: '1px 1px 0 #fff',
              }}>
                - 탈모와의 전쟁 -
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
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={GAME_CONFIG.CANVAS_WIDTH}
            height={GAME_CONFIG.CANVAS_HEIGHT}
            style={{
              border: '4px solid #333',
              borderRadius: '8px',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)',
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

          {/* Level Up Modal */}
          {gamePhase === 'levelup' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}>
              <h1 style={{
                color: '#FFD700',
                fontSize: '48px',
                marginBottom: '10px',
                textShadow: '0 0 30px #FFD700',
              }}>
                🎉 레벨 업! 🎉
              </h1>
              <p style={{ color: '#aaa', fontSize: '20px', marginBottom: '40px' }}>
                강화 옵션을 선택하세요
              </p>

              <div style={{ display: 'flex', gap: '25px' }}>
                {levelUpOptions.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    onClick={() => handleUpgrade(upgrade)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(60, 70, 100, 0.95), rgba(40, 50, 80, 0.95))',
                      border: '3px solid #556',
                      borderRadius: '16px',
                      padding: '30px 25px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '180px',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px)'
                      e.currentTarget.style.borderColor = '#FFD700'
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 215, 0, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = '#556'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '52px', marginBottom: '15px' }}>{upgrade.icon}</div>
                    <h3 style={{ color: '#fff', margin: '0 0 10px', fontSize: '20px' }}>{upgrade.name}</h3>
                    <p style={{ color: '#87CEEB', margin: 0, fontSize: '15px' }}>{upgrade.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAUSE MENU */}
          {gamePhase === 'paused' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              borderRadius: '8px',
              padding: '30px',
            }}>
              {/* Left Panel - Character Stats */}
              <div style={{
                width: '280px',
                background: 'rgba(30, 50, 70, 0.9)',
                borderRadius: '12px',
                padding: '20px',
                border: '3px solid #456',
                marginRight: '20px',
              }}>
                {/* Character Portrait */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 15px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.3)',
                  border: `3px solid ${selectedCharacter?.color || '#444'}`,
                }}>
                  <img src={SPRITES.characters[selectedCharacter?.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 20px' }}>{selectedCharacter?.name}</h3>
                
                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: '❤️', label: 'HP', value: `${displayStats.hp} / ${displayStats.maxHp}`, color: '#ff6b6b' },
                    { icon: '⚔️', label: 'ATK', value: `+${Math.floor((gameStateRef.current?.stats?.damage / 30 - 1) * 100)}%`, color: '#ffd700' },
                    { icon: '🏃', label: 'SPD', value: `+${Math.floor((gameStateRef.current?.stats?.moveSpeed - 1) * 100)}%`, color: '#87ceeb' },
                    { icon: '💥', label: 'CRT', value: '+5%', color: '#ff69b4' },
                    { icon: '🧲', label: 'Pickup', value: '+0%', color: '#00ffff' },
                    { icon: '⚡', label: 'Haste', value: `+${Math.floor((gameStateRef.current?.stats?.attackSpeed / 1.5 - 1) * 100)}%`, color: '#ffff00' },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', padding: '5px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <span>{stat.icon} {stat.label}</span>
                      <span style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Current Skills/Weapons */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ color: '#FFD700', fontSize: '36px', marginBottom: '20px', textShadow: '0 0 20px #FFD700' }}>⏸️ 일시정지</h1>
                
                {/* Current Weapon */}
                <div style={{ background: 'rgba(30, 50, 70, 0.9)', borderRadius: '12px', padding: '20px', border: '3px solid #456', marginBottom: '20px' }}>
                  <h3 style={{ color: '#87CEEB', margin: '0 0 15px' }}>🔫 현재 무기</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '60px', height: '60px', background: `${selectedCharacter?.color}40`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', border: `2px solid ${selectedCharacter?.color}` }}>
                      {selectedCharacter?.attackType === 'aoe' ? '💥' : selectedCharacter?.attackType === 'beam' ? '💫' : selectedCharacter?.attackType === 'spin' ? '🌀' : '⚡'}
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0 }}>{selectedCharacter?.weapon}</h4>
                      <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>{selectedCharacter?.description}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', color: selectedCharacter?.color, fontWeight: 'bold' }}>LV. {displayStats.level}</span>
                  </div>
                </div>

                {/* Game Stats */}
                <div style={{ background: 'rgba(30, 50, 70, 0.9)', borderRadius: '12px', padding: '20px', border: '3px solid #456', marginBottom: 'auto' }}>
                  <h3 style={{ color: '#87CEEB', margin: '0 0 15px' }}>📊 게임 정보</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: 'bold' }}>{displayStats.level}</div>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>레벨</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#87CEEB', fontSize: '28px', fontWeight: 'bold' }}>{formatTime(displayStats.time)}</div>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>생존 시간</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FF6B6B', fontSize: '28px', fontWeight: 'bold' }}>{displayStats.kills}</div>
                      <div style={{ color: '#aaa', fontSize: '14px' }}>처치 수</div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                  <button
                    onClick={() => setGamePhase('playing')}
                    style={{ padding: '18px 60px', fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(102,126,234,0.5)' }}
                  >
                    ▶️ 게임 재개
                  </button>
                  <button
                    onClick={() => { setGamePhase('menu'); setSelectedCharacter(null); gameStateRef.current = null; }}
                    style={{ padding: '18px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    🚪 메인 메뉴
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME OVER */}
      {gamePhase === 'gameover' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '20px',
          border: '4px solid #8B0000',
        }}>
          <h1 style={{
            color: '#FF4757',
            fontSize: '64px',
            marginBottom: '30px',
            textShadow: '0 0 40px #FF4757',
          }}>
            💀 게임 오버 💀
          </h1>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px 60px',
            marginBottom: '40px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: '28px', marginBottom: '15px' }}>
              ⏱️ 생존 시간: <span style={{ color: '#FFD700' }}>{formatTime(displayStats.time)}</span>
            </div>
            <div style={{ color: '#fff', fontSize: '28px', marginBottom: '15px' }}>
              💀 처치 수: <span style={{ color: '#FF6B6B' }}>{displayStats.kills}</span>
            </div>
            <div style={{ color: '#fff', fontSize: '28px' }}>
              🎖️ 최종 레벨: <span style={{ color: '#87CEEB' }}>{displayStats.level}</span>
            </div>
          </div>

          <button
            onClick={restart}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '16px',
              padding: '20px 60px',
              color: '#fff',
              fontSize: '28px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(102, 126, 234, 0.5)',
            }}
          >
            🔄 다시 시작
          </button>
        </div>
      )}
    </div>
  )
}

export default App
