<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import LoginView from '@/views/LoginView.vue'

const { t } = useI18n()
const route = useRoute()

// 全屏锁定：不提供任何可返回的交互入口。
// 解除方式：管理员在 03 设备状态页执行「解锁」（正规通道），本页无出口。
// ?over=login 时，锁屏以半透明覆盖在登录页之上（对齐设计稿「01 选择登录方式 · 锁屏」）。
const overLogin = computed(() => route.query.over === 'login')
</script>

<template>
  <div class="lock-root">
    <!-- 覆盖形态：底层显示登录页 -->
    <div v-if="overLogin" class="under-layer">
      <LoginView />
    </div>

    <div class="lock-screen fade-in" :class="{ overlay: overLogin }">
      <div class="lock-content">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" width="96" height="96" fill="none" aria-hidden="true">
            <path
              d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
              stroke="#9e1b2a"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="lock-title">{{ overLogin ? t('lock.lockedTitle') : t('lock.title') }}</div>
        <div v-if="!overLogin" class="lock-subtitle">{{ t('lock.subtitle') }}</div>
        <div class="lock-desc">
          <p>{{ t('lock.desc1') }}</p>
          <p>{{ t('lock.desc2') }}</p>
          <p>{{ t('lock.desc3') }}</p>
        </div>
        <div class="contact-box">
          <div class="c-label">{{ t('lock.hotline') }}</div>
          <div class="c-number">{{ t('lock.hotlineNo') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lock-root {
  position: relative;
  width: 1080px;
  height: 1920px;
}
.under-layer {
  position: absolute;
  inset: 0;
  filter: blur(2px) brightness(0.6);
  pointer-events: none;
}
.lock-screen {
  width: 1080px;
  height: 1920px;
  background: linear-gradient(160deg, #1a140d 0%, #3a1a12 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.lock-screen.overlay {
  position: absolute;
  inset: 0;
  background: rgba(20, 12, 6, 0.82);
  backdrop-filter: blur(6px);
}
.lock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 32px;
  padding: 0 80px;
  max-width: 920px;
}
.icon-container {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(158, 27, 42, 0.18);
  border: 2px solid var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.lock-title {
  font-size: 72px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
  line-height: 1.1;
}
.lock-subtitle {
  font-size: 36px;
  color: var(--gold);
  font-weight: 500;
  letter-spacing: 2px;
}
.lock-desc {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 16px;
}
.lock-desc p {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  letter-spacing: 1px;
}
.contact-box {
  margin-top: 32px;
  padding: 36px 80px;
  border: 1.5px solid rgba(201, 162, 77, 0.4);
  border-radius: var(--r-md);
  background: rgba(201, 162, 77, 0.08);
}
.c-label {
  font-size: 26px;
  color: var(--gold);
  letter-spacing: 2px;
  font-weight: 500;
}
.c-number {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin-top: 14px;
  letter-spacing: 4px;
  font-family: var(--font-en);
}
</style>
