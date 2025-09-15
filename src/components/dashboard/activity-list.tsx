

'use client';

import { useState, useMemo } from 'react';
import type { Activity, Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Plus, Clock, ChevronLeft, ChevronRight, Edit, Calendar, Trash2 } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface ActivityListProps {
  project: Project;
  activities: Activity[];
  tasks: Task[];
  isLoading: boolean;
  onAddActivity?: () => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
  isPublicView: boolean;
}

const ITEMS_PER_PAGE = 3;

export default function ActivityList({ project, activities, tasks, isLoading, onAddActivity, onEditActivity, onDeleteActivity, isPublicView = false }: ActivityListProps) {
  const auth = !isPublicView ? useAuth() : null;
  const user = auth?.user;
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const canAddActivity = useMemo(() => {
    if (isPublicView || !user || !project) return false;
    if (user.role === 'Admin') return true;
    if (project.teamMemberIds.includes(user.id)) return true;
    if (project.teamLeaderId === user.id) return true;
    return false;
  }, [user, project, isPublicView]);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handleAddActivityClick = () => {
    if (tasks.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Tasks Available',
        description: 'Please add a task to the project before logging an activity.',
      });
      return;
    }
    onAddActivity?.();
  };

  const formatDuration = (start: string, end: string) => {
    const padTime = (time: string) => {
      const [hour, minute] = time.split(':');
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    };

    try {
      const today = new Date().toISOString().split('T')[0];
      const startTime = start.includes(':') ? `${today}T${padTime(start)}` : null;
      const endTime = end.includes(':') ? `${today}T${padTime(end)}` : null;
      
      if (!startTime || !endTime) return 'N/A';

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return 'Invalid time';
      }

      const diff = differenceInMinutes(endDate, startDate);
      if (diff < 0) return 'Invalid time';
      
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch {
      return 'N/A';
    }
  };
  
  const canModifyActivity = (activity: Activity) => {
    if (isPublicView || !user) return false;
    return user.role === 'Admin' || user.id === activity.userId;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          {canAddActivity && (
            <Button onClick={handleAddActivityClick} size="sm" disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              New Activity
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : currentActivities.length > 0 ? (
          <ul className="space-y-4">
            {currentActivities.map((activity) => (
              <li key={activity.id} className="flex flex-col gap-2 p-3 rounded-lg border">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={activity.userAvatar} alt={activity.userName} data-ai-hint="user avatar" />
                    <AvatarFallback>{activity.userName ? activity.userName.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-semibold truncate">
                            <span>{activity.userName}</span>
                            <span className="font-normal text-muted-foreground"> - {activity.taskName}</span>
                          </p>
                          <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{format(parseISO(activity.date), 'MMM dd, yyyy')}</span>
                            </div>
                            {!isPublicView && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(activity.startTime, activity.endTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {canModifyActivity(activity) && onEditActivity && onDeleteActivity && (
                          <div className="flex items-center shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => onEditActivity(activity)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Activity</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDeleteActivity(activity)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Activity</span>
                            </Button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                {activity.activity && (
                  <div className="pl-12">
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="text-sm text-foreground pt-1 line-clamp-2">{activity.activity}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-normal">{activity.activity}</p>
                    </TooltipContent>
                  </Tooltip>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activities have been logged for this project yet.</p>
          </div>
        )}
        </TooltipProvider>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-center items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
