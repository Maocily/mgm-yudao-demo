export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    close: '关闭',
    back: '返回',
    backHome: '返回首页',
    logout: '登出',
    exit: '退出',
    or: '或',
    seconds: '秒',
    tickets: '张',
    delete: '删除',
    save: '保存'
  },
  standby: {
    poster: '待机海报',
    touch: '轻触屏幕'
  },
  login: {
    welcome: '美高梅欢迎您!',
    title: '会员登入',
    subtitle: '请选择登入方式',
    // 设计稿统一短词：刷卡/扫码/感应
    card: '刷卡登入',
    cardHint: '请于右侧读卡器刷会员卡',
    qr: '扫码登入',
    qrHint: '请打开美高梅 APP 出示会员码进行扫码',
    nfc: '感应登入',
    nfcHint: '请打开美高梅 APP 并将手机靠近感应区',
    // 隐藏员工入口版用更短副标题
    cardShort: '刷卡登入',
    cardShortHint: '在读卡器中刷您的会员卡',
    qrShort: '扫码登入',
    qrShortHint: '出示 MGM APP 会员码',
    nfcShort: '感应登入',
    nfcShortHint: '将手机靠近感应区',
    langCn: '中文',
    langEn: 'EN',
    deviceTag: 'v2.3.1 · KIOSK-MGM-001',
    staffEntry: '工作人员入口',
    staffHotspotHint: '不可见按钮区域 · 连击 5 次进入工作人员登入',
    staffHotspotBadge: 'Tap × 5',
    staffGestureDesc: '连续点击左下角 5 次后显示 PIN 输入页'
  },
  pin: {
    memberTitle: '请输入会员密码（4位数字）',
    adminTitle: '请输入管理密码',
    // 错误：设计稿"密码错误 / 请重新输入。\n如连续3次输入错误，您的账户将会被锁上。"
    errorTitle: '密码错误',
    errorDesc: '请重新输入。',
    errorNote: '如连续3次输入错误，您的账户将会被锁上。',
    // 锁定：设计稿"账户已锁定 / 连续3次密码错误，\n请前往会籍柜台重设您的密码"
    lockedTitle: '账户已锁定',
    lockedDesc: '连续3次密码错误，',
    lockedDesc2: '请前往会籍柜台重设您的密码'
  },
  campaign: {
    greeting: '请选择活动',
    participate: '参与',
    empty: '当前暂无可参与的活动',
    skip: '登出',
    // 设计稿 1 个 / 3 个 / 多 场景
    seeMore: '查看更多',
    seeMoreHint: '向下滑动查看更多活动',
    outOfStock: '已领完',
    quantityStepper: '兑换数量',
    confirmRedeem: '确认兑换',
    // 选数量弹窗
    chooseQtyTitle: '选择兑换数量',
    chooseQtyHint: '最多可兑换 {n} 张',
    confirmNext: '确认'
  },
  redeem: {
    title: '请确认兑换的票券',
    campaignName: '活动名称',
    quantity: '兑换数量',
    unit: '张',
    // 设计稿"票券列印後后无法修改或重新发行，请确认后再列印。"
    warning: '票券列印后无法修改或重新发行，<br/>请确认后再列印。',
    cancel: '取消',
    print: '打印'
  },
  printing: {
    // 设计稿用"票劵"（劵）
    title: '票劵打印中',
    titleShort: '正在打印第 {cur}/{total} 张',
    progress: '正在为您打印第 {cur}/{total} 张票券，请稍候。',
    pleaseWait: '目前正在打印第 {n} 张，请勿离开',
    total: '共 {total} 张票劵，正在依次输出',
    // 设计稿"打印中断 / 打印出现异常，已成功打印 1/3 张票劵。\n请重新尝试或联络工作人员。"
    interruptedTitle: '打印中断',
    interruptedDesc: '打印出现异常，已成功打印 {cur}/{total} 张票劵。',
    interruptedHint: '请重新尝试或联络工作人员。',
    successTitle: '出票完成',
    successDesc: '请于下方出票口领取票劵',
    autoLogout: '{n} 秒后将自动注销',
    autoLogoutSuffix: '秒后将自动注销',
    selectOther: '选择其他活动',
    logout: '注销',
    failTitle: '打印机异常',
    failDesc: '当前会员账号已自动登出。设备已暂停服务，请联系工作人员协助'
  },
  device: {
    title: '设备状态总览',
    exit: '退出',
    statusSection: '设备状态',
    network: '有线网络已连接',
    online: 'ONLINE',
    ip: 'IP',
    latency: '延迟',
    uplink: '上行',
    uptime: '稳定运行',
    uptimeVal: '{h} 小时',
    paper: '票据用纸',
    paperEnough: '充足',
    paperRemain: '剩余约 {remain} 张 / {total} 张',
    cardReader: '读卡器',
    normal: '正常',
    cardReaderVal: 'USB-COM3 · 已连接',
    scanner: '扫码模组',
    scannerVal: '摄像头 · 工作中',
    infoSection: '系统信息',
    deviceNo: '设备编号',
    location: '位置',
    locationVal: '澳门美高梅 · 1F 大堂西侧',
    version: '软件版本',
    lastSync: '最近同步',
    lastSyncVal: '{time} · 后台服务正常',
    lastRestart: '最近重启',
    actionSection: '快捷操作',
    testPrint: '测试打印',
    changePaper: '更换打印纸',
    restart: '重启设备',
    idleCountdown: '自动注销倒计时 {time} · 闲置 45秒将自动退出',
    unlock: '解锁',
    testSuccessTitle: '测试打印成功',
    testSuccessDesc: '打印机工作正常，测试页已输出',
    // 设计稿"打印机未响应，请检查纸仓及连接"
    testFailTitle: '测试打印失败',
    testFailDesc: '打印机未响应，请检查纸仓及连接',
    // 更换打印纸：设计稿"纸张数量 1200 保存"
    changePaperTitle: '更换打印纸',
    changePaperField: '纸张数量',
    changePaperSave: '保存',
    restartConfirmTitle: '确认重启设备？',
    restartConfirmDesc: '重启期间设备将暂时无法使用，预计需要 2-3 分钟，确认继续？',
    restartCancel: '取消',
    restartConfirmBtn: '确认重启',
    unlockSuccessTitle: '解锁成功',
    unlockSuccessDesc: '设备已成功解锁，可以进行操作',
    unlockExit: '退出并返回首页'
  },
  lock: {
    title: '打印机异常',
    lockedTitle: '设备已锁定',
    subtitle: '系统已自动锁定',
    desc1: '打印机检测到异常状态，为确保业务安全，系统已自动锁屏。',
    desc2: '整个页面及系统已被锁定，不可进行任何操作。',
    desc3: '请联系工作人员处理打印机故障。',
    hotline: '技术支持热线',
    hotlineNo: '400-XXX-XXXX'
  }
}
