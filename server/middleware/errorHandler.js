export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, _next) {
  const isMulterError = err?.name === "MulterError" || err?.code === "LIMIT_FILE_SIZE";
  const statusCode = err.statusCode || (isMulterError ? 400 : 500);
  const message = err.isOperational || isMulterError ? err.message : "Internal server error";
  if (!err.isOperational) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }
  res.status(statusCode).json({ message });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
