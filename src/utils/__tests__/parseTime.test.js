import { describe, it, expect } from 'vitest';
import { parseTime } from '../parseTime.js';

describe('parseTime', () => {
  it('parses seconds', () => {
    expect(parseTime('10s')).toBe(10000);
  });
  it('parses minutes', () => {
    expect(parseTime('2m')).toBe(120000);
  });
  it('parses hours', () => {
    expect(parseTime('1h')).toBe(3600000);
  });
  it('parses mixed time', () => {
    expect(parseTime('1h30m10s')).toBe(5410000);
  });
  it('returns 0 for invalid input', () => {
    expect(parseTime('abc')).toBe(0);
  });
});
