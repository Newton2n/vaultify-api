
import { VaultEntryWhereInput } from "../../../generated/prisma/models";
import { VaultCategory } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
  TCreateVaultEntryPayload,
  TUpdateVaultEntryPayload,
  TVaultEntrySearchQuery,
} from "./vault.entry.schema";
import { encrypt, decrypt } from "../../utils/encryption";

// Create a vault entry
const create = async (
  userId: string,
  payload: TCreateVaultEntryPayload,
) => {
  const isSensitive = payload.isSensitive ?? false;

  // Encrypt the value only if it is sensitive
  const value = isSensitive
    ? encrypt(payload.value)
    : payload.value;

  const entry = await prisma.vaultEntry.create({
    data: {
      ...payload,
      value,
      userId,
    },
  });

  // Return the original readable value
  return {
    ...entry,
    value: isSensitive ? decrypt(entry.value) : entry.value,
  };
};

// Get all entries belonging to the authenticated user
const getAll = async (
  userId: string,
  queryPayload: TVaultEntrySearchQuery,
) => {
  const {
    page,
    limit,
    search,
    category,
    isSensitive,
    tag,
    sortBy,
    sortOrder,
  } = queryPayload;

  const skip = (page - 1) * limit;

  const whereClause: VaultEntryWhereInput = {
    userId,
    deletedAt: null,
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

  const orderBy = {
    [sortBy]: sortOrder,
  };

  // Get total count and entries together
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

  // Decrypt sensitive values before returning them
  const decryptedEntries = entries.map((entry) => ({
    ...entry,
    value: entry.isSensitive
      ? decrypt(entry.value)
      : entry.value,
  }));

  return {
    meta: {
      currentPage: page,
      limit,
      totalRow,
      totalPage: Math.ceil(totalRow / limit),
    },
    data: decryptedEntries,
  };
};

// Get one entry owned by the authenticated user
const getById = async (
  userId: string,
  entryId: string,
) => {
  const entry = await prisma.vaultEntry.findFirstOrThrow({
    where: {
      id: entryId,
      userId,
      deletedAt: null,
    },
  });

  // Decrypt the value if it is sensitive
  return {
    ...entry,
    value: entry.isSensitive
      ? decrypt(entry.value)
      : entry.value,
  };
};

// Update an entry owned by the authenticated user
const update = async (
  userId: string,
  entryId: string,
  payload: TUpdateVaultEntryPayload,
) => {

  // Use a transaction to ensure atomicity of read and write operations
  return prisma.$transaction(async (tx) => {
    const existingEntry = await tx.vaultEntry.findFirstOrThrow({
      where: {
        id: entryId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        isSensitive: true,
        value: true,
      },
    });

    const wasSensitive = existingEntry.isSensitive;

    // Keep the previous setting if the user doesn't provide one
    const isSensitive = payload.isSensitive ?? wasSensitive;

    const updateData = { ...payload };

    // A new value was provided
    if (payload.value !== undefined) {
      updateData.value = isSensitive
        ? encrypt(payload.value)
        : payload.value;
    }
    // Only the sensitivity setting changed
    else if (wasSensitive !== isSensitive) {
      updateData.value = isSensitive
        ? encrypt(existingEntry.value)
        : decrypt(existingEntry.value);
    }

    const updatedEntry = await tx.vaultEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: updateData,
    });

    // Return a readable value
    return {
      ...updatedEntry,
      value: isSensitive
        ? decrypt(updatedEntry.value)
        : updatedEntry.value,
    };
  });
};

// Soft delete an entry owned by the authenticated user
const remove = async (
  userId: string,
  entryId: string,
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

  await prisma.vaultEntry.update({
    where: {
      id: existingEntry.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    message: "Vault entry deleted successfully",
  };
};

export const vaultEntryService = {
  create,
  getAll,
  getById,
  update,
  remove,
};
