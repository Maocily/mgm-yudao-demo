import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'node:path'

// 主进程由 esbuild 以 CJS 打包输出，直接使用 CJS 原生 __dirname

// Vite 注入的环境变量
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const isDev = process.env.NODE_ENV === 'development' || !!VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

// 是否允许退出（仅在管理员正规通道下临时置 true）
let allowQuit = false

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
      // 竖屏终端禁用缩放手势
      zoomFactor: 1.0
    }
  })

  // 生产环境置顶最高层级
  if (!isDev) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true)
  }

  // 拦截关闭：非正规通道一律阻止
  mainWindow.on('close', (e) => {
    if (!allowQuit) {
      e.preventDefault()
    }
  })

  // 禁止新窗口 / 外部导航
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

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
ipcMain.handle('kiosk:request-exit', () => {
  // 由管理员 PIN 校验通过后调用（本轮 UI 层已校验）
  allowQuit = true
  app.quit()
  return true
})

ipcMain.handle('kiosk:relaunch', () => {
  allowQuit = true
  app.relaunch()
  app.exit(0)
  return true
})

/**
 * 打印一张票券:用隐藏 BrowserWindow 加载 HTML,调 webContents.print 静默打印。
 * 走 OS 的默认打印机(或 deviceName 指定),跨 Mac/Win/Linux。
 */
ipcMain.handle('kiosk:print-ticket', async (_event, payload: { html: string; deviceName?: string }) => {
  const { html, deviceName } = payload
  const printWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      javascript: false
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
  }
})

app.whenReady().then(() => {
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
