/**
 * Sprite Animator Utility
 * Handles rendering of character sprites from sprite sheets.
 * Optimized for specific grid layouts (e.g., 30x30 frames).
 */

export const drawCharacterSprite = (ctx, img, x, y, state, isMoving, gameTime) => {
    // Configuration for 30x30 frames
    const FRAME_SIZE = 30

    // Determine Animation State
    // Run: 90x60 (3 cols, 2 rows) -> 6 Frames
    // Idle: 90x30 (3 cols, 1 row) -> 3 Frames
    const isRun = isMoving

    const totalFrames = isRun ? 6 : 3
    const cols = 3 // Both sheets are 90px wide (3 * 30)
    const rows = isRun ? 2 : 1

    // Animation Speed
    const FPS = 10 // Frames per second
    const frameIndex = Math.floor(gameTime * FPS) % totalFrames

    // Calculate Grid Position
    const col = frameIndex % cols
    const row = Math.floor(frameIndex / cols)

    // Source Rectangle (Crop from sheet)
    const sx = col * FRAME_SIZE
    const sy = row * FRAME_SIZE
    const sw = FRAME_SIZE
    const sh = FRAME_SIZE

    // Destination Rectangle (Where to draw on screen)
    // We scale the 30x30 sprite up to ~64-80px for the game
    const scale = 2.5 // 30 * 2.5 = 75px
    const dw = sw * scale
    const dh = sh * scale

    // Centering offset (character center is at x,y)
    const dx = -dw / 2
    const dy = -dh / 2 - 10 // Slight adjustment for shadow/feet

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}
