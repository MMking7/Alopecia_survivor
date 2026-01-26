export const generateId = () => Math.random().toString(36).substr(2, 9)

export const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

export const lerp = (a, b, t) => a + (b - a) * t

export const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let t = lenSq !== 0 ? dot / lenSq : -1

  t = Math.max(0, Math.min(1, t))

  const nearestX = x1 + t * C
  const nearestY = y1 + t * D

  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2)
}

export const isInsideMPattern = (point, center, width, height) => {
  const relX = point.x - center.x + width / 2
  const relY = point.y - center.y + height / 2

  if (relX < 0 || relX > width || relY < 0 || relY > height) return false

  const thickness = 80

  const leftX = width * 0.1
  const rightX = width * 0.9
  const peakY = height * 0.15
  const valleyY = height * 0.7
  const centerX = width * 0.5

  if (relX >= leftX - thickness / 2 && relX <= leftX + thickness / 2) {
    return true
  }

  if (relX >= rightX - thickness / 2 && relX <= rightX + thickness / 2) {
    return true
  }

  if (relX > leftX && relX < centerX) {
    const t = (relX - leftX) / (centerX - leftX)
    const lineY = peakY + t * (valleyY - peakY)
    if (Math.abs(relY - lineY) < thickness) return true
  }

  if (relX > centerX && relX < rightX) {
    const t = (relX - centerX) / (rightX - centerX)
    const lineY = valleyY + t * (peakY - valleyY)
    if (Math.abs(relY - lineY) < thickness) return true
  }

  return false
}
