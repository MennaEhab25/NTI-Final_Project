export function successResponse(res, statusCode, data, message = 'Success') {
  return res.status(statusCode).json({ success: true, data, message });
}
