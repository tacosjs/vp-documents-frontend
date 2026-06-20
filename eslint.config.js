//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config'
import perfectionistPlugin from 'eslint-plugin-perfectionist'
import perfectionistRules from './.eslintrc.perfectionist.js'

export default [
  ...tanstackConfig,
  {
    plugins: {
      perfectionist: perfectionistPlugin,
    },
    rules: {
      ...perfectionistRules,
      // Disable import/order - it conflicts with perfectionist/sort-imports (causes circular fixes)
      'import/order': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports', prefer: 'type-imports' },
      ],
    },
  },
  {
    ignores: [
      '**/convex/_generated/**',
      'src/generated/**',
      'src/routeTree.gen.ts',
      // Inlang Paraglide output only — list outdirs explicitly (avoid a broad paraglide glob).
      'src/paraglide/**',
      'apps/web/**',
      '.vite/**',
      'src/routes/__root.tsx',
      'src/routes/demo/**',
      '.output/**',
      'apps/web/.output/**',
      'eslint.config.js',
    ],
  },
]
