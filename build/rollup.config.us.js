import { name } from '../package.json'
import { resolve as pathResolve } from 'path'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
// import { terser } from 'rollup-plugin-terser';
import multi from '@rollup/plugin-multi-entry';
import base from './rollup.config.base'

const outputName = name.replace(/-|\d+/g, '_');
export default {
  input: [
    pathResolve(__dirname, '../src/header/bangumi_new_wiki_helper.js'),
    pathResolve(__dirname, '../src/index.ts')
  ],
  output: {
    name: outputName.toUpperCase(),
    file: pathResolve(__dirname,`../dist/${outputName.toLowerCase()}.user.js`),
    // format: 'iife',
    // sourcemap: true
  },
  plugins: [
    replace({ __ENV_EXT__: '__ENV_GM__' }),
    ...base.plugins,
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    multi(),
  ],
}
