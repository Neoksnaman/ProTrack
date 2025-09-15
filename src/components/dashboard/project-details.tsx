

'use client';

import { useMemo } from 'react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { Project, ProjectStatus } from '@/lib/types';
import { CalendarDays, Flag, User as UserIcon, Users, Building, TriangleAlert, Edit, Trash2, Share2, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';

interface ProjectDetailsProps {
  project: Project;
  setProjectStatus?: (status: ProjectStatus) => void;
  isSavingStatus?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isPublicView?: boolean;
}

const statuses: ProjectStatus[] = ['Planning', 'In Progress', 'Blocked', 'Completed'];

export default function ProjectDetails({ project, setProjectStatus, isSavingStatus, onEdit, onDelete, onShare, isPublicView = false }: ProjectDetailsProps) {
  const auth = !isPublicView ? useAuth() : null;
  const user = auth?.user;
  
  const isOverdue = isBefore(parseISO(project.deadline), startOfToday()) && project.status !== 'Completed';

  const canModifyProject = useMemo(() => {
    if (isPublicView || !user || !project) return false;
    if (user.role === 'Admin') return true;
    if (project.teamLeaderId === user.id) return true;
    return false;
  }, [user, project, isPublicView]);

  const canUpdateStatus = useMemo(() => {
    if (isPublicView || !user || !project) return false;
    if (user.role === 'Admin') return true;
    if (project.teamLeaderId === user.id) return true;
    return false;
  }, [user, project, isPublicView]);
  

  const getPriorityColor = () => {
    switch (project.priority) {
      case 'High':
        return 'text-red-600 dark:text-red-400';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

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

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setProjectStatus?.(newStatus);
  };
  
  const displayedMembers = project.teamMembers.slice(0, 2);
  const remainingMembers = project.teamMembers.slice(2);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Project Details</CardTitle>
            {canModifyProject && (
              <div className='flex items-center gap-2'>
                  <Button variant="ghost" size="icon" onClick={onShare}>
                      <Share2 className="h-5 w-5" />
                      <span className="sr-only">Share Project</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                      <Edit className="h-5 w-5" />
                      <span className="sr-only">Edit Project</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Delete Project</span>
                  </Button>
              </div>
            )}
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {!isPublicView && (
            <>
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <Select value={project.status} onValueChange={handleStatusChange} disabled={isSavingStatus || !canUpdateStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem icon={<Building className="h-5 w-5 text-muted-foreground" />} label="Client">
                {project.clientName}
            </InfoItem>
            {isPublicView ? (
              <InfoItem icon={<Info className="h-5 w-5 text-muted-foreground" />} label="Status">
                <Badge variant="outline" className={cn(getStatusColor())}>{project.status}</Badge>
              </InfoItem>
            ) : (
              <InfoItem icon={<Flag className={cn("h-5 w-5", getPriorityColor())} />} label="Priority">
                <Badge variant="outline" className={cn('border-none text-base font-normal p-0', getPriorityColor())}>
                  {project.priority}
                </Badge>
              </InfoItem>
            )}
            <InfoItem icon={<CalendarDays className="h-5 w-5 text-muted-foreground" />} label="Start Date">
              {format(parseISO(project.startDate), 'MMMM dd, yyyy')}
            </InfoItem>
            <InfoItem 
              icon={isOverdue ? <TriangleAlert className="h-5 w-5 text-red-600" /> : <CalendarDays className="h-5 w-5 text-muted-foreground" />} 
              label={isPublicView ? "Estimated Date of Completion" : "Deadline"}
              valueClassName={cn(isOverdue && "text-red-600 font-medium")}
            >
              {format(parseISO(project.deadline), 'MMMM dd, yyyy')}
            </InfoItem>
            <InfoItem icon={<UserIcon className="h-5 w-5 text-muted-foreground" />} label="Team Leader">
              {project.teamLeader}
            </InfoItem>
            <InfoItem icon={<Users className="h-5 w-5 text-muted-foreground" />} label="Team Members">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{displayedMembers.map(m => m.name).join(', ')}</span>
                {remainingMembers.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary">+{remainingMembers.length}</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <ul className="list-disc pl-4">
                          {remainingMembers.map(member => (
                            <li key={member.id}>{member.name}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </InfoItem>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon, label, children, valueClassName }: { icon: React.ReactNode; label: string; children: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("text-base font-medium", valueClassName)}>{children}</div>
      </div>
    </div>
  );
}
