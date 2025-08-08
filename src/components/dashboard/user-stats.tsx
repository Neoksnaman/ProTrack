
'use client';

import { useMemo } from 'react';
import type { User, Project, Task, Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { differenceInMinutes, parseISO, isAfter, subDays } from 'date-fns';
import { Hourglass, ListChecks, Briefcase } from 'lucide-react';

interface UserStatsProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

export default function UserStats({ user, projects, tasks, activities }: UserStatsProps) {

  const stats = useMemo(() => {
    const totalTasksCompleted = tasks.filter(t => t.status === 'Done').length;
    
    const padTime = (time: string) => {
      if (!time || !time.includes(':')) return '00:00';
      const [hour, minute] = time.split(':');
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    };

    const totalMinutes = activities.reduce((acc, activity) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const startTime = `${today}T${padTime(activity.startTime)}`;
        const endTime = `${today}T${padTime(activity.endTime)}`;
        const diff = differenceInMinutes(parseISO(endTime), parseISO(startTime));
        return acc + (diff > 0 && !isNaN(diff) ? diff : 0);
      } catch {
        return acc;
      }
    }, 0);
    
    const formatTotalTime = (minutes: number) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) return `${hours}h`;
      return `${hours}h ${remainingMinutes}m`;
    };

    return {
      activeProjects: projects.filter(p => p.status !== 'Completed').length,
      totalTasksCompleted,
      totalTimeLogged: formatTotalTime(totalMinutes)
    };
  }, [projects, tasks, activities]);

  const chartData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const projectTimeMap = new Map<string, number>();

    const recentActivities = activities.filter(a => isAfter(parseISO(a.date), thirtyDaysAgo));

    recentActivities.forEach(activity => {
      const project = projects.find(p => p.id === activity.projectId);
      if (project) {
        const padTime = (time: string) => {
            if (!time || !time.includes(':')) return 0;
            const [hour, minute] = time.split(':');
            return parseInt(hour, 10) * 60 + parseInt(minute, 10);
        };
        const startMinutes = padTime(activity.startTime);
        const endMinutes = padTime(activity.endTime);
        const diff = endMinutes - startMinutes;

        if (diff > 0) {
          projectTimeMap.set(project.name, (projectTimeMap.get(project.name) || 0) + diff);
        }
      }
    });
    
    return Array.from(projectTimeMap.entries()).map(([name, minutes]) => ({
      name,
      hours: parseFloat((minutes / 60).toFixed(2)),
    }));
  }, [activities, projects]);


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasksCompleted}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Logged</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTimeLogged}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Time Logged per Project (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} unit="h" />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Legend />
              <Bar dataKey="hours" fill="hsl(var(--primary))" name="Hours Logged" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
