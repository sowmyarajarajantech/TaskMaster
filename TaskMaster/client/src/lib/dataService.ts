import { Task } from "@shared/schema";

const STORAGE_KEYS = {
  TASKS: "taskflow_tasks",
  LISTS: "taskflow_lists",
  PREFERENCES: "taskflow_preferences",
};

let sessionToken: string | null = localStorage.getItem("taskflow_token");

const getAuthHeader = (): Record<string, string> => {
  return sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {};
};

export const taskService = {
  setSessionToken: (token: string | null): void => {
    sessionToken = token;
    if (token) {
      localStorage.setItem("taskflow_token", token);
    } else {
      localStorage.removeItem("taskflow_token");
      // Optional: clear synced tasks on logout to prevent data mixing if needed
    }
  },

  hasSession: (): boolean => {
    return !!sessionToken;
  },

  logout: (): void => {
    taskService.setSessionToken(null);
  },

  isOnline: (): boolean => {
    return navigator.onLine;
  },

  // GET TASKS
  getTasks: async (): Promise<Task[]> => {
    if (!sessionToken) {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const res = await fetch("/api/tasks", {
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const remoteTasks = await res.json();
      taskService.saveTasks(remoteTasks);
      return remoteTasks;
    } catch (error) {
      console.warn("Remote fetch failed, falling back to local storage", error);
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : [];
    }
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  // CREATE TASK
  addTask: async (task: Task): Promise<Task> => {
    if (!sessionToken) {
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
      const localTasks = [task, ...tasks];
      taskService.saveTasks(localTasks);
      return task;
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error("Failed to create task");
      const newTask = await res.json();
      const tasks = await taskService.getTasks();
      taskService.saveTasks([newTask, ...tasks]);
      return newTask;
    } catch (error) {
      console.warn("Remote create failed, saving locally", error);
      const tasks = await taskService.getTasks();
      const localTasks = [task, ...tasks];
      taskService.saveTasks(localTasks);
      return task;
    }
  },

  // UPDATE TASK
  updateTask: async (updatedTask: Task): Promise<Task> => {
    if (!sessionToken) {
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
      const updatedTasks = tasks.map((t: Task) => (t.id === updatedTask.id ? updatedTask : t));
      taskService.saveTasks(updatedTasks);
      return updatedTask;
    }
    try {
      const res = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error("Failed to update task");
      const remoteTask = await res.json();
      const tasks = await taskService.getTasks();
      taskService.saveTasks(
        tasks.map((t) => (t.id === remoteTask.id ? remoteTask : t))
      );
      return remoteTask;
    } catch (error) {
      console.warn("Remote update failed, saving locally", error);
      const tasks = await taskService.getTasks();
      taskService.saveTasks(
        tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      return updatedTask;
    }
  },

  // DELETE TASK
  deleteTask: async (taskId: number): Promise<void> => {
    if (!sessionToken) {
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
      taskService.saveTasks(tasks.filter((t: Task) => t.id !== taskId));
      return;
    }
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error("Failed to delete task");
      const tasks = await taskService.getTasks();
      taskService.saveTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.warn("Remote delete failed, updating locally", error);
      const tasks = await taskService.getTasks();
      taskService.saveTasks(tasks.filter((t) => t.id !== taskId));
    }
  },
};
