import { name } from '../package.json'
import { resolve } from 'path'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs';

export default {
  // 入口文件
  input: resolve(__dirname, '../src/index.ts'),
  output: {
    // 打包名称
    name: name,
    // exports: 'named', // 默认 auto
    // 启用代码映射，便于调试之用
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    typescript({
      exclude: ['./dist', './src/**/*.test.ts'],
    }),
  ],
}
