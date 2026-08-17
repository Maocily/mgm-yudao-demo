<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import PinPad from '@/components/PinPad.vue'
import { mockDevice } from '@/mock/data'
import { mockTestPrint } from '@/mock/hardware'

import chatouIcon from '@/assets/svg-icons/icon-plug.svg'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const d = mockDevice

type Modal = null | 'testSuccess' | 'testFail' | 'changePaper' | 'restart' | 'unlockSuccess' | 'restartPin'
// 支持 ?modal=testSuccess|testFail|changePaper|restart|unlockSuccess 直达（预览用）
const modal = ref<Modal>((route.query.modal as Modal) || null)
watch(() => route.query.modal, v => (modal.value = (v as Modal) || null))
const testing = ref(false)
// PR-11 (2026-08-15) / F-01: 重启需要 admin PIN
const restartPin = ref('')
const restartPinError = ref(false)

async function testPrint() {
  if (testing.value) return
  testing.value = true
  // 演示：这里默认成功；如需演示失败可传 true
  const ok = await mockTestPrint(false)
  testing.value = false
  modal.value = ok ? 'testSuccess' : 'testFail'
}

function confirmRestart() {
  // PR-11: 先弹 PIN 收集,主进程做常量时间比对 + 限流
  modal.value = 'restartPin'
  restartPin.value = ''
  restartPinError.value = false
}

async function submitRestartPin() {
  if (restartPin.value.length < 6) return
  if (!window.kioskBridge) {
    router.push('/standby')
    return
  }
  const result = await window.kioskBridge.relaunch(restartPin.value)
  if (!result.ok) {
    restartPinError.value = true
    restartPin.value = ''
  }
  // ok 时主进程会自己 quit,不需要前端处理
}

function cancelRestartPin() {
  modal.value = null
  restartPin.value = ''
  restartPinError.value = false
}

function unlock() {
  modal.value = 'unlockSuccess'
}

function exitToHome() {
  modal.value = null
  router.push('/login')
}

const paperPct = Math.round((d.paperRemain / d.paperTotal) * 100)

// 换纸弹窗：输入纸张数量（数字键盘用字符串拼接，保存时 parseInt 校验）
const paperInput = ref<string>(String(d.paperRefill))
function openChangePaper() {
  paperInput.value = String(d.paperRefill)
  modal.value = 'changePaper'
}
function saveChangePaper() {
  if (paperInput.value.length === 0) return
  const n = parseInt(paperInput.value, 10)
  if (Number.isNaN(n) || n < 0) return
  // 演示：保存即关闭弹窗并更新本地数据
  modal.value = null
}

// KDialog v-model 适配:把 modal 状态转成 5 个 boolean
// 用户关闭 KDialog 时(set false)自动回到 null
const showTestSuccess = computed({
  get: () => modal.value === 'testSuccess',
  set: (v) => { if (!v) modal.value = null }
})
const showTestFail = computed({
  get: () => modal.value === 'testFail',
  set: (v) => { if (!v) modal.value = null }
})
const showChangePaper = computed({
  get: () => modal.value === 'changePaper',
  set: (v) => { if (!v) modal.value = null }
})
const showRestart = computed({
  get: () => modal.value === 'restart',
  set: (v) => { if (!v) modal.value = null }
})
const showUnlockSuccess = computed({
  get: () => modal.value === 'unlockSuccess',
  set: (v) => { if (!v) modal.value = null }
})
</script>

<template>
  <div class="device fade-in">
    <StatusBar :isAdmin="true"/>
    <div class="scroll">
      <!-- 设备状态卡组 -->
      <div class="gap20">
        <div class="section-title">{{ t('device.statusSection') }}</div>
        <div class="card card-network">
          <div class="card-icon">
            <img :src="chatouIcon" />
          </div>
          <div class="card-body">
            <div class="card-head">
              <span class="c-name">{{ t('device.network') }}</span>
              <span class="badge ok">{{ t('device.online') }}</span>
            </div>
            <div class="c-rows">
              <div>
                <span>{{ t('device.ip') }}</span>
                <b>{{ d.ip }}</b>
              </div>
              <div>
                <span>{{ t('device.latency') }}</span>
                <b>{{ d.latency }} ms</b>
              </div>
              <div>
                <span>{{ t('device.uplink') }}</span>
                <b>↑ {{ d.uplink }}</b>
              </div>
              <div>
                <span>{{ t('device.uptime') }}</span>
                <b>{{ t('device.uptimeVal', { h: d.uptimeHours }) }}</b>
              </div>
            </div>
          </div>
        </div>
        <div class="row-3">
          <div class="card">
            <div class="card-head">
              <span class="c-name">{{ t('device.paper') }}</span>
              <span class="badge ok">{{ t('device.paperEnough') }}</span>
            </div>
            <div class="paper-bar">
              <div class="fill" :style="{ width: `${paperPct}%` }" />
            </div>
            <div class="c-note">{{ t('device.paperRemain', { remain: d.paperRemain, total: d.paperTotal }) }}</div>
          </div>

          <div class="card">
            <div class="card-head">
              <span class="c-name">{{ t('device.cardReader') }}</span>
              <span class="badge ok">{{ t('device.normal') }}</span>
            </div>
            <div class="c-note">{{ t('device.cardReaderVal') }}</div>
          </div>

          <div class="card">
            <div class="card-head">
              <span class="c-name">{{ t('device.scanner') }}</span>
              <span class="badge ok">{{ t('device.normal') }}</span>
            </div>
            <div class="c-note">{{ t('device.scannerVal') }}</div>
          </div>
        </div>
      </div>
      <div class="gap20">
      <!-- 系统信息 -->
      <div class="section-title">{{ t('device.infoSection') }}</div>
      <div class="info-card">
        <div class="info-row"><span>{{ t('device.deviceNo') }}</span><b>{{ d.deviceNo }}</b></div>
        <div class="info-row"><span>{{ t('device.location') }}</span><b>{{ t('device.locationVal') }}</b></div>
        <div class="info-row"><span>{{ t('device.version') }}</span><b>{{ d.version }}</b></div>
        <div class="info-row"><span>{{ t('device.lastSync') }}</span><b>{{ t('device.lastSyncVal', { time: d.lastSync }) }}</b></div>
        <div class="info-row"><span>{{ t('device.lastRestart') }}</span><b>{{ d.lastRestart }}</b></div>
      </div>
      </div>
      <div class="gap20">
      <!-- 快捷操作 -->
      <div class="section-title">{{ t('device.actionSection') }}</div>
      <div class="actions">
        <button class="action" :class="{ busy: testing }" @click="testPrint">
                
 <svg
        data-pencil-name="I"
        data-icon-name="printer"
        data-icon-set="phosphor"
        viewBox="0 0 14 14"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style="box-sizing: border-box; flex-shrink: 0; height: 30px; width: 30px"
      >
        <path
          d="M11.53906 3.9375l-0.60156 0 0-1.75q0-0.16406-0.13672-0.30078-0.13672-0.13672-0.30078-0.13672l-7 0q-0.16406 0-0.30078 0.13672-0.13672 0.13672-0.13672 0.30078l0 1.75-0.60156 0q-0.54688 0-0.95703 0.38281-0.41016 0.38281-0.41016 0.92969l0 4.375q0 0.16406 0.13672 0.30078 0.13672 0.13672 0.30078 0.13672l1.53125 0 0 1.96875q0 0.16406 0.13672 0.30078 0.13672 0.13672 0.30078 0.13672l7 0q0.16406 0 0.30078-0.13672 0.13672-0.13672 0.13672-0.30078l0-1.96875 1.53125 0q0.16406 0 0.30078-0.13672 0.13672-0.13672 0.13672-0.30078l0-4.375q0-0.54688-0.41016-0.92969-0.41016-0.38281-0.95703-0.38281z m-7.60156-1.3125l6.125 0 0 1.3125-6.125 0 0-1.3125z m6.125 8.96875l-6.125 0 0-2.84375 6.125 0 0 2.84375z m1.96875-2.40625l-1.09375 0 0-0.875q0-0.16406-0.13672-0.30078-0.13672-0.13672-0.30078-0.13672l-7 0q-0.16406 0-0.30078 0.13672-0.13672 0.13672-0.13672 0.30078l0 0.875-1.09375 0 0-3.9375q0-0.16406 0.13672-0.30078 0.13672-0.13672 0.35547-0.13672l9.07812 0q0.21875 0 0.35547 0.13672 0.13672 0.13672 0.13672 0.30078l0 3.9375z m-1.09375-2.84375q0 0.27344-0.19141 0.46484-0.19141 0.19141-0.46484 0.19141-0.27344 0-0.46484-0.19141-0.19141-0.19141-0.19141-0.46484 0-0.27344 0.19141-0.46484 0.19141-0.19141 0.46484-0.19141 0.27344 0 0.46484 0.19141 0.19141 0.19141 0.19141 0.46484z"
          fill="#8A650F"
        ></path>
      </svg> {{ t('device.testPrint') }}
        </button>
        <button class="action" @click="openChangePaper">    <svg
      data-pencil-name="I"
      data-icon-name="arrows-clockwise"
      data-icon-set="phosphor"
      viewBox="0 0 14 14"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="box-sizing: border-box; flex-shrink: 0; height: 30px; width: 30px"
    >
      <path
        d="M12.6875 2.84375l0 2.625q0 0.16406-0.10938 0.30078-0.10938 0.13672-0.32812 0.13672l-2.625 0q-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.32812 0-0.19141 0.13672-0.30078 0.13672-0.10938 0.30078-0.10938l1.58594 0-1.09375-1.14844q-0.875-0.82031-1.9961-1.12109-1.12109-0.30078-2.24218 0-1.12109 0.30078-1.9961 1.12109-0.10938 0.16406-0.30078 0.16406-0.19141 0-0.30078-0.13671-0.10938-0.13672-0.10937-0.32813 0-0.19141 0.10937-0.30078 1.03906-0.98438 2.37891-1.33984 1.33984-0.35547 2.67968 0 1.33984 0.35547 2.37891 1.33984l1.09375 1.09375 0-1.53125q0-0.21875 0.13672-0.32813 0.13672-0.10938 0.32812-0.10937 0.19141 0 0.30079 0.10937 0.10938 0.10938 0.10937 0.32813z m-2.57031 7.27344q-0.875 0.82031-1.9961 1.12109-1.12109 0.30078-2.24218 0-1.12109-0.30078-1.9961-1.12109l-1.09375-1.14844 1.58594 0q0.16406 0 0.30078-0.10938 0.13672-0.10938 0.13672-0.30078 0-0.19141-0.13672-0.32812-0.13672-0.13672-0.30078-0.13672l-2.625 0q-0.21875 0-0.32813 0.13672-0.10938 0.13672-0.10937 0.30078l0 2.625q0 0.21875 0.10937 0.32813 0.10938 0.10938 0.30079 0.10937 0.19141 0 0.32812-0.10937 0.13672-0.10938 0.13672-0.32813l0-1.53125 1.09375 1.09375q1.03906 0.98438 2.37891 1.33984 1.33984 0.35547 2.67968 0 1.33984-0.35547 2.37891-1.33984 0.10938-0.10938 0.10938-0.30078 0-0.19141-0.10938-0.32813-0.10938-0.13672-0.30078-0.13672-0.19141 0-0.30078 0.16407z"
        fill="#8A650F"
      ></path>
    </svg> {{ t('device.changePaper') }}</button>
        <button class="action danger" @click="modal = 'restart'"><svg
      data-pencil-name="I"
      data-icon-name="power"
      data-icon-set="phosphor"
      viewBox="0 0 14 14"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="box-sizing: border-box; flex-shrink: 0; height: 30px; width: 30px"
    >
      <path
        d="M6.5625 6.78125l0-4.15625q0-0.16406 0.13672-0.30078 0.13672-0.13672 0.30078-0.13672 0.16406 0 0.30078 0.13672 0.13672 0.13672 0.13672 0.30078l0 4.15625q0 0.16406-0.13672 0.30078-0.13672 0.13672-0.30078 0.13672-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.30078z m3.28125-4.21094q-0.10938-0.05469-0.30078-0.02734-0.19141 0.02734-0.30078 0.1914-0.10938 0.16406-0.05469 0.32813 0.05469 0.16406 0.21875 0.27344 1.20313 0.76563 1.69531 2.13281 0.49219 1.36719 0.08203 2.76172-0.41016 1.39453-1.55859 2.26953-1.14844 0.875-2.625 0.875-1.47656 0-2.625-0.875-1.14844-0.875-1.55859-2.26953-0.41016-1.39453 0.08203-2.76172 0.49219-1.36719 1.69531-2.13281 0.16406-0.10938 0.21875-0.27344 0.05469-0.16406-0.05469-0.32812-0.10938-0.16406-0.30078-0.19141-0.19141-0.02734-0.30078 0.02734-1.47656 0.98438-2.07813 2.625-0.60156 1.64063-0.10937 3.3086 0.49219 1.66797 1.88672 2.70703 1.39453 1.03906 3.14453 1.03906 1.75 0 3.14453-1.03906 1.39453-1.03906 1.88672-2.70703 0.49219-1.66797-0.10938-3.3086-0.60156-1.64063-2.07812-2.57031l0-0.05469z"
        fill="#8A650F"
      ></path>
    </svg> {{ t('device.restart') }}</button>
      </div>

      <button class="unlock-btn" @click="unlock">
            <svg
      data-pencil-name="I"
      data-icon-name="lock-open"
      data-icon-set="phosphor"
      viewBox="0 0 14 14"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="box-sizing: border-box; flex-shrink: 0; height: 30px; width: 30px"
    >
      <path
        d="M11.375 4.375l-5.90625 0 0-1.53125q0-0.65625 0.4375-1.09375 0.4375-0.4375 1.09375-0.4375 0.65625 0 1.09375 0.4375 0.4375 0.4375 0.4375 1.09375 0 0.16406 0.13672 0.30078 0.13672 0.13672 0.30078 0.13672 0.16406 0 0.30078-0.13672 0.13672-0.13672 0.13672-0.30078 0-0.98438-0.71094-1.69531-0.71094-0.71094-1.69531-0.71094-0.98438 0-1.69531 0.71094-0.71094 0.71094-0.71094 1.69531l0 1.53125-1.96875 0q-0.38281 0-0.62891 0.24609-0.24609 0.24609-0.24609 0.62891l0 6.125q0 0.38281 0.24609 0.62891 0.24609 0.24609 0.62891 0.24609l8.75 0q0.38281 0 0.62891-0.24609 0.24609-0.24609 0.24609-0.62891l0-6.125q0-0.38281-0.24609-0.62891-0.24609-0.24609-0.62891-0.24609z m0 7l-8.75 0 0-6.125 8.75 0 0 6.125z m-3.71875-3.0625q0 0.27344-0.19141 0.46484-0.19141 0.19141-0.46484 0.19141-0.27344 0-0.46484-0.19141-0.19141-0.19141-0.19141-0.46484 0-0.27344 0.19141-0.46484 0.19141-0.19141 0.46484-0.19141 0.27344 0 0.46484 0.19141 0.19141 0.19141 0.19141 0.46484z"
        fill="#8A650F"
      ></path>
    </svg>
        {{ t('device.unlock') }}</button>
      </div>
    </div>
    

    <!-- 测试打印成功 -->
    <KDialog
      v-model="showTestSuccess"
      :title="t('device.testSuccessTitle')"
      width="740px"
    >
      <div class="dm-body">
        <div class="dm-icon dm-icon--ok">✓</div>
        <div class="dm-desc">{{ t('device.testSuccessDesc') }}</div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-primary" @click="modal = null">{{ t('common.confirm') }}</button>
      </template>
    </KDialog>

    <!-- 测试打印失败 -->
    <KDialog
      v-model="showTestFail"
      :title="t('device.testFailTitle')"
      width="740px"
    >
      <div class="dm-body">
        <div class="dm-icon dm-icon--danger">✕</div>
        <div class="dm-desc">{{ t('device.testFailDesc') }}</div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-primary" @click="modal = null">{{ t('common.confirm') }}</button>
      </template>
    </KDialog>

    <!-- 更换打印纸：输入框 + 数字键盘（数字 0-9 随机打乱，无 PIN 方框） -->
    <KDialog
      v-model="showChangePaper"
      :title="t('device.changePaperTitle')"
      width="540px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="paper-form">
        <label class="paper-label">{{ t('device.changePaperField') }}</label>
        <input
          v-model="paperInput"
          inputmode="numeric"
          maxlength="4"
          class="paper-input"
        />
        <PinPad
          v-model="paperInput"
          :max-length="4"
          display="none"
          class="paper-input-pad"
          @confirm="saveChangePaper"
          @close="modal = null"
        />
      </div>
    </KDialog>

    <!-- 重启确认 -->
    <KDialog
      v-model="showRestart"
      width="740px"
       :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="dm-body">
        <div class="dm-icon dm-icon--warn"> <svg
      data-pencil-name="Power Icon"
      data-icon-name="power"
      data-icon-set="phosphor"
      viewBox="0 0 14 14"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="box-sizing: border-box; flex-shrink: 0; height: 100px; width: 100px"
    >
      <path
        d="M6.5625 6.78125l0-4.15625q0-0.16406 0.13672-0.30078 0.13672-0.13672 0.30078-0.13672 0.16406 0 0.30078 0.13672 0.13672 0.13672 0.13672 0.30078l0 4.15625q0 0.16406-0.13672 0.30078-0.13672 0.13672-0.30078 0.13672-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.30078z m3.28125-4.21094q-0.10938-0.05469-0.30078-0.02734-0.19141 0.02734-0.30078 0.1914-0.10938 0.16406-0.05469 0.32813 0.05469 0.16406 0.21875 0.27344 1.20313 0.76563 1.69531 2.13281 0.49219 1.36719 0.08203 2.76172-0.41016 1.39453-1.55859 2.26953-1.14844 0.875-2.625 0.875-1.47656 0-2.625-0.875-1.14844-0.875-1.55859-2.26953-0.41016-1.39453 0.08203-2.76172 0.49219-1.36719 1.69531-2.13281 0.16406-0.10938 0.21875-0.27344 0.05469-0.16406-0.05469-0.32812-0.10938-0.16406-0.30078-0.19141-0.19141-0.02734-0.30078 0.02734-1.47656 0.98438-2.07813 2.625-0.60156 1.64063-0.10937 3.3086 0.49219 1.66797 1.88672 2.70703 1.39453 1.03906 3.14453 1.03906 1.75 0 3.14453-1.03906 1.39453-1.03906 1.88672-2.70703 0.49219-1.66797-0.10938-3.3086-0.60156-1.64063-2.07812-2.57031l0-0.05469z"
        fill="#C9A24D"
      ></path>
    </svg></div>
     <div class="pin-error-title">
          {{ t('device.restartConfirmTitle') }}
        </div>
        <div class="dm-desc">{{ t('device.restartConfirmDesc') }}</div>
      </div>
      <template #footer>
        <button class="k-btn" @click="modal = null">{{ t('device.restartCancel') }}</button>
        <button class="k-btn k-btn-primary" @click="confirmRestart">{{ t('device.restartConfirmBtn') }}</button>
      </template>
    </KDialog>

    <!-- 解锁成功 -->
    <KDialog
      v-model="showUnlockSuccess"
      width="740px"
       :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="dm-body">
        <div class="dm-icon dm-icon--ok"><svg
      data-pencil-name="Check Icon"
      data-icon-name="lock-open"
      data-icon-set="phosphor"
      viewBox="0 0 14 14"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="box-sizing: border-box; flex-shrink: 0; height: 100px; width: 100px"
    >
      <path
        d="M11.375 4.375l-5.90625 0 0-1.53125q0-0.65625 0.4375-1.09375 0.4375-0.4375 1.09375-0.4375 0.65625 0 1.09375 0.4375 0.4375 0.4375 0.4375 1.09375 0 0.16406 0.13672 0.30078 0.13672 0.13672 0.30078 0.13672 0.16406 0 0.30078-0.13672 0.13672-0.13672 0.13672-0.30078 0-0.98438-0.71094-1.69531-0.71094-0.71094-1.69531-0.71094-0.98438 0-1.69531 0.71094-0.71094 0.71094-0.71094 1.69531l0 1.53125-1.96875 0q-0.38281 0-0.62891 0.24609-0.24609 0.24609-0.24609 0.62891l0 6.125q0 0.38281 0.24609 0.62891 0.24609 0.24609 0.62891 0.24609l8.75 0q0.38281 0 0.62891-0.24609 0.24609-0.24609 0.24609-0.62891l0-6.125q0-0.38281-0.24609-0.62891-0.24609-0.24609-0.62891-0.24609z m0 7l-8.75 0 0-6.125 8.75 0 0 6.125z m-3.71875-3.0625q0 0.27344-0.19141 0.46484-0.19141 0.19141-0.46484 0.19141-0.27344 0-0.46484-0.19141-0.19141-0.19141-0.19141-0.46484 0-0.27344 0.19141-0.46484 0.19141-0.19141 0.46484-0.19141 0.27344 0 0.46484 0.19141 0.19141 0.19141 0.19141 0.46484z"
        fill="#10B981"
      ></path>
    </svg></div>
        <div class="pin-error-title">
          {{ t('device.unlockSuccessTitle') }}
        </div>
        <div class="dm-desc">{{ t('device.unlockSuccessDesc') }}</div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-primary" @click="exitToHome">{{ t('device.unlockExit') }}</button>
      </template>
    </KDialog>
  </div>
</template>

<style scoped lang="scss">
.device {
  width: 1080px;
  height: 1920px;
  position: relative;
  background: var(--cream);
}

.scroll {
  position: absolute;
  top: 120px;
  left: 60px;
  right: 60px;
  display: flex;
  flex-direction: column;
  width: auto;
  gap: 56px;
  overflow-y: auto;
  padding-bottom: 80px;
  box-sizing: border-box;
}
.gap20 {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 20px;
  letter-spacing: 1px;
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 28px;
    background: #c9a24d;
    margin-right: 14px;
    border-radius: 3px;
  }
}

.card {
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  padding: 28px 32px;
  box-sizing: border-box;
}

/* 网络大卡：左侧 icon + 右侧内容 */
.card-network {
  display: flex;
  flex-direction: row;
  gap: 28px;
  align-items: stretch;
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(216, 194, 138, 0.2);
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    border-radius: 50%;
    img {
      width: 36px;
      height: 36px;
    }
  }
  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.c-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 1px;
}
.badge {
  font-size: 22px;
  font-weight: 700;
  padding: 6px 18px;
  border-radius: 6px;
  letter-spacing: 1px;
  background: rgba(216, 194, 138, 0.2);
  color: #8a650f;
}
.badge.ok {
  background: rgba(216, 194, 138, 0.25);
  color: #8a650f;
}

/* 网络卡：4 个指标行 */
.c-rows {
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
  flex-wrap: wrap;
}
.c-rows > div {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  padding-right: 24px;
  &:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: var(--cream-2);
  }
}
.c-rows span {
  color: var(--ink-soft);
  font-size: 22px;
  letter-spacing: 1px;
}
.c-rows b {
  color: var(--ink);
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-en);
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

/* 三列小卡（纸张/读卡器/扫码） */
.row-3 {
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
}
.row-3 .card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.c-note {
  font-size: 22px;
  color: var(--ink-soft);
  line-height: 1.5;
  letter-spacing: 1px;
}

.paper-bar {
  height: 14px;
  background: var(--cream-2);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.paper-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a24d, #a67c1f);
}

/* 系统信息卡 */
.info-card {
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  padding: 8px 32px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid var(--cream-2);
  font-size: 24px;
  letter-spacing: 1px;
}
.info-row:last-child {
  border-bottom: none;
}
.info-row span {
  color: var(--ink-soft);
}
.info-row b {
  color: var(--ink);
  font-weight: 600;
}

/* 快捷操作 3 列 */
.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 96px;
  background: var(--white);
  border: 1.5px solid #c9a24d;
  border-radius: var(--r-md);
  font-size: 28px;
  font-weight: 600;
  color: #8a650f;
  cursor: pointer;
  font-family: var(--font-cn);
  letter-spacing: 1px;
  transition: background 0.15s, transform 0.08s;
  svg {
    width: 32px;
    height: 32px;
  }
}
.action:active { transform: scale(0.98); }
.action.busy { opacity: 0.6; }

.unlock-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 96px;
  background: var(--white);
  border: 1.5px solid #c9a24d;
  border-radius: var(--r-md);
  font-size: 28px;
  font-weight: 600;
  color: #8a650f;
  cursor: pointer;
  font-family: var(--font-cn);
  letter-spacing: 1px;
  transition: background 0.15s, transform 0.08s;
  svg {
    width: 32px;
    height: 32px;
  }
}
.unlock-btn:active { transform: scale(0.98); }

.pin-error-title {
  color: var(--ink);
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* 弹窗内容（KDialog 内容区） */
.dm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
  padding: 8px 0;
  width: 100%;
}
.dm-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  font-weight: 700;
  line-height: 1;
  background: rgba(216, 194, 138, 0.2);
  color: #8a650f;
  svg {
    width: 80px;
    height: 80px;
  }
}
.dm-icon--ok { background: rgba(46, 125, 50, 0.12); color: var(--success); }
.dm-icon--danger { background: var(--danger-bg); color: var(--danger); }
.dm-icon--warn { background: var(--warning-bg); color: var(--warning); }
.dm-desc {
  font-size: 24px;
  color: var(--ink-soft);
  line-height: 1.5;
  letter-spacing: 1px;
}

/* 换纸弹窗：纸张数量输入 */
.paper-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}
.paper-label {
  font-size: 24px;
  color: var(--ink-soft);
  text-align: left;
  letter-spacing: 1px;
}
.paper-input {
  width: 100%;
  height: 80px;
  padding: 0 24px;
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  background: #fff;
  border: 1.5px solid var(--cream-2);
  border-radius: 14px;
  font-family: var(--font-cn);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.paper-input:focus {
  border-color: var(--gold);
  background: var(--white);
}
:deep(.k-dialog__footer) {
  padding: 0;
  button {
    flex: 1;
  }
}
</style>
