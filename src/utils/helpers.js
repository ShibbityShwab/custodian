/**
 * Shared helper utilities for command handlers
 */

/**
 * Extracts a named option value from a Discord interaction options array
 * @param {Array<{name: string, value: any}>} options
 * @param {string} name
 * @returns {any|undefined}
 */
export function getOption(options, name) {
  return options?.find((opt) => opt.name === name)?.value;
}

/**
 * Extracts the user ID from a Discord interaction
 * @param {object} interaction
 * @returns {string|undefined}
 */
export function getInteractionUser(interaction) {
  return interaction?.member?.user?.id;
}
