import { resolve as pathResolve } from 'path';
import resolve from '@rollup/plugin-node-resolve';
import base from './rollup.config.base';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

const bangumi = {
  input: pathResolve(__dirname, '../src/content/bangumi.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/bangumi.js'),
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      exclude: ['./dist', './src/**/*.test.ts'],
    }),
  ],
};
const bg = {
  input: pathResolve(__dirname, '../src/bg/index.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/background.js'),
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      exclude: ['./dist', './src/**/*.test.ts'],
    }),
  ],
};
const popup = {
  input: pathResolve(__dirname, '../src/bg/popup.ts'),
  output: {
    file: pathResolve(__dirname, '../extension/dist/popup.js'),
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      exclude: ['./dist', './src/**/*.test.ts'],
    }),
  ],
};
const config = [
  {
    input: pathResolve(__dirname, '../src/content/index.ts'),
    output: {
      file: pathResolve(__dirname, '../extension/dist/content.js'),
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        exclude: ['./dist', './src/**/*.test.ts'],
      }),
    ],
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
