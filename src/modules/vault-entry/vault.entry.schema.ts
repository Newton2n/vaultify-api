import { z } from "zod";

const vaultCategorySchema = z.enum([
  "EMAIL",
  "PHONE",
  "LINK",
  "PROJECT",
  "NOTE",
  "RESOURCE",
  "OTHER",
]);

export const createVaultEntrySchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    category: vaultCategorySchema.default("OTHER"),
    value: z.string().min(1, "Value is required"),
    description: z.string().max(5000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    isSensitive: z.boolean().default(false),
  }),
});

export const updateVaultEntrySchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      category: vaultCategorySchema.optional(),
      value: z.string().min(1).optional(),
      description: z.string().max(5000).nullable().optional(),
      tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
      isSensitive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const vaultEntrySearchSchema = z.object({
  search: z.string().trim().optional(),
  category: vaultCategorySchema.optional(),
  isSensitive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  tag: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(["title", "category", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TCreateVaultEntryPayload = z.infer<
  typeof createVaultEntrySchema
>["body"];

export type TUpdateVaultEntryPayload = z.infer<
  typeof updateVaultEntrySchema
>["body"];

export type TVaultEntrySearchQuery = z.infer<typeof vaultEntrySearchSchema>;
