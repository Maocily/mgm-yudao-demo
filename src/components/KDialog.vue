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
 *
 * 注意：组件本身不使用 <Teleport>，默认在父容器内绝对定位（与 kiosk-stage
 * 的 transform 缩放保持一致）。如果需要把弹窗挂到 body，可在使用处自行包
 * <Teleport to="body">…</Teleport>。
 */
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** v-model 绑定值 */
    modelValue: boolean
    /** 标题文本（header 插槽未使用时生效） */
    title?: string
    /** 弹窗宽度 */
    width?: string | number
    /** 是否显示右上角关闭按钮 */
    showClose?: boolean
    /** 点击遮罩是否关闭 */
    closeOnClickModal?: boolean
    /** 按 ESC 是否关闭 */
    closeOnPressEscape?: boolean
    /** 标题与底部是否居中对齐 */
    center?: boolean
    /** 弹窗在视口内是否垂直居中（默认是）；否则贴顶 */
    alignCenter?: boolean
    /** 是否显示遮罩 */
    modal?: boolean
    /** 透传给根节点的 class */
    customClass?: string
  }>(),
  {
    title: '',
    width: '500px',
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
      <!-- 头部：可整体替换 -->
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

      <!-- 主体 -->
      <div class="k-dialog__body">
        <slot />
      </div>

      <!-- 底部 -->
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
  background: rgba(20, 14, 8, 0.55);
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
  background: var(--cream);
  border-radius: 24px;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 48px);
  max-height: calc(100% - 48px);
  overflow: hidden;
  align-items: center;
  background-color: #ffffff;
  background-image: linear-gradient(0deg, #fcfcfc 50%, #fff8ea 100%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  border-radius: 30px;
  border: 2px solid #E8D6A3;
  box-shadow: 0px 20px 48px 0px #1A11084D;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 40px;
  justify-content: flex-start;
  left: 50%;
  padding: 60px 48px;
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
}
.k-dialog.is-top {
  align-self: flex-start;
  margin-top: 12vh;
}

.k-dialog__header {
  position: relative;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height:82px;
  font-family: var(--font-cn);
  box-sizing: border-box;
  color: #7A6546;
  font-family: "Noto Sans SC", system-ui, sans-serif;
  font-size: 36px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0px;
  line-height: normal;
  text-align: center;
  white-space: nowrap;
}
.k-dialog__header.is-center {
  justify-content: center;
}
.k-dialog__title {
  flex: 1;
  min-width: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 1px;
  text-align: left;
}
.k-dialog__header.is-center .k-dialog__title {
  text-align: center;
}

.k-dialog__close {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-size: 32px;
  line-height: 1;
  font-family: var(--font-en);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.k-dialog__close:hover {
  background: var(--cream-2);
  color: var(--ink);
}
.k-dialog__close:active {
  transform: scale(0.92);
}

.k-dialog__body {
  display: flex;
  flex-direction: column;
  padding: 0;
  color: var(--ink);
  font-size: 22px;
  line-height: 1.5;
  width:100%;
  font-family: var(--font-cn);
  overflow: hidden;
  gap:40px;
}

.k-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  width:100%;
  padding:0 50px;
  button{
    width: 100%;
    max-width: 200px;
  }
  
}
.k-dialog__footer.is-center {
  justify-content: center;
}

/* 过渡已移除（弹窗不再使用动画） */

</style>
