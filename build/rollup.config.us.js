import { name } from '../package.json'
import { resolve as pathResolve } from 'path'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
// import { terser } from 'rollup-plugin-terser';
import base from './rollup.config.base'

export default {
  ...base,
  output: {
    name: name.replace(/-|\d+/g, '_').toUpperCase(),
    file: pathResolve(__dirname,`../dist/${name}.user.js`),
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    replace({ __ENV_EXT__: '__ENV_GM__' }),
    ...base.plugins,
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
  ],
}
