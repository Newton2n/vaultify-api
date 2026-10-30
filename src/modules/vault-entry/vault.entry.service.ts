import { VaultEntryWhereInput } from "../../../generated/prisma/models";
import { VaultCategory } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
  TCreateVaultEntryPayload,
  TUpdateVaultEntryPayload,
  TVaultEntrySearchQuery,
} from "./vault.entry.schema";

// Create a vault entry
const create = async (userId: string, payload: TCreateVaultEntryPayload) => {
  const entry = await prisma.vaultEntry.create({
    data: {
      ...payload,
      userId,
    },
  });

  return entry;
};

// Get all entries belonging to the authenticated user
const getAll = async (userId: string, queryPayload: TVaultEntrySearchQuery) => {
  const { page, limit, search, category, isSensitive, tag, sortBy, sortOrder } =
    queryPayload;

  const skip = (page - 1) * limit;

  const whereClause: VaultEntryWhereInput = {
    userId,
  };

  if (category) {
    whereClause.category = category as VaultCategory;
  }

  if (isSensitive !== undefined) {
    whereClause.isSensitive = isSensitive;
  }

  if (tag) {
    whereClause.tags = {
      has: tag,
    };
  }

  if (search) {
    whereClause.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Exclude soft-deleted entries
  whereClause.deletedAt = null;

  const orderBy = {
    [sortBy]: sortOrder,
  };

  // Get total count and paginated entries in a single transaction
  const [totalRow, entries] = await prisma.$transaction([
    prisma.vaultEntry.count({
      where: whereClause,
    }),
    prisma.vaultEntry.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy,
    }),
  ]);

  return {
    meta: {
      currentPage: page,
      limit,
      totalRow,
      totalPage: Math.ceil(totalRow / limit),
    },
    data: entries,
  };
};

// Get one entry owned by the authenticated user
const getById = async (userId: string, entryId: string) => {
  const entry = await prisma.vaultEntry.findFirst({
    where: {
      id: entryId,
      userId,
      deletedAt: null,
    },
  });

  if (!entry) {
    throw new Error("Vault entry not found.");
  }

  return entry;
};

// Update an entry owned by the authenticated user
const update = async (
  userId: string,
  entryId: string,
  payload: TUpdateVaultEntryPayload,
) => {
  const existingEntry = await prisma.vaultEntry.findFirstOrThrow({
    where: {
      id: entryId,
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  const updatedEntry = await prisma.vaultEntry.update({
    where: {
      id: existingEntry.id,
    },
    data: payload,
  });

  return updatedEntry;
};

// Delete an entry owned by the authenticated user
const remove = async (userId: string, entryId: string) => {
  const existingEntry = await prisma.vaultEntry.findFirstOrThrow({
    where: {
      id: entryId,
      userId,
    },
    select: {
      id: true,
    },
  });

  const deletedEntry = await prisma.vaultEntry.update({
    where: {
      id: existingEntry.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return deletedEntry;
};

export const vaultEntryService = {
  create,
  getAll,
  getById,
  update,
  remove,
};
