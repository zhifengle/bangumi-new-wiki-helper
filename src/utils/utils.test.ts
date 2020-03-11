import {genRandomStr} from "./utils";

describe('test utils', () => {
  it('test the length of return value', () => {
    expect(genRandomStr(5).length).toEqual(5)
  })
  it('return value', () => {
    expect(genRandomStr(5)).toMatch(/^[a-zA-Z0-9]{5}$/)
  })
})
