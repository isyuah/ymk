  import type { ForgeConfig } from '@electron-forge/shared-types';

  export default {
    packagerConfig: {
      appBundleId: "top.isyuah.dev",
      name: 'Yumuzk',
      executableName: 'Yumuzk',
      icon: "./logo",
      ignore: (filePath) => {
        const normalized = String(filePath).replace(/\\/g, '/');
        if (normalized.includes('/node_modules/')) {
          // KuGouMusicApi 自带嵌套 pnpm node_modules（大量软链 + devDeps），
          // 其运行时依赖已被根 node_modules hoist，运行时可正确解析，
          if (normalized.includes('/KuGouMusicApi/node_modules/')) return true;
          if (normalized.includes('/node_modules/@yumuzk/')) return true;
          if (normalized.includes('/node_modules/.bin/')) return true;
          return false;
        }
        const ignorePatterns = [
          // VCS / 工具 / IDE / AI 缓存目录（绝不该打包）
          /^\/\.git(\/|$)/,
          /^\/\.github(\/|$)/,
          /^\/\.husky(\/|$)/,
          /^\/\.idea(\/|$)/,
          /^\/\.vscode(\/|$)/,
          /^\/\.trae(\/|$)/,
          /^\/\.zread(\/|$)/,
          /^\/\.claude(\/|$)/,
          /^\/\.pi(\/|$)/,

          // 源码 / 构建中间产物 / 文档 / 杂项目录
          /^\/src(\/|$)/,
          /^\/public(\/|$)/,
          /^\/out(\/|$)/,
          /^\/docs(\/|$)/,
          /^\/review(\/|$)/,
          /^\/tools(\/|$)/,
          /^\/ignoreFolder(\/|$)/,
          /^\/res(\/|$)/,
          /^\/plugins(\/|$)/,
          /^\/packages(\/|$)/,
          /^\/release(\/|$)/,

          // 配置 / 文档 / 锁文件等根文件
          /^\/\.gitignore$/,
          /^\/\.npmrc$/,
          /^\/\.hintrc$/,
          /^\/\.eslintignore$/,
          /^\/eslint\.config\.js$/,
          /^\/tsconfig\.app\.json$/,
          /^\/tsconfig\.node\.json$/,
          /^\/tsconfig\.json$/,
          /^\/README\.md$/,
          /^\/pnpm-lock\.yaml$/,
          /^\/env\.d\.ts$/,
          /^\/vite\.config\.ts$/,
          /^\/vite\.config\.ts\.timestamp-[^/]+\.mjs$/,
          /^\/index\.html$/,
          /^\/forge\.config\.(js|ts)$/,

          // 运行时只用 logo.png（托盘 / 任务栏），.ico 仅打包安装器用，不进 app
          /^\/logo\.ico$/,
        ];

        return ignorePatterns.some((re) => re.test(normalized));
      },
    },
    makers: [
      {
        name: '@electron-forge/maker-zip',
        config: {}
      },
      {
        name: '@electron-forge/maker-deb',
        platforms: ['linux'],
        config: {
          options: {
            categories: ['Audio'],
            description: 'Yumuzk Music Player',
            bin: "Yumuzk",
          }
        }
      }
    ],
    outDir: "release"
  } satisfies ForgeConfig;