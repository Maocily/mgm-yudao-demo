<script setup lang="ts">
import KioskStage from '@/components/KioskStage.vue'
</script>

<template>
  <KioskStage>
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </KioskStage>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.28s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
