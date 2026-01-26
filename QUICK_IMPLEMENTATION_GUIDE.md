# Quick Implementation Guide for Remaining Characters

## Template Pattern (Based on Female Implementation)

### Step 1: Update Attack Logic

Find the character's attack case in GameScreen.jsx (around line 618-820).

```javascript
case '<attackType>':  // e.g., 'beam', 'spin', etc.
  // 1. Get weapon data
  const weapon = getMainWeapon('<characterId>')
  if (!weapon) break

  const weaponEffect = weapon.levelEffects[state.mainWeaponLevel]

  // 2. Implement attack based on type
  // ... create projectiles, zones, or effects

  // 3. Add visual effects
  state.attackEffects.push({ ... })
  break
```

### Step 2: Add Damage Processing (if needed for persistent effects)

In game loop, after ground zones update (around line 460-528):

```javascript
// Update <character> <effect type>
if (state.<effectArray>) {
  state.<effectArray>.forEach((effect) => {
    // Check expiration
    if (currentTime - effect.createdAt > effect.duration) {
      effect.shouldRemove = true
      return
    }

    // Deal damage to enemies
    state.enemies.forEach((enemy) => {
      // Check collision/range
      // Deal damage
      // Apply debuffs
    })

    // Handle awakening mechanics
    if (state.mainWeaponLevel === 7 && effect.hasSpecialMechanic) {
      // Add special behavior
    }
  })
  state.<effectArray> = state.<effectArray>.filter(e => !e.shouldRemove)
}
```

### Step 3: Add Rendering

Find rendering section (around line 1626+) and add new case:

```javascript
case '<effectType>':
  // Render using ctx
  ctx.save()
  // ... drawing code
  ctx.restore()
  ctx.globalAlpha = 1
  break
```

## Character-Specific Quick Start

### 원형 탈모 (Areata) - Beam with Explosion

```javascript
case 'beam':
  const areataWeapon = getMainWeapon('areata')
  const weaponEffect = areataWeapon.levelEffects[state.mainWeaponLevel]

  // Find nearest enemy
  let target = /* find nearest enemy logic */

  if (target) {
    // Create projectile
    if (!state.beamProjectiles) state.beamProjectiles = []
    state.beamProjectiles.push({
      id: generateId(),
      x: state.player.x,
      y: state.player.y,
      vx: /* velocity toward target */,
      vy: /* velocity toward target */,
      damage: state.stats.damage * weaponEffect.damage,
      explosionRadius: weaponEffect.explosionRadius,
      pierce: weaponEffect.pierce,
      hitCount: 0,
      hasDoubleExplosion: weaponEffect.doubleExplosion || false,
      defenseReduction: weaponEffect.defenseReduction || 0,
      createdAt: currentTime,
    })
  }
  break

// In game loop:
// Update beamProjectiles
// - Move projectile
// - On hit enemy: create explosion zone
// - If awakened: create second explosion
// - Apply defense reduction debuff to enemies
```

### 황비홍 (Wong Fei Hung) - Melee Sweep

```javascript
case 'spin':
  const wongWeapon = getMainWeapon('wongfeihung')
  const weaponEffect = wongWeapon.levelEffects[state.mainWeaponLevel]

  const swingCount = weaponEffect.doubleSwing ? 2 : 1

  for (let swing = 0; swing < swingCount; swing++) {
    // Create sweep effect
    state.attackEffects.push({
      type: 'melee_sweep',
      angle: weaponEffect.angle,
      range: weaponEffect.range,
      swingNumber: swing + 1,
      // ... other properties
    })

    // Damage enemies in cone
    state.enemies.forEach(enemy => {
      const angle = /* angle to enemy from player */
      const dist = distance(state.player, enemy)

      if (dist < weaponEffect.range && /* angle within cone */) {
        let damage = state.stats.damage * weaponEffect.damage

        // First swing: knockback
        if (swing === 0 && weaponEffect.doubleSwing) {
          enemy.vx += /* knockback */
          enemy.vy += /* knockback */
        }

        // Second swing: extra damage + armor pen
        if (swing === 1) {
          damage *= weaponEffect.secondSwingDamage
          // Ignore enemy defense
        }

        // Stun chance
        if (Math.random() < (weaponEffect.stunChance || 0)) {
          enemy.stunned = true
          enemy.stunUntil = currentTime + weaponEffect.stunDuration * 1000
        }

        enemy.currentHp -= damage
      }
    })
  }
  break
```

### 헤이하치 (Heihachi) - Dash Punch

```javascript
case 'lightning':
  const heihachiWeapon = getMainWeapon('heihachi')
  const weaponEffect = heihachiWeapon.levelEffects[state.mainWeaponLevel]

  // Dash forward
  const dashAngle = /* direction player is facing */
  const dashEndX = state.player.x + Math.cos(dashAngle) * weaponEffect.dashDistance
  const dashEndY = state.player.y + Math.sin(dashAngle) * weaponEffect.dashDistance

  // Move player (instant or animated)
  state.player.x = dashEndX
  state.player.y = dashEndY

  // Hit enemies in radius
  state.enemies.forEach(enemy => {
    if (distance(state.player, enemy) < weaponEffect.radius) {
      const damage = state.stats.damage * weaponEffect.damage
      enemy.currentHp -= damage

      // Apply electrify debuff
      if (!enemy.electrified) enemy.electrified = {}
      enemy.electrified.damagePerSecond = weaponEffect.electrifyDamagePerSecond
      enemy.electrified.until = currentTime + weaponEffect.electrifyDuration * 1000
    }
  })
  break

// In game loop:
// - Update electrified enemies (DoT)
// - On electrified enemy death (awakened):
//   - Find 2 nearest enemies
//   - Chain lightning to them
//   - Apply electrify
```

### M자맨 (Mzamen) - Wave Pattern

```javascript
case 'boomerang':
  const mzamenWeapon = getMainWeapon('mzamen')
  const weaponEffect = mzamenWeapon.levelEffects[state.mainWeaponLevel]

  if (!state.mzamenWaves) state.mzamenWaves = []

  const facing = state.player.facing
  const baseAngle = facing === 1 ? 0 : Math.PI

  // Create M-pattern waves
  // M shape: / \ pattern
  const waveAngles = []
  for (let i = 0; i < weaponEffect.waveCount; i++) {
    // Alternate angles to create M shape
    const angleOffset = (i % 2 === 0 ? -1 : 1) * 0.4
    waveAngles.push(baseAngle + angleOffset)
  }

  waveAngles.forEach(angle => {
    state.mzamenWaves.push({
      id: generateId(),
      x: state.player.x,
      y: state.player.y,
      angle: angle,
      speed: weaponEffect.speed,
      range: weaponEffect.range,
      returning: false,
      damage: state.stats.damage * weaponEffect.damage,
      hasReturnExplosion: weaponEffect.returnExplosion || false,
      // ... other properties
    })
  })
  break

// In game loop:
// - Move waves forward
// - When reach max range: start returning
// - When returning: move toward player
// - Damage enemies along the way
// - If awakened: explosion when waves cross paths on return
```

### 탈모 의사 (Talmo Docter) - Cone Sweep

```javascript
case 'transplant':
  const docterWeapon = getMainWeapon('talmo_docter')
  const weaponEffect = docterWeapon.levelEffects[state.mainWeaponLevel]

  const swings = weaponEffect.multiSwing || 1

  for (let s = 0; s < swings; s++) {
    // Slight delay between swings
    setTimeout(() => {
      const facing = state.player.facing
      const baseAngle = facing === 1 ? 0 : Math.PI

      // Visual effect
      state.attackEffects.push({
        type: 'cone_sweep',
        angle: baseAngle,
        coneAngle: weaponEffect.angle,
        range: weaponEffect.range,
        // ... other properties
      })

      // Damage enemies in cone
      state.enemies.forEach(enemy => {
        const dx = enemy.x - state.player.x
        const dy = enemy.y - state.player.y
        const enemyAngle = Math.atan2(dy, dx)
        const angleDiff = Math.abs(enemyAngle - baseAngle)
        const dist = Math.sqrt(dx*dx + dy*dy)

        if (dist < weaponEffect.range && angleDiff < weaponEffect.angle / 2) {
          let damage = state.stats.damage * weaponEffect.damage

          // Fragment bonus (awakened)
          if (weaponEffect.fragmentBonus && state.fragments >= weaponEffect.fragmentBonusThreshold) {
            damage *= (1 + weaponEffect.fragmentBonusDamage)
          }

          enemy.currentHp -= damage

          // Lifesteal
          const heal = damage * weaponEffect.lifeSteal
          state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + heal)

          // Fragment collection
          if (Math.random() < weaponEffect.fragmentChance) {
            state.fragments = Math.min(weaponEffect.maxFragments, state.fragments + 1)
          }
        }
      })
    }, s * 100) // 100ms delay between swings
  }
  break
```

## Rendering Template

```javascript
case '<effectType>':
  const x = effect.x - state.camera.x
  const y = effect.y - state.camera.y

  ctx.save()

  // For angled effects
  if (effect.angle !== undefined) {
    ctx.translate(x, y)
    ctx.rotate(effect.angle)
    // Now draw relative to (0, 0)
  }

  // Set visual properties
  ctx.fillStyle = effect.color
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.6 * (1 - progress) // Fade out

  // Draw shape (rectangle, arc, lines, etc.)
  // ...

  ctx.restore()
  ctx.globalAlpha = 1
  break
```

## Testing Checklist Per Character

- [ ] Level 1: Basic attack works
- [ ] Level 2-6: Upgrades apply correctly
- [ ] Level 7: Awakening mechanic activates
- [ ] Visual effects render properly
- [ ] Damage numbers appear
- [ ] Performance is acceptable with many enemies
- [ ] Attack respects cooldown from weapon data
- [ ] Special mechanics work (debuffs, fragments, etc.)

## Common Pitfalls

1. **Forgetting to initialize arrays**: `if (!state.myArray) state.myArray = []`
2. **Not using deltaTime**: All damage over time needs `* deltaTime`
3. **Camera offset**: Rendering needs `- state.camera.x/y`
4. **Angle math**: Remember to check angle ranges and use `Math.atan2`
5. **Cleanup**: Always filter arrays to remove expired effects
6. **Awakening checks**: Use `state.mainWeaponLevel === 7` not `>= 7`

## Performance Tips

- Limit active zones/projectiles (set max counts)
- Remove effects far from player
- Use simple collision (distance checks first)
- Batch similar rendering operations
- Avoid creating objects in hot loops

## Debug Commands (add to keyboard handler)

```javascript
case 'KeyL': // Level up weapon for testing
  if (gameStateRef.current) {
    gameStateRef.current.mainWeaponLevel = Math.min(7, gameStateRef.current.mainWeaponLevel + 1)
    console.log('Weapon level:', gameStateRef.current.mainWeaponLevel)
  }
  break

case 'KeyK': // Give fragments (for Talmo Docter)
  if (gameStateRef.current) {
    gameStateRef.current.fragments = Math.min(15, gameStateRef.current.fragments + 5)
    console.log('Fragments:', gameStateRef.current.fragments)
  }
  break
```

## Next Steps After Implementation

1. Test each character solo
2. Test weapon progression 1→7
3. Add missing visual polish
4. Balance damage numbers
5. Implement passive skills
6. Implement special abilities
7. Final playtesting

Good luck! The Female character implementation in GameScreen.jsx is your complete reference.
