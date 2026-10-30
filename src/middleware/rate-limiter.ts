import type { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../lib/redis";
import { StatusCodes } from "http-status-codes";

const ratelimit = new Ratelimit({
  redis,
  // Maximum 20 requests per IP per 1 minute
  limiter: Ratelimit.slidingWindow(20, "1 m"),

  prefix: "vaultify:rate-limit",

  analytics: true,
});

const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {


    // Determine the client's IP address
    const forwardedFor = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];

    let ip: string;

    if (typeof realIp === "string") {
      ip = realIp;
    } else if (Array.isArray(forwardedFor)) {
      ip = forwardedFor[0];
    } else if (typeof forwardedFor === "string") {
      ip = forwardedFor.split(",")[0].trim();
    } else {
      ip = req.ip ?? "unknown-ip";
    }

    const identifier = `ip:${ip}`;

    const { success, limit, reset, pending } =
      await ratelimit.limit(identifier);

    const resetInSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));

    await pending;

    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Reset", reset);

    if (!success) {
      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        statusCode: StatusCodes.TOO_MANY_REQUESTS,
        message: "Rate limit exceeded.",
        errors: [
          {
            message: "Too many requests. Please try again later.",
            limit,
            resetInSeconds,
          },
        ],
      });

      return;
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);

    // In case of an error, allow the request to proceed
    next();
  }
};

export default rateLimiter;
