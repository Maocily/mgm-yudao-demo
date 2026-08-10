/// <reference types="vite/client" />

interface KioskBridge {
  requestExit: () => Promise<boolean>
  relaunch: () => Promise<boolean>
  printTicket: (html: string, deviceName?: string) => Promise<{ ok: boolean; reason?: string }>
}

interface Window {
  kioskBridge?: KioskBridge
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
