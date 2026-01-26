# Character Abilities Implementation Guide

## ✅ Completed

### 1. Main Weapons System
- Created `src/MainWeapons.js` with complete definitions for:
  - All 6 characters' main weapons with level 1-6 effects
  - Level 7 awakening (각성) effects
  - Special abilities (Shift-activated)
  - Character-specific passive skills (3 per character)

### 2. Constants & Sprites
- Updated `constants.js` with sprite paths for:
  - Ability icons: `<character>_ability.png`
  - Awakening icons: `<character>_gaksung.png`
  - Skill icons: `<character>_skill1/2/3.png`

### 3. Character Selection Screen
- Updated `CharacterSelectScreen.jsx` to display:
  - Main weapon description
  - Special ability description
  - Uses data from MainWeapons.js

### 4. GameScreen Integration
- Added to game state:
  - `mainWeaponLevel` (1-7)
  - `passiveSkills` array
  - `specialAbility` state
  - `fragments` (for Talmo Docter)
  - `shift` key tracking
- Updated level-up system to prioritize:
  1. Main weapon upgrades (appears every level until level 7)
  2. Character passive skills (1-2 options)
  3. Sub-weapons and items (fill remaining slots)
- Implemented upgrade handling for main weapons and passive skills

## 🚧 In Progress

### 5. Attack Logic Updates Needed

The following sections in `GameScreen.jsx` need to be updated to use `mainWeaponLevel`:

#### Female (여성형 탈모) - Line Area Damage
- Currently: Uses basic AoE
- Needed: Implement ground line zones that deal DoT
- Location: Search for `case 'aoe'` in attack switch

#### Areata (원형 탈모) - Beam Projectile
- Currently: Single beam attack
- Needed: Add projectile explosion with AoE, awakening double explosion
- Location: Search for `case 'beam'` in attack switch

#### Wong Fei Hung (황비홍) - Melee Sweep
- Currently: Spin attack hitting 5 enemies
- Needed: Keep existing but add weapon level scaling, awakening double swing
- Location: Search for `case 'spin'` in attack switch

#### Heihachi (헤이하치) - Dash Punch
- Currently: Lightning strikes
- Needed: Implement dash + electrify mechanic, chain lightning on awakening
- Location: Search for `case 'lightning'` in attack switch

#### Mzamen (M자맨) - Wave Pattern
- Currently: Boomerang
- Needed: M-shaped wave pattern, return explosion on awakening
- Location: Search for `case 'boomerang'` in attack switch

#### Talmo Docter (탈모 의사) - Cone Sweep
- Currently: Transplant gun projectile
- Needed: Cone-shaped sweep with lifesteal and fragment collection
- Location: Search for `case 'transplant'` in attack switch

### 6. Passive Skills Implementation

Need to add passive skill effects in game loop. Check `state.passiveSkills` and apply bonuses:

**Example pattern:**
```javascript
// Calculate passive skill bonuses
let attackMultiplier = 1.0
let moveSpeedBonus = 0

state.passiveSkills.forEach(skill => {
  const skillData = getPassiveSkills(character.id).find(s => s.id === skill.id)
  if (skillData) {
    const effect = skillData.levels[skill.level - 1]
    // Apply effect based on skill.id
    switch (skill.id) {
      case 'female_skill1': // 가늘어지는 모근
        attackMultiplier += effect.attack
        break
      case 'female_skill2': // 고속도로
        moveSpeedBonus += effect.moveSpeed
        break
      // ... etc
    }
  }
})
```

### 7. Special Abilities (Shift Key)

Need to implement special ability activation:

```javascript
// In game loop, check for Shift key press
if (state.keys.shift && !state.specialAbility.active) {
  const ability = getSpecialAbility(character.id)
  const timeSinceLastUse = currentTime - state.specialAbility.lastUsed

  if (timeSinceLastUse >= ability.cooldown) {
    state.specialAbility.active = true
    state.specialAbility.lastUsed = currentTime
    state.specialAbility.activeUntil = currentTime + ability.duration

    // Trigger ability effect based on character
    switch (character.id) {
      case 'female': // 융단폭격
        // Create screen-wide line zones
        break
      case 'areata': // 영역 확산
        // Create large circular zone
        break
      // ... etc
    }
  }
}

// Check if ability is still active
if (state.specialAbility.active && currentTime > state.specialAbility.activeUntil) {
  state.specialAbility.active = false
}
```

## 📝 Testing Checklist

After implementation, test each character for:
- [ ] Main weapon levels 1-6 work correctly
- [ ] Level 7 awakening activates with special effects
- [ ] All 3 passive skills can be selected and work
- [ ] Special ability activates with Shift key
- [ ] Special ability respects cooldown
- [ ] Passive skills stack correctly
- [ ] UI shows correct icons for abilities
- [ ] Weapon damage scales with level

## 📂 File Structure

```
src/
├── MainWeapons.js          # ✅ Complete - All definitions
├── constants.js            # ✅ Complete - Sprite paths added
├── screens/
│   ├── CharacterSelectScreen.jsx  # ✅ Complete - Shows abilities
│   └── GameScreen.jsx      # 🚧 In Progress - Need attack logic
└── sprites/
    ├── femalebald/         # Ability/skill icons
    ├── areata/
    ├── wongfeihung/
    ├── heihachi/
    ├── mzaman/
    └── talmo_docter/
```

## 🎯 Next Steps

1. **Update Attack Logic** - Modify each character's attack case to use `mainWeaponLevel` and `getMainWeapon()` data
2. **Implement Passive Skills** - Add passive skill effect calculations in game loop
3. **Implement Special Abilities** - Add Shift key handling and ability effects
4. **Add Visual Effects** - Create placeholder animations for new attack types
5. **Test & Balance** - Play each character and verify all mechanics work

## 💡 Tips

- Main weapon data: `const weapon = getMainWeapon(character.id)`
- Current level data: `const effect = weapon.levelEffects[state.mainWeaponLevel]`
- Check awakening: `if (state.mainWeaponLevel === 7 && effect.doubleSwing)`
- Passive skills: `state.passiveSkills.forEach(skill => { ... })`
- Special ability: `if (state.keys.shift && !state.specialAbility.active)`
