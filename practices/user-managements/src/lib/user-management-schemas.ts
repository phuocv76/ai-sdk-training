import { z } from "zod";

/** Reusable primitive schemas for user-management flows. */
export const emptyObjectSchema = z.object({});
export const userIdSchema = z.string();
export const userIdPayloadSchema = z.object({ id: userIdSchema });
export const userNameSchema = z.string().min(1).max(120);
export const userEmailSchema = z.string().email();
export const signupEmailSchema = userEmailSchema.max(255);
export const userBioSchema = z.string().max(8000);
export const userStatusSchema = z.enum(["active", "inactive"]);
export const passwordSchema = z.string().min(8).max(256);
export const loginPasswordSchema = z.string().min(1).max(256);
export const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const dateOfBirthPatchSchema = z
  .union([dateOfBirthSchema, z.literal(""), z.null()])
  .optional();

/** Common API body schemas shared across chat tools and auth routes. */
export const createUserToolInputSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
  date_of_birth: dateOfBirthSchema,
  bio: userBioSchema.optional(),
});

export const updateUserToolInputSchema = z.object({
  id: userIdSchema,
  name: z.string().optional(),
  email: userEmailSchema.optional(),
  date_of_birth: dateOfBirthPatchSchema,
  bio: userBioSchema.nullable().optional(),
  status: userStatusSchema.optional(),
});

export const updateMyProfileToolInputSchema = z.object({
  name: userNameSchema.optional(),
  date_of_birth: dateOfBirthPatchSchema,
  bio: userBioSchema.nullable().optional(),
});

export const signupBodySchema = z.object({
  name: userNameSchema,
  email: signupEmailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: userEmailSchema,
  password: loginPasswordSchema,
});
