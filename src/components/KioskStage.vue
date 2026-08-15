<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 将 1080×1920 舞台等比缩放到当前窗口，居中显示
const DESIGN_W = 1080
const DESIGN_H = 1920
const scale = ref(1)

function fit() {
  const sw = window.innerWidth
  const sh = window.innerHeight
  scale.value = Math.min(sw / DESIGN_W, sh / DESIGN_H)
}

onMounted(() => {
  fit()
  window.addEventListener('resize', fit)
})
onUnmounted(() => window.removeEventListener('resize', fit))
</script>

<template>
  <div class="kiosk-viewport">
    <div class="kiosk-stage" :style="{ transform: `scale(${scale})` }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.kiosk-viewport {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kiosk-stage {
  width: 1080px;
  height: 1920px;
  flex-shrink: 0;
  transform-origin: center center;
  overflow: hidden;
  background: var(--cream);
}
</style>
