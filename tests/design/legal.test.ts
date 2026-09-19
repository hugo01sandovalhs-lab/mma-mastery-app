import { describe, expect, it } from "vitest";
import { LEGAL_CONTENT, NEEDS_OWNER_INPUT } from "@/lib/content/legal";
import { LOCALES } from "@/lib/i18n";

describe("legal content (Privacy Policy / Terms of Service)", () => {
  it("has a privacy and terms doc for all 6 locales, with matching section counts", () => {
    const referenceSectionCounts = {
      privacy: LEGAL_CONTENT.fr.privacy.sections.length,
      terms: LEGAL_CONTENT.fr.terms.sections.length,
    };
    for (const locale of LOCALES) {
      const doc = LEGAL_CONTENT[locale];
      expect(doc, `locale "${locale}" legal content`).toBeDefined();
      expect(doc.privacy.sections.length, `${locale} privacy sections`).toBe(referenceSectionCounts.privacy);
      expect(doc.terms.sections.length, `${locale} terms sections`).toBe(referenceSectionCounts.terms);
    }
  });

  it("never leaves a title, heading, or body empty", () => {
    for (const locale of LOCALES) {
      for (const kind of ["privacy", "terms"] as const) {
        const doc = LEGAL_CONTENT[locale][kind];
        expect(doc.title.trim().length, `${locale}.${kind}.title`).toBeGreaterThan(0);
        expect(doc.intro.trim().length, `${locale}.${kind}.intro`).toBeGreaterThan(0);
        for (const section of doc.sections) {
          expect(section.heading.trim().length, `${locale}.${kind} section heading`).toBeGreaterThan(0);
          expect(section.body.trim().length, `${locale}.${kind} "${section.heading}" body`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("marks every owner-identity gap (entity, address, registration number, contact) instead of inventing one", () => {
    // Every locale's controller/publisher and contact sections must flag missing owner input --
    // never a fabricated company name, address, SIRET, or email.
    for (const locale of LOCALES) {
      for (const kind of ["privacy", "terms"] as const) {
        const doc = LEGAL_CONTENT[locale][kind];
        const flaggedSections = doc.sections.filter((s) => s.body.includes(NEEDS_OWNER_INPUT));
        expect(flaggedSections.length, `${locale}.${kind} should flag owner-specific gaps`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("does not fabricate a legal entity name, SIRET, or address anywhere in the copy", () => {
    // Sanity net: catch an accidental invented company/registration number pattern.
    const suspiciousPatterns = [/SIRET\s*:?\s*\d/i, /\b\d{14}\b/, /S\.?A\.?R\.?L\.?/i];
    for (const locale of LOCALES) {
      for (const kind of ["privacy", "terms"] as const) {
        const doc = LEGAL_CONTENT[locale][kind];
        const fullText = [doc.title, doc.intro, ...doc.sections.map((s) => s.body)].join(" ");
        for (const pattern of suspiciousPatterns) {
          expect(pattern.test(fullText), `${locale}.${kind} matched suspicious pattern ${pattern}`).toBe(false);
        }
      }
    }
  });
});
