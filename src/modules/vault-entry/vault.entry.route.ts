import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { validate, validateQuery } from "../../middleware/validate";
import { vaultEntryController } from "./vault.entry.controller";
import {
  createVaultEntrySchema,
  updateVaultEntrySchema,
  vaultEntrySearchSchema,
} from "./vault.entry.schema";
import { emailVerificationMiddleware } from "../../middleware/email-verified";

const vaultEntryRoute = Router();

// Create a vault entry
vaultEntryRoute.post(
  "/",
  authMiddleware.auth(),
  validate(createVaultEntrySchema),
  emailVerificationMiddleware,
  vaultEntryController.create,
);

// Get the authenticated user's entries with filters and pagination
vaultEntryRoute.get(
  "/",
  authMiddleware.auth(),
  validateQuery(vaultEntrySearchSchema),
  vaultEntryController.getAll,
);

// Get one entry
vaultEntryRoute.get(
  "/:id",
  authMiddleware.auth(),
  vaultEntryController.getById,
);

// Update an entry
vaultEntryRoute.patch(
  "/:id",
  authMiddleware.auth(),
  validate(updateVaultEntrySchema),
  emailVerificationMiddleware,
  vaultEntryController.update,
);

// Delete an entry
vaultEntryRoute.delete(
  "/:id",
  authMiddleware.auth(),
  emailVerificationMiddleware,
  vaultEntryController.remove,
);

export default vaultEntryRoute;
