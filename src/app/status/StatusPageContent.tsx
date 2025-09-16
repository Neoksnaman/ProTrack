
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProjects, getTasks, getActivities } from '@/lib/sheets';
import type { Project, Task, Activity } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectDetails from '@/components/dashboard/project-details';
import TaskList from '@/components/dashboard/task-list';
import ActivityList from '@/components/dashboard/activity-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { events } from '@/lib/events';

export default function StatusPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!token) {
      setError('No share token provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    events.emit('refresh-start');
    try {
      const allProjects = await getProjects();
      const targetProject = allProjects.find(p => p.shareToken === token);

      if (!targetProject) {
        setError('Project not found or share token is invalid.');
        setProject(null);
        setTasks([]);
        setActivities([]);
        return;
      }
      
      setProject(targetProject);

      const [allTasks, allActivities] = await Promise.all([
          getTasks(),
          getActivities()
      ]);

      setTasks(allTasks.filter(t => t.projectId === targetProject.id));
      setActivities(allActivities.filter(a => a.projectId === targetProject.id));
      setError(null);

    } catch (err) {
      console.error(err);
      setError('Failed to load project data.');
    } finally {
      setIsLoading(false);
      events.emit('refresh-end');
    }
  }, [token]);

  useEffect(() => {
    fetchProjectData();

    events.on('refreshPublicPage', fetchProjectData);
    
    return () => {
        events.off('refreshPublicPage', fetchProjectData);
    }
  }, [fetchProjectData]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    // This case is handled by the error state when token is invalid
    return null; 
  }

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="space-y-6">
            <ProjectDetails 
                project={project}
                isPublicView={true}
            />
            <TaskList 
                project={project}
                tasks={tasks}
                isLoading={isLoading}
                isPublicView={true}
            />
            <ActivityList
                project={project}
                activities={activities}
                tasks={tasks}
                isLoading={isLoading}
                isPublicView={true}
            />
        </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-12 w-3/4 mb-2" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
