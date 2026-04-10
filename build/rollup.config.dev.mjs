import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import {
  nodeResolvePluginOptions,
  sharedOutput,
  typescriptPluginOptions,
} from './rollup.config.base.mjs';

const require = createRequire(import.meta.url);
const { name } = require('../package.json');

export default {
  input: fileURLToPath(new URL('../src/dev.ts', import.meta.url)),
  output: {
    ...sharedOutput,
    name: name.replace(/-/g, '_').toUpperCase(),
    file: fileURLToPath(new URL(`../dist/${name}.dev.js`, import.meta.url)),
  },
  plugins: [
    nodeResolve(nodeResolvePluginOptions),
    typescript(typescriptPluginOptions),
    commonjs(),
  ],
};
