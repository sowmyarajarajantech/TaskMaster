import express, { type Request, Response } from "express";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";

const router = express.Router();

// Get all tasks
router.get("/", async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).decodedData?.userId;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: Missing owner information" });
    }

    const tasks = await storage.getTasksByOwner(ownerId);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create task
router.post("/", async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).decodedData?.userId;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: Missing owner information" });
    }

    const taskData = insertTaskSchema.parse({
      ...req.body,
      ownerId,
    });

    const task = await storage.createTask(taskData);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update task
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).decodedData?.userId;
    const taskId = parseInt(req.params.id);
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const task = await storage.updateTaskWithOwner(taskId, ownerId, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).decodedData?.userId;
    const taskId = parseInt(req.params.id);
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const success = await storage.deleteTaskWithOwner(taskId, ownerId);
    if (!success) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
