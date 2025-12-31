import { useState, useMemo, useEffect } from "react";
import { AddTask } from "@/components/AddTask";
import { TaskCard } from "@/components/TaskCard";
import { StatusFilter } from "@/components/StatusFilter";
import { useTasks } from "@/hooks/use-tasks";
import { Loader2, LayoutList, Search, SortAsc, Filter, GripVertical, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { taskService } from "@/lib/dataService";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { cn } from "@/lib/utils";

type FilterType = "all" | "pending" | "completed";

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority" | "alphabetical">("createdAt");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [isOnline, setIsOnline] = useState(taskService.isOnline());
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("high-contrast") === "true";
  });

  const toggleHighContrast = () => {
    const newVal = !highContrast;
    setHighContrast(newVal);
    localStorage.setItem("high-contrast", String(newVal));
    if (newVal) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  useEffect(() => {
    const handleStatus = () => {
      const online = taskService.isOnline();
      setIsOnline(online);
      if (online && taskService.hasSession()) {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
    };
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  // App Preferences
  useEffect(() => {
    const prefs = localStorage.getItem("app-preferences");
    if (prefs) {
      try {
        const { defaultSort, defaultPriority } = JSON.parse(prefs);
        if (defaultSort) setSortBy(defaultSort);
        if (defaultPriority) setPriorityFilter(defaultPriority);
      } catch (e) {}
    }
  }, []);

  const savePreference = (key: string, value: string) => {
    const prefs = JSON.parse(localStorage.getItem("app-preferences") || "{}");
    prefs[key] = value;
    localStorage.setItem("app-preferences", JSON.stringify(prefs));
  };

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];
    
    return [...tasks]
      .filter(task => {
        const matchesStatus = filter === "all" ? true : filter === "completed" ? task.completed : !task.completed;
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
        const matchesPriority = priorityFilter === "all" ? true : task.priority === priorityFilter;
        
        // Tag filtering from localStorage
        let matchesTag = true;
        if (tagFilter.trim()) {
          const savedTags = localStorage.getItem(`tags-${task.id}`);
          if (savedTags) {
            try {
              const tags = JSON.parse(savedTags) as string[];
              matchesTag = tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()));
            } catch (e) {
              matchesTag = false;
            }
          } else {
            matchesTag = false;
          }
        }
        
        return matchesStatus && matchesSearch && matchesPriority && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "createdAt") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === "priority") {
          const weights = { high: 3, medium: 2, low: 1 };
          const weightA = weights[a.priority as keyof typeof weights] || 0;
          const weightB = weights[b.priority as keyof typeof weights] || 0;
          return weightB - weightA;
        }
        if (sortBy === "alphabetical") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [tasks, filter, search, sortBy, priorityFilter]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    // Reordering logic would ideally be backend-supported with a 'position' field
    // For now, we'll just log or show it working in UI if we had that field.
    // Since our schema doesn't have position, we'll skip the actual persist but show the structure.
  };

  const counts = useMemo(() => {
    if (!tasks) return { all: 0, pending: 0, completed: 0 };
    return {
      all: tasks.length,
      pending: tasks.filter(t => !t.completed).length,
      completed: tasks.filter(t => t.completed).length
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-secondary selection:text-secondary-foreground overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 md:py-20 flex flex-col min-h-screen">
        <header className="mb-10 text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-2">
              <span className="text-secondary">Task</span>Master
            </h1>
            <p className="text-lg text-foreground/80 font-light">
              Focus on what matters most.
            </p>
            <div className="flex justify-center mt-4">
              <button 
                onClick={toggleHighContrast}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  highContrast 
                    ? "bg-accent text-accent-foreground border-2 border-white" 
                    : "bg-card/50 text-secondary border border-secondary/30 hover:bg-secondary/10"
                )}
                aria-pressed={highContrast}
              >
                {highContrast ? "Standard Contrast" : "High Contrast Mode"}
              </button>
            </div>
          </motion.div>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <AddTask />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks by title"
              className="w-full h-10 bg-card/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all text-foreground placeholder:text-foreground/40"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filter tasks by tag"
              className="w-full h-10 bg-card/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all text-foreground placeholder:text-foreground/40"
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <div className="flex-1 relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSortBy(val);
                  savePreference("defaultSort", val);
                }}
                aria-label="Sort tasks by"
                className="w-full h-10 bg-card/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 appearance-none [color-scheme:dark] text-foreground cursor-pointer"
              >
                <option value="createdAt">Date Created</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" aria-hidden="true" />
              <select
                value={priorityFilter}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPriorityFilter(val);
                  savePreference("defaultPriority", val);
                }}
                aria-label="Filter tasks by priority"
                className="w-full h-10 bg-card/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 appearance-none [color-scheme:dark] text-foreground cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <StatusFilter current={filter} onChange={setFilter} counts={counts} />
        </motion.div>

        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center gap-2 text-yellow-200 text-sm"
          >
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode - Changes will sync when connection is restored</span>
          </motion.div>
        )}

        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-destructive/20 rounded-2xl border border-destructive/40 text-foreground font-medium">
              <p>Failed to load tasks. Please try again.</p>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-secondary/50"
            >
              <LayoutList className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">Time to relax or adjust filters!</p>
            </motion.div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tasks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4 pb-20">
                    <AnimatePresence initial={false} mode="popLayout">
                      {filteredAndSortedTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                snapshot.isDragging && "z-50"
                              )}
                            >
                              <div className="flex items-center gap-2 group/drag">
                                <div {...provided.dragHandleProps} className="opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <TaskCard task={task} />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}
