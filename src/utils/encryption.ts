
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import config from "../config";
import { AppError } from "./app-error";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const encryptionKey = config.encryption_key;

if (!encryptionKey || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
  throw new AppError(400, "Invalid encryption key");
}

const key = Buffer.from(encryptionKey, "hex");

// Encrypt a value before saving it to the database
export const encrypt = (value: string): string => {
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV, authentication tag and encrypted value
  const result = Buffer.concat([iv, authTag, encrypted]);

  return `v1:${result.toString("base64")}`;
};

// Decrypt a value after retrieving it from the database
export const decrypt = (value: string): string => {
  const [version, encryptedData] = value.split(":");

  if (version !== "v1" || !encryptedData) {
    throw new AppError(400, "Invalid encrypted data");
  }

  const data = Buffer.from(encryptedData, "base64");

  const iv = data.subarray(0, IV_LENGTH);

  const authTag = data.subarray(
    IV_LENGTH,
    IV_LENGTH + AUTH_TAG_LENGTH,
  );

  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
