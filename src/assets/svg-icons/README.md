# SVG 图标库

本目录是 Kiosk 终端项目**唯一的图标源**。所有 PNG 图标（含历史残留）已全部迁移至此处的 SVG 文件。

## 命名约定

```
src/assets/svg-icons/icon-<name>.svg
```
<!-- prettier-ignore-start -->
(以下为目录占位说明，正式规范见上)
<!-- prettier-ignore-end -->

- 全部使用 `<svg viewBox="0 0 24 24">` 网格（Phosphor 风格）
- 默认使用 `stroke="currentColor"`，由父级 CSS `color` 控制颜色
- 移除 `width` / `height` 属性，由 CSS 控制尺寸
- `icon-warning.svg`（圆形 ! 圈）与 `icon-alert.svg`（三角警示）不同，不要混用

## 使用方式

```vue
<script setup>
import exitIcon from '@/assets/svg-icons/icon-exit.svg'
</script>

<template>
  <img :src="exitIcon" alt="exit" class="icon" />
</template>

<style scoped>
.icon { width: 22px; height: 22px; color: #8a650f; }
</style>
```

## 图标清单

### 已在页面中使用

| 文件 | 用途 | 引用位置 |
| --- | --- | --- |
| `icon-back.svg` | PinPad 关闭按钮左侧箭头 | `PinPad.vue:169` (CSS background) |
| `icon-backspace.svg` | PinPad 数字键盘删除键 | `PinPad.vue:4,60` |
| `icon-exit.svg` | 管理员页退出按钮 | `StatusBar.vue:3,25` |
| `icon-lock.svg` | 管理员页标题锁形图标 | `StatusBar.vue:4,20` |
| `icon-lock-red.svg` | 账户锁定弹窗 (100×100) | `LoginView.vue:16,295` |
| `icon-warning.svg` | 密码错误感叹号弹窗 (100×100) | `LoginView.vue:17,267` |
| `icon-plug.svg` | 设备状态插头图示 | `DeviceStatusView.vue:9,97` |

### 待接入页面（空文件，等待 SVG 代码）

| 文件 | 旧 PNG | 用途（推测） |
| --- | --- | --- |
| `icon-alert.svg` | `Warning.png` | 三角警示（与 `icon-warning` 圆形 ! 区别） |
| `icon-card.svg` | `card.png` | 会员卡图示 |
| `icon-close.svg` | `Close.png` | 通用关闭 (X) |
| `icon-close-x.svg` | `closex.png` | 关闭 X 备选 |
| `icon-fail.svg` | `Fail.png` | 失败状态 |
| `icon-lock-3.svg` | `lock3.png` | 锁形变体 |
| `icon-locked.svg` | `locked.png` | 上锁状态 |
| `icon-minus.svg` | `Minus.png` | 减号 / 数量减少 |
| `icon-plus.svg` | `Plus.png` | 加号 / 数量增加 |
| `icon-power.svg` | `Power.png` | 电源按钮 |
| `icon-print.svg` | `print.png` | 打印图标 |
| `icon-print-3.svg` | `print3.png` | 打印变体 3 |
| `icon-print-alt.svg` | `print2.png` | 打印变体 2 |
| `icon-qrcode.svg` | `qrcode.png` | 二维码图示 |
| `icon-shutdown.svg` | `shutdown.png` | 关机 |
| `icon-spinner.svg` | `Spinner.png` | 加载菊花 |
| `icon-spinner-alt.svg` | `Spinner2.png` | 加载菊花备选 |
| `icon-success.svg` | `Success.png` | 成功（对勾） |
| `icon-touch.svg` | `Touch.png` | 触摸 / 手指点击 |
| `icon-unlock.svg` | `unlock.png` | 解锁状态 |

## 待办

- [x] 创建 27 个 SVG 空文件（7 已使用 + 20 历史残留）
- [x] 迁移 4 个 .vue 文件的 import 引用
- [x] 删除 `src/assets/icons/` 整个目录
- [ ] 用户逐个贴入 SVG 路径/形状
