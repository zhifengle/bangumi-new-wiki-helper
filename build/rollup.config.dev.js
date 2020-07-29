import { name } from '../package.json';
import { resolve as pathResolve } from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import base from './rollup.config.base';

export default {
  ...base,
  input: pathResolve(__dirname, '../src/dev.ts'),
  output: {
    name: name.replace(/-/g, '_').toUpperCase(),
    file: pathResolve(__dirname, `../dist/${name}.dev.js`),
    // format: 'iife',
    // sourcemap: true
  },
  plugins: [
    ...base.plugins,
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
  ],
};
