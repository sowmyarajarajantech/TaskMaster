import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { List, type List as TaskList } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { ListTodo, Plus, Folder, Trash2, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppSidebar() {
  const { toast } = useToast();
  const [newListName, setNewListName] = useState("");
  const { data: lists, isLoading } = useQuery<TaskList[]>({ 
    queryKey: [api.lists.list.path] 
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", api.lists.create.path, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
      setNewListName("");
      toast({ title: "List created successfully" });
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", buildUrl(api.lists.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
      toast({ title: "List deleted" });
    }
  });

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListTodo className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
            TaskMaster
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Your Lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover-elevate active-elevate-2">
                  <a href="/" className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors">
                    <ListTodo className="h-4 w-4" />
                    <span className="font-medium">All Tasks</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/50" />
                </div>
              ) : (
                lists?.map((list) => (
                  <SidebarMenuItem key={list.id} className="group/item">
                    <SidebarMenuButton asChild className="hover-elevate active-elevate-2">
                      <div className="flex items-center justify-between gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors w-full cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Folder className="h-4 w-4" />
                          <span className="font-medium">{list.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-destructive no-default-hover-elevate"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteListMutation.mutate(list.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newListName.trim()) createListMutation.mutate(newListName);
          }}
          className="flex flex-col gap-2"
        >
          <Input 
            placeholder="New list..." 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="h-9 bg-sidebar-accent/50 border-transparent focus:bg-sidebar-accent focus:border-secondary/50 text-sidebar-foreground"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="w-full bg-primary text-primary-foreground"
            disabled={!newListName.trim() || createListMutation.isPending}
          >
            {createListMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </>
            )}
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
