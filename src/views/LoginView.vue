<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import DecoCorners from '@/components/DecoCorners.vue'
import LangSwitch from '@/components/LangSwitch.vue'
import PinPad from '@/components/PinPad.vue'
import { useSessionStore } from '@/store/session'
import { mockReadCard, mockScanQr, mockNfc, type MemberInfo } from '@/mock/hardware'
import { MOCK_ADMIN_PIN } from '@/mock/data'

import cardIllu from '@/assets/3.gif'
import qrIllu from '@/assets/2.gif'
import nfcIllu from '@/assets/1.gif'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()

// ?hint=1 时显示隐藏员工入口的引导标注（设计稿"01 选择登录方式 · 隐藏员工入口手势"）
const showHint = ref(route.query.hint === '1')
watch(() => route.query.hint, v => (showHint.value = v === '1'))

const busy = ref<'card' | 'qr' | 'nfc' | null>(null)

async function login(method: 'card' | 'qr' | 'nfc') {
  return;
  if (busy.value) return
  busy.value = method
  let member: MemberInfo
  try {
    if (method === 'card') member = await mockReadCard()
    else if (method === 'qr') member = await mockScanQr()
    else member = await mockNfc()
    session.login(member)
    router.push('/pin')
  } finally {
    busy.value = null
  }
}

// ---- 隐藏员工入口：左下角连击 5 次 → 弹出 admin PIN overlay（设计稿"管理员登录"） ----
const showAdmin = ref(false)
const adminPin = ref('')
const adminError = ref(false)

const taps = ref(0)
let tapTimer: number | undefined
function staffTap() {
  taps.value++
  if (tapTimer) window.clearTimeout(tapTimer)
  tapTimer = window.setTimeout(() => (taps.value = 0), 1500)
  if (taps.value >= 5) {
    taps.value = 0
    showAdmin.value = true
  }
}

function onAdminConfirm() {
  if (adminPin.value.length < 6) return
  if (adminPin.value === MOCK_ADMIN_PIN) {
    showAdmin.value = false
    adminPin.value = ''
    adminError.value = false
    router.push('/admin/device')
  } else {
    adminError.value = true
    adminPin.value = ''
  }
}

function closeAdmin() {
  showAdmin.value = false
  adminPin.value = ''
  adminError.value = false
}

function backHome() {
  session.reset()
  router.push('/standby')
}
</script>

<template>
  <div class="login fade-in">
    <StatusBar />

    <!-- 顶部装饰：金色细分隔线 + 小菱形 -->
    <div class="header-deco">
      <div class="gold-divider">
        <span class="line" />
        <span class="dot sm" />
        <span class="line" />
      </div>
      <div class="sub-cap">{{ t('login.title') }}</div>
    </div>

    <!-- 主标题区 -->
    <div class="title-block">
      <h1 class="welcome">{{ t('login.welcome') }}</h1>
      <p class="subtitle">{{ t('login.subtitle') }}</p>
    </div>

    <!-- 横向三张方法卡 -->
    <div class="method-row">
      <div
        class="method-card"
        :class="{ busy: busy === 'card' }"
        @click="login('card')"
      >
        <div class="illu">
          <img :src="cardIllu" alt="card" />
        </div>
        <div class="m-name">{{ t('login.card') }}</div>
        <div class="m-hint">
          {{ busy === 'card' ? '···' : (showHint ? t('login.cardShortHint') : t('login.cardHint')) }}
        </div>
      </div>

      <div class="or">{{ t('common.or') }}</div>

      <div
        class="method-card"
        :class="{ busy: busy === 'qr' }"
        @click="login('qr')"
      >
        <div class="illu">
          <img :src="qrIllu" alt="qr" />
        </div>
        <div class="m-name">{{ t('login.qr') }}</div>
        <div class="m-hint">
          {{ busy === 'qr' ? '···' : (showHint ? t('login.qrShortHint') : t('login.qrHint')) }}
        </div>
      </div>

      <div class="or">{{ t('common.or') }}</div>

      <div
        class="method-card"
        :class="{ busy: busy === 'nfc' }"
        @click="login('nfc')"
      >
        <div class="illu">
          <img :src="nfcIllu" alt="nfc" />
        </div>
        <div class="m-name">{{ t('login.nfc') }}</div>
        <div class="m-hint">
          {{ busy === 'nfc' ? '···' : (showHint ? t('login.nfcShortHint') : t('login.nfcHint')) }}
        </div>
      </div>
    </div>

    <!-- 底部三段：返回 / 版本号 / 语言切换 -->
    <div class="footer">
      <button class="back-hint" @click="backHome">
        <span class="arrow">‹</span>
        <span class="label">{{ t('common.back') }}</span>
      </button>

      <div class="device-tag">{{ t('login.deviceTag') }}</div>

      <LangSwitch style="position:absolute;right:10px;"/>
    </div>

    <!-- 隐藏员工入口热区（左下角） -->
    <div class="staff-hotspot" :class="{ reveal: showHint }" @click="staffTap">
      <span v-if="showHint" class="tap-badge">{{ t('login.staffHotspotBadge') }}</span>
    </div>

    <!-- 引导标注（仅 ?hint=1 预览时显示） -->
    <div v-if="showHint" class="gesture-annotation">
      <div class="ga-title">{{ t('login.staffEntry') }}</div>
      <div class="ga-desc">{{ t('login.staffHotspotHint') }}</div>
      <div class="ga-foot">{{ t('login.staffGestureDesc') }}</div>
    </div>

    <!-- 管理员 PIN overlay（设计稿"管理员登录"—— 与登录页同页叠加） -->
    <div v-if="showAdmin" class="dim-overlay" @click.self="closeAdmin">
      <div class="admin-window pop-in" :class="{ shake: adminError }">
        <div class="admin-title">{{ t('pin.adminTitle') }}</div>
        <PinPad
          v-model="adminPin"
          :max-length="6"
          @confirm="onAdminConfirm"
          @close="closeAdmin"
        />
        <div v-if="adminError" class="err">{{ t('pin.errorTitle') }}</div>
      </div>
    </div>

    <DecoCorners />
  </div>
</template>

<style scoped>
.login {
  width: 1080px;
  height: 1820px;
  position: relative;
  background: var(--cream);
}

/* 顶部装饰：金色分隔线 + 小菱形 + 小副标 */
.header-deco {
  position: absolute;
  top: 130px;
  left: 80px;
  width: 920px;
  text-align: center;
}
.header-deco .gold-divider {
  margin: 0 auto;
  max-width: 320px;
}
.sub-cap {
  margin-top: 16px;
  font-size: 26px;
  color: var(--gold-deep);
  letter-spacing: 6px;
}

/* 主标题区 */
.title-block {
  position: absolute;
  top: 240px;
  left: 0;
  width: 1080px;
  text-align: center;
}
.welcome {
  font-size: 76px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.1;
}
.subtitle {
  margin-top: 28px;
  font-size: 30px;
  color: var(--ink-soft);
  letter-spacing: 2px;
}

/* 横向三卡 */
.method-row {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 960px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  transform: translate(-50%, -50%);
}
.method-card {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap:20px;
  transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s;
}
.method-card:active {
 
}
.method-card.busy {
}
.illu {
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}
.illu img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.m-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 2px;
}
.m-hint {
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.45;
  padding: 0 8px;
  min-height: 52px;
  white-space: pre-line;
}
.or {
  align-self: center;
  font-size: 24px;
  color: var(--ink-soft);
  padding: 0 4px;
  letter-spacing: 2px;
}

/* 底部三段 */
.footer {
  position: absolute;
  bottom: 70px;
  left: 80px;
  width: 920px;
  height:72px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-hint {
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 26px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-cn);
  padding: 0;
}
.back-hint .arrow {
  font-size: 36px;
  line-height: 1;
}
.device-tag {
  position: absolute;
  left:0px;
  font-size: 11px;
  color: #C9A24D66;
  letter-spacing: 1px;
}

/* 隐藏员工入口相关（保留原行为） */
.staff-hotspot {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 220px;
  height: 160px;
  z-index: 20;
}
.staff-hotspot.reveal {
  border: 2px dashed var(--gold);
  border-radius: 0 var(--r-md) 0 0;
  background: rgba(201, 162, 77, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tap-badge {
  background: var(--gold-deep);
  color: #fff;
  font-size: 22px;
  padding: 8px 20px;
  border-radius: var(--r-pill);
}
.gesture-annotation {
  position: absolute;
  left: 260px;
  bottom: 60px;
  z-index: 21;
  background: var(--white);
  border: 1.5px solid var(--gold);
  border-radius: var(--r-md);
  padding: 24px 32px;
  box-shadow: var(--shadow-card);
  max-width: 510px;
}
.ga-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--gold-deep);
}
.ga-desc {
  font-size: 22px;
  color: var(--ink-soft);
  margin-top: 10px;
  line-height: 1.5;
}
.ga-foot {
  font-size: 20px;
  color: var(--gold-deep);
  margin-top: 8px;
  opacity: 0.8;
}

/* ---- Admin overlay ---- */
.dim-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 14, 8, 0.6);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.admin-window {
  background: var(--cream);
  border-radius: 32px;
  box-shadow: var(--shadow-modal);
  padding: 64px 80px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.admin-window.shake {
  animation: shake 0.4s;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12px); }
  75% { transform: translateX(12px); }
}
.admin-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
}
.err {
  color: var(--danger);
  font-size: 24px;
  margin-top: -8px;
}
</style>
