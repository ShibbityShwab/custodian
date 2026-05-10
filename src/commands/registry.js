import {
  setRecurringCleanup,
  viewCleanupSchedule,
  cancelRecurringCleanup,
  editRecurringCleanup,
} from './recurring-cleanup.js';
import { handleCleanupCommand } from './cleanup.js';
import { handleReminderCommand } from './reminder.js';
import { handleListRemindersCommand } from './list-reminders.js';
import { handleDeleteReminderCommand } from './delete-reminder.js';
import { handleHelpCommand } from './help.js';

/**
 * Command registry mapping Discord slash-command names to their handler functions.
 * Each handler receives the interaction object and returns a Discord interaction response.
 */
export const commands = new Map([
  ['setreminder', handleReminderCommand],
  ['listreminders', handleListRemindersCommand],
  ['deletereminder', handleDeleteReminderCommand],
  ['cleanup', handleCleanupCommand],
  ['setrecurringcleanup', setRecurringCleanup],
  ['viewcleanupschedule', viewCleanupSchedule],
  ['cancelrecurringcleanup', cancelRecurringCleanup],
  ['editrecurringcleanup', editRecurringCleanup],
  ['help', handleHelpCommand],
]);
