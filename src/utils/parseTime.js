/**
 * Utility functions for parsing time strings and calculating thresholds
 */

/**
 * Parses a time string into milliseconds
 * @param {string} timeStr - Time string in format like '10m', '1h30m'
 * @returns {number} Total milliseconds
 */
export function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }

  const regex = /(\d+)([smh])/g;
  let totalMs = 0;
  let match;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': totalMs += value * 1000; break;
      case 'm': totalMs += value * 60 * 1000; break;
      case 'h': totalMs += value * 60 * 60 * 1000; break;
    }
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

  const periodRegex = /^(\d+)(s|m|h)$/;
  const match = periodInput.match(periodRegex);

  if (!match) {
    return null;
  }

  const [, amount, unit] = match;
  const amountNumber = parseInt(amount, 10);
  let multiplier;

  switch (unit) {
    case 's': multiplier = 1000; break;
    case 'm': multiplier = 1000 * 60; break;
    case 'h': multiplier = 1000 * 60 * 60; break;
    default: return null;
  }

  return Date.now() - amountNumber * multiplier;
}

/**
 * Validates a time string format
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} Whether the time string is valid
 */
export function isValidTimeFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return false;
  }
  return /^(\d+)(s|m|h)$/.test(timeStr);
} 