import { hello } from './index'

describe('test index', () => {
  it('simple test', () => {
    expect(hello()).toEqual('hello')
  })
})

