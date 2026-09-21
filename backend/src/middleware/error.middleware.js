// SCAFFOLD ONLY | TODO: Handle application errors and return consistent HTTP error responses.
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : "Something went wrong on the server";

  if (!err.isOperational) {
    console.error("💥 UNEXPECTED ERROR:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
