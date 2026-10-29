import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/app-error";

export const emailVerificationMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.user) {
		next(
			new AppError(
				StatusCodes.UNAUTHORIZED,
				"You are not logged in. Please log in to access this resource.",
			),
		);
		return;
	}

	const user = req.user;

	if (!user) {
		next(new AppError(StatusCodes.NOT_FOUND, "User not found."));
		return;
	}

	if (!user.isEmailVerified) {
		next(
			new AppError(
				StatusCodes.FORBIDDEN,
				"Please verify your email before accessing this resource.",
			),
		);
		return;
	}

	next();
};