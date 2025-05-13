// In-memory storage for reminders
const reminders = new Map();

export function addReminder(id, reminder) {
  reminders.set(id, reminder);
}

export function getReminder(id) {
  return reminders.get(id);
}

export function deleteReminder(id) {
  return reminders.delete(id);
}

export function getAllReminders() {
  return Array.from(reminders.values());
}

export function cleanupOldReminders() {
  const now = Date.now();
  for (const [id, reminder] of reminders.entries()) {
    if (reminder.time <= now) {
      reminders.delete(id);
    }
  }
}
