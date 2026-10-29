import { prisma } from "../../lib/prisma";
import { TLoginPayload, TRegistrationPayload } from "./auth.schema";
import bcrypt from "bcryptjs";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";

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

export const authService = { register, login, getMe, refreshToken };
