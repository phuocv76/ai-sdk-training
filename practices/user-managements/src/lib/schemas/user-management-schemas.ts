import { z } from "zod";

/**
 * On mutating tools: omit or false on the preview call; set true only when the
 * latest user turn clearly approves executing that preview (model judges wording).
 */
export const humanAffirmsExecuteField = z.object({
  humanAffirmsExecute: z
    .preprocess((value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
      return value;
    }, z.boolean())
    .optional()
    .describe(
      "Preview: omit or false. Execute: true only if the latest user message clearly affirms this exact preview (typos/informal ok). False if unsure, they refused, or they only asked questions.",
    ),
});

/** Reusable primitive schemas for user-management flows. */
export const emptyObjectSchema = z.object({});
export const userIdSchema = z.string();
export const userIdPayloadSchema = z.object({ id: userIdSchema });

/** deleteUser: same id payload plus human-in-loop affirmation flag. */
export const deleteUserToolInputSchema =
  userIdPayloadSchema.merge(humanAffirmsExecuteField);
export const userNameSchema = z.string().min(1).max(120);
export const userEmailSchema = z.string().email();
/** Chat tools accept raw email text; tool execute validates and returns friendly errors. */
export const toolEmailInputSchema = z.string().min(1).max(255);
export const signupEmailSchema = userEmailSchema.max(255);
export const userBioSchema = z.string().max(8000);
export const userStatusSchema = z.enum(["active", "inactive"]);
export const passwordSchema = z.string().min(8).max(256);
export const loginPasswordSchema = z.string().min(1).max(256);
export const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Omit = unchanged; null = unchanged; "" = clear; YYYY-MM-DD = set. */
export const dateOfBirthPatchSchema = z
  .union([dateOfBirthSchema, z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null) return undefined;
    if (v === "") return null;
    return v;
  });

/** Omit = unchanged; null = unchanged; "" = clear; non-empty string = set. */
export const bioPatchSchema = z
  .union([userBioSchema, z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null) return undefined;
    if (v === "") return null;
    const t = v.trim();
    return t === "" ? null : t;
  });

/** Common API body schemas shared across chat tools and auth routes. */
export const createUserToolInputSchema = z
  .object({
    name: userNameSchema.optional(),
    email: toolEmailInputSchema.optional(),
    date_of_birth: dateOfBirthSchema.optional(),
    bio: userBioSchema.optional(),
  })
  .merge(humanAffirmsExecuteField);

export const updateUserToolInputSchema = z
  .object({
    id: userIdSchema,
    name: z.string().optional(),
    date_of_birth: dateOfBirthPatchSchema.describe(
      "Omit when unchanged. Do not send null. Use empty string only to clear.",
    ),
    bio: bioPatchSchema.describe(
      "Omit when unchanged. Do not send null. Use empty string only to clear.",
    ),
    status: userStatusSchema.optional(),
  })
  .merge(humanAffirmsExecuteField);

export const updateMyProfileToolInputSchema = z
  .object({
    name: userNameSchema.optional(),
    date_of_birth: dateOfBirthPatchSchema.describe(
      "Omit when unchanged. Do not send null. Use empty string only to clear.",
    ),
    bio: bioPatchSchema.describe(
      "Omit when unchanged. Do not send null. Use empty string only to clear.",
    ),
  })
  .merge(humanAffirmsExecuteField);

export const signupBodySchema = z.object({
  name: userNameSchema,
  email: signupEmailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: userEmailSchema,
  password: loginPasswordSchema,
});

export const findUserByEmailPayloadSchema = z.object({
  email: toolEmailInputSchema,
});
