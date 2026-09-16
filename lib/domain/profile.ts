import { z } from "zod";

export const profileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1).max(80).nullable(),
  first_name: z.string().max(80).nullable().optional(),
  last_name: z.string().max(80).nullable().optional(),
  age: z.number().int().min(13).max(100).nullable().optional(),
  height_cm: z.number().int().min(100).max(250).nullable().optional(),
  weight_kg: z.number().min(30).max(300).nullable().optional(),
  titles_belts: z.array(z.string()).optional(),
  years_practicing: z.number().int().min(0).max(80).nullable().optional(),
  preferred_techniques: z.array(z.string()).optional(),
  training_music: z.array(z.string()).optional(),
  disciplines: z.array(z.string()).optional(),
  dominant_stance: z.string().max(40).nullable().optional(),
  weight_class: z.string().max(80).nullable().optional(),
  current_goals: z.string().max(1000).nullable().optional(),
  youtube_url: z.string().url().nullable().optional(),
  spotify_url: z.string().url().nullable().optional(),
  deezer_url: z.string().url().nullable().optional(),
  apple_music_url: z.string().url().nullable().optional(),
  profile_visibility: z.enum(["private", "public"]).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

const text = (max = 120) => z.string().trim().max(max).default("").transform((value) => value || null);
const number = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === "" || value == null ? null : Number(value)), schema.nullable());
const list = z.string().default("").transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
const url = z.string().trim().refine((value) => !value || URL.canParse(value), "Lien invalide").default("").transform((value) => value || null);

export const profileInputSchema = z.object({
  display_name: text(80).optional(),
  first_name: text(80),
  last_name: text(80),
  age: number(z.number().int().min(13).max(100)),
  height_cm: number(z.number().int().min(100).max(250)),
  weight_kg: number(z.number().min(30).max(300)),
  titles_belts: list,
  years_practicing: number(z.number().int().min(0).max(80)),
  preferred_techniques: list,
  training_music: list,
  disciplines: list,
  dominant_stance: text(40),
  weight_class: text(80),
  current_goals: text(1000),
  youtube_url: url,
  spotify_url: url,
  deezer_url: url,
  apple_music_url: url,
  profile_visibility: z.enum(["private", "public"]).default("private"),
});

export type Profile = z.infer<typeof profileSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
