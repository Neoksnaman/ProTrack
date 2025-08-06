

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, Project, Client, Task, Activity } from '@/lib/types';
import { getProjects, getUsers, getClients, getTasks, getActivities } from '@/lib/sheets';
import { useToast } from './use-toast';
import { FullScreenLoader } from '@/components/ui/loader';

interface DataContextType {
  users: User[];
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  activities: Activity[];
  isLoading: boolean;
  isProjectsLoading: boolean;
  isTasksLoading: boolean;
  isActivitiesLoading: boolean;
  refetch: () => void;
  updateProjectInCache: (project: Project) => void;
  addProjectToCache: (project: Project) => void;
  removeProjectFromCache: (projectId: string) => void;
  updateUserInCache: (user: User) => void;
  addUserToCache: (user: User) => void;
  removeUserFromCache: (userId: string) => void;
  addTaskToCache: (task: Task) => void;
  updateTaskInCache: (task: Task) => void;
  removeTaskFromCache: (taskId: string) => void;
  addActivityToCache: (activity: Activity) => void;
  updateActivityInCache: (activity: Activity) => void;
  removeActivityFromCache: (activityId: string) => void;
  addClientToCache: (client: Client) => void;
  updateClientInCache: (client: Client) => void;
  removeClientFromCache: (clientId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [isEssentialLoading, setIsEssentialLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async (isRefetch = false) => {
    if (isRefetch) {
      setIsEssentialLoading(true);
      setIsProjectsLoading(true);
      setIsTasksLoading(true);
      setIsActivitiesLoading(true);
    }
    
    try {
        const [fetchedUsers, fetchedClients] = await Promise.all([
            getUsers(),
            getClients(),
        ]);
        setUsers(fetchedUsers);
        setClients(fetchedClients);
        setIsEssentialLoading(false);

        Promise.all([
            getProjects(),
            getTasks(),
            getActivities(),
        ]).then(([fetchedProjects, fetchedTasks, fetchedActivities]) => {
            setProjects(fetchedProjects);
            setTasks(fetchedTasks);
            setActivities(fetchedActivities);
            setIsProjectsLoading(false);
            setIsTasksLoading(false);
            setIsActivitiesLoading(false);
        }).catch(error => {
            console.error("Failed to fetch non-essential data", error);
            setIsProjectsLoading(false);
            setIsTasksLoading(false);
            setIsActivitiesLoading(false);
             toast({
                variant: 'destructive',
                title: 'Error Loading Additional Data',
                description: 'Could not load projects, tasks, or activities.',
            });
        });

    } catch (error) {
        console.error("Failed to fetch essential data", error);
        if (isRefetch) {
            toast({
                variant: 'destructive',
                title: 'Error Refreshing Data',
                description: 'Could not load the latest data. Please try again.',
            });
        } else {
            throw error;
        }
    } finally {
        if (isInitialLoad) {
            setIsInitialLoad(false);
        }
    }
  }, [isInitialLoad, toast]);

  useEffect(() => {
    if (isInitialLoad) {
        fetchData();
    }
  }, [fetchData, isInitialLoad]);

  const refetch = async () => {
    await fetchData(true);
  };
  
  const updateProjectInCache = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const addProjectToCache = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
  };

  const removeProjectFromCache = (projectId: string) => {
    setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    setTasks(prevTasks => prevTasks.filter(t => t.projectId !== projectId));
    setActivities(prevActivities => prevActivities.filter(a => a.projectId !== projectId));
  };
  
  const updateUserInCache = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
    setProjects(prevProjects => 
      prevProjects.map(p => {
        let updatedProject = { ...p };
        if (p.teamLeaderId === updatedUser.id) {
          updatedProject.teamLeader = updatedUser.name;
        }
        const memberIndex = p.teamMembers.findIndex(m => m.id === updatedUser.id);
        if (memberIndex > -1) {
          const newTeamMembers = [...p.teamMembers];
          newTeamMembers[memberIndex] = updatedUser;
          updatedProject.teamMembers = newTeamMembers;
        }
        return updatedProject;
      })
    );
  };

  const addUserToCache = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };
  
  const removeUserFromCache = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
  }

  const addTaskToCache = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const updateTaskInCache = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
    setActivities(prevActivities => 
      prevActivities.map(a => 
        a.taskId === updatedTask.id ? { ...a, taskName: updatedTask.name } : a
      )
    );
  };

  const removeTaskFromCache = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    setActivities(prevActivities => prevActivities.filter(a => a.taskId !== taskId));
  };

  const addActivityToCache = (newActivity: Activity) => {
    setActivities(prevActivities => 
      [...prevActivities, newActivity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const updateActivityInCache = (updatedActivity: Activity) => {
    setActivities(prevActivities => 
      prevActivities.map(a => a.id === updatedActivity.id ? updatedActivity : a)
    );
  };
  
  const removeActivityFromCache = (activityId: string) => {
    setActivities(prevActivities => prevActivities.filter(a => a.id !== activityId));
  };

  const addClientToCache = (newClient: Client) => {
    setClients(prevClients => [...prevClients, newClient]);
  };

  const updateClientInCache = (updatedClient: Client) => {
    setClients(prevClients =>
      prevClients.map(c => (c.id === updatedClient.id ? updatedClient : c))
    );
     setProjects(prevProjects =>
      prevProjects.map(p => (p.clientId === updatedClient.id ? { ...p, clientName: updatedClient.name } : p))
    );
  };

  const removeClientFromCache = (clientId: string) => {
      setClients(prev => prev.filter(c => c.id !== clientId));
  }

  if (isInitialLoad && isEssentialLoading) {
    return <FullScreenLoader />;
  }

  return (
    <DataContext.Provider value={{ 
        users, projects, clients, tasks, activities, 
        isLoading: isEssentialLoading,
        isProjectsLoading, isTasksLoading, isActivitiesLoading,
        refetch, 
        updateProjectInCache, addProjectToCache, removeProjectFromCache, 
        updateUserInCache, addUserToCache, removeUserFromCache,
        addTaskToCache, updateTaskInCache, removeTaskFromCache,
        addActivityToCache, updateActivityInCache, removeActivityFromCache,
        addClientToCache, updateClientInCache, removeClientFromCache
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
