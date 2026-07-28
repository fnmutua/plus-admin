import { resolve } from 'path'
import { loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import VueJsx from '@vitejs/plugin-vue-jsx'
import EslintPlugin from 'vite-plugin-eslint'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import { createStyleImportPlugin, ElementPlusResolve } from 'vite-plugin-style-import'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import PurgeIcons from 'vite-plugin-purge-icons'
import { viteMockServe } from 'vite-plugin-mock'
import { createHtmlPlugin } from 'vite-plugin-html'
import VueMarcos from 'unplugin-vue-macros/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
const root = process.cwd()

function pathResolve(dir: string) {
  return resolve(root, '.', dir)
}

export default ({ command, mode }: ConfigEnv): UserConfig => {
  const isBuild = command === 'build'
  // Loads `.env`, `.env.local`, then `.env.[mode]` / `.env.[mode].local` (mode is
  // `development` for dev, `production` for build). Keep shared vars in `.env` only.
  const env = loadEnv(mode, root) as Record<string, string>
  // VITE_APP_HOST is the public frontend origin (share links, emails). The dev proxy
  // must target the Node API on PORT, not the Vite dev server.
  const apiProxyTarget =
    env.VITE_DEV_API_TARGET ||
    `http://localhost:${env.PORT || env.VUE_APP_PORT || '80'}`

  const plugins = [
      Vue(),
      VueJsx(),
      WindiCSS(),
      ...(isBuild
        ? []
        : [
            nodePolyfills({
              include: ['buffer', 'process', 'stream', 'util', 'path'],
              globals: {
                Buffer: true,
                global: true,
                process: true
              },
              protocolImports: true
            })
          ]),
      ...(isBuild
        ? []
        : [
            createStyleImportPlugin({
              resolves: [ElementPlusResolve()],
              libs: [{
                libraryName: 'element-plus',
                esModule: true,
                resolveStyle: (name) => {
                  return `element-plus/es/components/${name.substring(3)}/style/css`
                }
              }]
            })
          ]),
      ...(isBuild
        ? []
        : [
            EslintPlugin({
              cache: false,
              include: ['src/**/*.vue', 'src/**/*.ts', 'src/**/*.tsx']
            })
          ]),
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve('src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: !isBuild
      }),
      ...(isBuild
        ? []
        : [
            PurgeIcons({
              content: [
                'src/**/*.{vue,js,ts,jsx,tsx}',
                'index.html'
              ],
              exclude: [
                'node_modules/**',
                'dist/**',
                'build/**',
                '**/pgdata/**',
                '**/data/**',
                'tools/**',
                'server/**'
              ]
            })
          ]),
      ...(isBuild
        ? []
        : [
            viteMockServe({
              ignore: /^\_/,
              mockPath: 'mock',
              localEnabled: true,
              prodEnabled: false,
              injectCode: `
          import { setupProdMockServer } from '../mock/_createProductionServer'

          setupProdMockServer()
          `
            })
          ]),
      ...(isBuild
        ? []
        : [
            VueMarcos({
              setupComponent: {
                exclude: [/\/src\/locales\//]
              }
            })
          ]),
      createHtmlPlugin({
        pages: [
          {
            entry: '/src/main.ts',
            filename: 'index.html',
            template: 'index.html',
            injectOptions: {
              data: {
                title: env.VITE_APP_TITLE,
                injectScript: `<script src="./inject.js"></script>`,
              },
            },
          },
          {
            entry: '/src/main.ts',
            filename: 'landing.html',
            template: 'landing.html',
          },
        ],
      })
    ]

  return {
    base: env.VITE_BASE_PATH,
    plugins,

    css: {
      preprocessorOptions: {
        less: {
          additionalData: '@import "./src/styles/variables.module.less";',
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      // Ensure echarts/core is always the same instance (source code & vue-echarts)
      dedupe: ['echarts', 'echarts/core', 'vue-demi', 'vue'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.less', '.css'],
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js'
        },
        {
          find: '@/',
          replacement: `${pathResolve('src')}/`
        }
      ]
    },
    build: {
      // Avoid preloading admin-only chunks (echarts/turf) on public landing visits.
      modulePreload: false,
      // esbuild uses far less RAM than terser on large apps (important for server builds)
      minify: 'esbuild',
      outDir: env.VITE_OUT_DIR || 'dist',
      sourcemap: false,
      reportCompressedSize: false,
      target: 'es2015',
      esbuild: {
        drop: ['console', 'debugger']
      },
      rollupOptions: {
        maxParallelFileOps: 1,
        output: {
          manualChunks(id) {
            if (id.includes('shared/publicPaths')) return 'public-paths'
            if (!id.includes('node_modules')) return
            if (id.includes('node_modules/element-plus')) return 'element-plus'
            // Keep vue-echarts with echarts so public landing never pulls chart code via vue-vendor.
            if (id.includes('node_modules/vue-echarts')) return 'echarts'
            if (id.includes('node_modules/vue-demi')) return 'vue-vendor'
            if (id.includes('node_modules/echarts')) return 'echarts'
            if (id.includes('mapbox') || id.includes('@mapbox')) return 'mapbox'
            if (id.includes('@turf')) return 'turf'
            if (id.includes('langchain') || id.includes('@langchain')) return 'langchain'
            if (id.includes('lodash')) return 'lodash'
            if (id.includes('@vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
          }
        }
      },

    }, 
    server: {
      host: false,
       port : 4000, //Dev
    //  port : 80,   // Production
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        },
        '/imagery': {
          target: 'https://kesmis.go.ke',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/imagery/, '')
        },
        '/geoserver': {
          target: 'https://kesmis.go.ke',
          changeOrigin: true,
          secure: true,
        },

      },
      hmr: {
        overlay: false
      },
 
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'vue-types',
        'element-plus/es/locale/lang/zh-cn',
        'element-plus/es/locale/lang/en',
        '@iconify/iconify',
        '@vueuse/core',
        'axios',
        'qs',
        'echarts',
        'echarts/core',
        'echarts/renderers',
        'echarts/charts',
        'echarts/components',
        'echarts-wordcloud',
        'vue-echarts',
        'intro.js',
        'qrcode',
        '@wangeditor/editor',
        '@wangeditor/editor-for-vue'
      ]
    }
  }
}
