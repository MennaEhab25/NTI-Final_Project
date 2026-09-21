// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import jwt from "jsonwebtoken";
import env from "../config/env.config.js";

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};
