
'use client';

import { useMemo, useState } from 'react';
import type { User, Project, Task, Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInMinutes, parseISO, isAfter, subDays, format } from 'date-fns';
import { Hourglass, ListChecks, Briefcase, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UserStatsProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

const ITEMS_PER_PAGE = 10;

export default function UserStats({ user, projects, tasks, activities }: UserStatsProps) {
  const [currentPage, setCurrentPage] = useState(1);

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
          if (!time || !time.includes(':')) return '00:00';
          const [hour, minute] = time.split(':');
          return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        };

        try {
            const today = new Date().toISOString().split('T')[0];
            const startTime = `${today}T${padTime(activity.startTime)}`;
            const endTime = `${today}T${padTime(activity.endTime)}`;
            const diff = differenceInMinutes(parseISO(endTime), parseISO(startTime));

            if (diff > 0) {
              projectTimeMap.set(project.name, (projectTimeMap.get(project.name) || 0) + diff);
            }
        } catch {
            // Ignore if time is invalid
        }
      }
    });
    
    return Array.from(projectTimeMap.entries()).map(([name, minutes]) => ({
      name,
      hours: parseFloat((minutes / 60).toFixed(2)),
    }));
  }, [activities, projects]);
  
  const recentActivities = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return activities
      .filter(a => isAfter(parseISO(a.date), thirtyDaysAgo))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);

  const totalPages = Math.ceil(recentActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentActivities = recentActivities.slice(startIndex, endIndex);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  }
  
  const formatDuration = (start: string, end: string) => {
    const padTime = (time: string) => {
      if (!time || !time.includes(':')) return 'N/A';
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
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Logged (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} />
                <YAxis allowDecimals={false} unit="h" />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" name="Hours Logged" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Activity Log (Last 30 Days)</CardTitle>
                <CardDescription>Activities logged in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {currentActivities.length > 0 ? currentActivities.map(activity => (
                        <li key={activity.id} className="flex flex-col space-y-1 rounded-lg border p-3">
                             <p className="font-medium leading-none">
                                <Link href={`/projects/${activity.projectId}`} className="hover:underline">{getProjectName(activity.projectId)}</Link>
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(parseISO(activity.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDuration(activity.startTime, activity.endTime)}</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">Task: {activity.taskName}</p>
                            <p className="text-sm text-foreground pt-1">{activity.activity}</p>
                        </li>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No activity found in the last 30 days.</p>
                    )}
                </ul>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="flex justify-center items-center gap-4 pt-4">
                  <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                  >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                  </Button>
                  <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                  </span>
                  <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                  >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              </CardFooter>
            )}
        </Card>
      </div>
    </div>
  );
}
