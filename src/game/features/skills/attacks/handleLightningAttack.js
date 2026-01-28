import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance, pointToLineDistance } from '../../../domain/math'
import { damageMapObjects } from '../../../usecases/combat'
import { playHit1 } from '../../../../utils/SoundManager'

export const handleLightningAttack = ({ state, currentTime, character }) => {
  // 헤이하치 - 초 풍신권 (돌진 후 전방에 감전 피해)
  const heihachiWeapon = getMainWeapon('heihachi')
  const heihachiEffect = heihachiWeapon ? heihachiWeapon.levelEffects[state.mainWeaponLevel] : { damage: 1.5, dashDistance: 80, radius: 60 }

  const dashDistance = heihachiEffect.dashDistance || 80
  const attackRadius = heihachiEffect.radius || 60

  // 마우스 커서 방향으로 돌진
  const dashAngle = state.player.facingAngle
  const dashDx = Math.cos(dashAngle) * dashDistance
  const dashDy = Math.sin(dashAngle) * dashDistance

  // 돌진 시작점과 끝점
  const dashStartX = state.player.x
  const dashStartY = state.player.y
  const dashEndX = state.player.x + dashDx
  const dashEndY = state.player.y + dashDy

  // 플레이어 이동
  state.player.x = dashEndX
  state.player.y = dashEndY

  // 돌진 궤적 이펙트
  state.attackEffects.push({
    id: generateId(),
    type: 'dash_trail',
    startX: dashStartX,
    startY: dashStartY,
    endX: dashEndX,
    endY: dashEndY,
    color: '#FFFF00',
    createdAt: currentTime,
  })

  // 돌진 끝점에서 전방 범위 감전 공격
  state.attackEffects.push({
    id: generateId(),
    type: 'lightning_punch',
    x: dashEndX + Math.cos(dashAngle) * 30, // 약간 앞
    y: dashEndY,
    radius: attackRadius,
    color: character.attackColor,
    createdAt: currentTime,
  })

  // 돌진 경로 및 전방 범위 내 적에게 피해
  const dashHitEnemies = new Set() // 중복 피해 방지

  state.enemies.forEach((enemy) => {
    if (enemy.isDead) return

    // 1. 돌진 경로에 있는 적 체크 (선분과 점 사이 거리)
    const dashPathWidth = 40 // 돌진 경로 폭
    const enemyDistToPath = pointToLineDistance(
      enemy.x, enemy.y,
      dashStartX, dashStartY,
      dashEndX, dashEndY
    )

    // 2. 돌진 끝점 앞쪽 범위 체크
    const punchX = dashEndX + Math.cos(dashAngle) * 30
    const punchY = dashEndY
    const distToPunch = distance({ x: punchX, y: punchY }, enemy)

    const hitByDash = enemyDistToPath <= dashPathWidth
    const hitByPunch = distToPunch <= attackRadius

    if (hitByDash || hitByPunch) {
      // 돌진 경로 피해는 50%, 펀치 피해는 100%
      const damageMultiplier = hitByPunch ? 1 : 0.5

      // Calculate Crit
      const isCrit = Math.random() < (state.stats.crit || 0)
      const critMultiplier = isCrit ? 1.5 : 1.0

      const damage = state.stats.damage * heihachiEffect.damage * damageMultiplier * critMultiplier
      enemy.currentHp -= damage
      enemy.lastHitTime = currentTime // Hit flash
      playHit1()

      state.damageNumbers.push({
        id: generateId(),
        x: enemy.x,
        y: enemy.y,
        damage: Math.floor(damage),
        isCritical: isCrit,
        createdAt: currentTime,
      })
    }
  })

  // Damage map objects at punch area
  const punchX = dashEndX + Math.cos(dashAngle) * 30
  const punchY = dashEndY
  damageMapObjects(state, { x: punchX, y: punchY, radius: attackRadius }, state.stats.damage * heihachiEffect.damage, currentTime, true)
}
