import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import {
  nodeResolvePluginOptions,
  sharedOutput,
  typescriptPluginOptions,
} from './rollup.config.base.mjs';

const require = createRequire(import.meta.url);
const { name, version } = require('../package.json');

const outputName = name.replace(/-|\d+/g, '_').toLowerCase();

async function renderScriptHeader() {
  const header = new URL(`../src/header/${outputName}.js`, import.meta.url);
  const source = await fs.promises.readFile(header, 'utf8');
  return source.replace(/@version(\s+)([\.\d]+)/, `@version$1${version}`);
}
export default {
  input: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  output: {
    ...sharedOutput,
    format: 'iife',
    banner: renderScriptHeader,
    file: fileURLToPath(new URL(`../dist/${outputName}.user.js`, import.meta.url)),
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __ENV_EXT__: '__ENV_GM__',
      },
    }),
    nodeResolve(nodeResolvePluginOptions),
    typescript(typescriptPluginOptions),
    commonjs(),
  ],
};
