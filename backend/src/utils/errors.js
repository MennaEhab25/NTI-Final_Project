// SCAFFOLD ONLY | TODO: Define application errors and shared validation helpers for required values, text, and monetary amounts.
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // خطأ متوقع (زي "user not found") مش bug في الكود
    Error.captureStackTrace(this, this.constructor);
  }
}
