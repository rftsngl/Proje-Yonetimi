export interface User {
  id: string;
  name: string;
  avatar: string;
  role: AppRole;
  email?: string;
  status?: 'Online' | 'Offline' | 'Busy';
  lastActive?: string;
  department?: string;
}

export type AppRole =
  | 'Admin'
  | 'Product Manager'
  | 'Senior Developer'
  | 'Frontend Developer'
  | 'UI/UX Designer'
  | 'QA Engineer';

export interface TeamMember extends User {
  department: string;
  projectsCount: number;
  tasksCount: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'task' | 'project' | 'mention' | 'system';
  read: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  time: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface TaskAttachment {
  id: string;
  name: string;
  fileType: string;
  fileSizeLabel: string;
  url?: string | null;
  mimeType?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  parentTaskId?: string | null;
  wbsCode?: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  status: 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti';
  date: string;
  startDate?: string | null;
  dueDate?: string | null;
  assignees: string[];
  assigneeNames: string[];
  comments: number;
  commentsList: TaskComment[];
  attachments: number;
  attachmentsList: TaskAttachment[];
  project: string;
  projectId: string;
}

export interface Stat {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  color: string;
  bg: string;
  iconName: string;
}

export interface ProjectProgress {
  id: number;
  name: string;
  progress: number;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  color: string;
  eventType?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  managerAvatar: string;
  progress: number;
  daysLeft: number;
  team: string[];
  status: 'Aktif' | 'Tamamlandı';
  category: string;
  themeColor?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AppBootstrap {
  stats: Stat[];
  tasks: Task[];
  projectProgress: ProjectProgress[];
  projects: Project[];
  calendarEvents: CalendarEvent[];
  teamMembers: TeamMember[];
  notifications: Notification[];
  users: User[];
  currentUser: User;
  permissions: PermissionSet;
}

export interface PermissionSet {
  canManageProjects: boolean;
  canManageTasks: boolean;
  canManageTeam: boolean;
  canInviteMembers: boolean;
  canManageCalendar: boolean;
  canViewAllData: boolean;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  projectId: string;
  parentTaskId?: string;
  assigneeIds: string[];
  startDate?: string;
  dueDate?: string;
  priority: Task['priority'];
}

export interface UpdateTaskPayload extends CreateTaskPayload {
  status?: Task['status'];
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  category: string;
  managerId: string;
  startDate?: string;
  endDate?: string;
  themeColor?: string;
}

export interface UpdateProjectPayload extends CreateProjectPayload {
  progress?: number;
  status?: Project['status'];
}

export interface CreateCalendarEventPayload {
  title: string;
  date: string;
  color: string;
  eventType: string;
}

export interface AuthPayload {
  token: string;
  bootstrap: AppBootstrap;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  department?: string;
}

export interface UpdateUserRolePayload {
  role: AppRole;
}

export interface UpdateUserDepartmentPayload {
  department: string;
}

export interface UserAuditLogItem {
  id: string;
  actorUserId: string;
  actorName: string;
  targetUserId: string;
  targetName: string;
  action: 'role_update' | 'department_update';
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface UserAuditLogsResponse {
  items: UserAuditLogItem[];
}

export interface TaskTreeItem extends Task {
  children: TaskTreeItem[];
}

export interface TaskTreeResponse {
  items: TaskTreeItem[];
}
