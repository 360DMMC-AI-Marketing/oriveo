import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = process.env.PHI_ENCRYPTION_KEY
  ? Buffer.from(process.env.PHI_ENCRYPTION_KEY, "hex")
  : null;

function getKey() {
  if (!KEY) return null;
  if (KEY.length !== 32) {
    throw new Error(`PHI_ENCRYPTION_KEY must be 64 hex chars (32 bytes), got ${KEY.length} bytes`);
  }
  return KEY;
}

export function encrypt(text) {
  const key = getKey();
  if (!key || !text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encoded) {
  const key = getKey();
  if (!key || !encoded) return encoded;
  if (!encoded.includes(":")) return encoded;
  const parts = encoded.split(":");
  if (parts.length !== 3) return encoded;
  const [ivHex, authTagHex, encrypted] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encoded;
  }
}

export function hashPhone(phone) {
  if (!phone) return "";
  return crypto.createHash("sha256").update(phone.replace(/\D/g, "")).digest("hex");
}

export function isEncryptionConfigured() {
  return !!process.env.PHI_ENCRYPTION_KEY;
}
