import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/standby' },
  { path: '/standby', name: 'standby', component: () => import('@/views/StandbyView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/pin', name: 'pin', component: () => import('@/views/PinView.vue') },
  { path: '/campaign', name: 'campaign', component: () => import('@/views/CampaignView.vue') },
  { path: '/printing', name: 'printing', component: () => import('@/views/PrintingView.vue') },
  // 管理员登录已改为 LoginView 上的 overlay，不再需要独立路由
  { path: '/admin/device', name: 'device', component: () => import('@/views/DeviceStatusView.vue') },
  { path: '/lock', name: 'lock', component: () => import('@/views/LockScreenView.vue') },
  { path: '/preview', name: 'preview', component: () => import('@/views/PreviewIndex.vue') }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
