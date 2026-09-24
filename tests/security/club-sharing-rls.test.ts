import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/00000000000018_club_progress_sharing.sql", "utf8");

describe("club progress sharing RLS", () => {
  it("defaults every category to private and keeps consent owner-controlled", () => {
    expect(sql.match(/default false/g)).toHaveLength(6);
    expect(sql).toContain('create policy "club_sharing_update_self"');
    expect(sql).toContain("user_id = auth.uid()");
  });

  it("requires active same-club staff and active membership", () => {
    expect(sql).toContain("staff.club_id = p.club_id");
    expect(sql).toContain("staff.role >= 'COACH'");
    expect(sql).toContain("staff.status = 'active'");
    expect(sql).toContain("member.status = 'active'");
  });

  it("applies category-specific policies to every shared data source", () => {
    for (const table of ["skill_progress", "training_sessions", "session_techniques", "session_observations", "goals", "resources"]) {
      expect(sql).toContain(`on ${table} for select`);
    }
  });
});
