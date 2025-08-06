

'use client';

import { useState, useMemo } from 'react';
import { differenceInMinutes, parseISO, isBefore, startOfToday } from 'date-fns';
import ProjectCard from './project-card';
import ProjectFilters from './project-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useData } from '@/hooks/use-data';
import type { Project, Task, Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function ProjectList() {
  const { user } = useAuth();
  const { projects, users, tasks, activities, isProjectsLoading } = useData();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const projectMetrics = useMemo(() => {
    const metrics = new Map<string, { completedTasks: number; totalTasks: number; totalMinutes: number }>();
    
    const padTime = (time: string) => {
      if (!time || !time.includes(':')) return '00:00';
      const [hour, minute] = time.split(':');
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    };

    tasks.forEach(task => {
      if (!metrics.has(task.projectId)) {
        metrics.set(task.projectId, { completedTasks: 0, totalTasks: 0, totalMinutes: 0 });
      }
      const projectMetric = metrics.get(task.projectId)!;
      projectMetric.totalTasks += 1;
      if (task.status === 'Done') {
        projectMetric.completedTasks += 1;
      }
    });

    activities.forEach(activity => {
        if (!metrics.has(activity.projectId)) {
            metrics.set(activity.projectId, { completedTasks: 0, totalTasks: 0, totalMinutes: 0 });
        }
        const projectMetric = metrics.get(activity.projectId)!;
        try {
            const today = new Date().toISOString().split('T')[0];
            const startTime = `${today}T${padTime(activity.startTime)}`;
            const endTime = `${today}T${padTime(activity.endTime)}`;
            const diff = differenceInMinutes(parseISO(endTime), parseISO(startTime));
            if (diff > 0 && !isNaN(diff)) {
              projectMetric.totalMinutes += diff;
            }
        } catch {}
    });

    return metrics;
  }, [tasks, activities]);


  const visibleProjects = useMemo(() => {
    if (!user) return [];

    if (user.role === 'Admin' || user.role === 'Supervisor') {
      return projects;
    }
    
    if (user.role === 'Senior' && user.team) {
      const teamMemberIds = users
        .filter(u => u.team === user.team)
        .map(u => u.id);
      
      return projects.filter(project => 
        project.teamLeaderId === user.id || 
        project.teamMemberIds.includes(user.id) ||
        project.teamMemberIds.some(memberId => teamMemberIds.includes(memberId))
      );
    }

    // Default for Associates
    return projects.filter(project => 
      project.teamLeaderId === user.id || project.teamMemberIds.includes(user.id)
    );
  }, [projects, users, user]);

  const filteredProjects = useMemo(() => {
    const filtered = visibleProjects.filter((project) => {
      const statusMatch = statusFilter === 'all' || project.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || project.priority === priorityFilter;
      const isOverdue = project.deadline ? isBefore(parseISO(project.deadline), startOfToday()) && project.status !== 'Completed' : false;
      const overdueMatch = !overdueFilter || isOverdue;
      const lowercasedQuery = searchQuery.toLowerCase();
      const searchMatch = 
        project.name.toLowerCase().includes(lowercasedQuery) ||
        project.clientName.toLowerCase().includes(lowercasedQuery);
      return statusMatch && priorityMatch && overdueMatch && searchMatch;
    });
    setCurrentPage(1); // Reset to first page when filters change
    return filtered;
  }, [visibleProjects, statusFilter, priorityFilter, overdueFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProjects = useMemo(() => {
      return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, startIndex, endIndex]);

  if (isProjectsLoading) {
    return (
       <div className="space-y-4">
        <ProjectFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          overdueFilter={overdueFilter}
          setOverdueFilter={setOverdueFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProjectFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        overdueFilter={overdueFilter}
        setOverdueFilter={setOverdueFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {filteredProjects.length > 0 ? (
        <>
        {/* Screen view (paginated) */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:hidden">
          {currentProjects.map((project) => {
            const metrics = projectMetrics.get(project.id) || { completedTasks: 0, totalTasks: 0, totalMinutes: 0 };
            return (
              <ProjectCard 
                key={project.id}
                project={project}
                completedTasks={metrics.completedTasks}
                totalTasks={metrics.totalTasks}
                totalMinutes={metrics.totalMinutes}
              />
            )
          })}
        </div>

        {/* Print view (all projects) */}
        <div className="hidden print:grid print:grid-cols-2 print:gap-4">
            {filteredProjects.map((project) => {
                const metrics = projectMetrics.get(project.id) || { completedTasks: 0, totalTasks: 0, totalMinutes: 0 };
                return (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        completedTasks={metrics.completedTasks}
                        totalTasks={metrics.totalTasks}
                        totalMinutes={metrics.totalMinutes}
                    />
                )
            })}
        </div>

         {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 print:hidden">
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
            </div>
        )}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <h3 className="text-lg font-medium">No projects found.</h3>
                <p className="text-muted-foreground">Try adjusting your filters or create a new project.</p>
            </div>
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg h-[270px]">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex-grow" />
      <div className="flex justify-between pt-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}
