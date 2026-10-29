export class AppError extends Error {
	constructor(
		public statusCode: number,
		message: string,
		public errors: unknown[] = [],
	) {
		super(message);

		this.name = "AppError";

		Error.captureStackTrace(this, this.constructor);
	}
}