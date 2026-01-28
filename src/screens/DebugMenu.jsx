import { SPRITES, UPGRADES, ENEMIES } from '../constants'
import { SUB_WEAPONS } from '../SubWeapons'
import { CHARACTER_PASSIVE_SKILLS } from '../MainWeapons'
import { COLORS, PIXEL_STYLES } from '../styles/PixelUI'
import { generateId } from '../game/domain/math'

const DebugMenu = ({
    setGamePhase,
    gameStateRef,
    handleUpgrade,
    mainWeapon,
    mainWeaponIconKey,
    selectedCharacter,
}) => {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            padding: '20px',
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.textWhite,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: `2px solid ${COLORS.primary}`,
                paddingBottom: '10px'
            }}>
                <h1 style={{ margin: 0, color: COLORS.primary, fontSize: '24px' }}>DEBUG MODE</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setGamePhase('playing')}
                        style={{
                            background: COLORS.danger,
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            fontFamily: 'inherit',
                        }}
                    >
                        CLOSE (` key)
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
                {/* Left Column: Cheats */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>

                    {/* Time Skip */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.warning }}>TIME SKIP (Force Set Time)</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[2, 5, 10].map(min => (
                                <button
                                    key={min}
                                    onClick={() => {
                                        if (gameStateRef.current) {
                                            gameStateRef.current.gameTime = min * 60
                                        }
                                        setGamePhase('playing')
                                    }}
                                    style={{
                                        background: COLORS.bgLight,
                                        border: `1px solid ${COLORS.textGray}`,
                                        color: COLORS.textWhite,
                                        padding: '8px',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {min} Minutes
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '10px', color: COLORS.danger, marginTop: '5px' }}>
                            Warning: Skipping time may cause missed boss spawns to trigger simultaneously.
                        </p>
                    </div>

                    {/* Spawn Enemies */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.danger }}>SPAWN ENEMIES</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    if (gameStateRef.current) {
                                        const shieldGuy = ENEMIES.find(e => e.type === 'shield_guy')
                                        if (shieldGuy) {
                                            gameStateRef.current.enemies.push({
                                                id: generateId(),
                                                ...shieldGuy,
                                                x: gameStateRef.current.player.x + 200,
                                                y: gameStateRef.current.player.y,
                                                currentHp: shieldGuy.hp,
                                                maxHp: shieldGuy.hp,
                                                scaledDamage: shieldGuy.damage,
                                                scaledSpeed: shieldGuy.speed,
                                                rotation: 0,
                                                lastAttack: 0,
                                                isAnimated: true // Ensure flag is set
                                            })
                                        }
                                    }
                                    setGamePhase('playing')
                                }}
                                style={{
                                    background: COLORS.bgLight,
                                    border: `1px solid ${COLORS.danger}`,
                                    color: COLORS.danger,
                                    padding: '8px',
                                    fontFamily: 'inherit',
                                    fontWeight: 'bold'
                                }}
                            >
                                Spawn Shield Guy
                            </button>
                        </div>
                    </div>

                    {/* Main Weapon */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.warning }}>MAIN WEAPON</h3>
                        {mainWeapon && (
                            <button
                                onClick={() => handleUpgrade({
                                    isMainWeapon: true,
                                    nextLevel: Math.min((gameStateRef.current?.mainWeaponLevel || 1) + 1, 7),
                                    levelEffects: mainWeapon.levelEffects
                                })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    background: COLORS.bgLight,
                                    border: '1px solid #fff',
                                    padding: '10px',
                                    marginBottom: '5px'
                                }}
                            >
                                <img src={SPRITES.abilities?.[mainWeaponIconKey] || ''} alt="" style={{ width: 30, height: 30, marginRight: 10 }} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: COLORS.warning }}>{mainWeapon.name}</div>
                                    <div style={{ fontSize: '10px' }}>Current LV: {gameStateRef.current?.mainWeaponLevel || 1}</div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Sub Weapons */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.primary }}>ADD SUB WEAPON</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
                            {SUB_WEAPONS.map(wpn => (
                                <button
                                    key={wpn.id}
                                    onClick={() => handleUpgrade({
                                        isSubWeapon: true,
                                        id: wpn.id,
                                        weaponData: wpn,
                                        // Logic to find next level is handled in useGameEngine
                                    })}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: COLORS.bgLight,
                                        border: '1px solid #444',
                                        padding: '5px',
                                        textAlign: 'left'
                                    }}
                                >
                                    <img src={SPRITES.subweapons?.[wpn.icon] || ''} alt="" style={{ width: 24, height: 24, marginRight: 8, objectFit: 'contain' }} />
                                    <span style={{ fontSize: '11px' }}>{wpn.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Skills & Items */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>

                    {/* Passive Skills */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.secondary }}>PASSIVE SKILLS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {(CHARACTER_PASSIVE_SKILLS[selectedCharacter?.id] || []).map(skill => (
                                <button
                                    key={skill.id}
                                    onClick={() => handleUpgrade({
                                        isPassiveSkill: true,
                                        ...skill,
                                        // Pass dummy upgrade object, real logic in useGameEngine handles next level
                                    })}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: COLORS.bgLight,
                                        border: '1px solid #444',
                                        padding: '8px',
                                        textAlign: 'left'
                                    }}
                                >
                                    <img src={SPRITES.abilities?.[skill.icon] || ''} alt="" style={{ width: 24, height: 24, marginRight: 8 }} />
                                    <span style={{ fontSize: '12px' }}>{skill.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Items */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <h3 style={{ marginTop: 0, color: COLORS.textGray }}>ADD ITEMS (PASSIVE)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
                            {UPGRADES.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleUpgrade(item)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: COLORS.bgLight,
                                        border: '1px solid #444',
                                        padding: '5px',
                                        textAlign: 'left'
                                    }}
                                >
                                    <img src={SPRITES.items?.[item.icon] || ''} alt="" style={{ width: 20, height: 20, marginRight: 8 }} />
                                    <span style={{ fontSize: '11px', color: COLORS.textGray }}>{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div >
    )
}

export default DebugMenu
