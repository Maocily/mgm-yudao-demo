import { app, BrowserWindow, globalShortcut, ipcMain, session, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

// 主进程由 esbuild 以 CJS 打包输出，直接使用 CJS 原生 __dirname

// Vite 注入的环境变量
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const isDev = process.env.NODE_ENV === 'development' || !!VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

// 是否允许退出（仅在管理员正规通道下临时置 true）
let allowQuit = false

// ---- PR-11 (2026-08-15) / F-06: 首次启动 SecureRandom 生成 PIN + 落盘 ----
interface KioskPins {
  adminPin: string
  memberPin: string
  generatedAt: string
}
const ALLOWED_PIN_CHARS = '0123456789'
function genPin(len: number): string {
  // 用 crypto.randomInt 保证不可预测 (非 Math.random)
  const out: string[] = []
  for (let i = 0; i < len; i++) {
    out.push(ALLOWED_PIN_CHARS[crypto.randomInt(0, ALLOWED_PIN_CHARS.length)])
  }
  return out.join('')
}
function getPinsFilePath(): string {
  return path.join(app.getPath('userData'), 'kiosk-pins.json')
}
function loadOrGeneratePins(): KioskPins {
  const file = getPinsFilePath()
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      const parsed = JSON.parse(raw) as KioskPins
      if (parsed.adminPin && parsed.memberPin) {
        return parsed
      }
    } catch (err) {
      console.error('[kiosk-pins] read failed, regenerating:', err)
    }
  }
  const pins: KioskPins = {
    adminPin: genPin(6),
    memberPin: genPin(4),
    generatedAt: new Date().toISOString()
  }
  fs.writeFileSync(file, JSON.stringify(pins, null, 2), { mode: 0o600 })
  // chmod 仅 Linux/Mac 有效;Windows 走 NTFS ACL (Node 16+ 已自动 set mode)
  try { fs.chmodSync(file, 0o600) } catch { /* ignore on Windows */ }
  console.log(`[kiosk-pins] 已生成新 PIN (admin=${pins.adminPin} member=${pins.memberPin}),落盘 ${file}`)
  return pins
}
let kioskPins: KioskPins | null = null

// PR-11 (2026-08-15) / F-01: 简单内存计数防 IPC 暴破
const ipcBruteforce = new Map<string, { count: number; lastAt: number }>()
function checkBruteforce(key: string): boolean {
  const now = Date.now()
  const rec = ipcBruteforce.get(key)
  if (!rec) {
    ipcBruteforce.set(key, { count: 1, lastAt: now })
    return true
  }
  if (now - rec.lastAt > 60_000) {
    ipcBruteforce.set(key, { count: 1, lastAt: now })
    return true
  }
  rec.count++
  rec.lastAt = now
  // 每分钟最多 5 次
  return rec.count <= 5
}

// PR-11 (2026-08-15) / F-18: IPC channel 白名单
const ALLOWED_IPC_CHANNELS = new Set([
  'kiosk:verify-pin',
  'kiosk:request-exit',
  'kiosk:relaunch',
  'kiosk:print-ticket'
])
ipcMain.handle('__kiosk:preflight', (event, channel: string) => {
  // 渲染层拿 PIN 校验结果时,带 channel 让主进程也校验
  return ALLOWED_IPC_CHANNELS.has(channel)
})

// PR-11 (2026-08-15) / F-01: PIN 校验
ipcMain.handle('kiosk:verify-pin', (_event, payload: { kind: 'admin' | 'member'; pin: string }) => {
  if (!kioskPins) return { ok: false, reason: 'PIN 尚未生成 (启动期失败)' }
  if (!payload || typeof payload.pin !== 'string' || typeof payload.kind !== 'string') {
    return { ok: false, reason: '参数错误' }
  }
  const key = `verify:${payload.kind}`
  if (!checkBruteforce(key)) {
    return { ok: false, reason: '尝试次数过多,请稍后重试' }
  }
  // 常量时间比较避免时序泄漏
  const expected = payload.kind === 'admin' ? kioskPins.adminPin : kioskPins.memberPin
  const a = Buffer.from(payload.pin, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) {
    return { ok: false, reason: 'PIN 错误' }
  }
  const ok = crypto.timingSafeEqual(a, b)
  return { ok, reason: ok ? undefined : 'PIN 错误' }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    // ---- Kiosk 锁定核心配置 ----
    fullscreen: true, // 全屏
    kiosk: !isDev, // 开发时关闭 kiosk 便于调试；生产强制 kiosk
    frame: false, // 无边框（无标题栏、无关闭按钮）
    autoHideMenuBar: true,
    minimizable: false, // 禁止最小化
    maximizable: false,
    closable: false, // 禁止关闭按钮
    resizable: false,
    movable: false,
    skipTaskbar: false, // 保留任务栏图标（便于运维）；如需彻底隐藏可置 true
    alwaysOnTop: !isDev, // 生产置顶，压住其他窗口
    backgroundColor: '#FBF8F1',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // PR-11 (2026-08-15) / F-05: 启用 sandbox (Chromium 进程级沙箱,即使 preload 受攻击也无法逃逸到主进程)
      sandbox: true,
      // 竖屏终端禁用缩放手势
      zoomFactor: 1.0,
      // 阻止 webview / web-contents-from-anything-other-than-main 加载任意 URL
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // 生产环境置顶最高层级
  if (!isDev) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true)
  }

  // PR-11 (2026-08-15) / F-07: CSP meta + X-Content-Type-Options
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // PR-24 (NEW-02 medium): 删 script-src 'unsafe-eval'。
          // 旧版本留 unsafe-eval 是给 dev 模式 Vite HMR 用;Vite HMR 走 ws://localhost:5199 走 connect-src,
          // 不依赖 eval。生产构建后 esbuild minify 产物不需要 eval。
          "default-src 'self' 'unsafe-inline' data:; " +
          "img-src 'self' data: https://images.unsplash.com; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http://localhost:48080 http://localhost:48081 ws://localhost:5199; " +
          "frame-ancestors 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self'"
        ],
        'X-Content-Type-Options': ['nosniff'],
        'Referrer-Policy': ['no-referrer']
      }
    })
  })

  // PR-11 (2026-08-15) / F-07: 拒绝所有权限申请 (geolocation/notification/media...)
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))

  // 拦截关闭：非正规通道一律阻止
  mainWindow.on('close', (e) => {
    if (!allowQuit) {
      e.preventDefault()
    }
  })

  // 禁止新窗口 / 外部导航
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // PR-11 (2026-08-15) / F-03: will-navigate 拦截 — 防止 XSS 触发 window.location 跳到 evil.com
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) {
      return // 开发期 vite HMR 允许
    }
    if (url.startsWith('file://')) {
      return // 本地资源允许
    }
    event.preventDefault()
    console.warn(`[will-navigate] blocked: ${url}`)
  })

  // PR-11 (2026-08-15) / F-03: did-redirect 拦截 (e.g. meta refresh, server 302)
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
    console.warn(`[will-redirect] blocked: ${url}`)
  })

  // 阻止第三方链接被 webview 弹出到 OS 浏览器 (静默阻止)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`[setWindowOpenHandler] blocked: ${url}`)
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    // 开发时打开 devtools（生产不打开）
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

/**
 * 屏蔽会导致退出/切换/最小化的全局快捷键。
 * 注意：Ctrl+Alt+Del、Win 锁屏等由系统接管，globalShortcut 无法拦截，
 * 需在系统层（Assigned Access / 组策略）配合，本轮仅做应用层。
 */
function registerShortcutBlocks() {
  const blocked = [
    'Alt+F4', // 关闭窗口
    'CommandOrControl+W', // 关闭
    'CommandOrControl+Q', // 退出
    'CommandOrControl+R', // 刷新（生产屏蔽，防止误刷）
    'CommandOrControl+Shift+R',
    'F11', // 切换全屏
    'CommandOrControl+M', // 最小化
    'Alt+Tab', // 切换窗口（部分系统可拦截）
    'Super', // Win 键
    'CommandOrControl+Shift+I', // devtools
    'F12'
  ]
  for (const accel of blocked) {
    try {
      globalShortcut.register(accel, () => {
        // 吞掉快捷键，什么都不做
      })
    } catch {
      // 某些组合在个别平台无法注册，忽略
    }
  }
}

// ---- IPC：供渲染进程调用的受控退出 / 重启 ----
// PR-11 (2026-08-15) / F-01: 退出 / 重启也要 admin PIN
ipcMain.handle('kiosk:request-exit', (_event, payload?: { pin?: string }) => {
  const pin = payload?.pin
  if (!kioskPins) return { ok: false, reason: 'PIN 未就绪' }
  if (!checkBruteforce('exit')) return { ok: false, reason: '尝试过于频繁' }
  if (!pin) return { ok: false, reason: '缺少 PIN' }
  const a = Buffer.from(pin, 'utf8')
  const b = Buffer.from(kioskPins.adminPin, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'PIN 错误' }
  }
  allowQuit = true
  app.quit()
  return { ok: true }
})

ipcMain.handle('kiosk:relaunch', (_event, payload?: { pin?: string }) => {
  const pin = payload?.pin
  if (!kioskPins) return { ok: false, reason: 'PIN 未就绪' }
  if (!checkBruteforce('relaunch')) return { ok: false, reason: '尝试过于频繁' }
  if (!pin) return { ok: false, reason: '缺少 PIN' }
  const a = Buffer.from(pin, 'utf8')
  const b = Buffer.from(kioskPins.adminPin, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'PIN 错误' }
  }
  allowQuit = true
  app.relaunch()
  app.exit(0)
  return { ok: true }
})

// PR-11 (2026-08-15) / F-10: 单实例锁 — 防止多开覆盖共享资源
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.exit(0)
}

/**
 * 打印一张票券:用隐藏 BrowserWindow 加载 HTML,调 webContents.print 静默打印。
 * 走 OS 的默认打印机(或 deviceName 指定),跨 Mac/Win/Linux。
 *
 * PR-11 (2026-08-15) / F-02 / F-04 / F-19: print-ticket 限流 + 长度限制 + 单一窗口
 */
const PRINT_HTML_MAX = 32 * 1024 // 32 KB (一张票面足够)
let printingNow = false
ipcMain.handle('kiosk:print-ticket', async (_event, payload: { html: string; deviceName?: string }) => {
  if (printingNow) return { ok: false, reason: '上一个打印任务尚未结束' }
  const { html, deviceName } = payload || {}
  if (typeof html !== 'string' || html.length === 0) {
    return { ok: false, reason: 'html 不能为空' }
  }
  if (html.length > PRINT_HTML_MAX) {
    return { ok: false, reason: `html 长度 ${html.length} 超过 ${PRINT_HTML_MAX} 上限` }
  }
  if (deviceName !== undefined && (typeof deviceName !== 'string' || deviceName.length > 256)) {
    return { ok: false, reason: 'deviceName 格式错误' }
  }
  if (!checkBruteforce('print')) return { ok: false, reason: '打印请求过于频繁' }

  printingNow = true
  const printWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      javascript: true, // 票面 HTML 可能有 inline 脚本
      // PR-11 (2026-08-15): 隐藏窗口禁掉 webview / 远程资源
      webSecurity: true
    }
  })
  try {
    // 用 data URL 加载,避免依赖本地文件路径
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
    await printWin.loadURL(dataUrl)
    // 给一点时间让样式/字体生效
    await new Promise((r) => setTimeout(r, 100))

    return await new Promise<{ ok: boolean; reason?: string }>((resolve) => {
      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
          ...(deviceName ? { deviceName } : {})
        },
        (success: boolean, failureReason: string) => {
          resolve({ ok: success, reason: success ? undefined : failureReason })
        }
      )
    })
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  } finally {
    if (!printWin.isDestroyed()) printWin.close()
    printingNow = false
  }
})

app.whenReady().then(() => {
  // PR-11 (2026-08-15) / F-06: 启动期生成 / 加载 PIN
  kioskPins = loadOrGeneratePins()
  // PR-11 (2026-08-15) / F-07: 拒绝协议跳转 (e.g. window.open('mailto:'))
  app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      // 默认 deny,只有 file:// 自家资源允许
      if (url.startsWith('file://')) return { action: 'allow' }
      return { action: 'deny' }
    })
    contents.on('will-attach-webview', (e) => e.preventDefault())
  })

  createWindow()
  if (!isDev) {
    registerShortcutBlocks()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 阻止默认的「窗口全关就退出」——保持常驻
app.on('window-all-closed', () => {
  if (!allowQuit) {
    // 窗口不该被关闭；若异常关闭则重建
    createWindow()
  } else {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
