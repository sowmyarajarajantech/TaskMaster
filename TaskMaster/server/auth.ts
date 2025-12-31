import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { type Request, Response, NextFunction } from "express";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.SESSION_SECRET || "default_secret";

/**
 * Hashes a plain text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password.
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a signed JWT token.
 */
export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Middleware to verify signed tokens from headers.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).decodedData = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
