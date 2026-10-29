import { Response } from "express";

interface TMeta {
  page: number;
  limit: number;
  total: number;
}

interface TSuccessResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: TMeta;
}

export const sendSuccessResponse = <T>(
  res: Response,
  data: TSuccessResponse<T>,
) => {
  res.status(data.statusCode).json({
    success: true,
    message: data.message,
    data: data.data,
    meta :data?.meta
  });
};