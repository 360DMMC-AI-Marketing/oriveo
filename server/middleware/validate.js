import { ZodError } from "zod";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({ message: messages.join("; ") });
      }
      next(error);
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({ message: messages.join("; ") });
      }
      next(error);
    }
  };
}
