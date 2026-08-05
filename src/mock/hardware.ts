/**
 * Mock 硬件层 —— 本轮以假数据模拟 读卡器 / 扫码 / NFC / 打印机。
 * 后续接真实硬件时，只需替换此文件的实现（保持接口不变），
 * 或改为通过 preload 暴露的 kioskBridge 调用主进程串口/打印 API。
 */

export interface MemberInfo {
  memberId: string
  name: string
  cardNo: string
}

/** 模拟异步延迟 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 模拟：读卡器刷卡，返回会员信息 */
export async function mockReadCard(): Promise<MemberInfo> {
  await delay(1500)
  return { memberId: 'M888168', name: '尊贵会员', cardNo: '**** **** **** 6688' }
}

/** 模拟：扫码登录 */
export async function mockScanQr(): Promise<MemberInfo> {
  await delay(1800)
  return { memberId: 'M520999', name: 'MGM Member', cardNo: 'QR-LOGIN' }
}

/** 模拟：NFC 感应登录 */
export async function mockNfc(): Promise<MemberInfo> {
  await delay(1600)
  return { memberId: 'M300777', name: 'NFC 会员', cardNo: 'NFC-TAP' }
}

export type PrintPhase = 'printing' | 'success' | 'interrupted' | 'failed'

export interface PrintUpdate {
  phase: PrintPhase
  current: number
  total: number
}

export interface PrintOptions {
  total: number
  /** 注入的模拟故障：'interrupt' 中途中断 | 'fail' 直接失败(缺纸) */
  fault?: 'interrupt' | 'fail' | null
}

/**
 * 模拟：逐张打印票券，通过回调上报进度。
 * 返回一个取消函数。
 */
export function mockPrint(opts: PrintOptions, onUpdate: (u: PrintUpdate) => void): () => void {
  const { total, fault = null } = opts
  let current = 0
  let cancelled = false

  const run = async () => {
    // 缺纸：直接失败
    if (fault === 'fail') {
      await delay(800)
      if (!cancelled) onUpdate({ phase: 'failed', current: 0, total })
      return
    }

    while (current < total) {
      await delay(1200)
      if (cancelled) return
      current++
      // 中断故障：打印到一半出错
      if (fault === 'interrupt' && current >= Math.ceil(total / 2)) {
        onUpdate({ phase: 'interrupted', current, total })
        return
      }
      onUpdate({ phase: 'printing', current, total })
    }
    if (!cancelled) onUpdate({ phase: 'success', current: total, total })
  }

  run()
  return () => {
    cancelled = true
  }
}

/** 模拟：测试打印，返回是否成功 */
export async function mockTestPrint(shouldFail = false): Promise<boolean> {
  await delay(1500)
  return !shouldFail
}
