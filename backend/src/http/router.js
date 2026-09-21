// SCAFFOLD ONLY | TODO: Collect API routes, match requests, check authentication and roles, and dispatch handlers.
import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";

const router = Router();

router.use('/auth', authRoutes);

export default router;
