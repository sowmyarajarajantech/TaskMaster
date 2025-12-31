import express, { type Request, Response } from "express";
import { createServer, type Server } from "http";
import userRouter from "./userRouter";
import taskRouter from "./taskRouter";
import { verifyToken } from "./auth";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Mount user routes (unprotected)
  app.use("/api", userRouter);

  // Protect all following routes
  app.use("/api/tasks", verifyToken, taskRouter);
  app.use("/api/lists", verifyToken);

  // Health check route
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
