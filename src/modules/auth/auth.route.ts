import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth";

const authRoute = Router();

//register user
authRoute.post("/register", authController.register);

//login
authRoute.post("/login", authController.login);

//get me

authRoute.get("/me", authMiddleware.auth(), authController.getMe);

//refresh token

authRoute.post("/refresh-token", authController.refreshToken);

export default authRoute;
