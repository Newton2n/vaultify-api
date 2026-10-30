import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../utils/catch-async";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        isEmailVerified: boolean;
      };
    }
  }
}

const auth = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //  Get access token from cookie or Authorization header
    const accessToken = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

    if (!accessToken) {
      throw new AppError(
        401,
        "You are not logged in. Please log in to access this resource."
      );
    }

    //  Verify access token
    const verifyAccessToken = jwtUtils.verifyToken(
      accessToken,
      config.jwt_access_secret!,
    );

    if (!verifyAccessToken.success) {
      throw new AppError(401, "Access token has expired");
    }

    //  Extract and validate payload
    const payload = verifyAccessToken.data as JwtPayload & {
      id: string;
      email: string;
      name: string;
    };

    const { id, email, name } = payload;

    if (!id || !email || !name) {
      throw new AppError(401, "Invalid access token payload.");
    }

    //  Verify user existence in database
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
      },
    });

    if (!user || user.email !== email) {
      throw new AppError(401, "User not found. Please log in again.");
    }

    //  Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  });
};

export const authMiddleware = { auth };
