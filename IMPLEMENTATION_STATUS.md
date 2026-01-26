# Character Abilities Implementation Status

## ✅ Fully Implemented

### Core Systems (100% Complete)
1. **MainWeapons.js** - All definitions created
   - 6 characters × 7 weapon levels = 42 weapon configurations
   - 6 special abilities (Shift key)
   - 18 passive skills (3 per character × 6 characters)
   - All with detailed level effects and descriptions

2. **Constants & Sprites** - Sprite paths configured
   - Added `abilities` section to SPRITES
   - All icon paths for abilities, awakening, and skills
   - Paths: `/sprites/<character>/<character>ability.png`, etc.

3. **Character Selection Screen** - UI Updated
   - Shows main weapon name and description
   - Shows special ability name and description
   - Uses data from MainWeapons.js dynamically

4. **GameScreen Core Integration**
   - Main weapon level tracking (1-7)
   - Passive skills array
   - Special ability state
   - Shift key detection
   - Level-up options generator prioritizing:
     1. Main weapon upgrade (always shown if not maxed)
     2. Passive skills (1-2 options)
     3. Sub weapons and items (fill remaining slots)
   - Upgrade handlers for all new types

### 여성형 탈모 (Female Bald) - Complete Example (100%)
✅ **Attack System**
- Line-based ground zones with proper dimensions
- Multi-line support (1 line → 3 lines at level 5)
- Damage-over-time processing
- Level 7 awakening: Periodic shockwaves at zone ends
- Full visual rendering (rectangles + shockwaves)

**What it demonstrates:**
- Reading weapon data: `getMainWeapon('female')`
- Using level effects: `weaponEffect = weapon.levelEffects[state.mainWeaponLevel]`
- Creating persistent zones: `state.groundZones` array
- Awakening detection: `if (weaponEffect.shockwave)`
- Visual effects: `line_zone` and `shockwave` rendering

## 🚧 Remaining Work

### 1. Other Characters' Attack Logic (5 remaining)

Use the Female character as a template. Each needs:

#### 원형 탈모 (Areata) - Beam Projectile
**Current**: Simple beam to nearest enemy
**Needed**:
- Projectile with explosion on hit
- Circular AoE damage
- Level 7: Double explosion + defense reduction debuff

#### 황비홍 (Wong Fei Hung) - Melee Sweep
**Current**: Spin hitting 5 enemies
**Needed**:
- Cone-shaped sweep attack
- Level 5: Stun chance
- Level 7: Double swing with knockback + armor penetration

#### 헤이하치 (Heihachi) - Dash Punch
**Current**: Random lightning strikes
**Needed**:
- Dash forward + punch
- Electrify debuff (DoT)
- Level 7: Chain lightning on electrified enemy death

#### M자맨 (Mzamen) - Wave Pattern
**Current**: Boomerang projectile
**Needed**:
- M-shaped wave projectiles (use multiple angled projectiles)
- Return to player
- Level 7: Explosion when waves return and cross

#### 탈모 의사 (Talmo Docter) - Cone Sweep
**Current**: Straight piercing projectile
**Needed**:
- 120-degree cone sweep
- Lifesteal mechanic
- Fragment collection system (stored in `state.fragments`)
- Level 5+: Multi-swing
- Level 7: Bonus damage when fragments ≥ 5

### 2. Passive Skills System

Add passive skill effect calculation in game loop. Example structure:

```javascript
// BEFORE damage calculations, compute bonuses
let attackBonus = 1.0
let moveSpeedBonus = 0
let critBonus = 0
// ... other bonuses

state.passiveSkills.forEach(skill => {
  const charSkills = CHARACTER_PASSIVE_SKILLS[character.id]
  const skillData = charSkills.find(s => s.id === skill.id)
  if (!skillData) return

  const effect = skillData.levels[skill.level - 1]

  switch (skill.id) {
    case 'female_skill1': // 가늘어지는 모근
      attackBonus += effect.attack
      break
    case 'female_skill2': // 고속도로
      moveSpeedBonus += effect.moveSpeed
      // Add regen timer logic
      break
    case 'female_skill3': // 모발 방어막
      // Shield stack logic
      break
    // ... add all 18 skills
  }
})

// APPLY bonuses to calculations
const finalDamage = state.stats.damage * attackBonus
const finalMoveSpeed = GAME_CONFIG.PLAYER_SPEED * state.stats.moveSpeed * (1 + moveSpeedBonus)
```

**Important passive mechanics to implement:**
- **Shield stacks** (female_skill3, talmo_docter_skill2)
- **Kill-based buffs** (wongfeihung_skill2, areata_skill3)
- **HP threshold buffs** (wongfeihung_skill1, heihachi_skill2, talmo_docter_skill1)
- **Conditional damage** (areata_skill1, mzamen_skill1, heihachi_skill1)
- **Auto-heal triggers** (talmo_docter_skill3)
- **Dodge chance** (areata_skill2)

### 3. Special Abilities (Shift Key)

Add special ability activation and effects:

```javascript
// In game loop, after player movement
const character = state.player.character
const specialAbility = getSpecialAbility(character.id)

// Check for Shift key press
if (state.keys.shift && !state.specialAbility.active) {
  const timeSince = currentTime - state.specialAbility.lastUsed

  if (timeSince >= specialAbility.cooldown) {
    state.specialAbility.active = true
    state.specialAbility.lastUsed = currentTime
    state.specialAbility.activeUntil = currentTime + specialAbility.duration

    // Trigger ability based on character
    switch (character.id) {
      case 'female': // 일자 탈모 융단폭격
        // Create screen-wide line zone
        break
      case 'areata': // 탈모 영역 확산
        // Create large circular zone following player
        break
      case 'wongfeihung': // 비홍 십팔탈
        // Create 3 rotating hair whirlpools
        break
      case 'heihachi': // 철권 난무
        // Buff attack speed + add lightning damage
        break
      case 'mzamen': // M 패턴 붕괴
        // Create M-shaped field in front
        break
      case 'talmo_docter': // 긴급 치료
        // Consume fragments for heal + AoE damage
        // If fragments >= 10, also grant buff
        break
    }
  }
}

// Check if ability expired
if (state.specialAbility.active && currentTime >= state.specialAbility.activeUntil) {
  state.specialAbility.active = false
  // Clean up any ability-specific state
}

// Apply ongoing ability effects
if (state.specialAbility.active) {
  switch (character.id) {
    case 'female':
    case 'areata':
    case 'mzamen':
      // Zone abilities: deal damage in zones
      break
    case 'wongfeihung':
      // Rotating whirlpools: update positions + damage
      break
    case 'heihachi':
      // Buff: multiply attack speed, add lightning to attacks
      break
  }
}
```

### 4. Visual Effects

Some attacks need placeholder visuals:

- **Cone attacks**: Draw filled arc/wedge shape
- **M-shaped waves**: Multiple angled projectiles
- **Dash effects**: Motion blur or trail
- **Chain lightning**: Lightning bolts between enemies
- **Whirlpool**: Rotating spiral particles

Use existing rendering patterns from SubWeapons as reference.

### 5. HUD Updates

Add to game HUD:
- Main weapon level indicator (1-7, show 각성 at 7)
- Special ability cooldown indicator
- Fragment counter (for Talmo Docter)
- Active passive skill icons

## 📁 Files Modified

1. ✅ `src/MainWeapons.js` - NEW (complete)
2. ✅ `src/constants.js` - UPDATED (sprite paths)
3. ✅ `src/screens/CharacterSelectScreen.jsx` - UPDATED (ability descriptions)
4. ✅ `src/screens/GameScreen.jsx` - PARTIALLY UPDATED
   - ✅ Imports
   - ✅ Game state initialization
   - ✅ Keyboard handling (Shift)
   - ✅ Level-up option generation
   - ✅ Upgrade handlers
   - ✅ Female character attack (COMPLETE EXAMPLE)
   - 🚧 Other 5 characters' attacks
   - 🚧 Passive skill effects
   - 🚧 Special ability system
   - 🚧 Visual effects for new types

## 📊 Progress Summary

| Component | Status | Progress |
|-----------|--------|----------|
| System Design | ✅ Complete | 100% |
| Data Definitions | ✅ Complete | 100% |
| UI Integration | ✅ Complete | 100% |
| Level-up System | ✅ Complete | 100% |
| Female Character | ✅ Complete | 100% |
| Other Characters | 🚧 In Progress | 0/5 |
| Passive Skills | 🚧 Pending | 0% |
| Special Abilities | 🚧 Pending | 0% |
| **Overall** | **🚧 In Progress** | **~40%** |

## 🎯 Next Steps (Priority Order)

1. **Implement remaining character attacks** (use Female as template)
   - Copy the pattern: read weapon, get level effects, create zones/projectiles
   - Add unique mechanics per character
   - Test each one individually

2. **Add passive skill effects**
   - Start with simple stat bonuses
   - Then add conditional buffs
   - Finally add complex triggers (shields, heals, drops)

3. **Implement special abilities**
   - Start with zone-based abilities (easier)
   - Then buff-based abilities
   - Finally complex abilities (Talmo Docter's consume)

4. **Polish and balance**
   - Adjust damage numbers
   - Fine-tune cooldowns
   - Add visual polish
   - Test all interactions

## 💡 Development Tips

- **Test incrementally**: Implement one character at a time
- **Use console.log**: Debug weapon levels and effects
- **Placeholder visuals**: Use simple shapes initially, polish later
- **Balance later**: Get mechanics working first, tune numbers after
- **Reference Female**: All patterns are demonstrated in Female implementation

## 🐛 Known Issues / Considerations

- Some sprite files may not exist yet (will show broken images)
- Attack cooldowns may need tuning after implementation
- Passive skill stacking may need limits
- Special ability costs/cooldowns may need balancing
- Performance with many zones/effects may need optimization

## ✨ Features to Consider Later

- Passive skill combos (synergies between skills)
- Main weapon alternate skins for awakening
- Special ability visual upgrades
- Character-specific particles and effects
- Sound effects for abilities
