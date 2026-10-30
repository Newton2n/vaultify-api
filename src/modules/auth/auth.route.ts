import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth";
import { verifyEmailValidationSchema } from "./auth.schema";
import { validate } from "../../middleware/validate";

const authRoute = Router();

//register user
authRoute.post("/register", authController.register);

//login
authRoute.post("/login", authController.login);

//get me

authRoute.get("/me", authMiddleware.auth(), authController.getMe);

//refresh token

authRoute.post("/refresh-token", authController.refreshToken);

// Send verification email route
authRoute.post(
  "/send-verification-email",
  authMiddleware.auth(),
  authController.sendVerificationEmail,
);

// Verify email route
authRoute.post(
  "/verify-email",
  authMiddleware.auth(),
  validate(verifyEmailValidationSchema),
  authController.verifyEmail,
);

export default authRoute;
