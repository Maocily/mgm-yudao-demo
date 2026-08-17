<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import DecoCorners from '@/components/DecoCorners.vue'
import LangSwitch from '@/components/LangSwitch.vue'
import PinPad from '@/components/PinPad.vue'
import { useSessionStore } from '@/store/session'
import { mockReadCard, mockScanQr, mockNfc, type MemberInfo } from '@/mock/hardware'

// PR-11 (2026-08-15) / F-06: MOCK_ADMIN_PIN/MOCK_MEMBER_PIN 删除,PIN 校验下沉到主进程 (首次启动 SecureRandom 生成,落盘 userData/kiosk-pins.json)
// 渲染层只负责收集 PIN 调 window.kioskBridge.verifyPin()

import cardIllu from '@/assets/1.gif'
import qrIllu from '@/assets/2.gif'
import nfcIllu from '@/assets/3.gif'
import lockedIllu from '@/assets/svg-icons/icon-lock-red.svg'
import gangIllu from '@/assets/svg-icons/icon-warning.svg'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()

// ?hint=1 时显示隐藏员工入口的引导标注（设计稿"01 选择登录方式 · 隐藏员工入口手势"）
const showHint = ref(route.query.hint === '1')
watch(() => route.query.hint, v => (showHint.value = v === '1'))

const busy = ref<'card' | 'qr' | 'nfc' | null>(null)

async function login(method: 'card' | 'qr' | 'nfc') {
  if (busy.value) return
  busy.value = method
  let member: MemberInfo
  try {
    if (method === 'card') member = await mockReadCard()
    else if (method === 'qr') member = await mockScanQr()
    else member = await mockNfc()
    session.login(member)
    // 设计稿"输入密码2"：会员密码以弹窗形式叠加在登录页上，位置距底部 1/5
    openMemberPin()
  } finally {
    busy.value = null
  }
}

// ---- 会员 PIN 弹窗（设计稿"输入密码2" — overlay，非独立页面） ----
const showMemberPin = ref(false)
const memberPin = ref('')
const pinAttempts = ref(0)
const pinState = ref<'input' | 'error' | 'locked'>('input')
const MAX_ATTEMPTS = 3

// KDialog v-model 适配:用 computed 把 pinState 转成两个 boolean
// 用户关闭 KDialog 时(set false)自动回到 'input' 状态
// const showPinError = ref(true)
const showPinError = computed({
  get: () => pinState.value === 'error',
  set: (v) => { if (!v) pinState.value = 'input' }
})
// const showPinLocked = ref(true);
const showPinLocked = computed({
  get: () => pinState.value === 'locked',
  set: (v) => { if (!v) pinState.value = 'input' }
})

function openMemberPin(initialState: 'input' | 'error' | 'locked' = 'input') {
  memberPin.value = ''
  pinAttempts.value = initialState === 'locked' ? MAX_ATTEMPTS : 0
  pinState.value = initialState
  showMemberPin.value = true
}

async function onMemberConfirm() {
  if (memberPin.value.length < 4) return
  // PR-11 (2026-08-15) / F-06: PIN 校验下沉到主进程 (主进程:常量时间比对 + 限流)
  const result = await window.kioskBridge.verifyPin('member', memberPin.value)
  if (result.ok) {
    showMemberPin.value = false
    pinState.value = 'input'
    router.push('/campaign')
    return
  }
  pinAttempts.value++
  memberPin.value = ''
  pinState.value = pinAttempts.value >= MAX_ATTEMPTS ? 'locked' : 'error'
}

function dismissPinError() {
  pinState.value = 'input'
}

function closeMemberPin() {
  showMemberPin.value = false
  memberPin.value = ''
  pinAttempts.value = 0
  pinState.value = 'input'
  session.reset()
}

function backHomeFromLock() {
  closeMemberPin()
  router.push('/standby')
}

// 预览支持：?pin=input|error|locked 直达指定状态（响应式初始值，setup 期内生效）
const previewPin = (() => {
  const p = route.query.pin
  if (p === 'error' || p === 'locked' || p === 'input') {
    session.login({ memberId: 'M888168', name: '尊贵会员', cardNo: '**** 6688' })
    return p
  }
  return null
})()
if (previewPin) {
  openMemberPin(previewPin as 'input' | 'error' | 'locked')
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

async function onAdminConfirm() {
  if (adminPin.value.length < 6) return
  // PR-11 (2026-08-15) / F-06: PIN 校验下沉到主进程
  const result = await window.kioskBridge.verifyPin('admin', adminPin.value)
  if (result.ok) {
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
          {{ (showHint ? t('login.cardShortHint') : t('login.cardHint')) }}
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
        <div class="m-hint" v-dompurify-html="t('login.qrHint')"></div>
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
          {{ (showHint ? t('login.nfcShortHint') : t('login.nfcHint')) }}
        </div>
      </div>
    </div>

    <!-- 底部三段：版本号 / 返回 / 语言切换 -->
    <div class="footer">
      <div class="device-tag">{{ t('login.deviceTag') }}</div>

      <button class="back-hint" @click="backHome">
        <svg
          data-pencil-name="BackIcon"
          data-icon-name="chevron-left"
          data-icon-set="feather"
          viewBox="0 0 14 14"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          class="back-icon"
          aria-hidden="true"
        >
          <path
            d="M8.54492 2.82813q-0.06836 0.02734-0.41015 0.35546-0.3418 0.32813-1.51758 1.49024-0.7793 0.7793-1.3125 1.32617-0.5332 0.54688-0.56055 0.60156-0.04102 0.05469-0.05469 0.10938-0.01367 0.05469-0.01367 0.16406 0 0.10938 0.01367 0.16406 0.01367 0.05469 0.05469 0.10938 0.02734 0.05469 0.60156 0.64258 0.57422 0.58789 1.25782 1.27148 0.68359 0.68359 1.27148 1.24414 0.57422 0.57422 0.61523 0.58789 0.20508 0.10938 0.42383 0.03418 0.21875-0.07519 0.3418-0.2666 0.04102-0.06836 0.05469-0.12305 0.01367-0.05469 0.01367-0.16406 0-0.0957-0.01367-0.15723-0.01367-0.06152-0.02735-0.10254-0.02734-0.02734-0.49902-0.51953-0.47168-0.49219-1.12793-1.13476l-1.57227-1.58594 1.57227-1.58594q0.65625-0.64258 1.12793-1.13476 0.47168-0.49219 0.49902-0.51953 0.01367-0.04102 0.02735-0.10254 0.01367-0.06152 0.01367-0.15723 0-0.10938-0.01367-0.16406-0.01367-0.05469-0.05469-0.12305-0.08203-0.12305-0.21191-0.20508-0.12988-0.08203-0.29395-0.08203-0.05469 0-0.10937 0.00684-0.05469 0.00684-0.10938 0.0205l0.01367 0z"
            fill="#8A650F"
          />
        </svg>
        <span class="label">{{ t('common.back') }}</span>
      </button>

      <LangSwitch />
    </div>

    <!-- 隐藏员工入口热区（左下角） -->
    <div class="staff-hotspot" :class="{ reveal: showHint }" @click="staffTap">
      <!-- <span  class="tap-badge">{{ t('login.staffHotspotBadge') }}</span> -->
    </div>



    <!-- 会员 PIN 弹窗（设计稿"输入密码2" — 距底部 1/5，叠加在登录页上） -->
    <div v-if="showMemberPin" class="pin-overlay" @click.self="closeMemberPin">
      <div class="pin-window">
        <div class="pin-title" v-dompurify-html="t('pin.memberTitle')"></div>
        <PinPad
          v-model="memberPin"
          :max-length="4"
          @confirm="onMemberConfirm"
          @close="closeMemberPin"
        />
      </div>
    </div>

    <!-- 密码错误弹窗（设计稿"输入密码2. 密码错误"） — KDialog -->
    <KDialog
      v-model="showPinError"
      width="740px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="modal-body">
        <div class="modal-icon ">
          <img :src="gangIllu" alt="locked" />
        </div>
        <div class="pin-error-title">
          {{ t('pin.errorTitle') }}
        </div>
   
       <div>
         <div class="modal-desc">{{ t('pin.errorDesc') }}</div>
        <div class="modal-desc">{{ t('pin.errorNote') }}</div>
       </div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-primary" @click="dismissPinError">
          {{ t('common.confirm') }}
        </button>
      </template>
    </KDialog>

    <!-- 账户锁定弹窗（设计稿"输入密码2. 账户锁定"） — KDialog -->
    <KDialog
      v-model="showPinLocked"
      width="740px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="modal-body">
        <div class="modal-icon ">
          <img :src="lockedIllu" alt="locked" />
        </div>
        <div class="pin-error-title">
          {{ t('pin.lockedTitle') }}
        </div>
        <div class="modal-desc">
          {{ t('pin.lockedDesc') }}<br />
          {{ t('pin.lockedDesc2') }}
        </div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-primary" @click="backHomeFromLock">
          {{ t('common.confirm') }}
        </button>
      </template>
    </KDialog>

    <!-- 管理员 PIN overlay（设计稿"管理员登录"—— 居中叠加） -->
    <div v-if="showAdmin" class="dim-overlay" @click.self="closeAdmin">
      <div class="admin-window">
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

<style scoped lang="scss">
.login {
  width: 1080px;
  height: 1920px;
  position: relative;
  background: var(--cream);
}

/* 顶部装饰：金色分隔线 + 小菱形 + 小副标 */
.header-deco {
  position: absolute;
  top: 140px;
  left: 80px;
  width: 920px;
  text-align: center;
}
.header-deco .gold-divider {
  margin: 0 auto;
  max-width: 320px;
  height:18px;
}
.sub-cap {
  margin-top: 18px;
  font-size: 20px;
  color: #C9A24D;
  font-weight: 500;
}

/* 主标题区 */
.title-block {
  position: absolute;
  top: 250px;
  left: 0;
  width: 1080px;
  text-align: center;
}
.welcome {
  font-size: 78px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.1;
}
.subtitle {
  margin-top: 28px;
  font-size: 32px;
  color: #2A2118;
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
  gap: 24px;
  transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s;
}
.illu {
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
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
}
.m-hint {
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.5;
  min-height: 54px;
  white-space: pre-line;
}
.or {
  align-self: center;
  font-size: 18px;
  color: #C9A24D;
  padding: 0 4px;
  font-weight: 500;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width:20px;
}
.or::before,
.or::after {
  content: '';
  display: block;
  width: 1.5px;
  height: 70px;
  background: var(--gold);
  border-radius: 1px;
}

/* 底部三段 */
.footer {
  position: absolute;
  bottom: 70px;
  left: 80px;
  width: 920px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back-hint {
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 32px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-cn);
  padding: 0;
}
.back-icon {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
}
.device-tag {
  font-size: 11px;
  color: #c9a24d66;
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

/* ---- 会员 PIN overlay（设计稿"输入密码2"） ----
   距底部 1/5：bottom: 20%（相对 .login 高度 1920 = 384px） */
.pin-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 14, 8, 0.45);
  z-index: 40;
}
.pin-window {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 460px;
  padding: 36px 32px 32px;
  background: var(--cream);
  border-radius: 32px;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;
}
.pin-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
  line-height: 1.4;
}

/* 错误/锁定弹窗（KDialog 内容区） */
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  text-align: center;
  padding: 8px 0;
}
.pin-error-title {
  color: #9e1b2a;
  font-size: 36px;
  font-weight: 700;
}
.modal-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: #fff;
  font-weight: 700;
  line-height: 1;
  img {
    width: 100px;
    height: 100px;
    object-fit: contain;
  }
}
.modal-icon--warn { background: var(--warning); }
.modal-icon--danger { background: var(--danger); font-size: 56px; }
.modal-desc {
  font-size: 24px;
  color: var(--ink-soft);
  line-height: 1.6;
}
.modal-note {
  font-size: 22px;
  color: var(--ink-soft);
  line-height: 1.5;
  opacity: 0.8;
}

/* ---- Admin overlay（居中叠加，与会员 PIN 区分） ---- */
.dim-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 14, 8, 0.6);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-window {
  background: var(--cream);
  border-radius: 32px;
  box-shadow: var(--shadow-modal);
  padding: 36px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: absolute;
  bottom: 20%;
  left: 50%;
  width: 500px;
  box-sizing: border-box;
  transform: translateX(-50%);
}

.admin-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.4;
}
.err {
  color: var(--danger);
  font-size: 24px;
  margin-top: -8px;
  font-weight: 600;
}

:deep(.k-dialog__footer) {
  padding: 0;
  button {
    width: 100%;
  }
}
</style>
