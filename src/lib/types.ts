
export type ProjectStatus = 'Planning' | 'In Progress' | 'Blocked' | 'Completed';
export type ProjectPriority = 'High' | 'Medium' | 'Low';

export type Project = {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  teamLeaderId: string;
  teamLeader: string;
  teamMemberIds: string[];
  teamMembers: User[];
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  priority: ProjectPriority;
};

export const UserRoles = ['Admin', 'Supervisor', 'Senior', 'Associate'] as const;
export type UserRole = typeof UserRoles[number];

export const Teams = ['Team 1', 'Team 2', 'Team 3'] as const;
export type Team = typeof Teams[number];

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  password?: string;
  role: UserRole;
  team?: Team;
};

export type Client = {
  id: string;
  name: string;
  address: string;
};

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: TaskStatus;
};

export type Activity = {
  id: string;
  activity: string;
  taskId: string;
  taskName: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  startTime: string;
  endTime: string;
};
