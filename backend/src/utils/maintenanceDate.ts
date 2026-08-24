import { addMonths, addYears, addDays } from "date-fns";

/**
 * Next Service Date = Last Service Date + Maintenance Frequency.
 * Uses date-fns so month-end dates roll over safely (e.g. Jan 31 + 1 month -> Feb 28/29).
 * Returns undefined when there isn't enough information to calculate (rule: don't guess).
 */
export function calculateNextServiceDate(
  lastServiceDate?: Date | string | null,
  frequency?: string | null,
  customFrequencyDays?: number | null
): Date | undefined {
  if (!lastServiceDate || !frequency) return undefined;
  const base = new Date(lastServiceDate);
  if (Number.isNaN(base.getTime())) return undefined;

  switch (frequency) {
    case "Monthly":
      return addMonths(base, 1);
    case "Every 3 Months":
      return addMonths(base, 3);
    case "Every 6 Months":
      return addMonths(base, 6);
    case "Yearly":
      return addYears(base, 1);
    case "Custom":
      return customFrequencyDays && customFrequencyDays > 0 ? addDays(base, customFrequencyDays) : undefined;
    default:
      return undefined;
  }
}
