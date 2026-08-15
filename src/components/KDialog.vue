<script setup lang="ts">
/**
 * KDialog — 通用弹窗组件（参考 El-dialog 的 API）
 *
 * 用法：
 *   <KDialog v-model="visible" title="提示" width="500px">…</KDialog>
 *   <KDialog v-model="visible" :show-close="false" @close="onClose">…</KDialog>
 *
 * 插槽：
 *   default  — 主体内容
 *   header   — 整个头部（覆盖 title 插槽与关闭按钮）
 *   title    — 仅替换标题文字
 *   footer   — 底部按钮区
 *   close    — 替换右上角关闭按钮
 */
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string | number
    showClose?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    center?: boolean
    alignCenter?: boolean
    modal?: boolean
    customClass?: string
  }>(),
  {
    title: '',
    width: '660px',
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    center: false,
    alignCenter: true,
    modal: true,
    customClass: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  open: []
  close: []
}>()

const dialogWidth = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width
)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onMaskClick() {
  if (props.closeOnClickModal) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnPressEscape && props.modelValue) {
    close()
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      document.addEventListener('keydown', onKeydown)
      emit('open')
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    v-if="modelValue"
    class="k-dialog__overlay"
    :class="{ 'is-transparent': !modal }"
    @click.self="onMaskClick"
  >
    <div
      class="k-dialog"
      :class="[customClass, { 'is-center': center, 'is-top': !alignCenter }]"
      :style="{ width: dialogWidth }"
      role="dialog"
      aria-modal="true"
      @click.stop
    >
      <header
        v-if="$slots.header || title || showClose"
        class="k-dialog__header"
        :class="{ 'is-center': center }"
      >
        <slot name="header">
          <div class="k-dialog__title">
            <slot name="title">{{ title }}</slot>
          </div>
        </slot>
      </header>

      <div class="k-dialog__body">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="k-dialog__footer"
        :class="{ 'is-center': center }"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.k-dialog__overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 17, 8, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.k-dialog__overlay.is-transparent {
  background: transparent;
  pointer-events: none;
}
.k-dialog__overlay.is-transparent .k-dialog {
  pointer-events: auto;
}

.k-dialog {
  background-color: #ffffff;
  background-image: linear-gradient(180deg, #fff8ea 0%, #ffffff 100%);
  border: 2px solid #e8d6a3;
  border-radius: 30px;
  box-shadow: 0 20px 48px rgba(26, 17, 8, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  padding: 48px 48px 40px;
  max-width: calc(100% - 48px);
  max-height: calc(100% - 48px);
  overflow: hidden;
  box-sizing: border-box;
}
.k-dialog.is-top {
  align-self: flex-start;
  margin-top: 12vh;
}

.k-dialog__header {
  position: relative;
  width: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  font-family: var(--font-cn);
  color: #7a6546;
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  box-sizing: border-box;
}
.k-dialog__header.is-center {
  justify-content: center;
}
.k-dialog__title {
  flex: 1;
  min-width: 0;
  font-size: 36px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 1px;
  text-align: center;
  line-height: 1.3;
}
.k-dialog__header.is-center .k-dialog__title {
  text-align: center;
}

.k-dialog__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0;
  color: var(--ink);
  font-size: 22px;
  line-height: 1.5;
  font-family: var(--font-cn);
  overflow: hidden;
  gap: 28px;
}

.k-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 8px 0 0;
  box-sizing: border-box;
}
.k-dialog__footer :deep(.k-btn) {
  flex: 1;
  min-width: 0;
  max-width: none;
}
.k-dialog__footer.is-center {
  justify-content: center;
}
</style>
