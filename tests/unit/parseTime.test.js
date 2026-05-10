import { describe, it, expect } from 'vitest';
import {
  parseTime,
  calculateThreshold,
  isValidTimeFormat,
  isValidPeriodFormat,
} from '../../src/utils/parseTime.js';

describe('Time Utilities', () => {
  describe('parseTime', () => {
    it('should parse seconds correctly', () => {
      expect(parseTime('30s')).toBe(30000);
    });

    it('should parse minutes correctly', () => {
      expect(parseTime('5m')).toBe(300000);
    });

    it('should parse hours correctly', () => {
      expect(parseTime('2h')).toBe(7200000);
    });

    it('should handle invalid input', () => {
      expect(parseTime('')).toBe(0);
      expect(parseTime(null)).toBe(0);
      expect(parseTime(undefined)).toBe(0);
    });
  });

  describe('calculateThreshold', () => {
    it('should calculate threshold correctly', () => {
      const now = Date.now();
      const threshold = calculateThreshold('30s');
      expect(threshold).toBeLessThan(now);
      expect(threshold).toBeGreaterThan(now - 31000);
    });

    it('should handle invalid input', () => {
      expect(calculateThreshold('')).toBeNull();
      expect(calculateThreshold('invalid')).toBeNull();
    });
  });

  describe('isValidTimeFormat', () => {
    it('should validate single-unit formats', () => {
      expect(isValidTimeFormat('30s')).toBe(true);
      expect(isValidTimeFormat('5m')).toBe(true);
      expect(isValidTimeFormat('2h')).toBe(true);
    });

    it('should validate compound formats', () => {
      expect(isValidTimeFormat('1h30m')).toBe(true);
      expect(isValidTimeFormat('1d12h')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidTimeFormat('')).toBe(false);
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('30')).toBe(false);
      expect(isValidTimeFormat('s')).toBe(false);
    });
  });

  describe('isValidPeriodFormat', () => {
    it('should validate single-unit formats', () => {
      expect(isValidPeriodFormat('30s')).toBe(true);
      expect(isValidPeriodFormat('5m')).toBe(true);
      expect(isValidPeriodFormat('2h')).toBe(true);
    });

    it('should reject compound formats', () => {
      expect(isValidPeriodFormat('1h30m')).toBe(false);
      expect(isValidPeriodFormat('1d12h')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(isValidPeriodFormat('')).toBe(false);
      expect(isValidPeriodFormat('invalid')).toBe(false);
      expect(isValidPeriodFormat('30')).toBe(false);
      expect(isValidPeriodFormat('s')).toBe(false);
    });
  });
});
