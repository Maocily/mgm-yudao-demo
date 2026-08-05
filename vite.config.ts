import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 渲染层配置。Electron 主进程 / preload 由 scripts/build-electron.mjs (esbuild) 单独编译，
// 避免 vite-plugin-electron 在 ESM 项目下的 CJS 解析冲突。
export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [vue()],
  // 生产用相对路径，便于 Electron loadFile 加载本地资源
  base: command === 'build' ? './' : '/',
  server: {
    port: 5199,
    strictPort: true
  }
}))
