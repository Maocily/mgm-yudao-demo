# MGM Kiosk 自助终端（桌面应用）

美高梅会员自助票券兑换机（Kiosk）的 **Windows 桌面端**应用。
技术栈：**Electron + Vue 3 + Vite + TypeScript + vue-i18n + Pinia**。
设计来源：`AD_SYS2/V4/Kiosk_zh.pen`（Pencil，竖屏 1080×1820，中英双语）。

> 本轮为 **UI + 交互流程 + Mock 硬件** 版本：读卡器 / 扫码 / NFC / 打印机均为假数据模拟，
> 未接真实串口、打印机与后端 API（已预留接口层，见 `src/mock/`）。

## 目录结构

```
kiosk-terminal/
├── electron/
│   ├── main.ts        # Electron 主进程：Kiosk 全屏锁定 / 禁最小化 / 屏蔽快捷键
│   └── preload.ts     # 安全桥 window.kioskBridge（退出 / 重启）
├── scripts/
│   └── build-electron.mjs  # esbuild 编译主进程/preload -> dist-electron/*.cjs
├── src/
│   ├── views/         # 8 个页面（见下）
│   ├── components/    # KioskStage(等比缩放) / StatusBar / DecoCorners / PinPad / LangSwitch
│   ├── composables/   # useClock / useIdleTimeout
│   ├── mock/          # hardware.ts(硬件模拟) + data.ts(活动/设备假数据)
│   ├── store/         # session.ts(会话流程状态)
│   ├── locales/       # zh.ts / en.ts / index.ts
│   ├── router/        # hash 路由
│   └── styles/        # tokens.css(设计 token)
└── index.html
```

## 页面流程（去重后，中英双语）

| 路由 | 页面 | 说明 |
|---|---|---|
| `/standby` | 待机页 | 广告轮播 + 轻触唤醒 |
| `/login` | 选择登录方式 | 会员卡 / 二维码 / NFC；**左下角连击 5 次 → 员工入口** |
| `/pin` | 会员 PIN | 4 位键盘，含密码错误 / 账户锁定弹窗 |
| `/campaign` | 选取活动 | 自适应 0 / 1 / 多个（可滚动）；内含兑换数量弹窗 |
| `/printing` | 打印流程 | 打印中 → 成功 / 中断 / 缺纸失败（四态合一） |
| `/admin/pin` | 管理员 PIN | 6 位密码（默认 `123456`） |
| `/admin/device` | 设备状态总览 | 网络/纸张/读卡器/扫码 + 测试打印/换纸/重启/解锁弹窗 |
| `/lock` | 异常锁屏 | 打印机异常全屏锁定，无出口 |

Mock PIN：会员 `8888`，管理员 `123456`（见 `src/mock/data.ts`）。
演示打印故障：设置 `session.injectFault = 'interrupt' | 'fail'` 可触发中断/缺纸页。

## 页面预览导航（开发用）

访问 `/#/preview` 可一键直达所有页面与状态，无需手动走流程。
各页面也支持 query 参数直接进入指定状态：

| 路由 | 状态 |
|---|---|
| `/#/login?hint=1` | 显示隐藏员工入口手势标注 |
| `/#/pin?state=error` / `?state=locked` | 密码错误 / 账户锁定 |
| `/#/campaign?count=0\|1\|3\|4` | 活动数量：空 / 1 个 / 3 个 / 多个滚动 |
| `/#/printing?fault=interrupt` / `?fault=fail` / `?total=n` | 打印中断 / 缺纸失败 / 指定张数 |
| `/#/admin/device?modal=testSuccess\|testFail\|changePaper\|restart\|unlockSuccess` | 各操作弹窗 |
| `/#/lock` / `/#/lock?over=login` | 独立异常锁屏 / 覆盖在登录页上的锁屏 |

## 开发与运行

```bash
npm install

# 1) 纯浏览器预览 UI（Mac/任意平台，最快）
npm run dev              # 打开 http://localhost:5199

# 2) Electron 桌面模式（dev 下关闭 kiosk 以便调试）
npm run electron:dev

# 3) 构建
npm run build           # 渲染层 + 主进程(dist-electron/*.cjs)
npm run electron:build  # 打包 Windows 安装包（需在目标环境执行 electron-builder）

npm run typecheck       # vue-tsc 类型检查
```

## Kiosk 锁定（应用层）

`electron/main.ts` 中：

- `fullscreen + kiosk`（生产强制）、`frame:false`、`minimizable:false`、`closable:false`、`resizable:false`
- 生产 `alwaysOnTop('screen-saver')` 置顶
- `close` 事件拦截、`window-all-closed` 重建窗口，非正规通道无法关闭
- `globalShortcut` 屏蔽 Alt+F4 / Ctrl+W/Q/R / F11 / Win 键 / F12 等
- 正规退出：管理员 PIN → `window.kioskBridge.requestExit()`

> **注意**：`Ctrl+Alt+Del`、任务管理器、Win 锁屏由 Windows 系统接管，
> 应用层无法拦截。若需彻底锁死，需在系统层配合
> **Assigned Access / Shell Launcher + 组策略**（本轮范围外）。

## 接入真实硬件（后续）

替换 `src/mock/hardware.ts` 的实现（保持函数签名不变），
或通过 `electron/preload.ts` 暴露主进程的 `serialport` / 热敏打印 API。
