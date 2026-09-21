// SCAFFOLD ONLY | TODO: Build a consistent response format for successful API requests.
export const successResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
