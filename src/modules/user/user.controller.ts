import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../utils/app-error";

import catchAsync from "../../utils/catch-async";
import { sendSuccessResponse } from "../../utils/response";
import { userService } from "./user.service";

const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User ID is missing in the request context.",
      );
    }

    const result = await userService.updateMyProfile(req.user.id, req.body);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: result,
    });
  },
);

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User ID is missing in the request context.",
      );
    }

    await userService.changePassword(req.user.id, req.body);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Password changed successfully",
      data: null,
    });
  },
);

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await userService.forgotPassword(req.body);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message:
        "If an account with this email exists, a password reset link has been sent.",
      data: null,
    });
  },
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await userService.resetPassword(req.body);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Password reset successfully",
      data: null,
    });
  },
);

const deleteMyAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User ID is missing in the request context.",
      );
    }

    await userService.deleteMyAccount(req.user.id);

    sendSuccessResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Account deleted successfully",
      data: null,
    });
  },
);

export const userController = {
  updateMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,

  deleteMyAccount,
};
