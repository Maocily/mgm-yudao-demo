import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的受控 API（Kiosk 桥）
// 类型声明在 src/env.d.ts (统一管理,避免重复)
contextBridge.exposeInMainWorld('kioskBridge', {
  /**
   * PR-11 (2026-08-15) / F-01: 校验 PIN
   * 渲染层收集 PIN 后调这个,主进程做常量时间比对 + 限流
   */
  verifyPin: (kind: 'admin' | 'member', pin: string) =>
    ipcRenderer.invoke('kiosk:verify-pin', { kind, pin }) as Promise<{ ok: boolean; reason?: string }>,
  /** 管理员正规通道退出应用 (需要 admin PIN) */
  requestExit: (pin: string) =>
    ipcRenderer.invoke('kiosk:request-exit', { pin }) as Promise<{ ok: boolean; reason?: string }>,
  /** 重启设备（应用层：重启应用进程,需要 admin PIN） */
  relaunch: (pin: string) =>
    ipcRenderer.invoke('kiosk:relaunch', { pin }) as Promise<{ ok: boolean; reason?: string }>,
  /**
   * 打印一张票券（系统默认打印机,静默打印）
   * @param html 票面 HTML (≤32 KB)
   * @param deviceName 可选,指定打印机名(Mac/Win);不传走系统默认
   * @returns 成功 true / 失败 false + reason
   */
  printTicket: (html: string, deviceName?: string) =>
    ipcRenderer.invoke('kiosk:print-ticket', { html, deviceName }) as Promise<{ ok: boolean; reason?: string }>
})
