import { resolve as pathResolve } from 'path';
import resolve from '@rollup/plugin-node-resolve';
import base from './rollup.config.base';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

function createPlugins() {
  return [
    resolve({
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
    }),
    typescript({
      exclude: ['./dist', './src/**/*.test.ts'],
      tsconfigOverride: {
        compilerOptions: {
          target: 'ES2019',
        },
      },
    }),
    commonjs(),
  ];
}

const bangumi = {
  input: pathResolve(__dirname, '../src/content/bangumi.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/bangumi.js'),
  },
  plugins: createPlugins(),
};
const bg = {
  input: pathResolve(__dirname, '../src/bg/index.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/background.js'),
  },
  plugins: createPlugins(),
};
const popup = {
  input: pathResolve(__dirname, '../src/bg/popup.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/popup.js'),
  },
  plugins: createPlugins(),
};
const config = [
  {
    input: pathResolve(__dirname, '../src/content/index.ts'),
    output: {
      file: pathResolve(__dirname, '../extension/dist/content.js'),
    },
    plugins: createPlugins(),
  },
];

export default [
  {
    ...base,
    ...bangumi,
  },
  {
    ...base,
    ...bg,
  },
  {
    ...base,
    ...popup,
  },
  ...config.map((obj) => ({ ...base, ...obj })),
];
