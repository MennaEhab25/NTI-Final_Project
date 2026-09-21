// SCAFFOLD ONLY | TODO: Load runtime configuration and start the backend HTTP server.
import app from "./app.js";
import connectDB from "./config/db.config.js";
import ConnectDB from "./config/db.config.js";
import env from "./config/env.config.js";

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(
      `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`,
    );
  });
};

startServer();