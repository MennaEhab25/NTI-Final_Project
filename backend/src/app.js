// SCAFFOLD ONLY | TODO: Configure the Express application, shared middleware, API routes, and error handling.
import express from "express";
import cors from "cors";
import helmet from "helmet";

import router from "./http/router.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - بسيط للتأكد إن السيرفر شغال
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// كل الـ API routes تحت بادئة واحدة
app.use("/api", router);

// لازم يجوا في الآخر بالترتيب ده بالظبط
app.use(notFound);
app.use(errorHandler);

export default app;
