
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProjects, getTasks, getActivities } from '@/lib/sheets';
import type { Project, Task, Activity } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectDetails from '@/components/dashboard/project-details';
import TaskList from '@/components/dashboard/task-list';
import ActivityList from '@/components/dashboard/activity-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function StatusPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectData() {
      if (!token) {
        setError('No share token provided.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const allProjects = await getProjects();
        const targetProject = allProjects.find(p => p.shareToken === token);

        if (!targetProject) {
          setError('Project not found or share token is invalid.');
          setIsLoading(false);
          return;
        }
        
        setProject(targetProject);

        const [allTasks, allActivities] = await Promise.all([
            getTasks(),
            getActivities()
        ]);

        setTasks(allTasks.filter(t => t.projectId === targetProject.id));
        setActivities(allActivities.filter(a => a.projectId === targetProject.id));

      } catch (err) {
        console.error(err);
        setError('Failed to load project data.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectData();
  }, [token]);

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
    return null; // Should be handled by error state
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
        <Skeleton className="h-8 w-1/2" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}


    