-- The skill catalog (skills, skill_relations) is global reference data, same
-- as disciplines (already publicly readable since migration 2). It was
-- restricted "to authenticated" for no functional reason, which forced
-- application code to read it with the service-role key just to bypass RLS.
-- That key is deploy-environment-scoped and its absence in one environment
-- (e.g. Production vs Preview) turns a healthy 133-skill catalog into a hard
-- failure ("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY")
-- surfaced to users as an empty catalog. Widening read access to match
-- disciplines removes that fragile dependency for a read with no private
-- data. Write policies (insert/update/delete) remain absent: catalog writes
-- stay service-role-only.

drop policy "skills_select_all" on skills;
create policy "skills_select_all"
  on skills for select
  using (true);

drop policy "skill_relations_select_all" on skill_relations;
create policy "skill_relations_select_all"
  on skill_relations for select
  using (true);
