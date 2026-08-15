<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/session'

const { locale } = useI18n()
const session = useSessionStore()

function set(lang: 'zh' | 'en') {
  locale.value = lang
  session.setLang(lang)
}
</script>

<template>
  <div class="lang-switch">
    <button :class="{ active: locale === 'zh' }" @click="set('zh')">中文</button>
    <button :class="{ active: locale === 'en' }" @click="set('en')">EN</button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 56px;
  background: #fff;
  border: 1.5px solid #e8d6a3;
  border-radius: 28px;
  box-sizing: border-box;
  padding: 4px;
  font-family: var(--font-cn);
}
.lang-switch button {
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 22px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  width: 78px;
  height: 44px;
  border-radius: 22px;
  transition: background 0.15s, color 0.15s, font-weight 0.15s;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lang-switch button.active {
  background: #c9a24d;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(201, 162, 77, 0.25);
}
</style>
