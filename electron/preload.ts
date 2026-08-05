import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的受控 API（Kiosk 桥）
contextBridge.exposeInMainWorld('kioskBridge', {
  /** 管理员正规通道退出应用 */
  requestExit: () => ipcRenderer.invoke('kiosk:request-exit'),
  /** 重启设备（应用层：重启应用进程） */
  relaunch: () => ipcRenderer.invoke('kiosk:relaunch')
})
