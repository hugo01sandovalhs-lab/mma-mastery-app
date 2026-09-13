import { z } from "zod";

export const profileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1).max(80).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;
