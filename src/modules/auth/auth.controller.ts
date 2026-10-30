import { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catch-async";
import { authService } from "./auth.service";
import { sendSuccessResponse } from "../../utils/response";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../utils/app-error";

//register user
const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    const result = await authService.register(payload);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.CREATED,
      message: "User Created Successfully",
      data: result,
    });
  },
);

//login user
const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { accessToken, refreshToken, jwtPayload } =
      await authService.login(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message:
        "User logged in successfully and Access token generated successfully",
      data: {
        user: jwtPayload,
        accessToken,
        refreshToken,
      },
    });
  },
);

//get me
const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user?.id) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Can not fetch user please log in again",
      );
    }
    const result = await authService.getMe(user?.id);
    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "User data retrieve successfully",
      data: result,
    });
  },
);

//generate refresh token
const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Sorry You Are Logged Out Please Log In Again",
      );
    }

    const { accessToken, jwtPayload } =
      await authService.refreshToken(refreshToken);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Access token generate successfully",
      data: {
        accessToken,
        user: jwtPayload,
      },
    });
  },
);

//send verification email
const sendVerificationEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User is not authenticated. Please log in again.",
      );
    }

    if (user.isEmailVerified) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email is already verified.");
    }

    await authService.sendVerificationEmail(user.email, user.id, user.name);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message:
        "Email verification OTP sent successfully. Please check your email.",
      data: null,
    });
  },
);

//verify email
const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User is missing in the request. Please log in again.",
      );
    }

    if (user.isEmailVerified) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email is already verified.");
    }

    if (!req.body.otp) {
      throw new AppError(StatusCodes.BAD_REQUEST, "OTP is required.");
    }

    const result = await authService.verifyEmail(user.id, req.body.otp);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Email verified successfully.",
      data: result,
    });
  },
);

export const authController = {
  register,
  login,
  getMe,
  refreshToken,
  sendVerificationEmail,
  verifyEmail,
};
