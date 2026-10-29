import { Router } from "express";

import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

import { userController } from "./user.controller";

import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  updateUserProfileValidationSchema
} from "./user.schema";
import { emailVerificationMiddleware } from "../../middleware/email-verified";

const router = Router();

// User Authentication Routes
router.post(
  "/forgot-password",
  validate(forgotPasswordValidationSchema),
  userController.forgotPassword,
);

// Reset password route
router.post(
  "/reset-password",
  validate(resetPasswordValidationSchema),
  userController.resetPassword,
);

// Update user profile
router.patch(
  "/me",
  authMiddleware.auth(),
  emailVerificationMiddleware,
  validate(updateUserProfileValidationSchema),
  userController.updateMyProfile,
);

// Change password
router.patch(
  "/me/password",
  authMiddleware.auth(),
  emailVerificationMiddleware,
  validate(changePasswordValidationSchema),
  userController.changePassword,
);

// delete user account
router.delete(
  "/me",
  authMiddleware.auth(),
  emailVerificationMiddleware,
  userController.deleteMyAccount,
);

export const userRoutes = router;
