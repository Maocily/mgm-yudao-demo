import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueDOMPurifyHTML from 'vue-dompurify-html' // PR-15 (2026-08-15): F-11/F-12 — v-html 渲染 i18n 字符串经 DOMPurify 清洗防 XSS
import App from './App.vue'
import router from './router'
import i18n from './locales'
import KDialog from './components/KDialog.vue'
import KStepper from './components/KStepper.vue'
import './styles/tokens.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
// PR-15 (2026-08-15) F-11/F-12: 注册 v-dompurify-html 全局指令,替代裸 v-html
// 用途:i18n 翻译里偶有 <br/> 之类的安全 HTML (如 en 的 pin.memberTitle 含 <br/>),
//      v-dompurify-html 走 DOMPurify 清洗,挡掉 <script>/onerror= 等危险标签。
app.use(VueDOMPurifyHTML)
// 全局注册通用组件
app.component('KDialog', KDialog)
app.component('KStepper', KStepper)
app.mount('#app')
