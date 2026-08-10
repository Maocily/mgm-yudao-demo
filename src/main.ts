import { createApp } from 'vue'
import { createPinia } from 'pinia'
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
// 全局注册通用组件
app.component('KDialog', KDialog)
app.component('KStepper', KStepper)
app.mount('#app')
