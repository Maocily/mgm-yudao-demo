<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LangSwitch from '@/components/LangSwitch.vue'
import { useSessionStore } from '@/store/session'
import { mockCampaigns } from '@/mock/data'

const router = useRouter()
const { locale } = useI18n()
const session = useSessionStore()

// 预览：直接进某页/某状态。部分页面依赖会话数据，这里先填好 mock 会话。
function go(path: string) {
  session.login({ memberId: 'M888168', name: locale.value === 'zh' ? '尊贵会员' : 'VIP Member', cardNo: '**** 6688' })
  session.selectCampaign(mockCampaigns[0])
  session.setQuantity(3)
  router.push(path)
}

const groups = [
  {
    title: '会员流程',
    items: [
      { label: '00 待机页', path: '/standby' },
      { label: '01 选择登录方式', path: '/login' },
      { label: '01 · 员工入口手势', path: '/login?hint=1' },
      { label: '02 会员 PIN', path: '/pin' },
      { label: '02 PIN · 密码错误', path: '/pin?state=error' },
      { label: '02 PIN · 账户锁定', path: '/pin?state=locked' }
    ]
  },
  {
    title: '选活动 / 兑换',
    items: [
      { label: '03 选活动 · 空（0 个）', path: '/campaign?count=0' },
      { label: '03 选活动 · 1 个', path: '/campaign?count=1' },
      { label: '03 选活动 · 3 个', path: '/campaign?count=3' },
      { label: '03 选活动 · 多个滚动（4+）', path: '/campaign?count=4' }
    ]
  },
  {
    title: '打印结果',
    items: [
      { label: '05 打印中 → 成功', path: '/printing?total=3' },
      { label: '05 打印中断', path: '/printing?fault=interrupt&total=3' },
      { label: '07 打印失败 · 缺纸', path: '/printing?fault=fail&total=3' }
    ]
  },
  {
    title: '管理员 / 设备',
    items: [
      { label: '01 登录页 · 员工入口 (连击 5 次)', path: '/login?hint=1' },
      { label: '03 设备状态总览', path: '/admin/device' },
      { label: '设备 · 测试成功', path: '/admin/device?modal=testSuccess' },
      { label: '设备 · 测试失败', path: '/admin/device?modal=testFail' },
      { label: '设备 · 更换打印纸 (输入数量)', path: '/admin/device?modal=changePaper' },
      { label: '设备 · 重启确认', path: '/admin/device?modal=restart' },
      { label: '设备 · 解锁成功', path: '/admin/device?modal=unlockSuccess' }
    ]
  },
  {
    title: '锁屏',
    items: [
      { label: '打印机异常锁屏', path: '/lock' },
      { label: '登录页 · 锁屏覆盖', path: '/lock?over=login' }
    ]
  }
]
</script>

<template>
  <div class="preview">
    <div class="head">
      <div>
        <div class="title">MGM Kiosk · 页面预览</div>
        <div class="sub">开发预览导航 · 点击任意项直达对应页面/状态</div>
      </div>
      <LangSwitch />
    </div>

    <div class="groups">
      <div v-for="g in groups" :key="g.title" class="group">
        <div class="group-title">{{ g.title }}</div>
        <div class="items">
          <button v-for="it in g.items" :key="it.path" class="item" @click="go(it.path)">
            {{ it.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  width: 1080px;
  min-height: 1820px;
  background: var(--cream);
  padding: 60px 64px;
  overflow-y: auto;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 48px;
}
.title {
  font-size: 48px;
  font-weight: 700;
  color: var(--ink);
}
.sub {
  font-size: 24px;
  color: var(--ink-soft);
  margin-top: 12px;
}
.group {
  margin-bottom: 44px;
}
.group-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-deep);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--cream-2);
}
.items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.item {
  padding: 28px 32px;
  background: var(--white);
  border: 1.5px solid var(--cream-2);
  border-radius: var(--r-md);
  font-size: 26px;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  font-family: var(--font-cn);
  transition: transform 0.08s;
}
.item:active {
  transform: scale(0.98);
  background: var(--cream-3);
}
</style>
