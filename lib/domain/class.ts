import { z } from "zod";

/**
 * Classes / attendance / QR check-in (docs/decisions/0007, P3.2). A class
 * belongs to a club and optionally one group; concrete occurrences are
 * `class_sessions`, each optionally carrying a short-lived check-in code
 * (`rotate_checkin_code`). Attendance is present/absent per (session, user).
 */

export const ATTENDANCE_STATUSES = ["present", "absent"] as const;
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  absent: "Absent",
};

export const WEEKDAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

export const classInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  group_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  day_of_week: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(0).max(6).optional()),
  start_time: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  duration_minutes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().positive().optional()),
  capacity: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().positive().optional()),
});
export type ClassInput = z.infer<typeof classInputSchema>;

export const classSessionInputSchema = z.object({
  starts_at: z.string().trim().min(1, "Date/heure requise"),
  ends_at: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type ClassSessionInput = z.infer<typeof classSessionInputSchema>;

export function checkinCodeIsValid(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}
