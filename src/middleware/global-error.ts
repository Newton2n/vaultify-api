import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError} from "../utils/app-error"

type TErrorDetail = {
	field: string;
	message: string;
};

const globalError = (
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
	let message = "Internal server error.";
	let errors: TErrorDetail[] = [];

	if (!(err instanceof AppError)) {
		console.error("Unexpected error:", err);
	}

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errors = err.errors as TErrorDetail[];
	} else if (err instanceof ZodError) {
		statusCode = StatusCodes.BAD_REQUEST;
		message = "Validation failed.";

		errors = err.issues.map((issue) => ({
			field: (issue.path[0] === "body" ? issue.path.slice(1) : issue.path).join(
				".",
			),
			message: issue.message,
		}));
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		switch (err.code) {
			case "P2002":
				statusCode = StatusCodes.CONFLICT;
				message = "A resource with the provided value already exists.";
				break;

			case "P2025":
				statusCode = StatusCodes.NOT_FOUND;
				message = "Resource not found.";
				break;

			case "P2003":
			case "P2014":
				statusCode = StatusCodes.BAD_REQUEST;
				message = "The requested operation is invalid.";
				break;

			default:
				message = "Database request failed.";
		}
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = StatusCodes.BAD_REQUEST;
		message = "The request could not be processed.";
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		statusCode = StatusCodes.SERVICE_UNAVAILABLE;
		message = "The service is temporarily unavailable.";
	} else if (err instanceof Prisma.PrismaClientRustPanicError) {
		message = "Internal server error.";
	} else if (err instanceof Error && err.name === "TokenExpiredError") {
		statusCode = StatusCodes.UNAUTHORIZED;
		message = "Access token expired.";
	} else if (err instanceof Error && err.name === "JsonWebTokenError") {
		statusCode = StatusCodes.UNAUTHORIZED;
		message = "Invalid access token.";
	}

	return res.status(statusCode).json({
		success: false,
		statusCode,
		message,
		errors,
	});
};

export default globalError;