import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const notFound = (req: Request, res: Response, next: NextFunction) => {
	res.status(StatusCodes.NOT_FOUND).json({
		success: false,
		statusCode: StatusCodes.NOT_FOUND,
		message: "The requested resource was not found.",
	});
};

export default notFound;