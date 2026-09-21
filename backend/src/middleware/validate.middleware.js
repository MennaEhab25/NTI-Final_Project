import { AppError } from "../utils/errors.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new AppError(firstError.message, 400);
  }

  req.body = result.data; // بيانات نضيفة بعد التحقق (زي email بقى lowercase تلقائيًا)
  next();
};
