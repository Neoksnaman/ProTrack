

'use client';

import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle, CircleDot, Circle, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';

interface TaskListProps {
  project: Project;
  tasks: Task[];
  isLoading: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export default function TaskList({ project, tasks, isLoading, onAddTask, onEditTask, onDeleteTask }: TaskListProps) {
  const { user } = useAuth();
  
  const canModify = useMemo(() => {
    if (!user || !project) return false;
    if (user.role === 'Admin') return true;
    if (project.teamLeaderId === user.id) return true;
    if (project.teamMemberIds.some(member => member.id === user.id)) return true;
    return false;
  }, [user, project]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          {canModify && (
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
        ) : tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between p-3 rounded-lg border">
                <div className="flex items-start gap-3 w-0 flex-1">
                  <span className="pt-0.5">
                    {getStatusIcon(task.status)}
                  </span>
                  <div className='w-0 flex-1'>
                    <p className="font-medium truncate">{task.name}</p>
                     {task.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-normal">
                          <p>{task.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>
                <div className='flex items-center gap-2 pl-2'>
                    <Badge variant="outline" className={cn(getStatusColor())}>{task.status}</Badge>
                    {canModify && (
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
    </Card>
  );
}
