import Link from "next/link";
import type { LegalDoc } from "@/lib/content/legal";
import { NEEDS_OWNER_INPUT } from "@/lib/content/legal";
import type { DICTIONARIES } from "@/lib/i18n";

export function LegalPage({ doc, dict }: { doc: LegalDoc; dict: (typeof DICTIONARIES)["fr"] }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
        {dict["action.back"]}
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{doc.updated}</p>
      <p className="mt-4 text-sm text-muted-foreground">{doc.intro}</p>
      <div className="mt-8 flex flex-col gap-6">
        {doc.sections.map((section) => {
          const needsInput = section.body.includes(NEEDS_OWNER_INPUT);
          return (
            <section key={section.heading}>
              <h2 className="text-sm font-semibold">{section.heading}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {needsInput ? (
                  <span className="rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                    {dict["legal.ownerInputNotice"]}
                  </span>
                ) : null}{" "}
                {section.body.replace(`${NEEDS_OWNER_INPUT} : `, "").replace(`${NEEDS_OWNER_INPUT}: `, "").replace(`${NEEDS_OWNER_INPUT}：`, "")}
              </p>
            </section>
          );
        })}
      </div>
    </main>
  );
}
