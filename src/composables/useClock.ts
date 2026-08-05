import { ref, onMounted, onUnmounted } from 'vue'

/** 实时时钟 HH:mm */
export function useClock() {
  const time = ref('00:00')
  let timer: number | undefined

  const update = () => {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    time.value = `${hh}:${mm}`
  }

  onMounted(() => {
    update()
    timer = window.setInterval(update, 1000)
  })
  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
  })

  return { time }
}
