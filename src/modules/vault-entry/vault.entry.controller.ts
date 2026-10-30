
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catch-async";
import { sendSuccessResponse } from "../../utils/response";
import { vaultEntryService } from "./vault.entry.service"
import { AppError } from "../../utils/app-error";

//create vault entry
const create = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please log in to create a vault entry.");
  }

  const result = await vaultEntryService.create(userId, req.body);

  sendSuccessResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Vault entry created successfully",
    data: { result },
  });
});

//get all vault entries
const getAll = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please log in to view your vault entries.");
  }

  const result = await vaultEntryService.getAll(
    userId,
    req.validatedQuery,
  );

  sendSuccessResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Vault entries retrieved successfully",
    data: { result },
  });
});

//get vault entry by id
const getById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please log in to access your vault.");
  }

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Vault entry ID is required.");
  }

  const result = await vaultEntryService.getById(userId, id as string);

  sendSuccessResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Vault entry retrieved successfully",
    data: { result },
  });
});

//update vault entry by id
const update = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please log in to update a vault entry.");
  }

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Vault entry ID is required.");
  }

  const result = await vaultEntryService.update(userId, id as string, req.body);

  sendSuccessResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Vault entry updated successfully",
    data: { result },
  });
});

//delete vault entry by id
const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please log in to delete a vault entry.");
  }

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Vault entry ID is required.");
  }

  const result = await vaultEntryService.remove(userId, id as string);

  sendSuccessResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Vault entry deleted successfully",
    data: { result },
  });
});

export const vaultEntryController = {
  create,
  getAll,
  getById,
  update,
  remove,
};
