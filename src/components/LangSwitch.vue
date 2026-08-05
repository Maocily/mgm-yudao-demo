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
  gap: 10px;
  color: var(--gold-deep);
  font-size: 22px;
  letter-spacing: 2px;
  height:55px;
  background: #fff;
  border:1px soid #E8D6A3;
  border-radius: 28px;
  box-sizing: border-box;
  padding: 8px;
  
}
.lang-switch button {
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 22px;
  cursor: pointer;
  font-family: var(--font-cn);
  width:51px;
  height: 39px;
  border-radius: 20px;
}
.lang-switch button.active {
  color: var(--gold-deep);
  font-weight: 700;
  opacity: 1;
  color:#FFF;
  width:71px;
  background:#C9A24D;
}
.sep {
  opacity: 0.4;
}
</style>
