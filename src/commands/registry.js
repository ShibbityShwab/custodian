import { handleCleanCommand } from './clean.js';
import { handleScheduleCommand } from './schedule.js';

export const commands = new Map([
  ['clean', handleCleanCommand],
  ['schedule', handleScheduleCommand],
]);
