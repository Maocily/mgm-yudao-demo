<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import DecoCorners from '@/components/DecoCorners.vue'
import { useSessionStore } from '@/store/session'
import { mockCampaigns, type Campaign } from '@/mock/data'
import { printReal, type PrintUpdate } from '@/mock/hardware'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const session = useSessionStore()

// 支持 ?count=0|1|3|4 控制活动数量（预览用），默认全部
// 注意：必须用 computed，否则 hash 变后 count 不会重算
const campaigns = computed<Campaign[]>(() => {
  const q = route.query.count
  const n = q !== undefined ? Number(q) : mockCampaigns.length
  const cap = isNaN(n) ? mockCampaigns.length : Math.max(0, Math.min(mockCampaigns.length, n))
  return mockCampaigns.slice(0, cap)
})

// 设计稿 1/3/4+ 三种版式
const layout = computed<'one' | 'three' | 'scroll' | 'empty'>(() => {
  const n = campaigns.value.length
  if (n === 0) return 'empty'
  if (n === 1) return 'one'
  if (n === 3) return 'three'
  return 'scroll'
})

function name(c: Campaign) {
  return locale.value === 'zh' ? c.nameCn : c.nameEn
}
function desc(c: Campaign) {
  return locale.value === 'zh' ? c.descCn : c.descEn
}

function logout() {
  session.reset()
  router.push('/standby')
}

// 预览支持：?campaign=A 直接打开某活动的数量弹窗
onMounted(() => {
  const id = route.query.campaign
  if (typeof id === 'string') {
    const c = mockCampaigns.find((x: Campaign) => x.id === id)
    if (c) openQty(c)
  }
})

// ---- 四段弹窗状态机 ----
// ① showQty          选数量
// ② showPrintConfirm 打印确认
// ③ showPrinting     正在打印
// ④ showPrintSuccess 打印完成（倒计时自动回活动列表）
const qtyTarget = ref<Campaign | null>(null)
const qty = ref(1)
const showQty = ref(false)
const showPrintConfirm = ref(false)
const showPrinting = ref(false)
const showPrintSuccess = ref(false)
const successCountdown = ref(10) // 弹窗④ 自动回列表倒计时
const printCurrent = ref(0) // 弹窗③ 实时显示第 N 张

let countdownTimer: ReturnType<typeof setInterval> | null = null
let printCancel: (() => void) | null = null // mockPrint 返回的取消函数

// ① 选数量
function openQty(c: Campaign) {
  if (c.maxQty <= 0) return
  qtyTarget.value = c
  qty.value = 1
  showQty.value = true
}
function closeQty() {
  showQty.value = false
  qtyTarget.value = null
}
// ① → ②
function confirmQty() {
  if (!qtyTarget.value) return
  session.selectCampaign(qtyTarget.value)
  session.setQuantity(qty.value)
  showQty.value = false
  showPrintConfirm.value = true
}

// ② 打印确认
function closePrintConfirm() {
  showPrintConfirm.value = false
  qtyTarget.value = null
}
// ② → ③ → ④
function confirmPrint() {
  if (!qtyTarget.value) return
  const member = session.member
  if (!member) return
  showPrintConfirm.value = false
  showPrinting.value = true
  printCurrent.value = 0

  // 调真实打印机:走 kioskBridge.printTicket,主进程用 webContents.print 静默打印
  // 想换回 mock:把 printReal 换回 mockPrint,签名一致
  printCancel = printReal(
    {
      total: qty.value,
      payload: {
        campaignName: name(qtyTarget.value),
        campaignDesc: desc(qtyTarget.value),
        memberName: member.name,
        memberCard: member.cardNo
      }
    },
    (update: PrintUpdate) => {
      printCurrent.value = update.current
      if (update.phase === 'success') {
        finishPrinting()
      } else if (update.phase === 'interrupted' || update.phase === 'failed') {
        // 简化:暂时和 success 走同一弹窗,后续可拆"中断/失败"独立页
        finishPrinting()
      }
    }
  )
}

function finishPrinting() {
  showPrinting.value = false
  showPrintSuccess.value = true
  startSuccessCountdown()
}

function startSuccessCountdown() {
  successCountdown.value = 10
  countdownTimer = setInterval(() => {
    successCountdown.value--
    if (successCountdown.value <= 0) {
      closePrintSuccess()
    }
  }, 1000)
}

// ④ 打印完成 → 回活动列表
function closePrintSuccess() {
  showPrintSuccess.value = false
  qtyTarget.value = null
  qty.value = 1
  printCurrent.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (printCancel) {
    printCancel()
    printCancel = null
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (printCancel) printCancel()
})
</script>

<template>
  <div class="campaign fade-in">
    <StatusBar />

    <div class="greeting">
      <div class="title">{{ t('campaign.greeting') }}</div>
    </div>

    <!-- 0 个活动：设计稿 04 零 -->
    <div v-if="layout === 'empty'" class="empty">
      <div class="empty-icon">🗂️</div>
      <div class="empty-text">{{ t('campaign.empty') }}</div>
    </div>

   

    <!-- 4+ 活动：可滚动 -->
    <div v-else  class="layout-scroll">
      <div class="activity-scroll">
        <div
          v-for="c in campaigns"
          :key="c.id"
        >
          <div
            class="card-list"
            :class="{ disabled: c.maxQty <= 0 }"
            @click="openQty(c)"
          >
            <div class="cl-img" :style="{ backgroundImage: `url(${c.image})` }" />
            <div class="cl-body">
              <div class="cl-name">{{ name(c) }}</div>
              <div class="cl-desc">{{ desc(c) }}</div>
            </div>
            <button
              v-if="c.maxQty > 0"
              class="btn btn-primary cl-join"
              @click.stop="openQty(c)"
            >{{ t('campaign.participate') }}</button>
            <div v-else class="cl-soldout">{{ t('campaign.outOfStock') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面底部固定栏:滚动提示 + 登出 (设计稿 03 Skip Row) -->
    <div class="bottom-bar">
      <div
        v-if="3 < campaigns.length"
        class="scroll-hint"
      >
        {{ t('campaign.seeMoreHint') }}
      </div>
      <button
        class="skip-row"
        type="button"
        @click="logout"
      >
        <svg class="skip-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M8 20 L20 8 L32 20 M12 18 V30 H28 V18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="skip-text">{{ t('campaign.skip') }}</span>
      </button>
    </div>

    <!-- ① 选择数量弹窗（设计稿 Redeem Ticket Modal） -->
    <KDialog
      v-model="showQty"
      :title="t('campaign.chooseQtyTitle')"
      width="760px"
    >
      <div v-if="qtyTarget" class="campaign-info">
        <div class="campaign-name">{{ name(qtyTarget) }}</div>
        <div class="campaign-desc">{{ desc(qtyTarget) }}</div>
      </div>
      <KStepper
        v-model="qty"
        :min="1"
        :max="qtyTarget?.maxQty ?? 1"
        :hint="qtyTarget ? t('campaign.chooseQtyHint', { n: qtyTarget.maxQty }) : ''"
      />
      <template #footer>
        <button class="k-btn k-btn-ghost" @click="closeQty">
          {{ t('common.cancel') }}
        </button>
        <button class="k-btn k-btn-primary" @click="confirmQty">
          {{ t('campaign.confirmNext') }}
        </button>
      </template>
    </KDialog>

    <!-- ② 打印确认弹窗（设计稿 05 請確認兌換的票券） -->
    <KDialog
      v-model="showPrintConfirm"
      :title="t('redeem.title')"
      width="760px"
    >
      <div v-if="qtyTarget" class="redeem-body">
        <div class="redeem-info-card">
          <div class="redeem-row">
            <span class="redeem-label">{{ t('redeem.campaignName') }}</span>
            <span class="redeem-value">{{ name(qtyTarget) }}</span>
          </div>
          <div class="redeem-row">
            <span class="redeem-label">{{ t('redeem.quantity') }}</span>
            <span class="redeem-value redeem-value--qty">
              <span class="redeem-qty">{{ qty }}</span>
              <span class="redeem-unit">{{ t('redeem.unit') }}</span>
            </span>
          </div>
        </div>
        <div class="redeem-warning" v-html="t('redeem.warning')"></div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-ghost" @click="closePrintConfirm">
          {{ t('redeem.cancel') }}
        </button>
        <button class="k-btn k-btn-primary" @click="confirmPrint">
          {{ t('redeem.print') }}
        </button>
      </template>
    </KDialog>

    <!-- ③ 正在打印中（设计稿 05 正在打印中 660x480 无头部） -->
    <KDialog
      v-model="showPrinting"
      width="660px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="printing-body">
        <div class="printing-spinner" />
        <div class="printing-title">
          {{ t('printing.titleShort', { cur: printCurrent || 1, total: qty }) }}
        </div>
        <div class="printing-desc">
          {{ t('printing.pleaseWait', { n: printCurrent || 1 }) }}
        </div>
        <div class="printing-total">
          {{ t('printing.total', { total: qty }) }}
        </div>
      </div>
    </KDialog>

    <!-- ④ 打印完成（设计稿 06 打印成功 660x672） -->
    <KDialog
      v-model="showPrintSuccess"
      width="660px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="success-body">
        <div class="success-icon">
          <span class="success-check">✓</span>
        </div>
        <div class="success-title">{{ t('printing.successTitle') }}</div>
        <div class="success-desc">{{ t('printing.successDesc') }}</div>
        <div class="success-countdown-box">
          <div class="countdown-num-row">
            <span class="countdown-num">{{ successCountdown }}</span>
            <span class="countdown-unit">{{ t('common.seconds') }}</span>
          </div>
          <div class="countdown-suffix">{{ t('printing.autoLogoutSuffix') }}</div>
        </div>
      </div>
      <template #footer>
        <button class="k-btn k-btn-ghost" @click="closePrintSuccess">
          {{ t('printing.logout') }}
        </button>
        <button class="k-btn k-btn-primary" @click="closePrintSuccess">
          {{ t('printing.selectOther') }}
        </button>
      </template>
    </KDialog>

    <DecoCorners />
  </div>
</template>

<style scoped lang="scss">
.campaign {
  width: 1080px;
  height: 1820px;
  position: relative;
  background: var(--cream);
}
.greeting {
  position: absolute;
  top: 140px;
  left: 0;
  width: 1080px;
  text-align: center;
}
.greeting .title {
  font-size: 44px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 2px;
}

.empty {
  position: absolute;
  top: 600px;
  left: 0;
  width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.empty-icon {
  font-size: 96px;
  opacity: 0.3;
}
.empty-text {
  font-size: 32px;
  color: var(--ink-soft);
}

/* === 1 个活动：居中大卡 === */
.layout-one {
  position: absolute;
  top: 280px;
  left: 80px;
  width: 920px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.card-big {
  width: 920px;
  padding: 0;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-lg);
  overflow: hidden;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 0;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
}
.card-big:active { transform: scale(0.99); }
.card-big.disabled { opacity: 0.45; cursor: not-allowed; }
.cb-img {
  width: 380px;
  height: 100%;
  min-height: 380px;
  background-size: cover;
  background-position: center;
}
.cb-body {
  padding: 40px 36px 24px;
}
.cb-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
}
.cb-desc {
  font-size: 22px;
  color: var(--ink-soft);
  margin-top: 14px;
  line-height: 1.5;
}
.cb-join {
  grid-column: 2;
  margin: 24px 36px 32px;
  height: 92px;
  font-size: 30px;
}
.cb-soldout {
  grid-column: 2;
  margin: 32px 36px;
  font-size: 28px;
  color: var(--ink-soft);
  text-align: center;
  padding: 32px 0;
  background: var(--cream-3);
  border-radius: 12px;
}

/* === 3 个活动：三栏等高 === */
.layout-three {
  position: absolute;
  top: 280px;
  left: 40px;
  right: 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  height: 1380px;
}
.card-mid {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
}
.card-mid:active { transform: scale(0.99); }
.card-mid.disabled { opacity: 0.45; cursor: not-allowed; }
.cm-img {
  width: 100%;
  height: 280px;
  background-size: cover;
  background-position: center;
}
.cm-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  padding: 24px 24px 0;
  line-height: 1.4;
}
.cm-desc {
  font-size: 20px;
  color: var(--ink-soft);
  padding: 12px 24px;
  line-height: 1.5;
  flex: 1;
}
.cm-join {
  margin: 12px 24px 24px;
  height: 76px;
  font-size: 24px;
}
.cm-soldout {
  margin: 12px 24px 24px;
  font-size: 22px;
  color: var(--ink-soft);
  text-align: center;
  padding: 24px 0;
  background: var(--cream-3);
  border-radius: 12px;
}

/* === 4+ 滚动列表 === */
.layout-scroll {
  position: absolute;
  top: 260px;
  left: 80px;
  width: 920px;
  height: 1500px;
}
.activity-scroll {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
}
.card-list {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 280px;
  flex-direction: column;
  padding: 36px 540px 36px 36px;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
}
.card-list:active { transform: scale(0.99); }
.card-list.disabled { opacity: 0.45; cursor: not-allowed; }
.cl-img {
  position: absolute;
  right: 0;
  top: 0;
  width: 540px;
  height: 280px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}
.cl-body {
  width: 100%;
  text-align: left;
}
.cl-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
}
.cl-desc {
  font-size: 20px;
  color: var(--ink-soft);
  margin-top: 8px;
  line-height: 1.4;
}
.cl-join {
  position: absolute;
  background: #C9A24D;
  color: #FFF;
  left: 36px;
  bottom: 20px;
  height: 62px;
  padding: 0 36px;
  font-size: 26px;
  flex-shrink: 0;
}
.cl-soldout {
  position: absolute;
  left: 36px;
  bottom: 20px;
  font-size: 22px;
  color: var(--ink-soft);
  padding: 16px 28px;
  background: var(--cream-3);
  border-radius: 12px;
  flex-shrink: 0;
}

/* === 页面底部固定栏 (设计稿 03 Activity Scroll Hint + Skip Row) === */
.bottom-bar {
  position: absolute;
  left: 0;
  bottom: 32px;
  width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 5;
}

/* Activity Scroll Hint: 向下滑动查看更多活动 */
.scroll-hint {
  font-size: 22px;
  color: #8A650F;
  letter-spacing: 2px;
  text-align: center;
}

/* Skip Row: ⌂ 登出 (设计稿 y=1698, gap=18, 居中) */
.skip-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  height: 72px;
  padding: 0 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-cn);
}
.skip-row:active { transform: scale(0.97); }
.skip-icon {
  width: 40px;
  height: 40px;
  color: #8A650F;
  flex-shrink: 0;
}
.skip-text {
  font-size: 28px;
  color: #7A6546;
  letter-spacing: 2px;
}

/* === 通用按钮 (活动卡片) === */
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
  background: #C9A24D;
  color: #fff;
}
.btn-ghost {
  background: var(--white);
  color: var(--ink);
  border: 1.5px solid var(--cream-2);
}

/* === 弹窗通用按钮 (k-btn,避免和 .btn 冲突) === */
.k-btn {
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: var(--font-cn);
  font-weight: 600;
  font-size: 28px;
  height: 68px;
  min-width: 220px;
  padding: 0 40px;
  transition: transform 0.08s, filter 0.15s;
}
.k-btn:active { transform: scale(0.98); }

/* 设计稿:白底 + 金边 + 棕字 (用于取消/注销) */
.k-btn-ghost {
  background: var(--white);
  color: var(--ink-soft);
  border: 1.5px solid var(--gold);
}

/* === 弹窗② 打印确认 (设计稿 05 請確認兌換的票券) === */
.redeem-body {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 4px 0;
}
.redeem-info-card {
  background: var(--white);
  border: 1.5px solid #d8c28a;
  border-radius: 16px;
  padding: 8px 24px;
}
.redeem-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  gap: 16px;
}
.redeem-row:last-child { border-bottom: none; }
.redeem-label {
  font-size: 26px;
  color: var(--ink-soft);
}
.redeem-value {
  font-size: 26px;
  color: var(--ink-soft);
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}
.redeem-value--qty {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.redeem-qty {
  font-size: 40px;
  font-weight: 700;
  color: var(--ink-soft);
  font-family: var(--font-en);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.redeem-unit {
  font-size: 26px;
  color: var(--ink-soft);
}
.redeem-warning {
  font-size: 30px;
  padding:26px 0;
  color: var(--ink-soft);
  line-height: 1.5;
  text-align: center;
  white-space: pre-line;
}

/* === 弹窗③ 正在打印 (设计稿 05 正在打印中 660x480) === */
.printing-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 0 24px;
  min-height: 360px;
  justify-content: center;
}
.printing-spinner {
  width: 100px;
  height: 100px;
  border: 8px solid var(--cream-2);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: printing-spin 1s linear infinite;
  margin-bottom: 8px;
}
@keyframes printing-spin {
  to { transform: rotate(360deg); }
}
.printing-title {
  font-size: 36px;
  color: var(--ink);
  font-weight: 700;
  text-align: center;
  line-height: 1.4;
}
.printing-desc {
  font-size: 30px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.5;
}
.printing-total {
  font-size: 30px;
  color: #9e8f76;
  text-align: center;
  line-height: 1.5;
}

/* === 弹窗④ 打印完成 (设计稿 06 打印成功 660x672) === */
.success-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 0 16px;
}
/* 设计稿:金底 + 白对勾 */
.success-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.success-check {
  color: #fff;
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  font-family: var(--font-en);
}
.success-title {
  font-size: 36px;
  color: var(--ink);
  font-weight: 700;
  text-align: center;
  line-height: 1.4;
}
.success-desc {
  font-size: 30px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.5;
}
/* 设计稿:360 宽米色框 + 金边 */
.success-countdown-box {
  width: 360px;
  background: #fff8ea;
  border: 1.5px solid var(--cream-2);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.countdown-num-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--gold);
}
.countdown-num {
  font-size: 48px;
  font-weight: 700;
  font-family: var(--font-en);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.countdown-unit {
  font-size: 24px;
  font-weight: 500;
}
.countdown-suffix {
  font-size: 18px;
  color: var(--ink-soft);
  text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.campaign-info{
  align-items: center;
    background-color: #FFFFFF;
    border-radius: 16px;
    border: 1.5px solid #D8C28A;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 20px;
    height: fit-content;
    justify-content: flex-start;
    padding: 24px 28px;
    position: relative;
    width: 100%;
    z-index: 1;
    .campaign-name{
        color: #2A2118;
        font-family: "Noto Sans SC", system-ui, sans-serif;
        font-size: 30px;
        font-style: normal;
        font-weight: 700;
        letter-spacing: 0px;
        line-height: normal;
        text-align: left;
        width: 100%;
    }
    .campaign-desc{
        color: #7A6546;
        font-family: "Noto Sans SC", system-ui, sans-serif;
        font-size: 22px;
        font-style: normal;
        font-weight: 500;
        letter-spacing: 0px;
        line-height: 31px;
        text-align: left;
        width: 100%;
    }
}
.k-dialog__footer {
  gap: 24px;
  padding: 24px 40px 32px;

  button {
    flex: 1;
    max-width: none;
  }
}
</style>
