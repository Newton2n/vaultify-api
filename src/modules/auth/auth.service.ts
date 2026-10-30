import { prisma } from "../../lib/prisma";
import {
  TLoginPayload,
  TRegistrationPayload,
  TSendVerificationEmail,
  TVerifyEmail,
} from "./auth.schema";
import bcrypt from "bcryptjs";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { redis } from "../../lib/redis";
import { AppError } from "../../utils/app-error";
import { StatusCodes } from "http-status-codes";
import crypto from "node:crypto";
import { mailService } from "../../services/mail";

//register user
const register = async (payload: TRegistrationPayload) => {
  const hashPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );
  const { password, ...restItem } = payload;

  const result = await prisma.user.create({
    data: {
      passwordHash: hashPassword,
      ...restItem,
    },
  });

  return result;
};

//log in
const login = async (payload: TLoginPayload) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  const checkPassword = await bcrypt.compare(
    payload.password,
    user?.passwordHash!,
  );
  if (!checkPassword) {
    throw new Error("Invalid Credential");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  // jwt access token generate
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  //jwt refreshToken generate
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken,
    jwtPayload,
  };
};

//get user
const getMe = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    omit: {
      passwordHash: true,
    },
  });
  return user;
};

//generate refresh token
const refreshToken = async (refreshToken: string) => {
  const verifyToken = jwtUtils.verifyToken(
    refreshToken,
    config.jwt_refresh_secret!,
  );

  if (!verifyToken.data) {
    throw new Error(verifyToken.error);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: verifyToken.data.id,
    },
    omit: {
      passwordHash: true,
    },
  });

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in!,
  );

  return { accessToken, jwtPayload };
};

//send verification email
const sendVerificationEmail = async (
  payload: TSendVerificationEmail,
  loginUserEmail: string,
) => {
  const email = payload.email.trim().toLowerCase();
  if (email !== loginUserEmail) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only send verification email to your own email address.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
      deletedAt: null,
    },
  });

  // Not revealing whether the email exists.
  if (!user) {
    return;
  }

  if (user.isEmailVerified) {
    return;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const VERIFY_EMAIL_OTP_EXPIRY = 60 * 5; // 5 minutes

  const redisKey = `vaulty:email-verification-otp:${user.id}`;

  await redis.set(redisKey, hashedOtp, {
    ex: VERIFY_EMAIL_OTP_EXPIRY,
  });


  await mailService.sendEmailVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });
};

//verify email
const verifyEmail = async (payload: TVerifyEmail, loginUserEmail: string) => {
  const email = payload.email.trim().toLowerCase();

  if (email !== loginUserEmail) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only verify your own email address.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or OTP.");
  }

  if (user.isEmailVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Email is already verified.");
  }

  const hashedOtp = crypto
    .createHash("sha256")
    .update(payload.otp)
    .digest("hex");

  const redisKey = `vaulty:email-verification-otp:${user.id}`;

  const storedOtp = await redis.get<string>(redisKey);


  if (!storedOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP.");
  }

  if (storedOtp !== hashedOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isEmailVerified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Make OTP single-use
  await redis.del(redisKey);

  return updatedUser;
};

export const authService = {
  register,
  login,
  getMe,
  refreshToken,
  sendVerificationEmail,
  verifyEmail,
};
