import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 空闲自动登出：无触摸操作 timeoutMs 后触发回调。
 * 监听 pointerdown/touchstart 重置计时。
 */
export function useIdleTimeout(timeoutMs: number, onIdle: () => void) {
  const remaining = ref(Math.ceil(timeoutMs / 1000))
  let deadline = 0
  let tick: number | undefined

  const reset = () => {
    deadline = Date.now() + timeoutMs
    remaining.value = Math.ceil(timeoutMs / 1000)
  }

  const loop = () => {
    const left = Math.max(0, deadline - Date.now())
    remaining.value = Math.ceil(left / 1000)
    if (left <= 0) {
      onIdle()
      reset()
    }
  }

  const events = ['pointerdown', 'touchstart', 'keydown']

  onMounted(() => {
    reset()
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    tick = window.setInterval(loop, 500)
  })
  onUnmounted(() => {
    events.forEach((e) => window.removeEventListener(e, reset))
    if (tick) window.clearInterval(tick)
  })

  return { remaining, reset }
}
