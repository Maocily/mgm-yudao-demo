<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted } from 'vue'
import StatusBar from '@/components/StatusBar.vue'
import DecoCorners from '@/components/DecoCorners.vue'
import handelIcon from '@/assets/handel.svg'
import { mockPosters } from '@/mock/data'

const router = useRouter()
const { t } = useI18n()

const posters = mockPosters
const idx = ref(0)
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    idx.value = (idx.value + 1) % posters.length
  }, 6000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})


function wake() {
  
  // return
  router.push('/login')
}
</script>

<template>
  <div class="standby fade-in" @click="wake">
    <!-- Hero 广告区 -->
    <div class="hero">
      <transition-group name="poster">
        <div
          v-for="(p, i) in posters"
          v-show="i === idx"
          :key="p"
          class="poster"
          :style="{ backgroundImage: `url(${p})` }"
        />
      </transition-group>
      <div class="top-vignette" />
      <div class="ad-copy">
        <span class="line" />
        <div class="hero-title">{{ t('standby.poster') }}</div>
        <span class="line" />
      </div>
    </div>

    <!-- 金色分隔 -->
    <div class="gold-divider standby-divider">
      <span class="line" />
      <span class="dot" />
      <span class="dot sm" />
      <span class="dot" />
      <span class="line" />
    </div>

    <!-- 轻触 CTA -->
    <!-- 设计稿：触摸环为正下方底部 CTA，含 TOUCH 副标题 -->
  <div class="touch-cta">
    <div class="touch-ring">
      <span class="ripple r1" />
      <span class="ripple r2" />
      <div class="inner">
        <img :src="handelIcon" alt="touch" width="46" height="46" />
      </div>
    </div>
    <div class="cta-text">{{ t('standby.touch') }}</div>
    <div class="cta-sub">TAP TO START</div>
  </div>

    <StatusBar />
    <DecoCorners />
  </div>
</template>

<style scoped>
.standby {
  width: 1080px;
  height: 1920px;
  position: relative;
  background: var(--cream);
}
.hero {
  position: absolute;
  top: 0;
  left: 0;
  width: 1080px;
  height: 1340px;
  overflow: hidden;
  background: #000;
}
.poster {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.poster-enter-active,
.poster-leave-active {
  transition: opacity 1.2s ease;
}
.poster-enter-from,
.poster-leave-to {
  opacity: 0;
}
.top-vignette {
  position: absolute;
  top: 0;
  left: 0;
  width: 1080px;
  height: 240px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
}
.ad-copy {
  position: absolute;
  left: 80px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.ad-copy .line {
  width: 120px;
  height: 1px;
  background: rgba(255, 255, 255, 0.8);
}
.hero-title {
  color: #fff;
  font-size: 96px;
  font-weight: 700;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  letter-spacing: 4px;
  line-height: 1.1;
}
.standby-divider {
  position: absolute;
  top: 1320px;
  left: 80px;
  width: 920px;
}
.touch-cta {
  position: absolute;
  top: 1400px;
  left: 0;
  width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.touch-ring {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ripple {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(201, 162, 77, 0.5);
  animation: ripple 2.4s ease-out infinite;
}
.ripple.r1 {
  width: 200px;
  height: 200px;
}
.ripple.r2 {
  width: 150px;
  height: 150px;
  animation-delay: 0.8s;
}
@keyframes ripple {
  0% { transform: scale(0.7); opacity: 0.8; }
  100% { transform: scale(1.15); opacity: 0; }
}
.inner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(138, 101, 15, 0.2);
}
.cta-text {
  font-size: 34px;
  color: var(--ink);
  letter-spacing: 4px;
  font-weight: 700;
}
.cta-sub {
  font-size: 22px;
  color: var(--gold-deep);
  letter-spacing: 6px;
  opacity: 0.7;
  margin-top: -16px;
  font-weight: 500;
}
</style>
