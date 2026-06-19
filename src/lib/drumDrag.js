// Svelte action — adds mouse/stylus drag-to-scroll to a drum column.
// Touch scroll is left to the browser's native handler.
export function drumDrag(node, itemH = 44) {
  let dragging = false
  let startY = 0
  let startScroll = 0

  function onPointerDown(e) {
    if (e.pointerType === 'touch') return
    if (e.button !== 0) return
    dragging = true
    startY = e.clientY
    startScroll = node.scrollTop
    node.setPointerCapture(e.pointerId)
    node.style.cursor = 'grabbing'
    e.preventDefault()
  }

  function onPointerMove(e) {
    if (!dragging) return
    node.scrollTop = startScroll + (startY - e.clientY)
  }

  function onPointerUp(e) {
    if (!dragging) return
    dragging = false
    node.releasePointerCapture(e.pointerId)
    node.style.cursor = ''
    const target = Math.round(node.scrollTop / itemH) * itemH
    node.scrollTo({ top: target, behavior: 'smooth' })
  }

  node.addEventListener('pointerdown', onPointerDown)
  node.addEventListener('pointermove', onPointerMove)
  node.addEventListener('pointerup', onPointerUp)
  node.addEventListener('pointercancel', onPointerUp)

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', onPointerUp)
      node.removeEventListener('pointercancel', onPointerUp)
    }
  }
}
