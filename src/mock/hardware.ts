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
  await delay(10)
  return { memberId: 'M888168', name: '尊贵会员', cardNo: '**** **** **** 6688' }
}

/** 模拟：扫码登录 */
export async function mockScanQr(): Promise<MemberInfo> {
  await delay(10)
  return { memberId: 'M520999', name: 'MGM Member', cardNo: 'QR-LOGIN' }
}

/** 模拟：NFC 感应登录 */
export async function mockNfc(): Promise<MemberInfo> {
  await delay(10)
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

// ============================================================================
// 真实打印机集成（走 Electron kioskBridge IPC → webContents.print）
// ============================================================================

/** 票面所需的元数据（从 session / 活动 / 当前时间拼出来） */
export interface TicketPayload {
  /** 活动名称（已按 locale 选好 zh/en） */
  campaignName: string
  /** 活动副标题/描述 */
  campaignDesc?: string
  /** 会员姓名 */
  memberName: string
  /** 会员卡号 */
  memberCard: string
  /** 票号(1..total) */
  ticketNo: number
  /** 总数 */
  total: number
  /** 票券唯一编号(用于验票) */
  ticketCode: string
  /** 领取时间 */
  issuedAt: string
  /** 打印机名（可选,默认走系统默认） */
  deviceName?: string
}

export interface PrintRealOptions {
  total: number
  payload: Omit<TicketPayload, 'ticketNo' | 'total' | 'ticketCode' | 'issuedAt'>
  deviceName?: string
}

/**
 * 真实打印:逐张调 kioskBridge.printTicket,每张成功后上报一次 printing。
 * 任一张失败立即返回 failed,已印的张数记在 current。
 */
export function printReal(
  opts: PrintRealOptions,
  onUpdate: (u: PrintUpdate) => void
): () => void {
  const { total, payload, deviceName } = opts
  let cancelled = false
  let current = 0

  const issuedAt = new Date().toLocaleString('zh-CN', { hour12: false })

  const run = async () => {
    // 防御:没装 kioskBridge(纯 web 开发场景)
    if (!window.kioskBridge?.printTicket) {
      onUpdate({ phase: 'failed', current: 0, total })
      return
    }

    while (current < total) {
      if (cancelled) return
      const no = current + 1
      const code = `${payload.memberCard}-${Date.now()}-${no}`
      const html = renderTicketHtml({
        ...payload,
        ticketNo: no,
        total,
        ticketCode: code,
        issuedAt
      })

      try {
        const res = await window.kioskBridge.printTicket(html, deviceName)
        if (cancelled) return
        if (!res.ok) {
          onUpdate({ phase: 'failed', current, total })
          return
        }
        current = no
        onUpdate({ phase: 'printing', current, total })
      } catch (e) {
        if (cancelled) return
        onUpdate({ phase: 'failed', current, total })
        return
      }
    }
    if (!cancelled) onUpdate({ phase: 'success', current: total, total })
  }

  run()
  return () => {
    cancelled = true
  }
}

/** 票面 HTML 模板：单张 A4,金色主题,跟 kiosk 设计 token 对齐 */
function renderTicketHtml(p: TicketPayload): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(p.campaignName)} - 票券</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
    color: #2a2118;
    background: #fbf8f1;
    width: 210mm;
    height: 297mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ticket {
    width: 160mm;
    padding: 18mm 16mm;
    background: linear-gradient(180deg, #fff8ea 0%, #ffffff 45%);
    border: 2px solid #e8d6a3;
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(26, 17, 8, 0.15);
  }
  .brand {
    text-align: center;
    color: #8a650f;
    font-size: 14pt;
    letter-spacing: 6px;
    margin-bottom: 8mm;
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10mm;
  }
  .divider .line { flex: 1; height: 1.5px; background: #c9a24d; opacity: 0.6; }
  .divider .dot { width: 10px; height: 10px; border-radius: 50%; background: #c9a24d; }
  .name {
    font-size: 28pt;
    font-weight: 700;
    text-align: center;
    line-height: 1.3;
    color: #2a2118;
  }
  .desc {
    font-size: 13pt;
    color: #7a6546;
    text-align: center;
    margin-top: 4mm;
    line-height: 1.5;
  }
  .rows {
    margin: 10mm 0 8mm;
    padding: 6mm 8mm;
    background: #ffffff;
    border: 1.5px solid #d8c28a;
    border-radius: 12px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 3mm 0;
    font-size: 13pt;
    border-bottom: 1px solid #efe5cf;
  }
  .row:last-child { border-bottom: none; }
  .row .label { color: #7a6546; }
  .row .value { color: #2a2118; font-weight: 600; }
  .footer {
    text-align: center;
    color: #9e8f76;
    font-size: 10pt;
    line-height: 1.6;
    margin-top: 8mm;
  }
  .no {
    display: inline-block;
    margin-top: 4mm;
    padding: 4mm 8mm;
    background: #c9a24d;
    color: #fff;
    border-radius: 999px;
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 2px;
  }
</style>
</head>
<body>
  <div class="ticket">
    <div class="brand">MGM · MEMBER TICKET</div>
    <div class="divider"><span class="line"></span><span class="dot"></span><span class="line"></span></div>
    <div class="name">${escapeHtml(p.campaignName)}</div>
    ${p.campaignDesc ? `<div class="desc">${escapeHtml(p.campaignDesc)}</div>` : ''}
    <div class="rows">
      <div class="row"><span class="label">会员姓名</span><span class="value">${escapeHtml(p.memberName)}</span></div>
      <div class="row"><span class="label">会员卡号</span><span class="value">${escapeHtml(p.memberCard)}</span></div>
      <div class="row"><span class="label">领取时间</span><span class="value">${escapeHtml(p.issuedAt)}</span></div>
      <div class="row"><span class="label">票券编号</span><span class="value">${escapeHtml(p.ticketCode)}</span></div>
    </div>
    <div style="text-align:center">
      <span class="no">第 ${p.ticketNo} / ${p.total} 张</span>
    </div>
    <div class="footer">
      本票券仅限本人使用,请于入场时出示<br/>
      票券一经打印无法修改或重新发行
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
