// 将 electron 主进程 / preload 从 TS 编译为 CJS(.cjs) 到 dist-electron/
// 输出 .cjs 后缀，使 Node 始终按 CommonJS 处理，不受根 package.json "type":"module" 影响。
// esbuild 随 vite 一起安装，可直接使用。
import { build } from 'esbuild'

const common = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['electron'],
  outdir: 'dist-electron',
  outExtension: { '.js': '.cjs' }
}

await build({ ...common, entryPoints: ['electron/main.ts'] })
await build({ ...common, entryPoints: ['electron/preload.ts'] })

console.log('[build-electron] main.cjs & preload.cjs compiled -> dist-electron/')
