import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"), // Lucide icon name
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  listId: integer("list_id").references(() => lists.id),
  userId: integer("user_id").references(() => users.id),
  ownerId: integer("owner_id").references(() => users.id),
  tags: text("tags").array(),
  recurrence: text("recurrence", { enum: ["none", "daily", "weekly", "monthly"] }).notNull().default("none"),
  parentTaskId: integer("parent_task_id"),
});

export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
