// utils/hash.js
import crypto from "crypto";

export const hashString = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
