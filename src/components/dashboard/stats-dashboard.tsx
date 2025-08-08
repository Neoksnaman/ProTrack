
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { User, Project, Task, Activity } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useData } from '@/hooks/use-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';
import UserStats from './user-stats';

export default function StatsDashboard() {
  const { user: currentUser } = useAuth();
  const { users, projects, tasks, activities, isLoading } = useData();

  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser]);

  const supervisableUsers = useMemo(() => {
    if (!currentUser || !users) return [];
    if (currentUser.role === 'Admin') {
      return users;
    }
    if (currentUser.role === 'Supervisor' || currentUser.role === 'Senior') {
      return users.filter(u => u.team === currentUser.team);
    }
    return [currentUser];
  }, [currentUser, users]);

  const canSelectUser = (currentUser?.role === 'Admin' || currentUser?.role === 'Supervisor' || currentUser?.role === 'Senior') && supervisableUsers.length > 1;

  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId);
  }, [users, selectedUserId]);

  const userProjects = useMemo(() => {
    if (!selectedUserId) return [];
    return projects.filter(p => p.teamMemberIds.includes(selectedUserId) || p.teamLeaderId === selectedUserId);
  }, [projects, selectedUserId]);

  const userTasks = useMemo(() => {
    if (!selectedUserId) return [];
    return tasks.filter(t => t.userId === selectedUserId);
  }, [tasks, selectedUserId]);

  const userActivities = useMemo(() => {
    if (!selectedUserId) return [];
    return activities.filter(a => a.userId === selectedUserId);
  }, [activities, selectedUserId]);

  if (isLoading || !currentUser) {
    return <StatsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {canSelectUser && (
        <div className="max-w-xs">
          <Label htmlFor="user-select">Viewing Stats For</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {supervisableUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedUser && (
        <UserStats 
          user={selectedUser}
          projects={userProjects}
          tasks={userTasks}
          activities={userActivities}
        />
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
