import { encrypt, decrypt, isEncryptionConfigured } from "./encryption.js";

function isStructured(schema, field) {
  const pathDef = schema.path(field);
  if (!pathDef) return false;
  return pathDef.instance === "Array" || pathDef.instance === "Object" || pathDef.instance === "Mixed" || pathDef.instance === "Embedded";
}

function encryptValue(value, structured) {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value === "string") {
    if (structured) return `js0:${encrypt(JSON.stringify(value))}`;
    return encrypt(value);
  }
  if (typeof value === "object") {
    return `js0:${encrypt(JSON.stringify(value))}`;
  }
  return value;
}

function decryptValue(value, structured) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  if (value.startsWith("js0:")) {
    const dec = decrypt(value.slice(4));
    try {
      return JSON.parse(dec);
    } catch {
      return dec;
    }
  }
  return decrypt(value);
}

export default function encryptPlugin(schema, options) {
  const fields = options?.fields || [];

  if (!fields.length || !isEncryptionConfigured()) return;

  const structuredFields = new Set(fields.filter((f) => isStructured(schema, f)));
  const isStructuredField = (field) => structuredFields.has(field);

  schema.pre("save", function (next) {
    for (const field of fields) {
      if (this.isModified(field) && this[field]) {
        this[field] = encryptValue(this[field], isStructuredField(field));
      }
    }
    next();
  });

  schema.pre(["updateOne", "findOneAndUpdate", "findOneAndReplace"], function (next) {
    const update = this.getUpdate?.();
    if (!update) return next();
    const set = update.$set || update;
    for (const field of fields) {
      if (set[field] !== undefined && set[field] !== null) {
        set[field] = encryptValue(set[field], isStructuredField(field));
      }
    }
    next();
  });

  schema.post("init", function () {
    for (const field of fields) {
      if (this[field] !== undefined && this[field] !== null) {
        this[field] = decryptValue(this[field], isStructuredField(field));
      }
    }
  });

  if (!schema.options.toJSON) schema.options.toJSON = {};
  if (!schema.options.toJSON.transform) {
    schema.options.toJSON.transform = function (doc, ret) {
      for (const field of fields) {
        if (ret[field]) {
          ret[field] = decryptValue(ret[field], isStructuredField(field));
        }
      }
      return ret;
    };
  }
}

export function decryptLeanDoc(doc, fields = []) {
  if (!doc || typeof doc !== "object") return doc;
  const isArray = Array.isArray(doc);
  const list = isArray ? doc : [doc];
  for (const item of list) {
    for (const field of fields) {
      if (item && item[field] !== undefined && item[field] !== null) {
        item[field] = decryptValue(item[field], false);
      }
    }
  }
  return doc;
}
