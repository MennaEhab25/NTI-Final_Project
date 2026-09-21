// SCAFFOLD ONLY | TODO: Return a standard 404 response for unknown API endpoints.
import { AppError } from "../utils/errors.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
