const PREFIXES = {
  info: "[INFO]",
  warn: "[WARN]",
  error: "[ERROR]",
  debug: "[DEBUG]",
};

function log(level, tag, message, ...args) {
  const prefix = PREFIXES[level] || "[INFO]";
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `${prefix} ${timestamp} [${tag}] ${message}`;
  if (level === "error") {
    console.error(formatted, ...args);
  } else if (level === "warn") {
    console.warn(formatted, ...args);
  } else {
    console.log(formatted, ...args);
  }
}

export const logger = {
  info: (tag, msg, ...args) => log("info", tag, msg, ...args),
  warn: (tag, msg, ...args) => log("warn", tag, msg, ...args),
  error: (tag, msg, ...args) => log("error", tag, msg, ...args),
  debug: (tag, msg, ...args) => log("debug", tag, msg, ...args),
};
