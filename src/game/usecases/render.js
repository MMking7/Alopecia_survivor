import { SPRITES } from '../../constants'

export const renderFrame = ({ state, ctx, canvas, currentTime, loadedImages }) => {
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

  // Draw Fallen Hairs (Areata Skill 3)
  const hairImg = loadedImages[SPRITES.items.areata_fallen_hair]
  state.fallenHairs?.forEach((hair) => {
    const sx = hair.x - state.camera.x
    const sy = hair.y - state.camera.y
    if (sx > -30 && sx < canvas.width + 30 && sy > -30 && sy < canvas.height + 30) {
      if (hairImg && hairImg.complete && hairImg.naturalWidth > 0) {
        const size = 32
        ctx.drawImage(hairImg, sx - size / 2, sy - size / 2, size, size)
      } else {
        // Fallback: Gray/Black crescent
        ctx.fillStyle = '#222'
        ctx.beginPath()
        ctx.arc(sx, sy, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1
        ctx.stroke()
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

  // Draw transplant projectiles (탈모의사 식모기 - 부메랑 스타일 회전)
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
        // 돌아올 때는 회전 애니메이션 적용, 아닐 때는 진행 방향
        if (proj.returning || proj.returnsToPlayer) {
          // 부메랑처럼 회전
          ctx.rotate(proj.rotation || 0)
        } else {
          // 이미지의 12시 방향이 진행 방향이 되도록 +90도 회전
          ctx.rotate(proj.angle + Math.PI / 2)
        }
        // 식모기 이미지 크기를 크게 키워서 날아가는 느낌
        const imgSize = proj.size || 100
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(transplantImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize)
        ctx.restore()
      } else {
        // Fallback: Draw a stylized syringe/transplant tool
        ctx.save()
        ctx.translate(sx, sy)
        // 부메랑 회전 또는 진행 방향
        if (proj.returning || proj.returnsToPlayer) {
          ctx.rotate(proj.rotation || 0)
        } else {
          ctx.rotate(proj.angle)
        }

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

  // Render Shield Skill Visuals (Barrier)
  if (state.passiveBonuses.shieldStacks && state.passiveBonuses.shieldStacks > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(state.player.x - state.camera.x, state.player.y - state.camera.y, 40, 0, Math.PI * 2)

    // Color based on character
    if (state.player.character.id === 'talmo_docter') {
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + state.passiveBonuses.shieldStacks * 0.2})` // Red
      ctx.shadowColor = 'red'
    } else {
      ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 + state.passiveBonuses.shieldStacks * 0.2})` // Purple (Female Bald)
      ctx.shadowColor = 'purple'
    }

    ctx.lineWidth = 3 + state.passiveBonuses.shieldStacks
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.restore()
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
        const aoeX = (effect.x - state.camera.x)
        const aoeY = (effect.y - state.camera.y)
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
        const femaleAttackImg = loadedImages[SPRITES.attacks?.female_mainattack]
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

        // Try to draw sprite image (female_ability.png)
        // Try multiple lookup methods in case of path issues
        const abilityPath = SPRITES.abilities?.female_ability || '/sprites/femalebald/female_ability.png'
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

      case 'areata_special_zone':
        // Areata Special Ability - Following Circular Zone
        ctx.save()
        const areataZoneX = effect.x - state.camera.x
        const areataZoneY = effect.y - state.camera.y

        ctx.translate(areataZoneX, areataZoneY)

        // Try to draw sprite image (areata ability)
        const areataAbilityPath = SPRITES.abilities?.areata_ability || '/sprites/areata/areata_ability.png'
        const areataAbilityImg = loadedImages[areataAbilityPath]

        if (areataAbilityImg && areataAbilityImg.complete && areataAbilityImg.naturalWidth > 0) {
          ctx.globalAlpha = 0.6
          const spriteSize = effect.radius * 2.5
          ctx.drawImage(
            areataAbilityImg,
            -spriteSize / 2,
            -spriteSize / 2,
            spriteSize,
            spriteSize
          )
        } else {
          // Fallback: Green circle
          ctx.fillStyle = effect.color
          ctx.globalAlpha = 0.3
          ctx.beginPath()
          ctx.arc(0, 0, effect.radius, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.arc(0, 0, effect.radius, 0, Math.PI * 2)
          ctx.stroke()
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
          const hairSize = (effect.radius * 2) / 3
          ctx.drawImage(hairImg, 0, 0, hairSize, hairSize)
        }

        // Draw slash effect trailing behind
        ctx.rotate(Math.PI / 4)
        if (loadedImages[SPRITES.attacks.wongfeihung_slash]) {
          const slashImg = loadedImages[SPRITES.attacks.wongfeihung_slash]
          const slashSize = effect.radius * 1.5 + 20
          ctx.drawImage(slashImg, -slashSize / 2, -slashSize / 2, slashSize, slashSize)
        }

        ctx.restore()
        ctx.globalAlpha = 1
        break

      case 'rotating_whirlpool':
        {
          const cx = effect.x - state.camera.x
          const cy = effect.y - state.camera.y
          const orbitRadius = effect.radius
          const rotationSpeed = 3
          const elapsedS = (currentTime - effect.createdAt) / 1000
          const currentAngle = elapsedS * rotationSpeed
          const orbitCount = effect.orbits || 3

          for (let i = 0; i < orbitCount; i++) {
            const angle = currentAngle + (i * (Math.PI * 2 / orbitCount))
            const satX = cx + Math.cos(angle) * orbitRadius
            const satY = cy + Math.sin(angle) * orbitRadius

            ctx.save()
            ctx.translate(satX, satY)

            // Spin around the satellite's center
            const spinAngle = angle + (elapsedS * 10)
            ctx.rotate(spinAngle)

            const satScale = 0.4
            const baseSize = 250
            const hairSize = baseSize * satScale

            if (loadedImages[SPRITES.attacks.wongfeihung_hair]) {
              const hairImg = loadedImages[SPRITES.attacks.wongfeihung_hair]
              ctx.drawImage(hairImg, 0, 0, hairSize, hairSize)
            }

            ctx.rotate(Math.PI / 4)
            if (loadedImages[SPRITES.attacks.wongfeihung_slash]) {
              const slashImg = loadedImages[SPRITES.attacks.wongfeihung_slash]
              const slashSize = hairSize * 3.0
              ctx.drawImage(slashImg, -slashSize / 2, -slashSize / 2, slashSize, slashSize)
            }

            if (!loadedImages[SPRITES.attacks.wongfeihung_hair] && !loadedImages[SPRITES.attacks.wongfeihung_slash]) {
              ctx.fillStyle = effect.color
              ctx.beginPath()
              ctx.arc(0, 0, 20, 0, Math.PI * 2)
              ctx.fill()
            }

            ctx.restore()

            // Draw connection line to player (optional visual flair)
            ctx.strokeStyle = effect.color
            ctx.globalAlpha = 0.2
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(satX, satY)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
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

      case 'dash_trail':
        // 헤이하치 돌진 궤적
        const trailStartX = effect.startX - state.camera.x
        const trailStartY = effect.startY - state.camera.y
        const trailEndX = effect.endX - state.camera.x
        const trailEndY = effect.endY - state.camera.y

        ctx.save()
        ctx.globalAlpha = 0.7 * (1 - progress)

        // 번개 효과가 있는 돌진 궤적
        const trailGradient = ctx.createLinearGradient(trailStartX, trailStartY, trailEndX, trailEndY)
        trailGradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)')
        trailGradient.addColorStop(0.5, 'rgba(255, 255, 100, 0.6)')
        trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)')

        ctx.strokeStyle = trailGradient
        ctx.lineWidth = 20
        ctx.lineCap = 'round'
        ctx.shadowColor = '#FFFF00'
        ctx.shadowBlur = 20

        ctx.beginPath()
        ctx.moveTo(trailStartX, trailStartY)
        ctx.lineTo(trailEndX, trailEndY)
        ctx.stroke()

        // 번개 스파크 효과
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        for (let i = 0; i < 5; i++) {
          const t = i / 5
          const sparkX = trailStartX + (trailEndX - trailStartX) * t
          const sparkY = trailStartY + (trailEndY - trailStartY) * t
          ctx.beginPath()
          ctx.moveTo(sparkX, sparkY - 15)
          ctx.lineTo(sparkX + (Math.random() - 0.5) * 20, sparkY)
          ctx.lineTo(sparkX, sparkY + 15)
          ctx.stroke()
        }

        ctx.restore()
        break

      case 'lightning_punch':
        // 헤이하치 감전 펀치 범위 공격
        const punchX = effect.x - state.camera.x
        const punchY = effect.y - state.camera.y
        const punchRadius = effect.radius || 60

        ctx.save()
        ctx.globalAlpha = 0.8 * (1 - progress)

        // 전기 충격파
        const punchGradient = ctx.createRadialGradient(punchX, punchY, 0, punchX, punchY, punchRadius)
        punchGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
        punchGradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.7)')
        punchGradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.4)')
        punchGradient.addColorStop(1, 'rgba(255, 255, 0, 0)')

        ctx.fillStyle = punchGradient
        ctx.beginPath()
        ctx.arc(punchX, punchY, punchRadius * (1 + progress * 0.5), 0, Math.PI * 2)
        ctx.fill()

        // 번개 방사
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 3
        ctx.shadowColor = '#FFFF00'
        ctx.shadowBlur = 15

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * Math.PI
          const innerR = punchRadius * 0.3
          const outerR = punchRadius * (1 + progress * 0.3)

          ctx.beginPath()
          ctx.moveTo(punchX + Math.cos(angle) * innerR, punchY + Math.sin(angle) * innerR)
          // 지그재그 번개
          const midR = (innerR + outerR) / 2
          ctx.lineTo(punchX + Math.cos(angle + 0.1) * midR, punchY + Math.sin(angle + 0.1) * midR)
          ctx.lineTo(punchX + Math.cos(angle) * outerR, punchY + Math.sin(angle) * outerR)
          ctx.stroke()
        }

        ctx.restore()

        break

      case 'chain_lightning':
        const clStartX = effect.startX - state.camera.x
        const clStartY = effect.startY - state.camera.y
        const clEndX = effect.endX - state.camera.x
        const clEndY = effect.endY - state.camera.y

        ctx.strokeStyle = effect.color || '#00FFFF'
        ctx.lineWidth = 2
        ctx.shadowColor = effect.color || '#00FFFF'
        ctx.shadowBlur = 10

        const dist = Math.sqrt((clEndX - clStartX) ** 2 + (clEndY - clStartY) ** 2)
        const steps = Math.floor(dist / 10)

        ctx.beginPath()
        ctx.moveTo(clStartX, clStartY)

        for (let i = 1; i < steps; i++) {
          const t = i / steps
          const mx = clStartX + (clEndX - clStartX) * t
          const my = clStartY + (clEndY - clStartY) * t
          const jitter = (Math.random() - 0.5) * 20
          ctx.lineTo(mx + jitter, my + jitter)
        }

        ctx.lineTo(clEndX, clEndY)
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
          const drawSize = effect.radius * 2.0
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
      let img
      if (enemy.type === 'boss') {
        img = loadedImages[SPRITES.boss]
      } else if (enemy.type === 'boss_subway') {
        img = loadedImages[SPRITES.bosses.subway]
      } else if (enemy.type === 'boss_airraid') {
        img = loadedImages[SPRITES.bosses.airraid]
      } else {
        img = loadedImages[SPRITES.enemies[enemy.type]]
      }
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

  // Draw M Pattern Field (Mzamen 스페셜 능력)
  if (state.specialAbility.active && state.specialAbility.type === 'm_pattern_field') {
    const mFieldPos = state.specialAbility.mFieldPosition
    if (mFieldPos) {
      const effect = state.specialAbility.effect
      const mWidth = effect.width || 600
      const mHeight = effect.height || 400

      const centerX = mFieldPos.x - state.camera.x
      const centerY = mFieldPos.y - state.camera.y

      ctx.save()

      // 시간에 따른 펄스 효과
      const pulseTime = currentTime % 500
      const pulseAlpha = 0.35 + Math.sin(pulseTime / 500 * Math.PI) * 0.15

      // M 패턴 그리기 (M자 탈모 형태)
      ctx.translate(centerX - mWidth / 2, centerY - mHeight / 2)

      const thickness = 80
      const leftX = mWidth * 0.1
      const rightX = mWidth * 0.9
      const peakY = mHeight * 0.15
      const valleyY = mHeight * 0.7
      const midX = mWidth * 0.5

      // 글로우 효과
      ctx.shadowColor = '#6BEEED'
      ctx.shadowBlur = 40

      // M 패턴 그라데이션 채우기
      const gradient = ctx.createLinearGradient(0, 0, mWidth, mHeight)
      gradient.addColorStop(0, `rgba(107, 238, 237, ${pulseAlpha + 0.1})`)
      gradient.addColorStop(0.3, `rgba(107, 238, 237, ${pulseAlpha})`)
      gradient.addColorStop(0.5, `rgba(80, 200, 220, ${pulseAlpha + 0.15})`)
      gradient.addColorStop(0.7, `rgba(107, 238, 237, ${pulseAlpha})`)
      gradient.addColorStop(1, `rgba(150, 255, 255, ${pulseAlpha + 0.1})`)

      ctx.fillStyle = gradient
      ctx.strokeStyle = `rgba(180, 255, 255, ${pulseAlpha + 0.4})`
      ctx.lineWidth = 4

      // M 경로 그리기 (M자 탈모 형태: 양쪽 세로 + 중앙 V)
      ctx.beginPath()

      // 왼쪽 세로선 바깥쪽
      ctx.moveTo(leftX - thickness / 2, mHeight)
      ctx.lineTo(leftX - thickness / 2, peakY)

      // 왼쪽 꼭지점에서 중앙 V로
      ctx.lineTo(leftX + thickness / 2, peakY)
      ctx.lineTo(midX, valleyY - thickness / 2)

      // 중앙 V에서 오른쪽 꼭지점으로
      ctx.lineTo(rightX - thickness / 2, peakY)
      ctx.lineTo(rightX + thickness / 2, peakY)

      // 오른쪽 세로선
      ctx.lineTo(rightX + thickness / 2, mHeight)
      ctx.lineTo(rightX - thickness / 2, mHeight)
      ctx.lineTo(rightX - thickness / 2, peakY + thickness)

      // 오른쪽에서 중앙 V 안쪽으로
      ctx.lineTo(midX, valleyY + thickness / 2)

      // 중앙 V 안쪽에서 왼쪽으로
      ctx.lineTo(leftX + thickness / 2, peakY + thickness)
      ctx.lineTo(leftX + thickness / 2, mHeight)

      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // 에너지 파티클 효과 (M 모양을 따라 이동)
      for (let i = 0; i < 12; i++) {
        const t = ((currentTime / 1000 + i * 0.3) % 3) / 3
        let particleX, particleY

        if (t < 0.33) {
          // 왼쪽 세로선
          particleX = leftX
          particleY = mHeight - (mHeight - peakY) * (t / 0.33)
        } else if (t < 0.66) {
          // 왼쪽에서 중앙으로
          const tt = (t - 0.33) / 0.33
          particleX = leftX + (midX - leftX) * tt
          particleY = peakY + (valleyY - peakY) * tt
        } else {
          // 중앙에서 오른쪽으로
          const tt = (t - 0.66) / 0.34
          particleX = midX + (rightX - midX) * tt
          particleY = valleyY + (peakY - valleyY) * tt
        }

        const particleAlpha = 0.6 + Math.sin(currentTime / 150 + i) * 0.3
        const particleSize = 6 + Math.sin(currentTime / 200 + i * 0.7) * 3

        ctx.fillStyle = `rgba(107, 238, 237, ${particleAlpha})`
        ctx.shadowColor = '#6BEEED'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }
  }

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
    // Check if damage string already has '+' to avoid '++3'
    let text = dn.damage.toString()
    if (dn.isHeal && !text.startsWith('+')) {
      text = `+${text}`
    }
    const displayText = text
    ctx.strokeText(displayText, 0, 0)
    ctx.fillText(displayText, 0, 0)
    ctx.restore()
  })
}
