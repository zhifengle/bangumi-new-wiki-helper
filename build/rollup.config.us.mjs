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

function addScriptHeader(name) {
  return {
    name: 'add_script_header',
    async intro() {
      const header = fileURLToPath(new URL(`../src/header/${name}.js`, import.meta.url));
      const headerStr = (await fs.promises.readFile(header)).toString();
      return headerStr.replace(
        /@version(\s+)([\.\d]+)/,
        `@version$1${version}`
      );
    },
  };
}
export default {
  input: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  output: {
    ...sharedOutput,
    name: outputName,
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
    addScriptHeader(outputName),
  ],
};
