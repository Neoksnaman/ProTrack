
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { CalendarDays, Flag, Building, TriangleAlert, Hourglass, ListChecks, Info } from 'lucide-react';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ProjectCardProps {
  project: Project;
  completedTasks: number;
  totalTasks: number;
  totalMinutes: number;
}

export default function ProjectCard({ project, completedTasks, totalTasks, totalMinutes }: ProjectCardProps) {
  const isOverdue = project.deadline ? isBefore(parseISO(project.deadline), startOfToday()) && project.status !== 'Completed' : false;
  const { start } = useTopLoaderStore();

  const getStatusColor = () => {
    switch (project.status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const getPriorityColor = () => {
    switch (project.priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Link href={`/projects/${project.id}`} onClick={start} className="print:break-inside-avoid">
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 print:shadow-none">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{project.name}</CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="outline" className={cn('whitespace-nowrap print:hidden', getStatusColor())}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 p-4 pt-0">
           <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>{project.clientName}</span>
            </div>
          <div className="text-sm text-foreground space-y-2">
            <div className="flex items-center gap-2 print:hidden">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <span>Tasks: {completedTasks} / {totalTasks}</span>
            </div>
             <div className="hidden print:flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>Status: {project.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-muted-foreground" />
              <span>Time Logged: {formatTotalTime(totalMinutes)}</span>
            </div>
             <div className="flex items-center gap-2">
              <Flag className={cn("h-4 w-4", getPriorityColor())} />
              <span>{project.priority} Priority</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className={cn("flex items-center gap-2 text-sm", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
            {isOverdue && <TriangleAlert className="h-4 w-4" />}
            <CalendarDays className="h-4 w-4" />
            <span>{project.deadline ? format(parseISO(project.deadline), 'MMM dd, yyyy') : 'N/A'}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
