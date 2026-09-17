import { z } from "zod";

export const friendCodeSchema = z.preprocess(
  (value) => typeof value === "string" ? value.trim().replaceAll("-", "").toUpperCase() : value,
  z.string().regex(/^[A-Z0-9]{8}$/, "Code ami invalide"),
);

export type TrainingPartner = {
  relationshipId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};
