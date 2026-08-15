<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/session'
import { mockPrint, type PrintPhase } from '@/mock/hardware'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()

// 支持 ?fault=interrupt|fail 直接演示故障；?total=n 指定张数
const faultQ = route.query.fault as 'interrupt' | 'fail' | undefined
const fault = faultQ ?? session.injectFault
const totalQ = route.query.total !== undefined ? Number(route.query.total) : undefined
const total = computed(() => totalQ && !isNaN(totalQ) ? totalQ : session.quantity || 3)
const current = ref(0)
const phase = ref<PrintPhase>('printing')
let cancelPrint: (() => void) | null = null

// 成功后自动登出倒计时
const autoLogout = ref(45)
let logoutTimer: number | undefined

function startPrint() {
  phase.value = 'printing'
  current.value = 0
  cancelPrint = mockPrint({ total: total.value, fault }, (u) => {
    current.value = u.current
    phase.value = u.phase
    if (u.phase === 'success') startAutoLogout()
    if (u.phase === 'failed') startFailLogout()
  })
}

function startAutoLogout() {
  autoLogout.value = 45
  logoutTimer = window.setInterval(() => {
    autoLogout.value--
    if (autoLogout.value <= 0) logout()
  }, 1000)
}

function startFailLogout() {
  // 失败后短暂停留即登出
  logoutTimer = window.setTimeout(() => logout(), 6000)
}

function logout() {
  clearTimers()
  session.reset()
  router.push('/standby')
}

function selectOther() {
  clearTimers()
  router.push('/campaign')
}

function clearTimers() {
  if (logoutTimer) {
    window.clearInterval(logoutTimer)
    window.clearTimeout(logoutTimer)
  }
  if (cancelPrint) cancelPrint()
}

onMounted(startPrint)
onUnmounted(clearTimers)
</script>

<template>
  <div class="printing-view">
    <div class="dim-overlay">
      <!-- 打印中 -->
      <div v-if="phase === 'printing'" class="modal printing pop-in">
        <div class="printer-anim">
          <div class="printer-body" />
          <div class="paper-out" />
        </div>
        <div class="p-title">{{ t('printing.title') }}</div>
        <div class="p-progress">{{ t('printing.progress', { cur: current, total }) }}</div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: `${(current / total) * 100}%` }" />
        </div>
        <div class="p-total">{{ t('printing.total', { total }) }}</div>
      </div>

      <!-- 成功 -->
      <div v-else-if="phase === 'success'" class="modal success pop-in">
        <div class="result-icon ok">✓</div>
        <div class="p-title">{{ t('printing.successTitle') }}</div>
        <div class="p-desc">{{ t('printing.successDesc') }}</div>
        <div class="countdown">{{ t('printing.autoLogout', { n: autoLogout }) }}</div>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="logout">{{ t('common.logout') }}</button>
          <button class="btn btn-primary" @click="selectOther">{{ t('printing.selectOther') }}</button>
        </div>
      </div>

      <!-- 中断 -->
      <div v-else-if="phase === 'interrupted'" class="modal interrupted pop-in">
        <div class="result-icon warn">!</div>
        <div class="p-title">{{ t('printing.interruptedTitle') }}</div>
        <div class="p-desc">{{ t('printing.interruptedDesc', { cur: current, total }) }}</div>
        <div class="p-sub">{{ t('printing.interruptedHint') }}</div>
        <button class="btn btn-primary result-btn" @click="logout">{{ t('common.backHome') }}</button>
      </div>

      <!-- 失败（缺纸） -->
      <div v-else class="modal failed pop-in">
        <div class="result-icon danger">✕</div>
        <div class="p-title">{{ t('printing.failTitle') }}</div>
        <div class="p-desc">{{ t('printing.failDesc') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.printing-view {
  width: 1080px;
  height: 1920px;
  position: relative;
  background: var(--cream);
}
.modal {
  width: 660px;
  padding: 60px 48px;
  background: var(--white);
  border-radius: 28px;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}
.p-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 1px;
  line-height: 1.4;
}
.p-progress,
.p-desc {
  font-size: 24px;
  color: var(--ink-soft);
  line-height: 1.5;
  letter-spacing: 1px;
}
.p-total,
.p-sub {
  font-size: 22px;
  color: var(--gold-deep);
  letter-spacing: 1px;
}
.progress-bar {
  width: 100%;
  height: 14px;
  background: var(--cream-2);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.progress-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a24d, #a67c1f);
  transition: width 0.4s ease;
}

/* 打印机动画 */
.printer-anim {
  position: relative;
  width: 200px;
  height: 160px;
}
.printer-body {
  position: absolute;
  top: 40px;
  left: 20px;
  width: 160px;
  height: 100px;
  background: var(--ink);
  border-radius: 12px;
}
.paper-out {
  position: absolute;
  top: 20px;
  left: 50px;
  width: 100px;
  height: 60px;
  background: #fff;
  border: 2px solid var(--gold);
  border-radius: 4px;
  animation: paper 1.6s ease-in-out infinite;
}
@keyframes paper {
  0%,
  100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

/* 结果图标 */
.result-icon {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: #fff;
  font-weight: 700;
}
.result-icon.ok { background: var(--gold); }
.result-icon.warn { background: var(--warning); }
.result-icon.danger { background: var(--danger); }

.countdown {
  font-size: 22px;
  color: var(--ink-soft);
}
.countdown .num {
  font-size: 36px;
  font-weight: 700;
  color: var(--gold-deep);
  margin-right: 6px;
  font-family: var(--font-en);
  font-variant-numeric: tabular-nums;
}
.result-actions {
  display: flex;
  gap: 24px;
  width: 100%;
  margin-top: 16px;
}
.result-actions .btn {
  flex: 1;
  height: 68px;
  font-size: 22px;
  font-weight: 700;
}
.result-btn {
  width: 100%;
  height: 68px;
  margin-top: 16px;
  font-size: 22px;
  font-weight: 700;
}
</style>
