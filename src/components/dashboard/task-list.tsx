

'use client';

import { useMemo, useState } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle, CircleDot, Circle, Plus, Edit, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/hooks/use-auth';

interface TaskListProps {
  project: Project;
  tasks: Task[];
  isLoading: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const ITEMS_PER_PAGE = 3;

export default function TaskList({ project, tasks, isLoading, onAddTask, onEditTask, onDeleteTask }: TaskListProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  
  const canAddTask = useMemo(() => {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;
    if (project.teamMemberIds.includes(user.id)) return true;
    if (project.teamLeaderId === user.id) return true;
    return false;
  }, [user, project]);

  const canModifyTask = (task: Task) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.id === task.userId) return true;
    return false;
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <CircleDot className="h-5 w-5 text-blue-500" />;
      case 'To Do':
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'To Do':
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  }

  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = useMemo(() => {
    return tasks.slice(startIndex, endIndex);
  }, [tasks, startIndex, endIndex]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          {canAddTask && (
            <Button onClick={onAddTask} size="sm" disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : currentTasks.length > 0 ? (
          <ul className="space-y-3">
            {currentTasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 p-3 rounded-lg border">
                <div className="flex items-start gap-3">
                  <span className="pt-0.5">
                    {getStatusIcon(task.status)}
                  </span>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{task.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{task.userName}</span>
                        </div>
                      </div>
                      <div className='flex items-center shrink-0 gap-2 pl-2'>
                          <Badge variant="outline" className={cn(getStatusColor())}>{task.status}</Badge>
                          {canModifyTask(task) && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => onEditTask(task)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit Task</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDeleteTask(task)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Task</span>
                              </Button>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
                 {task.description && (
                  <div className="pl-8">
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <p className="text-sm text-foreground pt-1 line-clamp-2">{task.description}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs whitespace-normal">{task.description}</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks have been added to this project yet.</p>
          </div>
        )}
        </TooltipProvider>
      </CardContent>
       {totalPages > 1 && (
        <CardFooter className="flex justify-center items-center gap-4 pt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
