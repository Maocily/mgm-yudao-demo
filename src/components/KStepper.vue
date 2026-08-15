<script setup lang="ts">
/**
 * KStepper — 数量步进器
 *
 * 用法：
 *   <KStepper v-model="qty" :min="1" :max="maxQty" hint="最多可兑换 4 张" />
 *
 * 行为：
 *   - 点击 − 减 1，触底禁用
 *   - 点击 + 加 1，触顶禁用
 *   - 支持键盘直接输入数字
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** v-model 绑定值 */
    modelValue: number
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 步长 */
    step?: number
    /** 输入框宽度 */
    inputWidth?: string
    /** 是否整体禁用 */
    disabled?: boolean
    /** 底部提示文案 */
    hint?: string
  }>(),
  {
    min: 1,
    max: Infinity,
    step: 1,
    inputWidth: '220px',
    disabled: false,
    hint: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [v: number]
  change: [v: number]
}>()

const atMin = computed(() => props.modelValue <= props.min)
const atMax = computed(() => props.modelValue >= props.max)

function clamp(n: number) {
  return Math.min(props.max, Math.max(props.min, n))
}

function setValue(n: number) {
  if (props.disabled) return
  const next = clamp(n)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', next)
  }
}

function dec() {
  if (atMin.value) return
  setValue(props.modelValue - props.step)
}

function inc() {
  if (atMax.value) return
  setValue(props.modelValue + props.step)
}

function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(v)) setValue(v)
}
</script>

<template>
  <div class="k-stepper" :class="{ 'is-disabled': disabled }">
    <div class="k-stepper__row">
      <button
        type="button"
        class="k-stepper__btn k-stepper__btn--minus"
        :disabled="atMin || disabled"
        @click="dec"
      >
    <svg data-pencil-name="Minus Icon" data-icon-name="minus" data-icon-set="phosphor" viewBox="0 0 14 14" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="box-sizing: border-box; flex-shrink: 0; height: 36px; width: 36px">
                  <path d="M11.8125 7.4375l-9.625 0q-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.30078 0-0.16406 0.13672-0.30078 0.13672-0.13672 0.30078-0.13672l9.625 0q0.16406 0 0.30078 0.13672 0.13672 0.13672 0.13672 0.30078 0 0.16406-0.13672 0.30078-0.13672 0.13672-0.30078 0.13672z" fill="#ffffffff"></path>
                </svg>
    </button>

      <div class="k-stepper__display" :style="{ width: inputWidth }">
        <input
          class="k-stepper__input"
          type="number"
          :value="modelValue"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          inputmode="numeric"
          @input="onInput"
          @change="onInput"
        />
      </div>

      <button
        type="button"
        class="k-stepper__btn k-stepper__btn--plus"
        :disabled="atMax || disabled"
        @click="inc"
      >
    <svg data-pencil-name="Plus Icon" data-icon-name="plus" data-icon-set="phosphor" viewBox="0 0 14 14" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="box-sizing: border-box; flex-shrink: 0; height: 36px; width: 36px">
                  <path d="M12.25 7q0 0.16406-0.13672 0.30078-0.13672 0.13672-0.30078 0.13672l-4.375 0 0 4.375q0 0.16406-0.13672 0.30078-0.13672 0.13672-0.30078 0.13672-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.30078l0-4.375-4.375 0q-0.16406 0-0.30078-0.13672-0.13672-0.13672-0.13672-0.30078 0-0.16406 0.13672-0.30078 0.13672-0.13672 0.30078-0.13672l4.375 0 0-4.375q0-0.16406 0.13672-0.30078 0.13672-0.13672 0.30078-0.13672 0.16406 0 0.30078 0.13672 0.13672 0.13672 0.13672 0.30078l0 4.375 4.375 0q0.16406 0 0.30078 0.13672 0.13672 0.13672 0.13672 0.30078z" fill="#FFFFFF"></path>
                </svg>
    </button>
    </div>

    <div v-if="hint" class="k-stepper__hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.k-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 24px 0 8px;
  font-family: var(--font-cn);
}

.k-stepper__row {
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  gap: 16px;
}

.k-stepper__btn {
  width: 82px;
  cursor: pointer;
  transition: transform 0.08s ease, filter 0.15s ease, background 0.15s ease;
  font-family: inherit;
  align-items: center;
  background: #C9A24D;
  border-radius: 14px;
  border: 1.5px solid #C9A24D;
  box-shadow: 0px 4px 12px 0px #C9A24D33;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  gap: 0px;
  height: 82px;
  justify-content: center;
  width: 82px;
  background-size:36px 36px
}
.k-stepper__btn:active:not(:disabled) {
  transform: scale(0.95);
}
.k-stepper__btn:disabled {
  cursor: not-allowed;
}

/* 减号：金色实心（设计稿 − 按钮状态） */
.k-stepper__btn--minus {
  background-color: #C9A24D;
  color: #fff;
  box-shadow: 0 4px 12px rgba(166, 124, 31, 0.3);
}
.k-stepper__btn--minus:disabled {
  background: #d3cdc1;
  border-color: #d3cdc1;
  box-shadow: none;
}

/* 加号：默认金色（与 − 一致），触顶置灰 */
.k-stepper__btn--plus {
  background: #C9A24D;
  color: #fff;
  box-shadow: 0 4px 12px rgba(166, 124, 31, 0.3);
}
.k-stepper__btn--plus:disabled {
  background: #d3cdc1;
  border-color: #d3cdc1;
  color: var(--ink-soft);
  box-shadow: none;
}

.k-stepper__display {
  position: relative;
  height: 82px;
  width:100%;
  flex:1;
  border: 1.5px solid var(--gold);
  border-radius: var(--r-md);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 隐藏原生 number input 的箭头 */
.k-stepper__input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-size: 68px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-en);
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
  appearance: textfield;
  line-height: 1;
}
.k-stepper__input::-webkit-outer-spin-button,
.k-stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.k-stepper__input:disabled {
  color: var(--ink-soft);
  cursor: not-allowed;
}

.k-stepper__hint {
  font-size: 22px;
  color: var(--ink-soft);
  letter-spacing: 1px;
  line-height: 1.4;
  text-align: center;
}

.k-stepper.is-disabled .k-stepper__display {
  background: var(--cream-2);
  border-color: var(--cream-2);
}
</style>
