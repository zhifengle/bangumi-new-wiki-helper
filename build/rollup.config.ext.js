import {resolve} from 'path'
import base from './rollup.config.base'

const bangumi = {
  input: resolve(__dirname, '../src/content/bangumi.ts'),
  output: {
    file: resolve(__dirname, '../extension/dist/bangumi.js')
  }
}
const bg = {
  input: resolve(__dirname, '../src/bg/index.ts'),
  output: {
    file: resolve(__dirname, '../extension/dist/background.js')
  }
}
const popup = {
  input: resolve(__dirname, '../src/popup.ts'),
  output: {
    file: resolve(__dirname, '../extension/dist/popup.js')
  }
}
const config = [
  {
    input: resolve(__dirname, '../src/content/index.ts'),
    output: {
      file: resolve(__dirname, '../extension/dist/content.js')
    }
  }
]

export default [
  {
    ...base,
    ...bangumi,
  },
  {
    ...base,
    ...bg,
  },
  // {
  //   ...base,
  //   ...popup,
  // },
  ...config.map(obj => ({...base, ...obj}))
]

