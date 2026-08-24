import { addMonths, addYears, addDays, format, parseISO } from "date-fns";

/**
 * Next Service Date = Last Service Date + Maintenance Frequency (mirrors backend/src/utils/maintenanceDate.ts).
 * Used for a live preview in the asset form; the backend recalculates authoritatively on save.
 * Returns a yyyy-MM-dd string for use in a date input, or "" when there isn't enough info.
 */
export function calculateNextServiceDate(lastServiceDate?: string, frequency?: string, customFrequencyDays?: number): string {
  if (!lastServiceDate || !frequency) return "";
  const base = parseISO(lastServiceDate);
  if (Number.isNaN(base.getTime())) return "";

  let next: Date | undefined;
  switch (frequency) {
    case "Monthly":
      next = addMonths(base, 1);
      break;
    case "Every 3 Months":
      next = addMonths(base, 3);
      break;
    case "Every 6 Months":
      next = addMonths(base, 6);
      break;
    case "Yearly":
      next = addYears(base, 1);
      break;
    case "Custom":
      next = customFrequencyDays && customFrequencyDays > 0 ? addDays(base, customFrequencyDays) : undefined;
      break;
    default:
      next = undefined;
  }

  return next ? format(next, "yyyy-MM-dd") : "";
}
