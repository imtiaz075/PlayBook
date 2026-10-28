/**
 * Deadline and countdown utility functions for PlayBook.
 * Enforces strict deadline parsing, 12-hour eligibility window, and human-readable countdowns with seconds.
 */

export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

/**
 * Calculates target timestamp in milliseconds from date string (YYYY-MM-DD or ISO)
 * and optional time string (HH:mm).
 */
export function parseDeadlineTarget(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;
  if (dateStr.includes('T')) {
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [year, month, day] = parts;

  if (timeStr && timeStr.trim().length > 0) {
    const cleanTime = timeStr.trim().split('-')[0].trim();
    const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
    }
  }

  // End of date (23:59:59.999 local time)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

/**
 * Checks whether an item's deadline is approaching strictly within the next 12 hours.
 * Note: Overdue items (diffMs <= 0) strictly return false.
 * Items > 12 hours away strictly return false.
 */
export function isApproachingIn12Hours(dateStr?: string, timeStr?: string, referenceTimeMs: number = Date.now()): boolean {
  const target = parseDeadlineTarget(dateStr, timeStr);
  if (target <= 0) return false;
  const diffMs = target - referenceTimeMs;
  return diffMs > 0 && diffMs <= TWELVE_HOURS_MS;
}

/**
 * Formats remaining milliseconds with hours, minutes, and seconds:
 * e.g. "Deadline in 11h 42m 18s" or "Overdue by 02h 15m 30s"
 */
export function formatLiveCountdown(remainingMs: number): string {
  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const totalSecs = Math.floor(overdueMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `Overdue by ${hh}h ${mm}m ${ss}s`;
  }

  const totalSecs = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `Deadline in ${hh}h ${mm}m ${ss}s`;
}
