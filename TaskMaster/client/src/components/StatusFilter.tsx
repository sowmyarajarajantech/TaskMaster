import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Filter = "all" | "pending" | "completed";

interface StatusFilterProps {
  current: Filter;
  onChange: (filter: Filter) => void;
  counts: Record<Filter, number>;
}

export function StatusFilter({ current, onChange, counts }: StatusFilterProps) {
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All Tasks" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="flex p-1 gap-1 bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={cn(
            "relative flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
            current === filter.id 
              ? "text-secondary-foreground" 
              : "text-muted-foreground hover:text-white"
          )}
        >
          {current === filter.id && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 bg-secondary rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {filter.label}
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] rounded-full transition-colors",
              current === filter.id 
                ? "bg-black/10 text-current" 
                : "bg-white/10 text-muted-foreground"
            )}>
              {counts[filter.id]}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
