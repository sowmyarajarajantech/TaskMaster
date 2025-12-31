import { db } from "./db";
import { users, tasks, subtasks, lists, type User, type InsertUser, type Task, type InsertTask, type Subtask, type InsertSubtask, type List, type InsertList } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<(Task & { subtasks: Subtask[] })[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  
  createSubtask(taskId: number, subtask: Omit<InsertSubtask, "taskId">): Promise<Subtask>;
  updateSubtask(id: number, updates: Partial<InsertSubtask>): Promise<Subtask | undefined>;
  deleteSubtask(id: number): Promise<void>;

  getLists(): Promise<List[]>;
  createList(list: InsertList): Promise<List>;
  updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined>;
  deleteList(id: number): Promise<void>;

  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTasksByOwner(ownerId: number): Promise<Task[]>;
  updateTaskWithOwner(id: number, ownerId: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTaskWithOwner(id: number, ownerId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getTasksByOwner(ownerId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.ownerId, ownerId))
      .orderBy(tasks.createdAt);
  }

  async updateTaskWithOwner(id: number, ownerId: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
      .returning();
    return updated;
  }

  async deleteTaskWithOwner(id: number, ownerId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
      .returning();
    return !!deleted;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getTasks(): Promise<(Task & { subtasks: Subtask[] })[]> {
    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
    const allSubtasks = await db.select().from(subtasks);
    
    return allTasks.map(task => ({
      ...task,
      subtasks: allSubtasks.filter(st => st.taskId === task.id)
    }));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async createSubtask(taskId: number, subtask: Omit<InsertSubtask, "taskId">): Promise<Subtask> {
    const [newSubtask] = await db.insert(subtasks).values({ ...subtask, taskId }).returning();
    return newSubtask;
  }

  async updateSubtask(id: number, updates: Partial<InsertSubtask>): Promise<Subtask | undefined> {
    const [updated] = await db.update(subtasks).set(updates).where(eq(subtasks.id, id)).returning();
    return updated;
  }

  async deleteSubtask(id: number): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  async getLists(): Promise<List[]> {
    return await db.select().from(lists).orderBy(lists.createdAt);
  }

  async createList(insertList: InsertList): Promise<List> {
    const [list] = await db.insert(lists).values(insertList).returning();
    return list;
  }

  async updateList(id: number, updates: Partial<InsertList>): Promise<List | undefined> {
    const [updated] = await db.update(lists).set(updates).where(eq(lists.id, id)).returning();
    return updated;
  }

  async deleteList(id: number): Promise<void> {
    await db.update(tasks).set({ listId: null }).where(eq(tasks.listId, id));
    await db.delete(lists).where(eq(lists.id, id));
  }
}

export const storage = new DatabaseStorage();
