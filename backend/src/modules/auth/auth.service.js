// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import User from "../users/user.model.js";
import { AppError } from "../../utils/errors.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generateToken.js";
import jwt from "jsonwebtoken";
import env from "../../config/env.config.js";
import crypto from "crypto";

export const registerUser = async ({ name, email, password, roles }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password, // بيتشفر تلقائيًا في pre('save') hook جوه الـ model
    roles: roles && roles.length ? roles : ["client"],
    activeRole: roles && roles.length ? roles[0] : "client",
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status === "suspended") {
    throw new AppError("This account has been suspended", 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Refresh token is invalid", 401);
  }

  const newAccessToken = generateAccessToken(user._id);
  return newAccessToken;
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  // بنرجع نفس الرسالة سواء الإيميل موجود أو لأ — عشان محدش يقدر يستخدم الـ endpoint ده
  // "يتحقق" هل إيميل معين مسجل في المنصة ولا لأ (privacy/enumeration attack)
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقايق
  await user.save({ validateBeforeSave: false });

  // ⚠️ TODO: لسه معندناش email service في المشروع.
  // مؤقتًا بنسجله في الـ console للتطوير، وده لازم يتبدل بإرسال إيميل حقيقي
  // (يفيد تتنسق مع اللي شغال على notifications في الفريق)
  console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

  return resetToken; // مؤقتًا بترجع هنا للتيست؛ في production متترجعش في الـ response
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  user.passwordHash = newPassword; // هيتشفر تلقائيًا في pre('save')
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // نلغي أي جلسة قديمة — أمان إضافي بعد تغيير الباسورد
  await user.save();
};
