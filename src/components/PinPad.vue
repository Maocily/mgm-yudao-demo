<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import backspaceIcon from '@/assets/svg-icons/icon-backspace.svg'

const props = withDefaults(
  defineProps<{
    modelValue: string
    maxLength?: number
    title?: string
    shake?: boolean
  }>(),
  { maxLength: 4, title: '', shake: false }
)
const emit = defineEmits<{
  'update:modelValue': [v: string]
  confirm: []
  close: []
}>()

const { t } = useI18n()
const slots = computed(() =>
  Array.from({ length: props.maxLength }, (_, i) => i < props.modelValue.length)
)

function press(k: string) {
  if (props.modelValue.length >= props.maxLength) return
  emit('update:modelValue', props.modelValue + k)
}
function backspace() {
  emit('update:modelValue', props.modelValue.slice(0, -1))
}
</script>

<template>
  <div class="pinpad" :class="{ shake }">
    <div v-if="title" class="pin-title">{{ title }}</div>

    <!-- PIN 显示：48x60 方框（设计稿输入密码2） -->
    <div class="pin-row">
      <div
        v-for="(filled, i) in slots"
        :key="i"
        class="pin-box"
        :class="{ filled }"
      />
    </div>

    <!-- 数字键盘：1-9 / 删除 0 确认 -->
    <div class="keys">
      <button class="key" @click="press('1')">1</button>
      <button class="key" @click="press('2')">2</button>
      <button class="key" @click="press('3')">3</button>
      <button class="key" @click="press('4')">4</button>
      <button class="key" @click="press('5')">5</button>
      <button class="key" @click="press('6')">6</button>
      <button class="key" @click="press('7')">7</button>
      <button class="key" @click="press('8')">8</button>
      <button class="key" @click="press('9')">9</button>
      <button class="key key-fn" @click="backspace" aria-label="delete">
        <img :src="backspaceIcon" alt="delete" />
      </button>
      <button class="key" @click="press('0')">0</button>
      <button class="key key-confirm" @click="emit('confirm')">{{ t('common.confirm') }}</button>
    </div>

    <!-- 关闭按钮（设计稿"关闭"） -->
    <button v-if="!title" class="pin-close" @click="emit('close')">{{ t('common.close') }}</button>
  </div>
</template>

<style scoped>
.pinpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  font-family: var(--font-cn);
}

.pin-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
  letter-spacing: 1px;
  line-height: 1.4;
}

.pin-row {
  display: flex;
  gap: 16px;
}
.pin-box {
  width: 56px;
  height: 68px;
  border: 1.5px solid var(--gold);
  border-radius: 8px;
  background: #fff;
  position: relative;
  transition: background 0.15s;
}
.pin-box.filled {
  background: var(--cream-3);
}
.pin-box.filled::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--gold-deep);
}

.keys {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  width: 100%;
  max-width: 360px;
}
.key {
  height: 64px;
  border-radius: 12px;
  border: 1.5px solid var(--cream-2);
  background: #fff;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-cn);
  cursor: pointer;
  transition: transform 0.08s, background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-window .keys {
  max-width: 420px;
}
.key:active {
  transform: scale(0.95);
  background: var(--cream-3);
  border-color: var(--gold);
}
.key-fn {
  color: var(--ink-soft);
}
.key-fn img {
  width: 22px;
  height: 22px;
}
.key-confirm {
  background: #c9a24d;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  border: 1.5px solid #c9a24d;
  box-shadow: 0 4px 12px rgba(201, 162, 77, 0.25);
}
.key-confirm:active {
  background: #a67c1f;
  border-color: #a67c1f;
}

.pin-close {
  background: url('@/assets/svg-icons/icon-back.svg') no-repeat 12px center;
  background-size: 14px 14px;
  border: none;
  color: var(--ink-soft);
  font-size: 18px;
  cursor: pointer;
  font-family: var(--font-cn);
  padding: 12px 24px 12px 32px;
}
</style>
