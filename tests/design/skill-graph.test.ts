import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Static integrity check for the skill catalog / skill_relations graph, run
// against the raw migration SQL (no live database needed in CI). It parses
// the two shapes the migrations use to declare skills and relations:
//   - `<name>_skills`/`<name>_additions` CTEs of `('Name', 'slug', 'category')`
//     tuples, inserted per-discipline via `from disc where code = '<code>'`.
//   - relation CTEs of `('from_slug', 'to_slug', 'relation_type')` tuples,
//     scoped to one discipline via a `with <scope> as (... where d.code =
//     '<code>')` lookup, plus a `cross_relations` CTE of explicit
//     `(from_code, from_slug, to_code, to_slug, relation_type)` 5-tuples.
// This does not validate every hypothetical future migration shape — it
// documents and enforces the shape this repo's migrations 3/14/15 actually
// use, so a typo'd slug or an accidental self/duplicate edge fails fast
// instead of silently no-oping via `on conflict do nothing` in production.

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function readMigrations(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf-8"))
    .join("\n");
}

type RelationEdge = { fromDiscipline: string; fromSlug: string; toDiscipline: string; toSlug: string; type: string };

function parseCatalog(sql: string): Map<string, Set<string>> {
  // discipline code -> set of slugs declared for it
  const catalog = new Map<string, Set<string>>();
  const cteToDiscipline = new Map<string, string>();
  for (const m of sql.matchAll(
    /select \(select id from disc where code = '([a-z_]+)'\), name, slug, category from (\w+)/g,
  )) {
    cteToDiscipline.set(m[2], m[1]);
  }
  for (const [cteName, discipline] of cteToDiscipline) {
    const block = sql.match(new RegExp(`${cteName}\\(name, slug, category\\) as \\(([\\s\\S]*?)\\n\\)`));
    if (!block) continue;
    const set = catalog.get(discipline) ?? new Set<string>();
    for (const tuple of block[1].matchAll(/\('(?:[^']|'')*',\s*'([^']+)',\s*'[^']+'\)/g)) {
      set.add(tuple[1]);
    }
    catalog.set(discipline, set);
  }
  return catalog;
}

function parseRelations(sql: string): RelationEdge[] {
  const edges: RelationEdge[] = [];

  // Migration 3's original inline single-discipline (grappling) format.
  for (const m of sql.matchAll(
    /\(select id from s where slug = '([^']+)'\), \(select id from s where slug = '([^']+)'\), '([a-z_]+)'::skill_relation_type/g,
  )) {
    edges.push({ fromDiscipline: "grappling", fromSlug: m[1], toDiscipline: "grappling", toSlug: m[2], type: m[3] });
  }

  // Migration 15's scope-CTE -> discipline code map (e.g. `g` -> grappling).
  const scopeToDiscipline = new Map<string, string>();
  for (const m of sql.matchAll(
    /(\w+) as \(\s*select sk\.id, sk\.slug from skills sk\s*join disciplines d on d\.id = sk\.discipline_id\s*where d\.code = '([a-z_]+)'/g,
  )) {
    scopeToDiscipline.set(m[1], m[2]);
  }

  // Migration 15's relations-CTE -> scope-CTE map, from the final select/union block.
  const relationsCteToScope = new Map<string, string>();
  for (const m of sql.matchAll(
    /select \(select id from (\w+) where slug = r\.from_slug\), \(select id from \1 where slug = r\.to_slug\), r\.relation_type::skill_relation_type\s*from (\w+) r/g,
  )) {
    relationsCteToScope.set(m[2], m[1]);
  }

  for (const [relationsCte, scopeCte] of relationsCteToScope) {
    const discipline = scopeToDiscipline.get(scopeCte);
    if (!discipline) continue;
    const block = sql.match(new RegExp(`${relationsCte}\\(from_slug, to_slug, relation_type\\) as \\(([\\s\\S]*?)\\n\\)`));
    if (!block) continue;
    for (const tuple of block[1].matchAll(/\('([^']+)', '([^']+)', '([a-z_]+)'\)/g)) {
      edges.push({ fromDiscipline: discipline, fromSlug: tuple[1], toDiscipline: discipline, toSlug: tuple[2], type: tuple[3] });
    }
  }

  // Migration 15's explicit cross-discipline relations.
  const crossBlock = sql.match(/cross_relations\(from_code, from_slug, to_code, to_slug, relation_type\) as \(([\s\S]*?)\n\)/);
  if (crossBlock) {
    for (const tuple of crossBlock[1].matchAll(
      /\('([a-z_]+)', '([^']+)', '([a-z_]+)', '([^']+)', '([a-z_]+)'\)/g,
    )) {
      edges.push({ fromDiscipline: tuple[1], fromSlug: tuple[2], toDiscipline: tuple[3], toSlug: tuple[4], type: tuple[5] });
    }
  }

  return edges;
}

describe("skill_relations graph integrity (static, from migration SQL)", () => {
  const sql = readMigrations();
  const catalog = parseCatalog(sql);
  const edges = parseRelations(sql);

  it("parsed a non-trivial catalog and graph (parser sanity check)", () => {
    const totalSkills = [...catalog.values()].reduce((n, set) => n + set.size, 0);
    expect(totalSkills).toBeGreaterThanOrEqual(133);
    expect(edges.length).toBeGreaterThanOrEqual(110);
  });

  it("has no self-relation (a skill related to itself)", () => {
    const selfEdges = edges.filter((e) => e.fromDiscipline === e.toDiscipline && e.fromSlug === e.toSlug);
    expect(selfEdges).toEqual([]);
  });

  it("has no duplicate (from, to, relation_type) edge", () => {
    const seen = new Map<string, number>();
    for (const e of edges) {
      const key = `${e.fromDiscipline}:${e.fromSlug}->${e.toDiscipline}:${e.toSlug}::${e.type}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
    expect(duplicates).toEqual([]);
  });

  it("never references a slug missing from the declared catalog", () => {
    const missing: string[] = [];
    for (const e of edges) {
      if (!catalog.get(e.fromDiscipline)?.has(e.fromSlug)) missing.push(`${e.fromDiscipline}:${e.fromSlug} (from)`);
      if (!catalog.get(e.toDiscipline)?.has(e.toSlug)) missing.push(`${e.toDiscipline}:${e.toSlug} (to)`);
    }
    expect(missing).toEqual([]);
  });

  it("only uses relation types from the skill_relation_type enum", () => {
    const allowed = new Set(["prerequisite", "counter", "variation", "follow_up", "transition", "related"]);
    const invalid = edges.filter((e) => !allowed.has(e.type));
    expect(invalid).toEqual([]);
  });
});
