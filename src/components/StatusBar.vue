<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import exitBtn from '@/assets/icons/ExitI.png'
import lockIcon from '@/assets/icons/Lock.png'

import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const { t } = useI18n()
defineProps<{ showBrand?: boolean; isAdmin?: boolean }>()
const { time } = useClock()

</script>

<template>
  <div class="status-bar">
    <div class="brand">
      <img src="@/assets/logo.png" class="" />
    </div>
    <div class="admin-page-title" v-if="isAdmin"><img :src="lockIcon" />{{ t('device.title') }}</div>
    <div class="clock" v-if="!isAdmin">{{ time }}</div>
    <div v-else class="exit" @click="router.push('/login')">
      <img :src="exitBtn" />
      {{ t('device.exit') }}
    </div>
  </div>
</template>
<style lang="scss" scoped>
.status-bar {
  display: flex;  /* flex 布局 *
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  padding: 0 20px;
  height: 80px;
  background-color: #fff;
  color: #fff;
  .brand {
    img {
      height: 52px;
    }
  }
  .admin-page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #333;
    font-weight: 600;
    img {
      width: 16px;
      height: 16px;
    }
  }
  .exit{
    color:#C9A24D;
    padding:8px 18px;
    box-sizing:border-box;
    border:1px solid #C9A24D;
    display:flex;
    align-items:center;
    justify-content:center;
    height:35px;
    line-height:20px;
    border-radius: 17px;
    gap:8px;
    img{
      width:14px;
      height:14px;
    }

  }
  .clock {
    font-size: 20px;
  }}
</style>
