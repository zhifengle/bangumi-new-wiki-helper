import { name } from '../package.json';
import { resolve as pathResolve } from 'path';
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
  ],
};
