export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface UserItem {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
}

export interface AuthResponse {
  message?: string;
  user: AuthUser;
  token?: string;
}

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user?: UserItem;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  teamId: string | null;
  assigneeId: string | null;
  creatorId?: string | null;
  createdAt: string;
  team?: {
    id: string;
    name: string;
  } | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  owner?: UserItem;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface TeamDetailItem extends TeamItem {
  members: TeamMemberItem[];
  tasks: TaskItem[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
}
