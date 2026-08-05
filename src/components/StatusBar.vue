<script setup lang="ts">
import { useClock } from '@/composables/useClock'

defineProps<{ showBrand?: boolean }>()
const { time } = useClock()
</script>

<template>
  <div class="status-bar">
    <div class="brand">
      <img src="@/assets/logo.png" class="" />
    </div>
    <div class="clock">{{ time }}</div>
  </div>
</template>
<style lang="scss" scoped>
.status-bar {
  display: flex;  /* flex 布局 *
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  padding: 0 20px;
  height: 50px;
  background-color: #fff;
  color: #fff;
  .brand {
    img {
      height: 30px;
    }
  }
  .clock {
    font-size: 20px;
  }}
</style>