export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';

  if (error?.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path || 'ID'}`;
  } else if (error?.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors || {})[0]?.message || 'Invalid data';
  } else if (error?.code === 11000) {
    statusCode = 409;
    message = 'This value already exists';
  }

  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json({
    success: false,
    message,
  });
}
