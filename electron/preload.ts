import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的受控 API（Kiosk 桥）
contextBridge.exposeInMainWorld('kioskBridge', {
  /** 管理员正规通道退出应用 */
  requestExit: () => ipcRenderer.invoke('kiosk:request-exit'),
  /** 重启设备（应用层：重启应用进程） */
  relaunch: () => ipcRenderer.invoke('kiosk:relaunch'),
  /**
   * 打印一张票券（系统默认打印机,静默打印）
   * @param html 票面 HTML
   * @param deviceName 可选,指定打印机名(Mac/Win);不传走系统默认
   * @returns 成功 true / 失败 false + reason
   */
  printTicket: (html: string, deviceName?: string) =>
    ipcRenderer.invoke('kiosk:print-ticket', { html, deviceName }) as Promise<{ ok: boolean; reason?: string }>
})
