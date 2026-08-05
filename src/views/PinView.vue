<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PinPad from '@/components/PinPad.vue'
import { useSessionStore } from '@/store/session'
import { MOCK_MEMBER_PIN } from '@/mock/data'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const session = useSessionStore()

const pin = ref('')
const MAX_ATTEMPTS = 3
// state 必须随 route.query.state 响应（预览用 ?state=error|locked 直达）
const state = ref<'input' | 'error' | 'locked'>('input')
const attempts = ref(0)
const errorShake = ref(false)

function applyStateFromRoute() {
  const s = route.query.state
  if (s === 'error') {
    state.value = 'error'
    attempts.value = 1
  } else if (s === 'locked') {
    state.value = 'locked'
    attempts.value = MAX_ATTEMPTS
  } else {
    state.value = 'input'
    attempts.value = 0
  }
}
applyStateFromRoute()
watch(() => route.query.state, applyStateFromRoute)

function onConfirm() {
  if (pin.value.length < 4) return
  if (pin.value === MOCK_MEMBER_PIN) {
    router.push('/campaign')
    return
  }
  attempts.value++
  pin.value = ''
  errorShake.value = false
  requestAnimationFrame(() => (errorShake.value = true))
  if (attempts.value >= MAX_ATTEMPTS) {
    state.value = 'locked'
  } else {
    state.value = 'error'
  }
}

function dismissError() {
  state.value = 'input'
}

function close() {
  session.reset()
  router.push('/standby')
}
</script>

<template>
  <div class="pin-view fade-in">
    <!-- 隐私窗口容器（设计稿"输入密码2" 居中卡片） -->
    <div class="privacy-window pop-in">
      <div class="pin-title">{{ t('pin.memberTitle') }}</div>
      <PinPad
        v-model="pin"
        :max-length="4"
        :shake="errorShake"
        @confirm="onConfirm"
        @close="close"
      />
    </div>

    <!-- 密码错误弹窗（设计稿"输入密码2. 密码错误"） -->
    <div v-if="state === 'error'" class="dim-overlay" @click.self="dismissError">
      <div class="modal error pop-in">
        <div class="modal-icon warn">!</div>
        <div class="modal-title">{{ t('pin.errorTitle') }}</div>
        <div class="modal-desc">{{ t('pin.errorDesc') }}</div>
        <div class="modal-note">{{ t('pin.errorNote') }}</div>
        <button class="btn btn-primary modal-btn" @click="dismissError">
          {{ t('common.confirm') }}
        </button>
      </div>
    </div>

    <!-- 账户锁定弹窗（设计稿"输入密码2. 账户锁定"） -->
    <div v-if="state === 'locked'" class="dim-overlay">
      <div class="modal locked pop-in">
        <div class="modal-icon danger">🔒</div>
        <div class="modal-title">{{ t('pin.lockedTitle') }}</div>
        <div class="modal-desc">
          {{ t('pin.lockedDesc') }}<br />
          {{ t('pin.lockedDesc2') }}
        </div>
        <button class="btn btn-primary modal-btn" @click="close">
          {{ t('common.backHome') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-view {
  width: 1080px;
  height: 1820px;
  position: relative;
  background: linear-gradient(160deg, #2a2118 0%, #4a3a24 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.privacy-window {
  width: 760px;
  padding: 72px 60px 56px;
  background: var(--cream);
  border-radius: 32px;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
}
.pin-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
  text-align: center;
  letter-spacing: 1px;
}

.dim-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 14, 8, 0.65);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  width: 600px;
  padding: 64px 56px;
  background: var(--white);
  border-radius: 28px;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}
.modal-icon {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: #fff;
  margin-bottom: 8px;
}
.modal-icon.warn { background: var(--warning); }
.modal-icon.danger { background: var(--danger); font-size: 56px; }
.modal-title {
  font-size: 40px;
  font-weight: 700;
  color: var(--ink);
}
.modal-desc {
  font-size: 26px;
  color: var(--ink-soft);
  line-height: 1.6;
}
.modal-note {
  font-size: 22px;
  color: var(--ink-soft);
  line-height: 1.5;
  opacity: 0.8;
}
.modal-btn {
  margin-top: 16px;
  width: 100%;
  height: 96px;
  font-size: 30px;
}
.btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: var(--font-cn);
  font-weight: 600;
  transition: transform 0.08s, background 0.15s;
}
.btn:active { transform: scale(0.98); }
.btn-primary {
  background: linear-gradient(135deg, #c9a24d, #a67c1f);
  color: #fff;
}
.btn-ghost {
  background: transparent;
  color: var(--ink-soft);
  border: 1.5px solid var(--cream-2);
}
</style>
