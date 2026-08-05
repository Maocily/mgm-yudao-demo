/** Mock 业务数据 —— 活动 / 广告 / 设备信息 */

export interface Campaign {
  id: string
  nameCn: string
  nameEn: string
  descCn: string
  descEn: string
  image: string
  /** 单次最多兑换张数；0 表示已领完（设计稿 04 零） */
  maxQty: number
}

/** 活动列表
 *  - D.maxQty = 0 → 设计稿 04 零（已领完，不可参与）
 *  - 默认 1 张最多；C 设为 3 张以便演示 04 选择兑换数量（无遮罩）-3
 */
export const mockCampaigns: Campaign[] = [
  {
    id: 'A',
    nameCn: '活动名称A',
    nameEn: 'MGM Anniversary Bonus Draw',
    descCn: '周年庆抽奖，赢取豪华大礼',
    descEn: 'Anniversary lucky draw with premium prizes',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80',
    maxQty: 3
  },
  {
    id: 'B',
    nameCn: '活动名称B',
    nameEn: 'Asia Cup Poker Championship 2026',
    descCn: '亚洲杯扑克锦标赛入场券',
    descEn: 'Entry ticket to the Asia Cup Poker Championship',
    image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&q=80',
    maxQty: 2
  },
  {
    id: 'C',
    nameCn: '活动名称C',
    nameEn: 'Platinum Member Exclusive Rewards',
    descCn: '白金会员专属奖励',
    descEn: 'Exclusive rewards for platinum members',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80',
    maxQty: 3
  },
  {
    id: 'D',
    nameCn: '活动名称D',
    nameEn: 'Weekend Dining Voucher Lucky Draw',
    descCn: '周末餐饮礼券幸运抽奖',
    descEn: 'Weekend dining voucher lucky draw',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
    maxQty: 0
  }
]

/** 待机广告海报（可多张轮播） */
export const mockPosters: string[] = [
  'https://images.unsplash.com/photo-1774702669811-3c7707e91f0f?w=1080&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080&q=80'
]

/** 设备信息（对齐设备状态页） */
export const mockDevice = {
  deviceNo: 'KIOSK-MGM-001',
  ip: '10.0.4.127',
  latency: 8,
  uplink: '2.4 MB/s',
  uptimeHours: 36,
  paperRemain: 320,
  paperTotal: 600,
  /** 设计稿"更换打印纸"弹窗 — 纸张数量 1200 */
  paperRefill: 1200,
  version: 'v2.3.1 (build 20260612)',
  lastSync: '22:13:55',
  lastRestart: '2026-06-16 08:00:00'
}

/** 会员 PIN（Mock 校验用） */
export const MOCK_MEMBER_PIN = '8888'
/** 管理员 PIN（Mock 校验用；正规退出通道） */
export const MOCK_ADMIN_PIN = '123456'
