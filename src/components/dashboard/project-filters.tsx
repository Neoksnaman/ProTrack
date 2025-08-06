
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ProjectStatus, ProjectPriority } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

interface ProjectFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  overdueFilter: boolean;
  setOverdueFilter: (value: boolean) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const statuses: ProjectStatus[] = ['Planning', 'In Progress', 'Blocked', 'Completed'];
const priorities: ProjectPriority[] = ['High', 'Medium', 'Low'];

export default function ProjectFilters({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  overdueFilter,
  setOverdueFilter,
  searchQuery,
  setSearchQuery,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end print:hidden">
       <div className="grid flex-1 gap-2">
        <Label htmlFor="search-filter">Search</Label>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                id="search-filter"
                placeholder="Search by project or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />
        </div>
      </div>
      <div className="grid flex-1 gap-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid flex-1 gap-2">
        <Label htmlFor="priority-filter">Priority</Label>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger id="priority-filter">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2 pb-2">
        <Switch id="overdue-filter" checked={overdueFilter} onCheckedChange={setOverdueFilter} />
        <Label htmlFor="overdue-filter">Show overdue only</Label>
      </div>
    </div>
  );
}
