<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import { mockDevice } from '@/mock/data'
import { mockTestPrint } from '@/mock/hardware'

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
</script>

<template>
  <div class="device fade-in">
    <StatusBar />

    <div class="page-head">
      <div class="ph-title">{{ t('device.title') }}</div>
      <button class="exit-btn" @click="router.push('/login')">{{ t('device.exit') }}</button>
    </div>

    <div class="scroll">
      <!-- 设备状态卡组 -->
      <div class="section-title">{{ t('device.statusSection') }}</div>
      <div class="grid">
        <div class="card">
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

        <div class="card">
          <div class="card-head">
            <span class="c-name">{{ t('device.paper') }}</span>
            <span class="badge ok">{{ t('device.paperEnough') }}</span>
          </div>
          <div class="paper-bar">
            <div class="fill" :style="{ width: paperPct + '%' }" />
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

      <!-- 系统信息 -->
      <div class="section-title">{{ t('device.infoSection') }}</div>
      <div class="info-card">
        <div class="info-row"><span>{{ t('device.deviceNo') }}</span><b>{{ d.deviceNo }}</b></div>
        <div class="info-row"><span>{{ t('device.location') }}</span><b>{{ t('device.locationVal') }}</b></div>
        <div class="info-row"><span>{{ t('device.version') }}</span><b>{{ d.version }}</b></div>
        <div class="info-row"><span>{{ t('device.lastSync') }}</span><b>{{ t('device.lastSyncVal', { time: d.lastSync }) }}</b></div>
        <div class="info-row"><span>{{ t('device.lastRestart') }}</span><b>{{ d.lastRestart }}</b></div>
      </div>

      <!-- 快捷操作 -->
      <div class="section-title">{{ t('device.actionSection') }}</div>
      <div class="actions">
        <button class="action" :class="{ busy: testing }" @click="testPrint">
          🖨️ {{ t('device.testPrint') }}
        </button>
        <button class="action" @click="openChangePaper">📄 {{ t('device.changePaper') }}</button>
        <button class="action danger" @click="modal = 'restart'">🔄 {{ t('device.restart') }}</button>
      </div>

      <button class="unlock-btn" @click="unlock">🔓 {{ t('device.unlock') }}</button>
    </div>

    <!-- 弹窗组 -->
    <div v-if="modal" class="dim-overlay" @click.self="modal = null">
      <div class="modal pop-in">
        <template v-if="modal === 'testSuccess'">
          <div class="m-icon ok">✓</div>
          <div class="m-title">{{ t('device.testSuccessTitle') }}</div>
          <div class="m-desc">{{ t('device.testSuccessDesc') }}</div>
          <button class="btn btn-primary m-btn" @click="modal = null">{{ t('common.confirm') }}</button>
        </template>

        <template v-else-if="modal === 'testFail'">
          <div class="m-icon danger">✕</div>
          <div class="m-title">{{ t('device.testFailTitle') }}</div>
          <div class="m-desc">{{ t('device.testFailDesc') }}</div>
          <button class="btn btn-primary m-btn" @click="modal = null">{{ t('common.confirm') }}</button>
        </template>

        <template v-else-if="modal === 'changePaper'">
          <div class="m-icon warn">📄</div>
          <div class="m-title">{{ t('device.changePaperTitle') }}</div>
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
          <div class="m-actions">
            <button class="btn btn-ghost" @click="modal = null">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="saveChangePaper">{{ t('device.changePaperSave') }}</button>
          </div>
        </template>

        <template v-else-if="modal === 'restart'">
          <div class="m-icon warn">🔄</div>
          <div class="m-title">{{ t('device.restartConfirmTitle') }}</div>
          <div class="m-desc">{{ t('device.restartConfirmDesc') }}</div>
          <div class="m-actions">
            <button class="btn btn-ghost" @click="modal = null">{{ t('device.restartCancel') }}</button>
            <button class="btn btn-danger" @click="confirmRestart">{{ t('device.restartConfirmBtn') }}</button>
          </div>
        </template>

        <template v-else-if="modal === 'unlockSuccess'">
          <div class="m-icon ok">🔓</div>
          <div class="m-title">{{ t('device.unlockSuccessTitle') }}</div>
          <div class="m-desc">{{ t('device.unlockSuccessDesc') }}</div>
          <button class="btn btn-primary m-btn" @click="exitToHome">{{ t('device.unlockExit') }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device {
  width: 1080px;
  height: 1820px;
  position: relative;
  background: var(--cream);
}
.page-head {
  position: absolute;
  top: 110px;
  left: 60px;
  width: 960px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ph-title {
  font-size: 44px;
  font-weight: 700;
  color: var(--ink);
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
  top: 210px;
  left: 60px;
  width: 960px;
  height: 1520px;
  overflow-y: auto;
  padding-bottom: 60px;
}
.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-deep);
  margin: 32px 0 20px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
  font-size: 26px;
  font-weight: 600;
  color: var(--ink);
}
.badge {
  font-size: 20px;
  padding: 6px 20px;
  border-radius: var(--r-pill);
}
.badge.ok {
  background: var(--success-bg);
  color: var(--success);
}
.c-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.c-rows > div {
  display: flex;
  justify-content: space-between;
  font-size: 23px;
}
.c-rows span {
  color: var(--ink-soft);
}
.c-rows b {
  color: var(--ink);
}
.c-note {
  font-size: 23px;
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
  height: 120px;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  font-size: 26px;
  color: var(--ink);
  cursor: pointer;
  font-family: var(--font-cn);
}
.action.busy {
  opacity: 0.6;
}
.action.danger {
  color: var(--danger);
  border-color: var(--danger-bg);
}
.unlock-btn {
  width: 960px;
  height: 96px;
  margin-top: 40px;
  background: linear-gradient(135deg, #c9a24d, #a67c1f);
  color: #fff;
  border: none;
  border-radius: var(--r-md);
  font-size: 30px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-cn);
}

/* 弹窗 */
.modal {
  width: 740px;
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
.m-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
}
.m-icon.ok {
  background: var(--success-bg);
  color: var(--success);
}
.m-icon.danger {
  background: var(--danger-bg);
  color: var(--danger);
}
.m-icon.warn {
  background: var(--warning-bg);
}
.m-title {
  font-size: 40px;
  font-weight: 700;
  color: var(--ink);
}
.m-desc {
  font-size: 26px;
  color: var(--ink-soft);
  line-height: 1.5;
}
.m-btn {
  width: 100%;
  height: 88px;
  margin-top: 16px;
}
.m-actions {
  display: flex;
  gap: 24px;
  width: 100%;
  margin-top: 16px;
}
.m-actions .btn {
  flex: 1;
  height: 88px;
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
  background: var(--cream-3);
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
</style>
