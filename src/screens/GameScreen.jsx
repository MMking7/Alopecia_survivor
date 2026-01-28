import React from 'react'
import { GAME_CONFIG, SPRITES } from '../constants'
import { getMainWeapon, getPassiveSkills, getSpecialAbility } from '../MainWeapons'
import DebugMenu from './DebugMenu'
import { useGameEngine } from '../game/adapters/react/useGameEngine'
import { formatTime } from '../game/domain/xp'
import { COLORS, PIXEL_STYLES } from '../styles/PixelUI'
import { playMenuSelect, setGlobalSfxVolume } from '../utils/SoundManager'
import autoAimCursor from '../assets/cursors/auto_aim.png'
import manualAimCursor from '../assets/cursors/manual_aim.png'

const getItemDescription = (entry) => {
  if (!entry) return ''
  const level = entry.count || entry.level || 1

  switch (entry.id) {
    case 'scanner': {
      const bonus = Math.round(level * 15)
      return `경험치 획득량 ${bonus}% 증가`
    }
    case 'biotin': {
      return `즉시 HP 20% 회복 (x${level})`
    }
    case 'minoxidil': {
      const bonus = Math.round(level * 5)
      return `처치 시 +3HP를 ${bonus}% 확률로 회복할 수 있습니다.`
    }
    case 'silk_cap': {
      return `보호막 +15 (x${level})`
    }
    case 'beer': {
      const bonus = Math.round(level * 5)
      return `치명타 확률 ${bonus}% 증가`
    }
    case 'black_beans': {
      const bonus = level * 15
      return `최대 HP +${bonus}`
    }
    case 'DHT': {
      const bonus = Math.round(level * 20)
      return `적 생성 속도 ${bonus}% 증가`
    }
    case 'magical_wig': {
      const reduction = Math.min(0.5, level * 0.1)
      return `궁극기 쿨타임 ${Math.round(reduction * 100)}% 감소`
    }
    default:
      return entry.description || ''
  }
}

const GameScreen = ({
  selectedCharacter,
  shopLevels,
  characterRanks = {},
  characterProgress,
  loadedImages,
  onGameOver,
  onQuit,
}) => {
  const {
    canvasRef,
    gameStateRef,
    gamePhase,
    setGamePhase,
    displayStats,
    levelUpOptions,
    pauseTab,
    setPauseTab,
    handleUpgrade,
    handleQuit,
  } = useGameEngine({
    selectedCharacter,
    shopLevels,
    characterRanks,
    characterProgress,
    loadedImages,
    onGameOver,
    onQuit,
  })

  // Volume settings (stored in localStorage)
  const [bgmVolume, setBgmVolume] = React.useState(() => {
    const saved = localStorage.getItem('bgmVolume')
    return saved !== null ? parseFloat(saved) : 0.4
  })
  const [sfxVolume, setSfxVolume] = React.useState(() => {
    const saved = localStorage.getItem('sfxVolume')
    return saved !== null ? parseFloat(saved) : 0.7
  })

  // Save volume settings to localStorage
  React.useEffect(() => {
    localStorage.setItem('bgmVolume', bgmVolume.toString())
  }, [bgmVolume])

  React.useEffect(() => {
    localStorage.setItem('sfxVolume', sfxVolume.toString())
    setGlobalSfxVolume(sfxVolume) // Apply to SoundManager
  }, [sfxVolume])

  // Boss spawn notification system
  const [bossNotification, setBossNotification] = React.useState(null)
  const processedBossEventsRef = React.useRef(new Set())
  const bossAudioRef = React.useRef(null)
  const bgmAudioRef = React.useRef(null)

  // BGM playback management
  React.useEffect(() => {
    // Initialize BGM on first game start
    if (!bgmAudioRef.current && (gamePhase === 'playing' || gamePhase === 'levelup')) {
      bgmAudioRef.current = new Audio('/sounds/bgm/bgm.wav')
      bgmAudioRef.current.loop = true
      bgmAudioRef.current.volume = bgmVolume
      bgmAudioRef.current.play().catch(err => console.warn('BGM play failed:', err))
    }

    // Update volume when changed
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = bgmVolume
    }

    // Handle pause/resume
    if (bgmAudioRef.current) {
      if (gamePhase === 'paused') {
        bgmAudioRef.current.pause()
      } else if (gamePhase === 'playing' || gamePhase === 'levelup') {
        bgmAudioRef.current.play().catch(err => console.warn('BGM resume failed:', err))
      }
    }

    // Cleanup on unmount
    return () => {
      if (bgmAudioRef.current && gamePhase === null) {
        bgmAudioRef.current.pause()
        bgmAudioRef.current = null
      }
    }
  }, [gamePhase, bgmVolume])

  // Check for boss spawn events
  React.useEffect(() => {
    if (!gameStateRef.current?.bossSpawnEvents) return

    const events = gameStateRef.current.bossSpawnEvents
    const newEvent = events.find(event => !processedBossEventsRef.current.has(event.bossId))

    if (newEvent) {
      processedBossEventsRef.current.add(newEvent.bossId)

      // Play boss sound
      if (newEvent.sound) {
        if (bossAudioRef.current) {
          bossAudioRef.current.pause()
          bossAudioRef.current.currentTime = 0
        }
        bossAudioRef.current = new Audio(newEvent.sound)
        bossAudioRef.current.volume = Math.min(1, bgmVolume + 0.1) // BGM volume + 10%
        bossAudioRef.current.play().catch(err => console.warn('Boss sound play failed:', err))
      }

      // Show boss subtitle banner
      if (newEvent.subtitle) {
        setBossNotification(newEvent.subtitle)
        setTimeout(() => setBossNotification(null), 5000) // Show for 5 seconds
      }
    }
  }, [displayStats.time]) // Check on time update

  const mainWeapon = getMainWeapon(selectedCharacter?.id)
  const mainWeaponLevel = gameStateRef.current?.mainWeaponLevel || 1
  const mainWeaponIconKey = selectedCharacter?.id
    ? (mainWeaponLevel >= (mainWeapon?.maxLevel || 7)
      ? `${selectedCharacter.id}_gaksung`
      : `${selectedCharacter.id}_mainattack`)
    : null
  const mainWeaponEntry = mainWeapon ? {
    id: mainWeapon.id,
    name: mainWeapon.name,
    description: mainWeapon.description,
    iconKey: mainWeaponIconKey,
    level: mainWeaponLevel,
    maxLevel: mainWeapon.maxLevel || 7,
    category: 'main',
  } : null
  const passiveSkillDefs = getPassiveSkills(selectedCharacter?.id)
  const passiveSkillEntries = (gameStateRef.current?.passiveSkills || []).map((skill) => {
    const def = passiveSkillDefs.find((entry) => entry.id === skill.id)
    return {
      id: skill.id,
      name: def?.name || skill.name,
      description: def?.description || '',
      iconKey: def?.icon || skill.id,
      level: skill.level || 1,
      maxLevel: def?.maxLevel || skill.maxLevel || 1,
      category: 'passive',
    }
  })
  // Group inventory items by ID to handle duplicates
  // Group inventory items by ID to handle duplicates
  // Note: Removed useMemo because inventory mutation doesn't trigger ref dependency check reliably
  const inventoryEntries = (() => {
    const rawInventory = gameStateRef.current?.inventory || []
    const grouped = {}

    rawInventory.forEach(item => {
      // If SubWeapon, it already handles levels internally, so just use it
      if (item.isSubWeapon) {
        grouped[item.id] = { ...item, category: 'subweapon', level: item.level || 1 }
      } else {
        // Regular items: Stack them
        if (!grouped[item.id]) {
          grouped[item.id] = {
            ...item,
            category: 'item',
            level: 1, // Start at level 1 (count 1)
            count: 1,
          }
        } else {
          grouped[item.id].level += 1
          grouped[item.id].count += 1
        }
      }
    })

    return Object.values(grouped)
  })()
  const selectionCount = (mainWeaponEntry ? 1 : 0) + passiveSkillEntries.length + inventoryEntries.length
  const selectionSections = [
    {
      id: 'main',
      title: 'MAIN WEAPON',
      entries: mainWeaponEntry ? [mainWeaponEntry] : [],
      emptyText: 'Main weapon missing.',
    },
    {
      id: 'passive',
      title: 'PASSIVE SKILLS',
      entries: passiveSkillEntries,
      emptyText: 'No passive skills yet.',
    },
    {
      id: 'inventory',
      title: 'ITEMS',
      entries: inventoryEntries,
      emptyText: 'No items collected yet.',
    },
  ]

  const renderSelectionEntry = (entry, idx) => {
    const isMainWeapon = entry.category === 'main'
    const isPassiveSkill = entry.category === 'passive'
    const isSubWeapon = entry.category === 'subweapon'
    const accentColor = isSubWeapon
      ? COLORS.primary
      : (isMainWeapon || isPassiveSkill)
        ? COLORS.warning
        : '#4FC3F7' // Blue for Items
    const badgeText = isMainWeapon ? 'MAIN' : isPassiveSkill ? 'SKILL' : isSubWeapon ? 'WPN' : null
    const abilityIcon = (isMainWeapon || isPassiveSkill) && entry.iconKey
      ? SPRITES.abilities?.[entry.iconKey]
      : null
    const subweaponIcon = isSubWeapon ? SPRITES.subweapons?.[entry.icon] : null
    const itemIcon = (!isMainWeapon && !isPassiveSkill && !isSubWeapon)
      ? SPRITES.items?.[entry.icon]
      : null
    const fallbackLetter = isMainWeapon ? 'W' : isPassiveSkill ? 'S' : isSubWeapon ? 'W' : 'I'
    const description = (!isMainWeapon && !isPassiveSkill && !isSubWeapon)
      ? getItemDescription(entry)
      : entry.description

    return (
      <div
        key={`${entry.id}-${idx}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          background: isSubWeapon
            ? `linear-gradient(90deg, rgba(255,215,0,0.1) 0%, ${COLORS.bgLight} 100%)`
            : COLORS.bgLight,
          border: `2px solid ${accentColor}`,
          boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          background: COLORS.bgDark,
          border: `2px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '10px',
          flexShrink: 0,
        }}>
          {abilityIcon ? (
            <img src={abilityIcon} alt="" style={{ width: '22px', height: '22px', imageRendering: 'pixelated', objectFit: 'contain' }} />
          ) : isSubWeapon ? (
            subweaponIcon ? (
              <img src={subweaponIcon} alt="" style={{ width: '22px', height: '22px', imageRendering: 'pixelated', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '16px' }}>{fallbackLetter}</span>
            )
          ) : itemIcon ? (
            <img src={itemIcon} alt="" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          ) : (
            <span style={{ fontSize: '16px' }}>{fallbackLetter}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            fontWeight: 'bold',
            color: isSubWeapon ? COLORS.primary : (isMainWeapon || isPassiveSkill) ? COLORS.warning : COLORS.textWhite,
            fontSize: '11px',
            textShadow: '1px 1px 0 #000',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {entry.name}
            {badgeText && (
              <span style={{
                fontSize: '8px',
                color: COLORS.bgDark,
                background: isSubWeapon ? COLORS.primary : COLORS.warning,
                padding: '1px 4px',
              }}>{badgeText}</span>
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
            {description}
          </div>
        </div>
        <div style={{
          fontFamily: PIXEL_STYLES.fontFamily,
          fontSize: '10px',
          color: accentColor,
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.4)',
          padding: '2px 6px',
          marginLeft: '8px',
        }}>
          {entry.isConsumable ? `x${entry.count}` : `LV${entry.level || 1}`}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      cursor: `url(${displayStats.aimMode === 'manual' ? manualAimCursor : autoAimCursor}) 16 16, auto`
    }}>
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

      {/* Boss Notification Banner */}
      {bossNotification && (
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '75%',
          background: 'linear-gradient(90deg, rgba(139, 0, 0, 0.95) 0%, rgba(220, 20, 60, 0.95) 50%, rgba(139, 0, 0, 0.95) 100%)',
          border: '4px solid #FFD700',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 0, 0, 0.4)',
          padding: '20px 0',
          zIndex: 200,
          animation: 'bossWarning 1s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: 'Gungsuh, serif',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 20px rgba(255, 215, 0, 0.8)',
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
            animation: 'marquee 10s linear infinite',
            display: 'inline-block',
            willChange: 'transform',
          }}>
            {bossNotification}
          </div>
        </div>
      )}

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
              const reduction = Math.min(0.5, displayStats.specialCooldownReduction || 0)
              const effectiveCooldown = ability.cooldown * (1 - reduction)
              const timeSinceLastUse = hasBeenUsed ? (currentGameTime - lastUsedGameTime) * 1000 : Infinity // 초 → 밀리초
              const cooldownRemaining = hasBeenUsed ? Math.max(0, effectiveCooldown - timeSinceLastUse) : 0
              const isOnCooldown = cooldownRemaining > 0
              const cooldownPercent = isOnCooldown ? (cooldownRemaining / effectiveCooldown) * 100 : 0
              const cooldownSeconds = Math.ceil(cooldownRemaining / 1000)

              // 모근 부족 체크 (탈모의사 전용)
              const minFragments = ability.minFragments || 0
              const currentFragments = displayStats.fragments || 0
              const needsMoreFragments = minFragments > 0 && currentFragments < minFragments

              // 사용 불가 상태: 쿨타임 중이거나 모근 부족
              const isDisabled = isOnCooldown || needsMoreFragments

              // Build icon path
              const iconPath = SPRITES.abilities?.[`${selectedCharacter.id}_ability`]

              return (
                <div style={{
                  background: 'rgba(13, 13, 26, 0.9)',
                  border: `2px solid ${isDisabled ? COLORS.panelBorder : COLORS.warning}`,
                  boxShadow: isDisabled ? '2px 2px 0 0 rgba(0,0,0,0.5)' : `0 0 8px ${COLORS.warning}80`,
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
                    filter: isDisabled ? 'brightness(0.3)' : 'none',
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

                  {/* 모근 부족 Overlay */}
                  {needsMoreFragments && !isOnCooldown && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(139, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000',
                        textAlign: 'center',
                        lineHeight: '1.1',
                      }}>
                        모근<br />부족
                      </span>
                    </div>
                  )}

                  {/* Shift Key Hint or Fragment requirement */}
                  {!isOnCooldown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '8px',
                      color: needsMoreFragments ? COLORS.danger : COLORS.warning,
                      textShadow: '1px 1px 0 #000',
                      whiteSpace: 'nowrap',
                    }}>
                      {needsMoreFragments ? `${currentFragments}/${minFragments}` : 'Shift'}
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
                color: displayStats.fragments >= 30 ? COLORS.primary : COLORS.textGray,
                fontSize: '16px',
                fontWeight: 'bold',
                textShadow: '1px 1px 0 #000',
              }}>
                {displayStats.fragments || 0} / 50
                {displayStats.fragments >= 30 && (
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
          {/* Aim Mode Indicator */}
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            fontSize: '10px',
            marginTop: '6px',
            padding: '3px 6px',
            background: displayStats.aimMode === 'manual' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 255, 100, 0.3)',
            border: `1px solid ${displayStats.aimMode === 'manual' ? '#ff6666' : '#66ff66'}`,
            color: displayStats.aimMode === 'manual' ? '#ff6666' : '#66ff66',
            textShadow: '1px 1px 0 #000',
            cursor: 'pointer',
          }}>
            🎯 {displayStats.aimMode === 'manual' ? 'MANUAL' : 'AUTO'} (Click)
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
                    position: 'relative', // Ensure absolute children are relative to button
                    overflow: 'visible', // Allow badge to pop out
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary
                    e.currentTarget.style.boxShadow = `0 0 15px ${upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary}40, 3px 3px 0 0 rgba(0,0,0,0.5)`
                  }}
                  onMouseLeave={(e) => {
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
                      <img src={SPRITES.items[upgrade.icon]} alt="" style={{ width: '40px', height: '40px', imageRendering: 'pixelated', objectFit: 'contain' }} />
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
                      {/* Valid Type Badge (Always show type) */}
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary,
                        fontSize: '9px',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        marginRight: '20px' // Space for New Badge
                      }}>
                        {upgrade.isMainWeapon ? 'MAIN' : upgrade.isPassiveSkill ? 'SKILL' : upgrade.isSubWeapon ? 'SUB' : 'ITEM'}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      fontSize: '10px',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingBottom: '16px' // Space for bottom right text
                    }}>
                      {upgrade.description}
                    </div>
                  </div>

                  {/* PROMO BADGES */}
                  {/* NEW! Badge (First time getting it, non-consumable) */}
                  {(!upgrade.currentLevel || upgrade.currentLevel === 0) && !upgrade.isConsumable && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      zIndex: 10,
                      pointerEvents: 'none',
                      animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                      {/* Shadow & Shape same as before */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        clipPath: 'polygon(20% 0%, 35% 15%, 50% 0%, 65% 15%, 80% 0%, 85% 25%, 100% 20%, 90% 40%, 100% 60%, 85% 75%, 100% 100%, 70% 90%, 50% 100%, 30% 90%, 0% 100%, 15% 75%, 0% 60%, 10% 40%, 0% 20%)',
                        transform: 'translate(1px, 1px)'
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#FFF',
                        clipPath: 'polygon(20% 0%, 35% 15%, 50% 0%, 65% 15%, 80% 0%, 85% 25%, 100% 20%, 90% 40%, 100% 60%, 85% 75%, 100% 100%, 70% 90%, 50% 100%, 30% 90%, 0% 100%, 15% 75%, 0% 60%, 10% 40%, 0% 20%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{
                          color: '#FF0000',
                          fontFamily: 'Impact, sans-serif',
                          fontSize: '8px',
                          fontWeight: '900',
                          transform: 'rotate(-10deg)',
                          textShadow: '0.5px 0.5px 0 #000',
                          letterSpacing: '0px'
                        }}>NEW!</span>
                      </div>
                    </div>
                  )}

                  {/* INSTANT Badge (Consumable) */}
                  {upgrade.isConsumable && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#00FF00',
                      color: '#000',
                      border: '2px solid #000',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      padding: '2px 4px',
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                      transform: 'rotate(5deg)',
                      zIndex: 10,
                    }}>
                      INSTANT
                    </div>
                  )}

                  {/* Level Upgrade Text (Bottom Right) */}
                  {(upgrade.currentLevel > 0) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '11px',
                      color: '#FFFF00', // Yellow
                      fontWeight: 'bold',
                      textShadow: '1px 1px 0 #000',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,0,0.3)',
                      zIndex: 5
                    }}>
                      LV {(upgrade.currentLevel || 0)} <span style={{ color: '#FFF' }}>➤</span> {(upgrade.nextLevel || (upgrade.currentLevel + 1))}
                    </div>
                  )}

                  {/* Consumed Count Text (For Instant Items) */}
                  {(upgrade.isConsumable && upgrade.consumedCount > 0) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '11px',
                      color: '#00FF00', // Green
                      fontWeight: 'bold',
                      textShadow: '1px 1px 0 #000',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,255,0,0.3)',
                      zIndex: 5
                    }}>
                      Used: {upgrade.consumedCount}
                    </div>
                  )}
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
                  { label: '⚙️ SETTINGS', action: () => setPauseTab('settings'), variant: 'dark' },
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
                        playMenuSelect()
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

          {/* Settings Screen */}
          {pauseTab === 'settings' && (
            <div style={{
              width: '100%',
              maxWidth: '500px',
              background: 'rgba(13, 13, 26, 0.98)',
              border: `4px solid ${COLORS.panelBorder}`,
              boxShadow: '6px 6px 0 0 rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header */}
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
                  ⚙️ SETTINGS
                </h2>
                <div style={{ width: '70px' }} />
              </div>

              {/* Settings Content */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* BGM Volume */}
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: COLORS.textWhite,
                    marginBottom: '8px',
                    textShadow: '1px 1px 0 #000',
                  }}>
                    🎵 BGM Volume: {Math.round(bgmVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${bgmVolume * 100}%, ${COLORS.bgDark} ${bgmVolume * 100}%, ${COLORS.bgDark} 100%)`,
                      border: `2px solid ${COLORS.panelBorder}`,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* SFX Volume */}
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: COLORS.textWhite,
                    marginBottom: '8px',
                    textShadow: '1px 1px 0 #000',
                  }}>
                    🔊 Effect Sound Volume: {Math.round(sfxVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sfxVolume}
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      background: `linear-gradient(to right, ${COLORS.secondary} 0%, ${COLORS.secondary} ${sfxVolume * 100}%, ${COLORS.bgDark} ${sfxVolume * 100}%, ${COLORS.bgDark} 100%)`,
                      border: `2px solid ${COLORS.panelBorder}`,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* Test Sound Button */}
                <button
                  onClick={() => {
                    if (bossAudioRef.current) {
                      bossAudioRef.current.pause()
                    }
                    const testAudio = new Audio('/sounds/boss/boss.wav')
                    testAudio.volume = Math.min(1, bgmVolume + 0.1) // BGM volume + 10%
                    testAudio.play().catch(err => console.warn('Test sound failed:', err))
                  }}
                  style={{
                    padding: '12px',
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: `3px solid ${COLORS.panelBorder}`,
                    background: COLORS.bgLight,
                    color: COLORS.textWhite,
                    boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
                    textShadow: '1px 1px 0 #000',
                  }}
                >
                  🔔 Test Effect Sound
                </button>
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
                minHeight: 0,
                overflow: 'hidden',
                flexDirection: 'row',
                '@media (max-width: 600px)': { flexDirection: 'column' },
              }}>
                {/* Left - Character Stats */}
                <div style={{
                  width: '250px',
                  minWidth: '200px',
                  minHeight: 0,
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
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
                      📦 INVENTORY ({selectionCount})
                    </h3>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0,
                    maxHeight: '60vh',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    {selectionSections.map((section) => (
                      <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{
                          fontFamily: PIXEL_STYLES.fontFamily,
                          color: COLORS.textGray,
                          fontSize: '10px',
                          letterSpacing: '1px',
                        }}>
                          {section.title} ({section.entries.length})
                        </div>
                        {section.entries.length === 0 ? (
                          <p style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            color: COLORS.textDark,
                            textAlign: 'center',
                            margin: '6px 0 10px',
                            fontSize: '11px',
                          }}>
                            {section.emptyText}
                          </p>
                        ) : (
                          section.entries.map(renderSelectionEntry)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* DEBUG MENU */}
      {gamePhase === 'debug' && (
        <DebugMenu
          setGamePhase={setGamePhase}
          gameStateRef={gameStateRef}
          handleUpgrade={handleUpgrade}
          mainWeapon={mainWeapon}
          mainWeaponIconKey={mainWeaponIconKey}
          selectedCharacter={selectedCharacter}
        />
      )}
    </div>
  )
}

export default GameScreen


