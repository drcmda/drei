import path from 'path'
import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import glslify from 'rollup-plugin-glslify'
import multiInput from 'rollup-plugin-multi-input'
import terser from '@rollup/plugin-terser'

const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']

const getBabelOptions = ({ useESModules }, targets = '> 1%, not dead, not ie 11, not op_mini all') => ({
  babelrc: false,
  extensions,
  exclude: '**/node_modules/**',
  babelHelpers: 'runtime',
  presets: [
    [
      '@babel/preset-env',
      {
        include: [
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-optional-chaining',
          '@babel/plugin-transform-nullish-coalescing-operator',
          '@babel/plugin-transform-numeric-separator',
          '@babel/plugin-transform-logical-assignment-operators',
        ],
        bugfixes: true,
        loose: true,
        modules: false,
        targets,
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-nullish-coalescing-operator',
    ['@babel/plugin-transform-runtime', { regenerator: false, useESModules }],
  ],
})

export default [
  {
    input: ['src/**/*.ts', 'src/**/*.tsx', '!src/index.ts'],
    output: { dir: `dist`, format: 'esm' },
    external,
    plugins: [
      multiInput(),
      json(),
      glslify(),
      babel(getBabelOptions({ useESModules: true }, '>1%, not dead, not ie 11, not op_mini all')),
      nodeResolve({ extensions }),
    ],
  },
  {
    input: `./src/index.ts`,
    output: { dir: `dist`, format: 'esm', preserveModules: true },
    external,
    plugins: [
      json(),
      glslify(),
      babel(getBabelOptions({ useESModules: true }, '>1%, not dead, not ie 11, not op_mini all')),
      nodeResolve({ extensions }),
    ],
  },
  {
    input: ['src/**/*.ts', 'src/**/*.tsx', '!src/index.ts'],
    output: { dir: `dist`, format: 'cjs' },
    external,
    plugins: [
      multiInput({
        transformOutputPath: (output) => output.replace(/\.[^/.]+$/, '.cjs.js'),
      }),
      json(),
      glslify(),
      babel(getBabelOptions({ useESModules: false })),
      nodeResolve({ extensions }),
      terser(),
    ],
  },
  {
    input: `./src/index.ts`,
    output: { file: `dist/index.cjs.js`, format: 'cjs' },
    external,
    plugins: [
      json(),
      glslify(),
      babel(getBabelOptions({ useESModules: false })),
      nodeResolve({ extensions }),
      terser(),
    ],
  },
]
