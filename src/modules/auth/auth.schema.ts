import { z } from "zod";

export const userLoginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 letters long"),
  }),
});

export const userRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Minimum 3 character required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 letters long"),
  }),
});

// types

export type TLoginPayload = z.infer<typeof userLoginSchema>["body"];
export type TRegistrationPayload = z.infer<typeof userRegisterSchema>["body"];
