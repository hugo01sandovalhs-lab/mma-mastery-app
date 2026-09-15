/**
 * Club admin overview (P3.3): pure helpers for stats and alerts shown on
 * `/club/[id]/admin`. Kept separate from `club.ts` so the admin-specific
 * thresholds don't leak into the core club/role model.
 */

export function computeRate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

// A session counts as "low attendance" once enough people were marked and
// under half showed up — too few marks (e.g. 1 of 1) is noise, not a signal.
export const LOW_ATTENDANCE_MIN_MARKED = 3;
export const LOW_ATTENDANCE_RATE_THRESHOLD = 50;

export function isLowAttendanceSession(present: number, marked: number): boolean {
  if (marked < LOW_ATTENDANCE_MIN_MARKED) return false;
  return computeRate(present, marked) < LOW_ATTENDANCE_RATE_THRESHOLD;
}
