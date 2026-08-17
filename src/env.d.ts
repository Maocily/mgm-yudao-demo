/// <reference types="vite/client" />

// PR-11 (2026-08-15) / F-01: kioskBridge 类型 (主进程 contextBridge 暴露的 API)
interface KioskBridge {
  /** PR-11: 校验 PIN (admin=6位, member=4位) */
  verifyPin: (kind: 'admin' | 'member', pin: string) => Promise<{ ok: boolean; reason?: string }>
  /** 退出应用 (需要 admin PIN) */
  requestExit: (pin: string) => Promise<{ ok: boolean; reason?: string }>
  /** 重启应用 (需要 admin PIN) */
  relaunch: (pin: string) => Promise<{ ok: boolean; reason?: string }>
  /** 打印票券 */
  printTicket: (html: string, deviceName?: string) => Promise<{ ok: boolean; reason?: string }>
}

interface Window {
  /**
   * PR-11: kioskBridge 由 electron/preload.ts 在 contextIsolation 下注入,
   * 生产环境永远存在 (Electron 启动期同步执行 exposeInMainWorld)。
   * 标记为必选,渲染层无需做 optional chain 噪声检查。
   */
  kioskBridge: KioskBridge
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.svg' {
  const src: string
  export default src
}
