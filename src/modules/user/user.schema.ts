import { z } from "zod";

export const updateUserProfileValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
  }),
});

export const changePasswordValidationSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters"),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),
});

export const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase().trim(),
  }),
});

export const resetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.email(), 
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits."),
    newPassword: z.string().min(8),
  }),
});

export type TUpdateUserProfile = z.infer<
  typeof updateUserProfileValidationSchema
>["body"];
export type TChangePassword = z.infer<
  typeof changePasswordValidationSchema
>["body"];
export type TForgotPassword = z.infer<
  typeof forgotPasswordValidationSchema
>["body"];
export type TResetPassword = z.infer<
  typeof resetPasswordValidationSchema
>["body"];
