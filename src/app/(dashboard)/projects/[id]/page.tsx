

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { updateProjectStatus, deleteProjectAndRelatedData, deleteTaskAndRelatedActivities, deleteActivity } from '@/lib/sheets';
import type { Project, Task, Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import ProjectDetails from '@/components/dashboard/project-details';
import AISummary from '@/components/dashboard/ai-summary';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';
import EditProjectForm from '@/components/dashboard/edit-project-form';
import TaskList from '@/components/dashboard/task-list';
import AddTaskForm from '@/components/dashboard/add-task-form';
import EditTaskForm from '@/components/dashboard/edit-task-form';
import ActivityList from '@/components/dashboard/activity-list';
import AddActivityForm from '@/components/dashboard/add-activity-form';
import EditActivityForm from '@/components/dashboard/edit-activity-form';
import DeleteProjectDialog from '@/components/dashboard/delete-project-dialog';
import DeleteItemDialog from '@/components/admin/delete-item-dialog';
import { useAuth } from '@/hooks/use-auth';


export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const { 
    projects, 
    users,
    isProjectsLoading, 
    updateProjectInCache, 
    removeProjectFromCache,
    tasks, 
    isTasksLoading, 
    addTaskToCache, 
    updateTaskInCache,
    removeTaskFromCache,
    activities, 
    isActivitiesLoading, 
    addActivityToCache,
    updateActivityInCache,
    removeActivityFromCache
  } = useData();
  const { toast } = useToast();
  const { start, finish } = useTopLoaderStore();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Project['status'] | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);
  
  const project = useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [projects, id]);
  
  useEffect(() => {
    if (isProjectsLoading || !user) return;

    if (project) {
        if (user.role === 'Admin') {
            setIsAuthorized(true);
            return;
        }

        const userIsLeader = project.teamLeaderId === user.id;
        const userIsMember = project.teamMemberIds.includes(user.id);

        if (userIsLeader || userIsMember) {
            setIsAuthorized(true);
            return;
        }

        if (user.role === 'Senior' && user.team) {
            const teamMemberIds = users
                .filter(u => u.team === user.team)
                .map(u => u.id);
            const isTeamProject = project.teamMemberIds.some(id => teamMemberIds.includes(id));
            if (isTeamProject) {
                setIsAuthorized(true);
                return;
            }
        }
        
        setIsAuthorized(false);
    } else {
        setIsAuthorized(false);
    }
  }, [project, user, users, isProjectsLoading]);

  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === id);
  }, [tasks, id]);

  const projectActivities = useMemo(() => {
    return activities.filter(a => a.projectId === id);
  }, [activities, id]);

  const displayProject = useMemo(() => {
    if (!project) return null;
    if (optimisticStatus) {
      return { ...project, status: optimisticStatus };
    }
    return project;
  }, [project, optimisticStatus]);

  const setProjectStatus = useCallback(async (status: Project['status']) => {
    if (!project) return;
    
    start();
    const originalStatus = project.status;
    setIsSavingStatus(true);
    setOptimisticStatus(status);

    try {
      await updateProjectStatus(project.id, status);
      
      const updatedProject = { ...project, status };
      updateProjectInCache(updatedProject);

      toast({
        title: 'Status Updated',
        description: `Project status changed to "${status}".`,
      });

    } catch (error) {
       setOptimisticStatus(originalStatus);
       toast({
        variant: 'destructive',
        title: 'Error Updating Status',
        description: 'Could not save status change. Please try again.',
      });
    } finally {
      setIsSavingStatus(false);
      setOptimisticStatus(null);
      finish();
    }
  }, [project, toast, updateProjectInCache, start, finish]);
  
  const handleDeleteProject = useCallback(async () => {
    if (!project) return;
    start();
    try {
        await deleteProjectAndRelatedData(project.id);
        removeProjectFromCache(project.id);
        toast({
            title: 'Project Deleted',
            description: `The project "${project.name}" has been successfully deleted.`,
        });
        router.push('/');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Project',
            description: 'Could not delete the project. Please try again.',
        });
        finish();
    }
  }, [project, removeProjectFromCache, toast, router, start, finish]);

  const handleTaskAdded = (newTask: Task) => {
    addTaskToCache(newTask);
    setIsAddTaskDialogOpen(false);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };
  
  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!deletingTask) return;
    start();
    setIsDeletingTask(true);
    try {
        await deleteTaskAndRelatedActivities(deletingTask.id);
        removeTaskFromCache(deletingTask.id);
        toast({
            title: 'Task Deleted',
            description: `The task "${deletingTask.name}" has been successfully deleted.`,
        });
        setDeletingTask(null);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Task',
            description: error instanceof Error ? error.message : 'Could not delete the task.',
        });
    } finally {
        setIsDeletingTask(false);
        finish();
    }
  }, [deletingTask, removeTaskFromCache, toast, start, finish]);

  const handleTaskUpdated = (updatedTask: Task) => {
    updateTaskInCache(updatedTask);
    setEditingTask(null);
  }

  const handleActivityAdded = (newActivity: Activity) => {
    addActivityToCache(newActivity);
    setIsAddActivityDialogOpen(false);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setDeletingActivity(activity);
  };

  const handleConfirmDeleteActivity = useCallback(async () => {
    if (!deletingActivity) return;
    start();
    setIsDeletingActivity(true);
    try {
      await deleteActivity(deletingActivity.id);
      removeActivityFromCache(deletingActivity.id);
      toast({
        title: 'Activity Deleted',
        description: 'The activity log has been successfully deleted.',
      });
      setDeletingActivity(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Activity',
        description: error instanceof Error ? error.message : 'Could not delete the activity.',
      });
    } finally {
      setIsDeletingActivity(false);
      finish();
    }
  }, [deletingActivity, removeActivityFromCache, toast, start, finish]);


  const handleActivityUpdated = (updatedActivity: Activity) => {
    updateActivityInCache(updatedActivity);
    setEditingActivity(null);
  };
  
  const handleShare = () => {
    if (!displayProject?.shareToken) {
      toast({
        variant: 'destructive',
        title: 'Share Token Missing',
        description: 'This project does not have a share token and cannot be shared.',
      });
      return;
    }
    const shareUrl = `${window.location.origin}/status?token=${displayProject.shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Public share link has been copied to your clipboard.',
      });
    }).catch(err => {
       toast({
        variant: 'destructive',
        title: 'Failed to Copy',
        description: 'Could not copy the link to your clipboard.',
      });
    });
  }


  if (isProjectsLoading || isAuthorized === null) {
    return <PageSkeleton />;
  }

  if (!displayProject || !isAuthorized) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-muted-foreground">The project you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild className="mt-4">
          <Link href="/" onClick={start}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" onClick={start}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">{displayProject.name}</h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {isProjectsLoading ? <Skeleton className="h-64 w-full" /> : 
              <ProjectDetails 
                project={displayProject} 
                setProjectStatus={setProjectStatus} 
                isSavingStatus={isSavingStatus}
                onEdit={() => setIsEditDialogOpen(true)}
                onDelete={() => setIsDeleteDialogOpen(true)}
                onShare={handleShare}
              />
            }
             {isTasksLoading ? <Skeleton className="h-48 w-full" /> : 
                <TaskList 
                    project={displayProject}
                    tasks={projectTasks} 
                    isLoading={isTasksLoading} 
                    onAddTask={() => setIsAddTaskDialogOpen(true)} 
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask} 
                    isPublicView={false}
                />
             }
             {isActivitiesLoading ? <Skeleton className="h-48 w-full" /> : 
                <ActivityList 
                    project={displayProject}
                    activities={projectActivities} 
                    tasks={projectTasks}
                    isLoading={isActivitiesLoading} 
                    onAddActivity={() => setIsAddActivityDialogOpen(true)} 
                    onEditActivity={handleEditActivity} 
                    onDeleteActivity={handleDeleteActivity}
                    isPublicView={false}
                />
             }
          </div>
          <div>
            {isProjectsLoading ? <Skeleton className="h-48 w-full" /> : <AISummary project={displayProject} tasks={projectTasks} />}
          </div>
        </div>
      </div>
      <EditProjectForm
        project={displayProject}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProject}
        projectName={displayProject.name}
      />
      <AddTaskForm
        projectId={displayProject.id}
        isOpen={isAddTaskDialogOpen}
        setIsOpen={setIsAddTaskDialogOpen}
        onTaskAdded={handleTaskAdded}
      />
      {editingTask && (
        <EditTaskForm
            task={editingTask}
            isOpen={!!editingTask}
            setIsOpen={() => setEditingTask(null)}
            onTaskUpdated={handleTaskUpdated}
        />
      )}
       {deletingTask && (
        <DeleteItemDialog
          isOpen={!!deletingTask}
          setIsOpen={() => setDeletingTask(null)}
          isDeleting={isDeletingTask}
          onConfirm={handleConfirmDeleteTask}
          itemName={deletingTask.name}
          itemType="task"
        />
      )}
      <AddActivityForm
        projectId={displayProject.id}
        tasks={projectTasks}
        isOpen={isAddActivityDialogOpen}
        setIsOpen={setIsAddActivityDialogOpen}
        onActivityAdded={handleActivityAdded}
      />
       {editingActivity && (
        <EditActivityForm
          activity={editingActivity}
          tasks={projectTasks}
          isOpen={!!editingActivity}
          setIsOpen={() => setEditingActivity(null)}
          onActivityUpdated={handleActivityUpdated}
        />
      )}
      {deletingActivity && (
        <DeleteItemDialog
            isOpen={!!deletingActivity}
            setIsOpen={() => setDeletingActivity(null)}
            isDeleting={isDeletingActivity}
            onConfirm={handleConfirmDeleteActivity}
            itemName="this activity log"
            itemType="activity"
        />
      )}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-12 w-3/4" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

    