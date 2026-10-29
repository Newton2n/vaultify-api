import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type BodyValidationSchema = z.ZodObject<{
  body: z.ZodTypeAny;
}>;

export const validate = (schema: BodyValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
    });

    if (!result.success) {
      res.status(400).json({
        status: "error",
        errors: result.error.issues.map((err) => ({
          field: err.path.slice(1).join("."),
          message: err.message,
        })),
      });
      return;
    }

    req.body = result.data.body;
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}

export const validateQuery = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        status: "error",
        errors: result.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
};