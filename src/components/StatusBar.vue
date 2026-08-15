<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import exitIcon from '@/assets/svg-icons/icon-exit.svg'
import lockIcon from '@/assets/svg-icons/icon-lock.svg'

import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const router = useRouter()
const { t } = useI18n()
defineProps<{ showBrand?: boolean; isAdmin?: boolean }>()
const { time } = useClock()
</script>

<template>
  <div class="status-bar">
    <div class="brand">
      <img src="@/assets/logo.png" />
    </div>
    <div v-if="isAdmin" class="admin-page-title">
      <img :src="lockIcon" />
      <span>{{ t('device.title') }}</span>
    </div>
    <div v-if="!isAdmin" class="clock">{{ time }}</div>
    <div v-else class="exit" @click="router.push('/login')">
      <img :src="exitIcon" />
      <span>{{ t('device.exit') }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 88px;
  background-color: #fff;
  font-family: var(--font-cn);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;

  .brand {
    img {
      height: 52px;
      display: block;
    }
  }
  .admin-page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    color: var(--ink);
    font-weight: 700;
    letter-spacing: 1px;
    img {
      width: 32px;
      height: 32px;
    }
  }
  .clock {
    font-size: 28px;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    font-family: var(--font-en);
  }
  .exit {
    color: #8a650f;
    padding: 0 24px;
    box-sizing: border-box;
    border: 1.5px solid #c9a24d;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    border-radius: 28px;
    gap: 8px;
    font-size: 24px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    img {
      width: 22px;
      height: 22px;
    }
  }
  .exit:active {
    background: var(--cream-3);
  }
}
</style>
