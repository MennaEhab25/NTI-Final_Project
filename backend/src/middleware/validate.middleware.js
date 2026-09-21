import { AppError } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) throw new AppError(result.error.issues[0]?.message || 'Invalid data', 400);
  req[source] = result.data;
  next();
};
