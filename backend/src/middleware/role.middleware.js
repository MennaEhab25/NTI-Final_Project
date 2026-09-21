import { AppError } from '../utils/errors.js';

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    const hasRole = req.user?.roles?.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return next(new AppError('Admin access required', 403));
    }
    next();
  };
};