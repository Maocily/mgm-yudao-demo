import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/standby' },
  { path: '/standby', name: 'standby', component: () => import('@/views/StandbyView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  // 会员 PIN 已合并到 LoginView 的 overlay（?pin=error|locked 直达预览）；管理员登录同理。
  { path: '/campaign', name: 'campaign', component: () => import('@/views/CampaignView.vue') },
  { path: '/printing', name: 'printing', component: () => import('@/views/PrintingView.vue') },
  { path: '/admin/device', name: 'device', component: () => import('@/views/DeviceStatusView.vue') },
  { path: '/pin', redirect: '/login' }, // 兼容老链接
  { path: '/lock', name: 'lock', component: () => import('@/views/LockScreenView.vue') },
  { path: '/preview', name: 'preview', component: () => import('@/views/PreviewIndex.vue') }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
