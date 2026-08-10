<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import { mockDevice } from '@/mock/data'
import { mockTestPrint } from '@/mock/hardware'

import chatouIcon from '@/assets/icons/PlugI.png'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const d = mockDevice

type Modal = null | 'testSuccess' | 'testFail' | 'changePaper' | 'restart' | 'unlockSuccess'
// 支持 ?modal=testSuccess|testFail|changePaper|restart|unlockSuccess 直达（预览用）
const modal = ref<Modal>((route.query.modal as Modal) || null)
watch(() => route.query.modal, v => (modal.value = (v as Modal) || null))
const testing = ref(false)

async function testPrint() {
  if (testing.value) return
  testing.value = true
  // 演示：这里默认成功；如需演示失败可传 true
  const ok = await mockTestPrint(false)
  testing.value = false
  modal.value = ok ? 'testSuccess' : 'testFail'
}

function confirmRestart() {
  modal.value = null
  // 应用层重启：调用主进程 relaunch（开发环境无 bridge 时降级为刷新）
  if (window.kioskBridge) {
    window.kioskBridge.relaunch()
  } else {
    router.push('/standby')
  }
}

function unlock() {
  modal.value = 'unlockSuccess'
}

function exitToHome() {
  modal.value = null
  router.push('/login')
}

const paperPct = Math.round((d.paperRemain / d.paperTotal) * 100)

// 换纸弹窗：输入纸张数量
const paperInput = ref<number>(d.paperRefill)
function openChangePaper() {
  paperInput.value = d.paperRefill
  modal.value = 'changePaper'
}
function saveChangePaper() {
  if (paperInput.value < 0) paperInput.value = 0
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
      <div class="grid-1">
        <div class="card">
          <div class="card-icon">
            <img :src="chatouIcon" />
          </div>
          <div>
            <div class="card-head">
            <span class="c-name">{{ t('device.network') }}</span>
            <span class="badge ok">{{ t('device.online') }}</span>
          </div>
          <div class="c-rows">
            <div><span>{{ t('device.ip') }}</span><b>{{ d.ip }}</b></div>
            <div><span>{{ t('device.latency') }}</span><b>{{ d.latency }} ms</b></div>
            <div><span>{{ t('device.uplink') }}</span><b>↑ {{ d.uplink }}</b></div>
            <div><span>{{ t('device.uptime') }}</span><b>{{ t('device.uptimeVal', { h: d.uptimeHours }) }}</b></div>
          </div>
          </div>
        </div>
       </div>
        <div class="grid flex-row">
          <div class="card">
            <div class="card-head">
              <span class="c-name">{{ t('device.paper') }}</span>
              <span class="badge ok">{{ t('device.paperEnough') }}</span>
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

    <!-- 更换打印纸 -->
    <KDialog
      v-model="showChangePaper"
      :title="t('device.changePaperTitle')"
      width="740px"
    >
      <div class="paper-form">
        <label class="paper-label">{{ t('device.changePaperField') }}</label>
        <input
          v-model.number="paperInput"
          type="number"
          min="0"
          step="100"
          class="paper-input"
        />
      </div>
      <template #footer>
        <button class="k-btn" @click="modal = null">{{ t('common.cancel') }}</button>
        <button class="k-btn k-btn-primary" @click="saveChangePaper">{{ t('device.changePaperSave') }}</button>
      </template>
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
  height: 1820px;
  position: relative;
  background: var(--cream);
}

.exit-btn {
  background: transparent;
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-pill);
  padding: 14px 40px;
  font-size: 24px;
  color: var(--ink-soft);
  cursor: pointer;
  font-family: var(--font-cn);
}
.scroll {
  position: absolute;
  top: 100px;
  left: 60px;
  display: flex;
  flex-direction: column;
  width: 960px;
  gap:80px;
  overflow-y: auto;
  padding-bottom: 60px;
}
.gap20{
  display:flex;
  flex-direction:column;
  gap:20px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 32px 0 20px;
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: #C9A24D;
    margin-right: 12px;
  }
}
.grid-1{
  
  
    .grid {
     
      padding:28px 32px;

    }
    .card{
       display:flex;
      flex-direction:row;
      gap:32px;
      
    }
    .card-icon{
      display:flex;
      align-items:center;
      justify-content:center;
      background:#D8C28A33;
      width: 64px;
      border-radius: 50%;
      height: 64px;
      img{
        width: 32px;
        height: 32px;
      }
    }
  .card-info{
    display:flex;
    flex-direction:column;
    gap:12px;
   
  }
  .card-head {
    justify-content: flex-start;
  }
  .c-name {
  font-size: 24px;}
   .badge {
      font-size: 12px;
      padding: 3px 10px;
      border-radius:5px;
      margin-left: 20px;
    }
    .badge.ok {
      background:#8A650F;
      color: #FFF;
      
    }
}
.grid {
  display: grid;
  gap: 24px;
}
.flex-row{
  display:flex;
  width:100%;
  flex-direction:row;
  gap:20px;
  .card{
    flex:1;
  }
}
.card {
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  padding: 32px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.c-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.badge {
  font-size: 12px;
  padding: 6px 20px;
  margin-left: 20px;
  border-radius: 2px;
  float:right;
}
.badge.ok {
  background: #D8C28A33;
  color: #8A650F;
}
.c-rows {
  display: flex;
  flex-direction: row;
  gap: 14px;
}
.c-rows > div {
  display: flex;
  justify-content: space-between;
  font-size: 23px;
  padding-right:20px;
  &:after{
    position: absolute;
    content: '';
    width:1px;
    height:14px;
    background: #EFE5CF;
    right:0;
    top:50%;
    transform: translateY(-50%);
  }

  
}
.c-rows span {
  color: var(--ink-soft);
  margin-right: 12px;
}
.c-rows b {
  color: var(--ink);
}
.c-note {
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 12px;
}
.paper-bar {
  height: 16px;
  background: var(--cream-2);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.paper-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a24d, #a67c1f);
}
.info-card {
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  padding: 12px 32px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 22px 0;
  border-bottom: 1px solid var(--cream-2);
  font-size: 24px;
}
.info-row:last-child {
  border-bottom: none;
}
.info-row span {
  color: var(--ink-soft);
}
.info-row b {
  color: var(--ink);
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}
.action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap:10px;
  height: 80px;
  background: var(--white);
  border: 1.5px solid #C9A24D;
  border-radius: var(--r-md);
  font-size: 26px;
  color: #C9A24D;
  cursor: pointer;
  font-family: var(--font-cn);
}
.action.busy {
  opacity: 0.6;
}
.action.danger {

}
.unlock-btn {
  width: 960px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap:10px;
  height: 80px;
  background: var(--white);
  border: 1.5px solid #C9A24D;
  border-radius: var(--r-md);
  font-size: 26px;
  color: #C9A24D;
  cursor: pointer;
  font-family: var(--font-cn);
}
.pin-error-title{
  color:#333;
  font-size:36px;
  font-weight:700;
}

/* 弹窗内容（KDialog 内容区） */
.dm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  padding: 8px 0;
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
}
.dm-icon--ok {  }
.dm-icon--danger { background: var(--danger-bg); color: var(--danger); }
.dm-icon--warn { background: var(--warning-bg); }
.dm-desc {
  font-size: 26px;
  color: var(--ink-soft);
  line-height: 1.5;
}

/* 换纸弹窗：纸张数量输入 */
.paper-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.paper-label {
  font-size: 24px;
  color: var(--ink-soft);
  text-align: left;
}
.paper-input {
  width: 100%;
  height: 80px;
  padding: 0 24px;
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
  background: #FFF;
  border: 1.5px solid var(--cream-2);
  border-radius: 12px;
  font-family: var(--font-cn);
  outline: none;
  transition: border-color 0.15s;
}
.paper-input:focus {
  border-color: var(--gold);
  background: var(--white);
}
:deep .k-dialog__footer{
  padding:0;
  button{
    flex:1;
  }
}

</style>
