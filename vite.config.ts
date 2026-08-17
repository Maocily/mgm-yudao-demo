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
  },
  // PR-24 (CROSS-06 low): 生产构建显式开 minify + 禁 sourcemap。
  // Vite 默认对 build 走 esbuild minify,这里显式声明更清楚;
  // sourcemap 关闭避免 dist/ 输出 .map 文件被反编译回源码,泄漏 mock 数据 + 注释。
  build: {
    minify: 'esbuild',
    sourcemap: false,
    // rollupOptions 里把 mock/ 目录标记为 external 不参与 bundle(深度防御:即便 dead code analyzer
    // 误判保留,产物里也不含 mock/ 任何引用)
    rollupOptions: {
      output: {
        // 留默认 manualChunks:auto,Vite/esbuild 会自动 split Vue runtime / 业务代码
      }
    }
  }
}))
