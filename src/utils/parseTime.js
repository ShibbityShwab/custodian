/**
 * Utility functions for parsing time strings and calculating thresholds
 */

const UNITS = Object.freeze({
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
});

/**
 * Parses a time string into milliseconds
 * @param {string} timeStr - Time string in format like '10m', '1h30m'
 * @returns {number} Total milliseconds
 */
export function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }

  const regex = /(\d+)([smhdw])/g;
  let totalMs = 0;
  let match;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    totalMs += value * (UNITS[unit] || 0);
  }

  return totalMs;
}

/**
 * Calculates a timestamp threshold based on a time string
 * @param {string} periodInput - Time string in format like '30s', '15m', '1h'
 * @returns {number|null} Timestamp threshold or null if invalid input
 */
export function calculateThreshold(periodInput) {
  if (!periodInput || typeof periodInput !== 'string') {
    return null;
  }

  const periodRegex = /^(\d+)(s|m|h|d|w)$/;
  const match = periodInput.match(periodRegex);

  if (!match) {
    return null;
  }

  const [, amount, unit] = match;
  const amountNumber = parseInt(amount, 10);
  const multiplier = UNITS[unit];

  if (!multiplier) {
    return null;
  }

  return Date.now() - amountNumber * multiplier;
}

/**
 * Validates a time string format (supports compounds like 1h30m, for reminders)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} Whether the time string is valid
 */
export function isValidTimeFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return false;
  }
  return /^(\d+[smhdw])+$/.test(timeStr);
}

/**
 * Validates a period string format (strict single-unit, for cleanups)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} Whether the time string is valid
 */
export function isValidPeriodFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return false;
  }
  return /^(\d+)(s|m|h|d|w)$/.test(timeStr);
}
