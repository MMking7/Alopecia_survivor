import { useEffect } from 'react'

export const useGameInput = ({
  gameStateRef,
  canvasRef,
  gamePhase,
  setGamePhase,
  setPauseTab,
}) => {
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = true; break
        case 'KeyS': gameStateRef.current.keys.s = true; break
        case 'KeyA': gameStateRef.current.keys.a = true; break
        case 'KeyD': gameStateRef.current.keys.d = true; break
        case 'ShiftLeft':
        case 'ShiftRight':
          if (!gameStateRef.current.keys.shift) {
            console.log('[SHIFT] Shift key pressed!')
            gameStateRef.current.keys.shift = true;
            gameStateRef.current.keys.shiftPressed = true;
          }
          break
        case 'Escape':
          if (gamePhase === 'playing') {
            setGamePhase('paused')
            setPauseTab('main') // ESC를 누르면 항상 메인 메뉴로
          }
          else if (gamePhase === 'paused') setGamePhase('playing')
          break
      }
    }

    const handleKeyUp = (e) => {
      if (!gameStateRef.current) return

      switch (e.code) {
        case 'KeyW': gameStateRef.current.keys.w = false; break
        case 'KeyS': gameStateRef.current.keys.s = false; break
        case 'KeyA': gameStateRef.current.keys.a = false; break
        case 'KeyD': gameStateRef.current.keys.d = false; break
        case 'ShiftLeft':
        case 'ShiftRight':
          gameStateRef.current.keys.shift = false;
          break
      }
    }

    const handleBlur = () => {
      if (gameStateRef.current) {
        gameStateRef.current.keys = { w: false, a: false, s: false, d: false, shift: false }
      }
    }

    const handleMouseMove = (e) => {
      if (!gameStateRef.current || !canvasRef.current) return
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      // 캔버스 내 마우스 위치
      const mouseX = (e.clientX - rect.left) * scaleX
      const mouseY = (e.clientY - rect.top) * scaleY
      
      gameStateRef.current.mouse.x = mouseX
      gameStateRef.current.mouse.y = mouseY
      
      // 월드 좌표로 변환
      gameStateRef.current.mouse.worldX = mouseX + gameStateRef.current.camera.x
      gameStateRef.current.mouse.worldY = mouseY + gameStateRef.current.camera.y
    }

    const handleMouseClick = (e) => {
      if (!gameStateRef.current) return
      // Left click (button 0) toggles aim mode
      if (e.button === 0 && gamePhase === 'playing') {
        gameStateRef.current.aimMode = gameStateRef.current.aimMode === 'auto' ? 'manual' : 'auto'
        console.log('[AIM] Mode changed to:', gameStateRef.current.aimMode)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseClick)
    }
  }, [gamePhase])

}
