// ============================================================
// SUB WEAPONS - 서브 웨폰 시스템
// ============================================================

/**
 * 서브 웨폰 정의
 * - 레벨업 시 선택 가능
 * - 선택 시 인벤토리에 '무기'로 추가
 * - 동일 무기 재선택 시 레벨업 (최대 7레벨)
 */

// 서브 웨폰 스프라이트 경로 (추후 실제 이미지로 교체 필요)
export const SUB_WEAPON_SPRITES = {
    black_dye: '/sprites/subweapon/black_dye.webp',
    hair_brush: '/sprites/subweapon/hair_brush.webp',
    hair_spray: '/sprites/subweapon/hair_spray.webp',
    hair_dryer: '/sprites/subweapon/hair_dryer.webp',
    electric_clipper: '/sprites/subweapon/electric_clipper.webp',
    dandruff_bomb: '/sprites/subweapon/dandruff_bomb.webp',
}

/**
 * 서브 웨폰 정의
 */
export const SUB_WEAPONS = [
    // ============================================================
    // 흑채 뿌리기 (Black Dye Sprinkle) - 등급 3
    // ============================================================
    {
        id: 'black_dye',
        name: '흑채 뿌리기',
        nameEn: 'Black Dye Sprinkle',
        grade: 3,
        type: 'ground_aoe',
        typeDisplay: '지속 장판',
        icon: 'black_dye',
        description: '바닥에 검은 염료를 뿌려 암흑 장판을 생성한다. 장판 위의 적은 지속 피해를 입고 시야가 제한된다.',
        maxLevel: 7,
        // 레벨별 효과
        levelEffects: {
            1: {
                zoneCount: 1,              // 장판 수 (Changed from 3)
                damagePerSecond: 0.50,     // 초당 50% 피해
                duration: 3,               // 지속시간 (초)
                range: 60,                 // 장판 범위
                slowAmount: 0,             // 이동속도 감소
                blindChance: 0,            // 암흑 효과 확률
            },
            2: {
                zoneCount: 1,
                damagePerSecond: 0.50,
                duration: 5,               // +2초
                range: 60,
                slowAmount: 0,
                blindChance: 0,
            },
            3: {
                zoneCount: 1,
                damagePerSecond: 0.65,     // 30% 증가
                duration: 5,
                range: 60,
                slowAmount: 0,
                blindChance: 0,
            },
            4: {
                zoneCount: 2,              // +1개 (Total 2)
                damagePerSecond: 0.65,
                duration: 5,
                range: 60,
                slowAmount: 0,
                blindChance: 0,
            },
            5: {
                zoneCount: 2,
                damagePerSecond: 0.65,
                duration: 5,
                range: 60,
                slowAmount: 0.30,          // 30% 이동속도 감소 added
                blindChance: 0.20,         // 20% 확률 암흑
                blindDuration: 1,          // 1초 암흑
            },
            6: {
                zoneCount: 2,
                damagePerSecond: 0.65,
                duration: 5,
                range: 75,                 // 25% 증가
                slowAmount: 0.30,
                blindChance: 0.20,
                blindDuration: 1,
            },
            7: {
                zoneCount: 3,              // +1개 (Total 3)
                damagePerSecond: 0.65,
                duration: 5,
                range: 75,
                slowAmount: 0.30,          // 30% 이동속도 감소
                blindChance: 0.20,
                blindDuration: 1,
            },
        },
        // 공격 주기 (ms)
        attackCooldown: 3000,
    },

    // ============================================================
    // 빗 돌리기 (Hair Brush Barrier) - 등급 2
    // ============================================================
    {
        id: 'hair_brush',
        name: '빗 돌리기',
        nameEn: 'Hair Brush Barrier',
        grade: 2,
        type: 'defensive_knockback',
        typeDisplay: '방어 넉백',
        icon: 'hair_brush',
        description: '빗을 빠르게 돌려 주변을 방어하는 회전 장벽을 만든다. 접근하는 적을 밀어내고 피해를 준다.',
        maxLevel: 7,
        levelEffects: {
            1: {
                teethCount: 2,             // 빗니 수 (Changed from 3)
                damagePercent: 0.40,       // 40% 피해
                knockbackForce: 100,       // 넉백 강도
                rotationSpeed: 1.0,        // 회전 속도 배율
                range: 80,                 // 회전 범위
                stunChance: 0,             // 기절 확률
            },
            2: {
                teethCount: 3,             // +1개 (Total 3)
                damagePercent: 0.40,
                knockbackForce: 100,
                rotationSpeed: 1.0,
                range: 80,
                stunChance: 0,
            },
            3: {
                teethCount: 3,
                damagePercent: 0.50,       // 25% 증가 (Total 50%)
                knockbackForce: 100,
                rotationSpeed: 1.2,        // 20% 증가
                range: 80,
                stunChance: 0,
            },
            4: {
                teethCount: 3,
                damagePercent: 0.50,
                knockbackForce: 130,       // 30% 증가
                rotationSpeed: 1.2,
                range: 80,
                stunChance: 0,
            },
            5: {
                teethCount: 4,             // +1개 (Total 4)
                damagePercent: 0.50,
                knockbackForce: 130,
                rotationSpeed: 1.2,
                range: 80,
                stunChance: 0,
            },
            6: {
                teethCount: 4,
                damagePercent: 0.50,
                knockbackForce: 130,
                rotationSpeed: 1.2,
                range: 96,                 // 20% 증가
                stunChance: 0,
            },
            7: {
                teethCount: 5,             // +1개 (Total 5)
                damagePercent: 0.50,
                knockbackForce: 130,
                rotationSpeed: 1.2,
                range: 96,
                stunChance: 0,             // Stun removed
            },
        },
        attackCooldown: 0, // 지속 효과 (회전)
    },

    // ============================================================
    // 헤어스프레이 미사일 (Hair Spray Missile) - 등급 2
    // ============================================================
    {
        id: 'hair_spray',
        name: '헤어스프레이 미사일',
        nameEn: 'Hair Spray Missile',
        grade: 2,
        type: 'ranged_explosive',
        typeDisplay: '원거리 폭발',
        icon: 'hair_spray',
        description: '압축된 헤어스프레이를 미사일 형태로 발사, 적중 지점에 폭발하며 넓은 범위에 스프레이를 뿌린다.',
        maxLevel: 7,
        levelEffects: {
            1: {
                missileCount: 1,           // 미사일 수
                explosionDamage: 1.20,     // 120% 폭발 피해
                cloudDuration: 3,          // 구름 지속시간
                cloudDamagePerSecond: 0.30, // 초당 30%
                missileSpeed: 300,         // 미사일 속도
                explosionRadius: 50,       // 폭발 범위
                attackSpeedDebuff: 0,      // 공격속도 감소
                cooldownReduction: 0,
            },
            2: {
                missileCount: 1,
                explosionDamage: 1.20,
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,         // 20% 증가 (300 * 1.2)
                explosionRadius: 57.5,     // 15% 증가 (50 * 1.15)
                attackSpeedDebuff: 0,
                cooldownReduction: 0,
            },
            3: {
                missileCount: 1,
                explosionDamage: 1.44,     // 20% 증가 (1.2 * 1.2)
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,
                explosionRadius: 57.5,
                attackSpeedDebuff: 0,
                cooldownReduction: 0,
            },
            4: {
                missileCount: 1,
                explosionDamage: 1.44,
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,
                explosionRadius: 57.5,
                attackSpeedDebuff: 0,
                cooldownReduction: 0.15,   // 공격주기 15% 감소
            },
            5: {
                missileCount: 1,
                explosionDamage: 1.728,    // 20% 증가 (1.44 * 1.2)
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,
                explosionRadius: 57.5,
                attackSpeedDebuff: 0,
                cooldownReduction: 0.15,
            },
            6: {
                missileCount: 1,
                explosionDamage: 1.728,
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,
                explosionRadius: 75,       // ~30% Increase (approx, set to 75)
                attackSpeedDebuff: 0,
                cooldownReduction: 0.15,
            },
            7: {
                missileCount: 2,           // 2연발
                secondMissileDamage: 0.50, // 두 번째 미사일 50% 피해
                explosionDamage: 1.728,
                cloudDuration: 3,
                cloudDamagePerSecond: 0.30,
                missileSpeed: 360,
                explosionRadius: 75,
                attackSpeedDebuff: 0,
                cooldownReduction: 0.15,
            },
        },
        attackCooldown: 2000,
    },

    // ============================================================
    // 헤어드라이어 열파 (Hair Dryer Heat Wave) - 등급 3
    // ============================================================
    {
        id: 'hair_dryer',
        name: '헤어드라이어 열파',
        nameEn: 'Hair Dryer Heat Wave',
        grade: 3,
        type: 'ranged_sustained',
        typeDisplay: '원거리 지속',
        icon: 'hair_dryer',
        description: '헤어드라이어에서 강력한 열풍을 방출한다. 전방 부채꼴 범위에 지속적인 열 피해를 입힌다.',
        maxLevel: 7,
        levelEffects: {
            1: {
                coneAngle: 60,
                damagePerSecond: 0.60,     // 60%
                range: 150,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            2: {
                coneAngle: 80,             // +20 (Total 80)
                damagePerSecond: 0.60,
                range: 150,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            3: {
                coneAngle: 80,
                damagePerSecond: 0.72,     // 20% Increase (1.2x)
                range: 150,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            4: {
                coneAngle: 80,
                damagePerSecond: 0.864,    // 20% Increase (1.2x)
                range: 150,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            5: {
                coneAngle: 80,
                damagePerSecond: 0.864,
                range: 187.5,              // 25% Increase
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            6: {
                coneAngle: 80,
                damagePerSecond: 1.037,    // 20% Increase (1.2x)
                range: 187.5,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
            },
            7: {
                coneAngle: 80,
                damagePerSecond: 1.037,
                range: 187.5,
                burnDamagePerSecond: 0.2,
                burnDuration: 2,
                bidirectional: true,       // Dual Direction
            },
        },
        attackCooldown: 0, // Continuous update for smooth tracking
    },

    // ============================================================
    // 전동 클리퍼 (Electric Clipper) - 등급 1
    // ============================================================
    {
        id: 'electric_clipper',
        name: '전동 클리퍼',
        nameEn: 'Electric Clipper',
        grade: 1,
        type: 'melee_rapid',
        typeDisplay: '근접 연속',
        icon: 'electric_clipper',
        description: '전동 클리퍼를 짧은 거리로 빠르게 휘두른다. 연속 타격이 가능하며 넉백 효과가 약하다.',
        maxLevel: 7,
        levelEffects: {
            1: {
                damagePercent: 0.50,       // 50% 피해
                attacksPerSecond: 5,       // 초당 5회
                range: 50,                 // 공격 범위
                comboStrike: 0,            // 강력한 일격 피해
                critBonus: 0,              // 치명타 보너스
            },
            2: {
                damagePercent: 0.50,
                attacksPerSecond: 6,       // 20% 증가
                range: 50,
                comboStrike: 0,
                critBonus: 0,
            },
            3: {
                damagePercent: 0.625,      // 25% 증가
                attacksPerSecond: 6,
                range: 50,
                comboStrike: 0,
                critBonus: 0,
            },
            4: {
                damagePercent: 0.625,
                attacksPerSecond: 6,
                range: 57.5,               // 15% 증가
                comboStrike: 0,
                critBonus: 0,
            },
            5: {
                damagePercent: 0.625,
                attacksPerSecond: 6,
                range: 57.5,
                comboStrike: 2.0,          // 5회 연속 공격 시 200% 피해
                comboThreshold: 5,
                critBonus: 0,
            },
            6: {
                damagePercent: 0.8125,     // 30% 증가
                attacksPerSecond: 6,
                range: 57.5,
                comboStrike: 2.0,
                comboThreshold: 5,
                critBonus: 0,
            },
            7: {
                damagePercent: 0.8125,
                attacksPerSecond: 6,
                range: 57.5,
                comboStrike: 2.0,
                comboThreshold: 0,         // 제한 없음
                unlimitedCombo: true,
                critBonus: 0.05,           // 치명타 5% 증가
            },
        },
        attackCooldown: 200, // 빠른 연속 공격
    },

    // ============================================================
    // 비듬 폭탄 (Dandruff Bomb) - 등급 3
    // ============================================================
    {
        id: 'dandruff_bomb',
        name: '비듬 폭탄',
        nameEn: 'Dandruff Bomb',
        grade: 3,
        type: 'explosive_debuff',
        typeDisplay: '폭발 디버프',
        icon: 'dandruff_bomb',
        description: '두피에서 비듬을 떨어뜨려 폭탄을 생성한다. 폭탄은 시간이 지나면 자동 폭발하거나 적에게 닿으면 즉시 폭발한다.',
        maxLevel: 7,
        levelEffects: {
            1: {
                maxBombs: 3,               // 최대 폭탄 수
                explosionDamage: 1.50,     // 150% 폭발 피해
                explosionRadius: 60,       // 폭발 범위
                slowAmount: 0,             // 이동속도 감소
                chainExplosionChance: 0,   // 연쇄 폭발 확률
            },
            2: {
                maxBombs: 4,               // +1개
                explosionDamage: 1.50,
                explosionRadius: 60,
                slowAmount: 0,
                chainExplosionChance: 0,
            },
            3: {
                maxBombs: 4,
                explosionDamage: 1.50,
                explosionRadius: 72,       // 20% 증가
                slowAmount: 0,
                chainExplosionChance: 0,
            },
            4: {
                maxBombs: 4,
                explosionDamage: 1.50,
                explosionRadius: 72,
                slowAmount: 0,
                chainExplosionChance: 0,
                generationInterval: 4000,  // 4초마다 생성 (기본 5초)
            },
            5: {
                maxBombs: 4,
                explosionDamage: 1.50,
                explosionRadius: 72,
                slowAmount: 0.30,          // 3초간 30% 감소
                slowDuration: 3,
                chainExplosionChance: 0,
                generationInterval: 4000,
            },
            6: {
                maxBombs: 4,
                explosionDamage: 1.95,     // 30% 증가
                explosionRadius: 72,
                slowAmount: 0.30,
                slowDuration: 3,
                chainExplosionChance: 0,
                generationInterval: 4000,
            },
            7: {
                maxBombs: 5,               // +1개
                explosionDamage: 1.95,
                explosionRadius: 72,
                slowAmount: 0.30,
                slowDuration: 3,
                chainExplosionChance: 0.20, // 20% 확률로 추가 폭탄
                generationInterval: 4000,
            },
        },
        attackCooldown: 0, // 0 to allow logic to run every frame (internal timer handles generation)
    },
]

// ============================================================
// 서브 웨폰 유틸리티 함수
// ============================================================

/**
 * ID로 서브 웨폰 찾기
 */
export const getSubWeaponById = (id) => {
    return SUB_WEAPONS.find(weapon => weapon.id === id)
}

/**
 * 등급별 서브 웨폰 필터링
 */
export const getSubWeaponsByGrade = (grade) => {
    return SUB_WEAPONS.filter(weapon => weapon.grade === grade)
}

/**
 * 레벨업 시 랜덤 서브 웨폰 선택지 생성
 * @param {Array} inventory - 현재 인벤토리 (레벨업 가능 여부 체크)
 * @param {number} count - 선택지 개수
 * @returns {Array} 서브 웨폰 선택지 배열
 */
export const getRandomSubWeaponOptions = (inventory = [], count = 3) => {
    // 인벤토리에서 서브 웨폰만 필터링
    const ownedWeapons = inventory.filter(item => item.isSubWeapon)

    // 선택 가능한 무기: 미보유 무기 OR 레벨업 가능한 무기
    const availableWeapons = SUB_WEAPONS.filter(weapon => {
        const owned = ownedWeapons.find(w => w.id === weapon.id)
        if (!owned) return true // 미보유
        return owned.level < weapon.maxLevel // 레벨업 가능
    })

    // 랜덤 셔플 후 선택
    const shuffled = [...availableWeapons].sort(() => Math.random() - 0.5)

    return shuffled.slice(0, count).map(weapon => {
        const owned = ownedWeapons.find(w => w.id === weapon.id)
        const currentLevel = owned ? owned.level : 0
        const nextLevel = currentLevel + 1

        return {
            ...weapon,
            currentLevel,
            nextLevel,
            isNew: !owned,
            isSubWeapon: true,
            // 다음 레벨 효과
            nextLevelEffect: weapon.levelEffects[nextLevel],
            // 현재 레벨 효과 (비교용)
            currentLevelEffect: currentLevel > 0 ? weapon.levelEffects[currentLevel] : null,
        }
    })
}

/**
 * 서브 웨폰 선택 처리 (인벤토리 업데이트)
 * @param {Object} weapon - 선택한 서브 웨폰
 * @param {Array} inventory - 현재 인벤토리
 * @returns {Array} 업데이트된 인벤토리
 */
export const handleSubWeaponSelection = (weapon, inventory) => {
    const existingIndex = inventory.findIndex(item => item.isSubWeapon && item.id === weapon.id)

    if (existingIndex >= 0) {
        // 기존 무기 레벨업
        const updatedInventory = [...inventory]
        const currentLevel = updatedInventory[existingIndex].level
        const newLevel = Math.min(currentLevel + 1, weapon.maxLevel)

        updatedInventory[existingIndex] = {
            ...updatedInventory[existingIndex],
            level: newLevel,
            effect: weapon.levelEffects[newLevel],
        }

        return updatedInventory
    } else {
        // 새 무기 추가
        const newWeapon = {
            id: weapon.id,
            name: weapon.name,
            nameEn: weapon.nameEn,
            icon: weapon.icon,
            grade: weapon.grade,
            type: weapon.type,
            typeDisplay: weapon.typeDisplay,
            description: weapon.description,
            isSubWeapon: true,
            level: 1,
            maxLevel: weapon.maxLevel,
            effect: weapon.levelEffects[1],
            attackCooldown: weapon.attackCooldown,
            lastAttackTime: 0,
            // 무기별 추가 상태
            state: initializeWeaponState(weapon),
        }

        return [...inventory, newWeapon]
    }
}

/**
 * 무기별 초기 상태 설정
 */
const initializeWeaponState = (weapon) => {
    switch (weapon.id) {
        case 'black_dye':
            return { activeZones: [] }
        case 'hair_brush':
            return { rotation: 0 }
        case 'hair_spray':
            return { projectiles: [], clouds: [] }
        case 'hair_dryer':
            return { isActive: false, hitEnemies: new Map() }
        case 'electric_clipper':
            return { comboCount: 0 }
        case 'dandruff_bomb':
            return { bombs: [], lastGeneration: 0 }
        default:
            return {}
    }
}

/**
 * 서브 웨폰 레벨업 효과 설명 생성
 */
export const getSubWeaponLevelUpDescription = (weapon, fromLevel, toLevel) => {
    const fromEffect = fromLevel > 0 ? weapon.levelEffects[fromLevel] : null
    const toEffect = weapon.levelEffects[toLevel]

    const descriptions = []

    switch (weapon.id) {
        case 'black_dye':
            if (!fromEffect || toEffect.zoneCount > fromEffect.zoneCount) {
                descriptions.push(`장판 ${toEffect.zoneCount}개 생성`)
            }
            if (!fromEffect || toEffect.duration > fromEffect.duration) {
                descriptions.push(`지속시간 ${toEffect.duration}초`)
            }
            if (!fromEffect || toEffect.damagePerSecond > fromEffect.damagePerSecond) {
                descriptions.push(`초당 ${Math.floor(toEffect.damagePerSecond * 100)}% 피해`)
            }
            if (toEffect.blindChance > 0 && (!fromEffect || fromEffect.blindChance === 0)) {
                descriptions.push(`${Math.floor(toEffect.blindChance * 100)}% 암흑 효과`)
            }
            if (toEffect.slowAmount > 0 && (!fromEffect || fromEffect.slowAmount === 0)) {
                descriptions.push(`${Math.floor(toEffect.slowAmount * 100)}% 이동속도 감소`)
            }
            break

        case 'hair_brush':
            if (!fromEffect || toEffect.teethCount > fromEffect.teethCount) {
                descriptions.push(`빗니 ${toEffect.teethCount}개`)
            }
            if (!fromEffect || toEffect.damagePercent > fromEffect.damagePercent) {
                descriptions.push(`${Math.floor(toEffect.damagePercent * 100)}% 피해`)
            }
            if (!fromEffect || toEffect.rotationSpeed > fromEffect.rotationSpeed) {
                descriptions.push(`회전 속도 ${Math.floor(toEffect.rotationSpeed * 100)}%`)
            }
            if (toEffect.stunChance > 0 && (!fromEffect || fromEffect.stunChance === 0)) {
                descriptions.push(`${Math.floor(toEffect.stunChance * 100)}% 기절`)
            }
            break

        // 다른 무기들도 필요시 추가...
        default:
            descriptions.push(`레벨 ${toLevel} 효과`)
    }

    return descriptions.join(', ')
}

// ============================================================
// 서브 웨폰 업그레이드 옵션 (UPGRADES 배열 형식)
// ============================================================

/**
 * 레벨업 UI에서 사용할 수 있는 형식으로 서브 웨폰 변환
 */
export const convertToUpgradeFormat = (weapon, currentLevel = 0) => {
    const nextLevel = currentLevel + 1
    const effect = weapon.levelEffects[nextLevel]

    return {
        id: weapon.id,
        name: weapon.name,
        type: `무기 (${weapon.typeDisplay})`,
        description: weapon.description,
        icon: weapon.icon,
        isSubWeapon: true,
        grade: weapon.grade,
        currentLevel,
        nextLevel,
        effect: (stats) => stats, // 서브 웨폰은 스탯이 아닌 별도 처리
        weaponData: weapon,
    }
}

/**
 * 레벨업 옵션 생성 (아이템 + 서브 웨폰 혼합)
 * @param {Array} UPGRADES - 기존 아이템 업그레이드 배열
 * @param {Array} inventory - 현재 인벤토리
 * @param {number} totalCount - 총 선택지 개수
 * @returns {Array} 혼합된 업그레이드 옵션
 */
export const generateMixedLevelUpOptions = (UPGRADES, inventory, totalCount = 3) => {
    // 서브 웨폰 옵션 (1~2개)
    const subWeaponCount = Math.floor(Math.random() * 2) + 1 // 1 or 2
    const subWeaponOptions = getRandomSubWeaponOptions(inventory, subWeaponCount)
        .map(weapon => convertToUpgradeFormat(weapon, weapon.currentLevel))

    // 나머지는 기존 아이템
    const itemCount = totalCount - subWeaponOptions.length
    // 아이템 레벨/개수 계산하여 옵션 생성
    const itemOptions = [...UPGRADES]
        .sort(() => Math.random() - 0.5)
        .slice(0, itemCount)
        .map(item => {
            // 인벤토리 내 동일 아이템 수 카운트 (레벨 대용)
            // isConsumable(즉발성)이 아니면 레벨로 표시
            const count = inventory.filter(i => i.id === item.id).length
            const isConsumable = item.isConsumable

            return {
                ...item,
                grade: 1, // 아이템 등급 기본 1
                currentLevel: isConsumable ? 0 : count,
                nextLevel: isConsumable ? 0 : count + 1,
                consumedCount: count, // Count for consumables display
                isConsumable,
            }
        })

    // 셔플 후 반환
    return [...subWeaponOptions, ...itemOptions].sort(() => Math.random() - 0.5)
}

export default SUB_WEAPONS
