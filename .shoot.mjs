// Drive the kiosk-terminal Vite dev server and capture screenshots of every key state.
// Note: use in-page hash navigation to avoid full reload losing query string.
import { chromium } from 'playwright'
import * as fs from 'node:fs'
import * as path from 'node:path'

const SHOT_DIR = path.resolve('.run-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const BASE = 'http://localhost:5199'

const STATES = [
  { name: '01-standby', path: '/standby' },
  { name: '02-login', path: '/login' },
  { name: '03-login-staff-hint', path: '/login?hint=1' },
  { name: '04-pin', path: '/pin' },
  { name: '05-pin-error', path: '/pin?state=error' },
  { name: '06-pin-locked', path: '/pin?state=locked' },
  { name: '07-campaign-empty', path: '/campaign?count=0' },
  { name: '08-campaign-one', path: '/campaign?count=1' },
  { name: '09-campaign-three', path: '/campaign?count=3' },
  { name: '10-campaign-scroll', path: '/campaign?count=4' },
  { name: '11-printing-success', path: '/printing?total=3' },
  { name: '12-printing-interrupt', path: '/printing?fault=interrupt&total=3' },
  { name: '13-printing-fail', path: '/printing?fault=fail&total=3' },
  { name: '14-device', path: '/admin/device' },
  { name: '15-device-change-paper', path: '/admin/device?modal=changePaper' },
  { name: '16-device-restart', path: '/admin/device?modal=restart' },
  { name: '17-lock', path: '/lock' }
]

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1820 } })
  const page = await ctx.newPage()

  // 第一次 goto 完整加载
  await page.goto(`${BASE}/#/standby`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  for (const s of STATES) {
    try {
      // 关键：原地改 hash 走 vue-router，不触发整页刷新
      await page.evaluate(p => { window.location.hash = p }, s.path)
      await page.waitForTimeout(1200) // settle
      const f = path.join(SHOT_DIR, `${s.name}.png`)
      await page.screenshot({ path: f, fullPage: false })
      console.log(`OK  ${s.name}  ${f}`)
    } catch (e) {
      console.log(`FAIL ${s.name}: ${e.message}`)
    }
  }

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
