import express, { type Request, Response } from "express";
import { storage } from "./storage";
import { hashPassword, comparePasswords, signToken } from "./auth";
import { insertUserSchema } from "@shared/schema";

const router = express.Router();

// Register placeholder
router.post("/register", async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const passwordHash = await hashPassword(req.body.password);
    const user = await storage.createUser({
      ...userData,
      passwordHash,
    });

    res.status(201).json({ 
      message: "User registered successfully", 
      user: { id: user.id, email: user.email } 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login placeholder
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await comparePasswords(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({ 
      message: "Logged in successfully", 
      token,
      user: { id: user.id, email: user.email } 
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
