import { defineStore } from 'pinia'
import type { MemberInfo } from '@/mock/hardware'
import type { Campaign } from '@/mock/data'

export type Lang = 'zh' | 'en'

interface SessionState {
  lang: Lang
  member: MemberInfo | null
  selectedCampaign: Campaign | null
  quantity: number
  /** 打印时可注入的模拟故障，便于演示各结果页 */
  injectFault: 'interrupt' | 'fail' | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    lang: 'zh',
    member: null,
    selectedCampaign: null,
    quantity: 1,
    injectFault: null
  }),
  actions: {
    setLang(lang: Lang) {
      this.lang = lang
    },
    login(member: MemberInfo) {
      this.member = member
    },
    selectCampaign(c: Campaign) {
      this.selectedCampaign = c
    },
    setQuantity(n: number) {
      this.quantity = Math.max(1, n)
    },
    /** 会员会话结束：清空敏感数据，回到待机/登录 */
    reset() {
      this.member = null
      this.selectedCampaign = null
      this.quantity = 1
      this.injectFault = null
    }
  }
})
