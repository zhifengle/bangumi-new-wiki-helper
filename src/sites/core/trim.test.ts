import { trimParenthesis } from './trim';

describe('core trim helpers', () => {
  test('trimParenthesis keeps numeric parenthesis content', () => {
    expect(trimParenthesis('Vol.1 (限定版) (1)')).toBe('Vol.1  (1)');
  });
});
