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
          if (normalized.includes('/node_modules/@yumuzk/')) return true;
          return false;
        }
        const ignorePatterns = [
          // VCS / tooling directories (should never be shipped)
          /^\/\.git(\/|$)/,
          /^\/\.trae(\/|$)/,

          // Directories (mirrors release/clean.js)
          /^\/src(\/|$)/,
          /^\/public(\/|$)/,
          /^\/\.github(\/|$)/,
          /^\/\.idea(\/|$)/,
          /^\/\.vscode(\/|$)/,
          /^\/ignoreFolder(\/|$)/,
          /^\/res(\/|$)/,
          /^\/plugins(\/|$)/,
          /^\/packages(\/|$)/,

          // Root files (mirrors release/clean.js)
          /^\/\.gitignore$/,
          /^\/tsconfig\.app\.json$/,
          /^\/tsconfig\.node\.json$/,
          /^\/tsconfig\.json$/,
          /^\/README\.md$/,
          /^\/pnpm-lock\.yaml$/,
          /^\/env\.d\.ts$/,
          /^\/\.npmrc$/,
          /^\/\.hintrc$/,
          /^\/vite\.config\.ts$/,
          /^\/vite\.config\.ts\.timestamp-[^/]+\.mjs$/,
          /^\/index\.html$/,
          /^\/forge\.config\.js$/,

          // Optional assets removed by clean.js
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