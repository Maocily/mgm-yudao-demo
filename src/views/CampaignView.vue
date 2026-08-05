<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StatusBar from '@/components/StatusBar.vue'
import DecoCorners from '@/components/DecoCorners.vue'
import { useSessionStore } from '@/store/session'
import { mockCampaigns, type Campaign } from '@/mock/data'

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

// 设计稿：04 选择兑换数量（无遮罩）= 选数量 inline，不弹窗
// 每个活动独立 qty
const qtyMap = ref<Record<string, number>>({})
const maxFor = (c: Campaign) => Math.max(0, c.maxQty)
const qtyOf = (c: Campaign) => {
  if (c.maxQty <= 0) return 0
  return qtyMap.value[c.id] ?? 1
}
function setQty(c: Campaign, n: number) {
  const cap = maxFor(c)
  if (cap <= 0) return
  qtyMap.value[c.id] = Math.max(1, Math.min(cap, n))
}
function changeQty(c: Campaign, delta: number) {
  setQty(c, qtyOf(c) + delta)
}

// 提交：直接进打印页
function join(c: Campaign) {
  if (c.maxQty <= 0) return
  session.selectCampaign(c)
  session.setQuantity(qtyOf(c))
  router.push('/printing')
}

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

// 设计稿 1/3/4+ 三种版式
const layout = computed<'one' | 'three' | 'scroll' | 'empty'>(() => {
  const n = campaigns.value.length
  if (n === 0) return 'empty'
  if (n === 1) return 'one'
  if (n === 3) return 'three'
  return 'scroll'
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

    <!-- 1 个活动：设计稿 03 选取活动(1个活动) — 大卡片 + 登出 -->
    <div v-else-if="layout === 'one'" class="layout-one">
      <div
        v-for="c in campaigns"
        :key="c.id"
        class="card-big"
        :class="{ disabled: c.maxQty <= 0 }"
      >
        <div class="cb-img" :style="{ backgroundImage: `url(${c.image})` }" />
        <div class="cb-body">
          <div class="cb-name">{{ name(c) }}</div>
          <div class="cb-desc">{{ desc(c) }}</div>
        </div>
        <div v-if="c.maxQty > 0" class="cb-stepper">
          <button class="step" :disabled="qtyOf(c) <= 1" @click="changeQty(c, -1)">−</button>
          <div class="step-num">{{ qtyOf(c) }}<span class="step-unit">{{ t('redeem.unit') }}</span></div>
          <button class="step" :disabled="qtyOf(c) >= c.maxQty" @click="changeQty(c, 1)">+</button>
        </div>
        <button
          v-if="c.maxQty > 0"
          class="btn btn-primary cb-join"
          @click="join(c)"
        >{{ t('campaign.participate') }}</button>
        <div v-else class="cb-soldout">{{ t('campaign.outOfStock') }}</div>
      </div>
      <button class="skip-btn" @click="logout">{{ t('campaign.skip') }}</button>
    </div>

    <!-- 3 个活动：设计稿 03 选取活动(三个活动) — 三栏等高 -->
    <div v-else-if="layout === 'three'" class="layout-three">
      <div
        v-for="c in campaigns"
        :key="c.id"
        class="card-mid"
        :class="{ disabled: c.maxQty <= 0 }"
      >
        <div class="cm-img" :style="{ backgroundImage: `url(${c.image})` }" />
        <div class="cm-name">{{ name(c) }}</div>
        <div class="cm-desc">{{ desc(c) }}</div>
        <div v-if="c.maxQty > 0" class="cm-stepper">
          <button class="step" :disabled="qtyOf(c) <= 1" @click="changeQty(c, -1)">−</button>
          <div class="step-num">{{ qtyOf(c) }}<span class="step-unit">{{ t('redeem.unit') }}</span></div>
          <button class="step" :disabled="qtyOf(c) >= c.maxQty" @click="changeQty(c, 1)">+</button>
        </div>
        <button
          v-if="c.maxQty > 0"
          class="btn btn-primary cm-join"
          @click="join(c)"
        >{{ t('campaign.participate') }}</button>
        <div v-else class="cm-soldout">{{ t('campaign.outOfStock') }}</div>
      </div>
    </div>

    <!-- 4+ 活动：可滚动，中间"查看更多"分割 -->
    <div v-else class="layout-scroll">
      <div class="activity-scroll">
        <div
          v-for="(c, i) in campaigns"
          :key="c.id"
        >
          <div
            class="card-list"
            :class="{ disabled: c.maxQty <= 0 }"
          >
            <div class="cl-img" :style="{ backgroundImage: `url(${c.image})` }" />
            <div class="cl-body">
              <div class="cl-name">{{ name(c) }}</div>
              <div class="cl-desc">{{ desc(c) }}</div>
            </div>
            <div v-if="c.maxQty > 0" class="cl-stepper">
              <button class="step" :disabled="qtyOf(c) <= 1" @click="changeQty(c, -1)">−</button>
              <div class="step-num">{{ qtyOf(c) }}<span class="step-unit">{{ t('redeem.unit') }}</span></div>
              <button class="step" :disabled="qtyOf(c) >= c.maxQty" @click="changeQty(c, 1)">+</button>
            </div>
            <button
              v-if="c.maxQty > 0"
              class="btn btn-primary cl-join"
              @click="join(c)"
            >{{ t('campaign.participate') }}</button>
            <div v-else class="cl-soldout">{{ t('campaign.outOfStock') }}</div>
          </div>
          <div
            v-if="i === 1 && i < campaigns.length - 1"
            class="see-more"
          >
            <span class="line" />
            <span class="sm-text">{{ t('campaign.seeMore') }}</span>
            <span class="line" />
          </div>
        </div>
      </div>
    </div>

    <DecoCorners />
  </div>
</template>

<style scoped>
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
}
.card-big.disabled { opacity: 0.45; }
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
.cb-stepper {
  grid-column: 2;
  padding: 0 36px;
  display: flex;
  align-items: center;
  gap: 16px;
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
.skip-btn {
  margin-top: 24px;
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 26px;
  cursor: pointer;
  font-family: var(--font-cn);
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
}
.card-mid.disabled { opacity: 0.45; }
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
.cm-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px 24px;
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
  gap: 24px;
  padding: 16px 0;
}
.card-list {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px 32px;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-lg);
}
.card-list.disabled { opacity: 0.45; }
.cl-img {
  width: 180px;
  height: 130px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}
.cl-body {
  flex: 1;
  min-width: 0;
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
.cl-stepper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cl-join {
  height: 80px;
  padding: 0 36px;
  font-size: 26px;
  flex-shrink: 0;
}
.cl-soldout {
  font-size: 22px;
  color: var(--ink-soft);
  padding: 16px 28px;
  background: var(--cream-3);
  border-radius: 12px;
  flex-shrink: 0;
}

.see-more {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 40px;
}
.see-more .line {
  flex: 1;
  height: 1px;
  background: var(--cream-2);
}
.sm-text {
  font-size: 22px;
  color: var(--gold-deep);
  letter-spacing: 4px;
}

/* === 通用 stepper === */
.step {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 1.5px solid var(--cream-2);
  background: var(--white);
  font-size: 32px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
}
.step:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.step-num {
  min-width: 90px;
  text-align: center;
  font-size: 30px;
  font-weight: 600;
  color: var(--ink);
}
.step-unit {
  font-size: 18px;
  color: var(--ink-soft);
  margin-left: 4px;
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
</style>
