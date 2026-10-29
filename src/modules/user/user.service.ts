import bcrypt from "bcrypt";
import crypto from "node:crypto";

import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import config from "../../config";
import { mailService } from "../../services/mail";

import type {
  TChangePassword,
  TForgotPassword,
  TResetPassword,
  TUpdateUserProfile,
} from "./user.schema";
import { AppError } from "../../utils/app-error";
import { StatusCodes } from "http-status-codes";

// update user profile
const updateMyProfile = async (userId: string, payload: TUpdateUserProfile) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: payload.name,
    },
    omit: {
      passwordHash: true,
    },
  });
};

// change password
const changePassword = async (userId: string, payload: TChangePassword) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (!user.passwordHash) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Password is not available for this account.",
    );
  }

  const passwordMatches = await bcrypt.compare(
    payload.currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Current password is incorrect.",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });
};

// forgot password
const forgotPassword = async (payload: TForgotPassword) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // If the user doesn't exist, we don't throw an error to avoid revealing whether the email is registered or not. We simply return and do nothing.
  if (!user || user.deletedAt) {
    return;
  }

  

  // Generate a 6-digit OTP.
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash OTP before storing it in Redis.
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const RESET_OTP_EXPIRY = 60 * 5; // 5 minutes
  const redisKey = `vaulty:password-reset-otp:${user.id}`;

  await redis.set(redisKey, hashedOtp, {
    ex: RESET_OTP_EXPIRY,
  });

  // Send OTP directly to email.
  await mailService.sendPasswordResetOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });
};

// reset password
const resetPassword = async (payload: TResetPassword) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or OTP.");
  }

  

  const hashedOtp = crypto
    .createHash("sha256")
    .update(payload.otp)
    .digest("hex");

  const redisKey = `vaulty:password-reset-otp:${user.id}`;

  const storedOtp = await redis.get<string>(redisKey);

  if (!storedOtp || storedOtp !== hashedOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });

  // Make OTP single-use.
  await redis.del(redisKey);
};

const deleteMyAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null,
    }
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (user.deletedAt) {
    throw new AppError(StatusCodes.CONFLICT, "User account is already deleted.");
  }


  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const userService = {
  updateMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteMyAccount,
};
