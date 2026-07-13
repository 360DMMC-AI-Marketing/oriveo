import { encrypt, decrypt, isEncryptionConfigured } from "./encryption.js";

export default function encryptPlugin(schema, options) {
  const fields = options?.fields || [];

  if (!fields.length || !isEncryptionConfigured()) return;

  schema.pre("save", function (next) {
    for (const field of fields) {
      if (this.isModified(field) && this[field]) {
        this[field] = encrypt(this[field]);
      }
    }
    next();
  });

  schema.post("init", function () {
    for (const field of fields) {
      if (this[field]) {
        this[field] = decrypt(this[field]);
      }
    }
  });

  if (!schema.options.toJSON) schema.options.toJSON = {};
  if (!schema.options.toJSON.transform) {
    schema.options.toJSON.transform = function (doc, ret) {
      for (const field of fields) {
        if (ret[field]) {
          ret[field] = decrypt(ret[field]);
        }
      }
      return ret;
    };
  }
}
