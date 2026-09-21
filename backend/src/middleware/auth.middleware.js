// SCAFFOLD ONLY | TODO: Authenticate incoming requests and make the current user available to handlers.
import jwt from "jsonwebtoken";
import env from "../config/env.config.js";
import { AppError } from "../utils/errors.js";
import { catchAsync } from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(
      "You are not logged in. Please log in to access this resource",
      401,
    );
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }

  // بنحط الـ userId بس دلوقتي؛ أي controller محتاج بيانات المستخدم كاملة هيجيبها من DB بنفسه
  req.userId = decoded.userId;
  next();
});
