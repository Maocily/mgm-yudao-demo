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
          <div class="lock-icon">🔒</div>
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
  height: 1820px;
}
.under-layer {
  position: absolute;
  inset: 0;
  filter: blur(2px) brightness(0.6);
  pointer-events: none;
}
.lock-screen {
  width: 1080px;
  height: 1820px;
  background: linear-gradient(160deg, #1a140d 0%, #3a1a12 100%);
  display: flex;
  align-items: center;
  justify-content: center;
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
  gap: 40px;
  padding: 0 80px;
}
.icon-container {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(158, 27, 42, 0.2);
  border: 2px solid var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lock-icon {
  font-size: 100px;
}
.lock-title {
  font-size: 64px;
  font-weight: 700;
  color: #fff;
}
.lock-subtitle {
  font-size: 36px;
  color: var(--gold);
}
.lock-desc {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}
.lock-desc p {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
}
.contact-box {
  margin-top: 40px;
  padding: 40px 80px;
  border: 1.5px solid rgba(201, 162, 77, 0.4);
  border-radius: var(--r-md);
  background: rgba(201, 162, 77, 0.08);
}
.c-label {
  font-size: 26px;
  color: var(--gold);
}
.c-number {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin-top: 16px;
  letter-spacing: 4px;
}
</style>
