import fsPromises from 'fs/promises';
import { resolve as pathResolve } from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
// import { terser } from 'rollup-plugin-terser';
import base from './rollup.config.base';
import { name, version } from '../package.json';

const outputName = name.replace(/-|\d+/g, '_').toLowerCase();

function addScriptHeader(name) {
  return {
    name: 'add_script_header',
    async intro() {
      const header = pathResolve(__dirname, `../src/header/${name}.js`);
      const headerStr = (await fsPromises.readFile(header)).toString();
      return headerStr.replace(
        /@version(\s+)([\.\d]+)/,
        `@version$1${version}`
      );
    },
  };
}
export default {
  input: pathResolve(__dirname, '../src/index.ts'),
  output: {
    name: outputName,
    file: pathResolve(__dirname, `../dist/${outputName}.user.js`),
    // format: 'iife',
    // sourcemap: true
  },
  plugins: [
    replace({ __ENV_EXT__: '__ENV_GM__' }),
    ...base.plugins,
    resolve(),
    commonjs(),
    addScriptHeader(outputName),
  ],
};
