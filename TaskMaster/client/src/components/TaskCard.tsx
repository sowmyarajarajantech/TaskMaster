import React, { useState, useEffect } from "react";
import { format, isPast, isToday, addDays, addWeeks, addMonths } from "date-fns";
import { Check, Trash2, Pencil, Folder, Calendar as CalendarIcon, Flag, ChevronDown, ChevronRight, Plus, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { type Task, type List } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCardProps {
  task: Task;
}

const TaskCardComponent = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.title);
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [attachments, setAttachments] = useState<{name: string, type: string, size: number}[]>([]);
    const { toast } = useToast();

    // Load subtasks, tags, and notes from localStorage
    useEffect(() => {
      const savedSubtasks = localStorage.getItem(`subtasks-${task.id}`);
      if (savedSubtasks) {
        try {
          setSubtasks(JSON.parse(savedSubtasks));
        } catch (e) {
          console.error("Failed to parse subtasks", e);
        }
      }
      const savedTags = localStorage.getItem(`tags-${task.id}`);
      if (savedTags) {
        try {
          setTags(JSON.parse(savedTags));
        } catch (e) {
          console.error("Failed to parse tags", e);
        }
      }
      const savedNotes = localStorage.getItem(`notes-${task.id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
      const savedAttachments = localStorage.getItem(`attachments-${task.id}`);
      if (savedAttachments) {
        try {
          setAttachments(JSON.parse(savedAttachments));
        } catch (e) {
          console.error("Failed to parse attachments", e);
        }
      }
    }, [task.id]);

    // Save notes and attachments to localStorage
    const saveNotes = (val: string) => {
      setNotes(val);
      localStorage.setItem(`notes-${task.id}`, val);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));
      
      const updated = [...attachments, ...newAttachments];
      setAttachments(updated);
      localStorage.setItem(`attachments-${task.id}`, JSON.stringify(updated));
    };

    const removeAttachment = (index: number) => {
      const updated = attachments.filter((_, i) => i !== index);
      setAttachments(updated);
      localStorage.setItem(`attachments-${task.id}`, JSON.stringify(updated));
    };

    // Save tags to localStorage
    const saveTags = (updated: string[]) => {
      setTags(updated);
      localStorage.setItem(`tags-${task.id}`, JSON.stringify(updated));
    };

    const removeTag = (tagToRemove: string) => {
      saveTags(tags.filter(t => t !== tagToRemove));
    };

    // Save subtasks to localStorage
    const saveSubtasks = (updated: Subtask[]) => {
      setSubtasks(updated);
      localStorage.setItem(`subtasks-${task.id}`, JSON.stringify(updated));
    };

    const addSubtask = () => {
      if (!newSubtaskTitle.trim()) return;
      const subtask: Subtask = {
        id: Math.random().toString(36).substring(2, 9),
        title: newSubtaskTitle.trim(),
        completed: false
      };
      saveSubtasks([...subtasks, subtask]);
      setNewSubtaskTitle("");
    };

    const toggleSubtask = (id: string) => {
      saveSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const deleteSubtask = (id: string) => {
      saveSubtasks(subtasks.filter(s => s.id !== id));
    };

    const updateSubtaskTitle = (id: string, title: string) => {
      saveSubtasks(subtasks.map(s => s.id === id ? { ...s, title } : s));
    };

    const { data: lists } = useQuery<List[]>({ 
      queryKey: [api.lists.list.path] 
    });

    const taskList = lists?.find(l => l.id === task.listId);

    const updateTask = useMutation({
      mutationFn: async (updates: Partial<Task>) => {
        return apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      },
    });

    const deleteTask = useMutation({
      mutationFn: async () => {
        return apiRequest("DELETE", `/api/tasks/${task.id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
        localStorage.removeItem(`subtasks-${task.id}`);
        toast({ 
          title: "Task deleted",
          description: "Want to undo this?",
          action: (
            <button
              onClick={() => {
                const { id, createdAt, ...rest } = task;
                apiRequest("POST", api.tasks.create.path, rest).then(() => {
                  queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
                });
              }}
              className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline"
            >
              Undo
            </button>
          )
        });
      },
    });

    const handleToggleComplete = () => {
      const isCompleting = !task.completed;
      updateTask.mutate({ completed: isCompleting }, {
        onSuccess: (updatedTask) => {
          if (isCompleting && task.recurrence !== "none") {
            // Generate next instance
            const nextDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
            let newDate: Date;
            if (task.recurrence === "daily") newDate = addDays(nextDueDate, 1);
            else if (task.recurrence === "weekly") newDate = addWeeks(nextDueDate, 1);
            else newDate = addMonths(nextDueDate, 1);

            const { id, createdAt, updatedAt, completed, ...rest } = task;
            apiRequest("POST", api.tasks.create.path, {
              ...rest,
              dueDate: newDate.toISOString(),
              completed: false,
              parentTaskId: task.id
            }).then(async (res) => {
              const newTask = await res.json();
              // Copy tags if they exist
              const savedTags = localStorage.getItem(`tags-${task.id}`);
              if (savedTags) {
                localStorage.setItem(`tags-${newTask.id}`, savedTags);
              }
              queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
            });
          }
        }
      });
    };

    const handleSave = () => {
      if (editText.trim() === "") return;
      updateTask.mutate({ title: editText }, {
        onSuccess: () => setIsEditing(false)
      });
    };

    const handleCancel = () => {
      setEditText(task.title);
      setIsEditing(false);
    };

    const getDueDateStatus = () => {
      if (!task.dueDate || task.completed) return null;
      const date = new Date(task.dueDate);
      if (isPast(date) && !isToday(date)) return { label: "Overdue", color: "bg-destructive text-destructive-foreground" }; 
      if (isToday(date)) return { label: "Due Today", color: "bg-primary text-primary-foreground" }; 
      return { label: format(date, "MMM d, h:mm a"), color: "bg-card text-foreground border border-border" }; 
    };

    const dueDateStatus = getDueDateStatus();

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className={cn(
          "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
          "bg-card/90 backdrop-blur-md shadow-lg hover:shadow-xl hover:shadow-black/20",
          "border border-white/5",
          task.completed && "opacity-60 bg-card/50"
        )}
        aria-label={`Task: ${task.title}`}
      >
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300",
          task.completed ? "bg-secondary/30" : 
          task.priority === "high" ? "bg-primary" : 
          task.priority === "medium" ? "bg-secondary" : "bg-muted-foreground/30"
        )} aria-hidden="true" />

        <div className="flex items-start gap-4 pl-3">
          <button
            onClick={handleToggleComplete}
            disabled={updateTask.isPending}
            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
            className={cn(
              "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
              task.completed 
                ? "border-secondary bg-secondary text-secondary-foreground" 
                : "border-secondary/50 hover:border-secondary"
            )}
          >
            <motion.div
              initial={false}
              animate={{ scale: task.completed ? 1 : 0 }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
            </motion.div>
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  aria-label="Edit task title"
                  className="w-full bg-black/20 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-3 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground" aria-label="Save changes">Save</button>
                  <button onClick={handleCancel} className="px-3 py-1 rounded-md text-xs font-medium bg-white/10" aria-label="Cancel editing">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className={cn("text-lg font-medium leading-tight break-words", task.completed ? "line-through text-muted-foreground" : "text-white")}>
                    {task.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground/80 font-mono" aria-label={`Created at ${format(new Date(task.createdAt || new Date()), "MMM d, h:mm a")}`}>
                      {format(new Date(task.createdAt || new Date()), "MMM d, h:mm a")}
                    </span>
                    {taskList && (
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded" aria-label={`List: ${taskList.name}`}>
                        <Folder className="h-2.5 w-2.5" aria-hidden="true" />
                        {taskList.name}
                      </div>
                    )}
                    {task.priority !== "low" && (
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                        task.priority === "high" ? "text-primary bg-primary/10" : "text-secondary bg-secondary/10"
                      )} aria-label={`Priority: ${task.priority}`}>
                        <Flag className="h-2.5 w-2.5" aria-hidden="true" />
                        {task.priority}
                      </div>
                    )}
                    {tags.length > 0 && tags.map(tag => (
                      <div key={tag} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded group/tag" aria-label={`Tag: ${tag}`}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="opacity-0 group-hover/tag:opacity-100 hover:text-destructive" aria-label={`Remove tag ${tag}`}>
                          <X className="h-2 w-2" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {task.recurrence !== "none" && (
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded" aria-label={`Recurrence: ${task.recurrence}`}>
                        <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" />
                        {task.recurrence}
                      </div>
                    )}
                    {subtasks.length > 0 && (
                      <button 
                        onClick={() => setShowSubtasks(!showSubtasks)}
                        aria-label={`${subtasks.filter(s => s.completed).length} of ${subtasks.length} subtasks completed. Toggle details.`}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-secondary hover:underline"
                      >
                        {subtasks.filter(s => s.completed).length}/{subtasks.length} Subtasks
                        {(notes.length > 0 || attachments.length > 0) && " • Details"}
                        {showSubtasks ? <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" /> : <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />}
                      </button>
                    )}
                    {subtasks.length === 0 && (notes.length > 0 || attachments.length > 0) && (
                      <button 
                        onClick={() => setShowSubtasks(!showSubtasks)}
                        aria-label="View task details"
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-secondary hover:underline"
                      >
                        Details
                        {showSubtasks ? <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" /> : <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />}
                      </button>
                    )}
                    <button 
                      onClick={() => setShowSubtasks(!showSubtasks)}
                      className="p-1 hover:bg-white/5 rounded transition-colors"
                      title="Task Details & Subtasks"
                      aria-label="Toggle task details"
                    >
                      <Plus className="h-3 w-3 text-secondary" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {dueDateStatus && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold w-fit",
                    dueDateStatus.color
                  )} aria-label={`Due: ${dueDateStatus.label}`}>
                    <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {dueDateStatus.label}
                  </div>
                )}

                <AnimatePresence>
                  {showSubtasks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 space-y-4 pt-4 border-t border-white/5"
                    >
                      <div className="space-y-2" role="group" aria-label="Subtasks">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-secondary">Subtasks</label>
                        {subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 group/subtask">
                            <button
                              onClick={() => toggleSubtask(subtask.id)}
                              aria-label={subtask.completed ? `Mark subtask ${subtask.title} as incomplete` : `Mark subtask ${subtask.title} as complete`}
                              className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                subtask.completed ? "bg-secondary border-secondary text-secondary-foreground" : "border-secondary/50"
                              )}
                            >
                              {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden="true" />}
                            </button>
                            <input
                              type="text"
                              value={subtask.title}
                              onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                              aria-label={`Edit subtask: ${subtask.title}`}
                              className={cn(
                                "flex-1 bg-transparent text-sm focus:outline-none",
                                subtask.completed && "line-through text-muted-foreground"
                              )}
                            />
                            <button 
                              onClick={() => deleteSubtask(subtask.id)}
                              aria-label={`Delete subtask: ${subtask.title}`}
                              className="opacity-0 group-hover/subtask:opacity-100 p-1 hover:text-destructive transition-opacity"
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Plus className="h-4 w-4 text-secondary/50" aria-hidden="true" />
                          <input
                            type="text"
                            placeholder="Add subtask..."
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                            aria-label="New subtask title"
                            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-secondary" htmlFor={`notes-${task.id}`}>Notes</label>
                        <textarea
                          id={`notes-${task.id}`}
                          value={notes}
                          onChange={(e) => saveNotes(e.target.value)}
                          placeholder="Add notes..."
                          aria-label="Task notes"
                          className="w-full bg-black/20 rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-muted-foreground/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-secondary">Attachments</label>
                        <div className="flex flex-wrap gap-2" role="list">
                          {attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-secondary/10 px-2 py-1 rounded text-xs group/file" role="listitem" aria-label={`Attachment: ${file.name}`}>
                              <span className="max-w-[150px] truncate">{file.name}</span>
                              <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove attachment ${file.name}`}>
                                <X className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                          <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/5 hover:bg-secondary/10 cursor-pointer text-xs font-bold text-secondary transition-colors border border-dashed border-secondary/30" aria-label="Add attachment">
                            <Plus className="h-3 w-3" aria-hidden="true" />
                            Attach File
                            <input type="file" className="hidden" multiple onChange={handleFileChange} aria-label="Upload files" />
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-secondary" aria-label="Edit task"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
              <button onClick={() => deleteTask.mutate()} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Delete task"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

TaskCardComponent.displayName = "TaskCard";
export const TaskCard = TaskCardComponent;
