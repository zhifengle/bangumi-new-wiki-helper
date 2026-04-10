import { fileURLToPath } from 'node:url';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import {
  nodeResolvePluginOptions,
  sharedOutput,
  typescriptPluginOptions,
} from './rollup.config.base.mjs';

const entries = [
  {
    input: '../src/content/bangumi.ts',
    output: '../extension/dist/bangumi.js',
  },
  {
    input: '../src/bg/index.ts',
    output: '../extension/dist/background.js',
  },
  {
    input: '../src/bg/popup.ts',
    output: '../extension/dist/popup.js',
  },
  {
    input: '../src/content/index.ts',
    output: '../extension/dist/content.js',
  },
];

export default entries.map(({ input, output }) => ({
  input: fileURLToPath(new URL(input, import.meta.url)),
  output: {
    ...sharedOutput,
    file: fileURLToPath(new URL(output, import.meta.url)),
  },
  plugins: [
    nodeResolve(nodeResolvePluginOptions),
    typescript(typescriptPluginOptions),
    commonjs(),
  ],
}));
