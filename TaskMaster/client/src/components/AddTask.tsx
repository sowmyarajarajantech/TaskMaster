import { useState, useEffect } from "react";
import { Plus, Loader2, Folder, Flag, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { type List } from "@shared/schema";
import { cn } from "@/lib/utils";

export function AddTask() {
  const [text, setText] = useState("");
  const [listId, setListId] = useState<string>("none");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const { toast } = useToast();

  // Load default priority from preferences
  useEffect(() => {
    const prefs = localStorage.getItem("app-preferences");
    if (prefs) {
      try {
        const { defaultTaskPriority } = JSON.parse(prefs);
        if (defaultTaskPriority) setPriority(defaultTaskPriority);
      } catch (e) {}
    }
  }, []);

  const { data: lists } = useQuery<List[]>({ 
    queryKey: [api.lists.list.path] 
  });

  const createTask = useMutation({
    mutationFn: async (task: { 
      title: string, 
      listId?: number | null, 
      priority: string,
      dueDate?: string | null,
      recurrence: "none" | "daily" | "weekly" | "monthly"
    }) => {
      const result = await apiRequest("POST", api.tasks.create.path, task);
      const newTask = await result.json();
      if (tagInput.trim()) {
        const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
        localStorage.setItem(`tags-${newTask.id}`, JSON.stringify(tags));
      }
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      setText("");
      setDueDate("");
      setPriority("medium");
      setTagInput("");
      setRecurrence("none");
      toast({ title: "Task added successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || createTask.isPending) return;
    createTask.mutate({ 
      title: text.trim(),
      listId: listId === "none" ? null : parseInt(listId),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      recurrence
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative group z-10 flex flex-col gap-3" aria-label="Add new task">
      <div className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="Task title"
          className="w-full h-14 pl-6 pr-14 rounded-2xl bg-card border-2 border-transparent focus:border-secondary/50 focus:outline-none focus:ring-4 focus:ring-secondary/10 transition-all duration-300 placeholder:text-foreground/50 text-lg shadow-lg"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim() || createTask.isPending}
          aria-label="Add task"
          className="absolute right-2 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {createTask.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-3 px-2">
        {/* List Selector */}
        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-xl border border-border/50">
          <Folder className="h-4 w-4 text-secondary" aria-hidden="true" />
          <select 
            value={listId} 
            onChange={(e) => setListId(e.target.value)}
            aria-label="Select list"
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-foreground/80"
          >
            <option value="none" className="bg-background text-foreground">No List</option>
            {lists?.map(list => (
              <option key={list.id} value={list.id.toString()} className="bg-background text-foreground">
                {list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-xl border border-border/50">
          <Flag className={cn(
            "h-4 w-4",
            priority === "high" ? "text-primary" : priority === "medium" ? "text-secondary" : "text-muted-foreground"
          )} aria-hidden="true" />
          <select 
            value={priority} 
            onChange={(e) => {
              const val = e.target.value as any;
              setPriority(val);
              // Save as default for next tasks
              const prefs = JSON.parse(localStorage.getItem("app-preferences") || "{}");
              prefs.defaultTaskPriority = val;
              localStorage.setItem("app-preferences", JSON.stringify(prefs));
            }}
            aria-label="Select priority"
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-foreground/80"
          >
            <option value="low" className="bg-background text-foreground text-sm">Low Priority</option>
            <option value="medium" className="bg-background text-foreground text-sm">Medium Priority</option>
            <option value="high" className="bg-background text-foreground text-sm">High Priority</option>
          </select>
        </div>

        {/* Due Date Selector */}
        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-xl border border-border/50">
          <CalendarIcon className="h-4 w-4 text-secondary" aria-hidden="true" />
          <input 
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Select due date"
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-foreground/80 [color-scheme:dark]"
          />
        </div>

        {/* Recurrence Selector */}
        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-xl border border-border/50">
          <Loader2 className={cn("h-4 w-4 text-secondary", recurrence === "none" && "opacity-30")} aria-hidden="true" />
          <select 
            value={recurrence} 
            onChange={(e) => setRecurrence(e.target.value as any)}
            aria-label="Select recurrence"
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-foreground/80"
          >
            <option value="none" className="bg-background text-foreground text-sm">No Recurrence</option>
            <option value="daily" className="bg-background text-foreground text-sm">Daily</option>
            <option value="weekly" className="bg-background text-foreground text-sm">Weekly</option>
            <option value="monthly" className="bg-background text-foreground text-sm">Monthly</option>
          </select>
        </div>

        {/* Tags Input */}
        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-xl border border-border/50">
          <input 
            type="text"
            placeholder="Tags (comma separated)..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            aria-label="Tags (comma separated)"
            className="bg-transparent text-sm font-medium focus:outline-none text-foreground/80 placeholder:text-foreground/40 w-32 md:w-48"
          />
        </div>
      </div>
    </form>
  );
}
