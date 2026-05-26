import { describe, it, expect } from 'vitest';
import { getOption } from '../../src/utils/helpers.js';

describe('getOption', () => {
  it('should return the value of a named option', () => {
    const options = [
      { name: 'channel', value: '123' },
      { name: 'age', value: '1h' },
    ];
    expect(getOption(options, 'channel')).toBe('123');
    expect(getOption(options, 'age')).toBe('1h');
    expect(getOption(options, 'missing')).toBeUndefined();
  });

  it('should handle undefined or empty options', () => {
    expect(getOption(undefined, 'channel')).toBeUndefined();
    expect(getOption([], 'channel')).toBeUndefined();
  });
});
