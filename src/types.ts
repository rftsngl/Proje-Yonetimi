export interface User {
  id: string;
  name: string;
  avatar: string;
  role: AppRole;
  email?: string;
  status?: 'Online' | 'Offline' | 'Busy';
  lastActive?: string;
  department?: string;
  workspaceId?: string;
  workspaceName?: string;
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
  entityType?: 'task' | 'project' | 'calendar' | 'none';
  entityId?: string | null;
  createdAt?: string;
}

export interface NotificationCursor {
  createdAt?: string;
  id?: string;
}

export interface NotificationsPageResponse {
  items: Notification[];
  hasMore: boolean;
  nextCursor?: NotificationCursor;
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
  endDate?: string;
  reminderOffset?: number;
  color: string;
  eventType?: string;
}

export type ProjectStatus = 'Taslak' | 'Planlanıyor' | 'Aktif' | 'Askıda' | 'Tamamlandı' | 'İptal Edildi';

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  managerAvatar: string;
  managerId: string;
  progress: number;
  daysLeft: number;
  team: string[];
  status: ProjectStatus;
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

// ---------------------------------------------------------------------------
// Project Wizard — Payload helpers
// ---------------------------------------------------------------------------

export interface CreateProjectStakeholderPayload {
  name: string;
  role: string;
  interest: 'Düşük' | 'Orta' | 'Yüksek';
  power: 'Düşük' | 'Orta' | 'Yüksek';
  expectation?: string;
  communicationMethod?: string;
}

export interface CreateProjectRequirementPayload {
  title: string;
  description: string;
  type: 'İşlevsel' | 'İşlevsel Olmayan';
  priority: 'Must' | 'Should' | 'Could' | "Won't";
  difficulty: number;
  businessValue: number;
  acceptanceCriteria?: string;
}

export type ProjectRiskCategory =
  | 'Teknik'
  | 'Planlama'
  | 'Yönetim'
  | 'Finansal'
  | 'Kaynak'
  | 'Kalite'
  | 'İletişim'
  | 'Güvenlik';

export interface CreateProjectRiskPayload {
  title: string;
  description?: string;
  category: ProjectRiskCategory;
  probability: number;
  impact: number;
  mitigation?: string;
  contingency?: string;
}

export type ProjectCostCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export type ProjectCostCategory =
  | 'Personel'
  | 'Yazılım Lisansı'
  | 'Donanım'
  | 'Sunucu / Hosting'
  | 'Eğitim'
  | 'Danışmanlık'
  | 'Test'
  | 'Bakım'
  | 'Diğer';

export interface CreateProjectCostItemPayload {
  title: string;
  estimatedCost: number;
  actualCost?: number;
  currency: ProjectCostCurrency;
  category: ProjectCostCategory;
}

export type ProjectTestType =
  | 'Birim Testi'
  | 'Entegrasyon Testi'
  | 'Sistem Testi'
  | 'Kullanıcı Kabul Testi'
  | 'Kullanılabilirlik Testi'
  | 'Performans Testi'
  | 'Güvenlik Testi';

export interface CreateProjectTestItemPayload {
  title: string;
  testType: ProjectTestType;
  expectedResult?: string;
}

// ---------------------------------------------------------------------------
// Project Wizard — Main payload
// ---------------------------------------------------------------------------

export interface CreateProjectPayload {
  name: string;
  description: string;
  category: string;
  managerId: string;
  startDate?: string;
  endDate?: string;
  themeColor?: string;

  // Temel Bilgiler (ek)
  purpose?: string;
  problemStatement?: string;
  targetUsers?: string;
  projectType?: string;

  // Değer ve Uygunluk
  directValue?: string;
  indirectValue?: string;
  strategicAlignment?: string;
  sustainabilityNotes?: string;
  expectedBenefits?: string;
  notDoingImpact?: string;
  feasibilityScore?: number;

  // Kapsam
  inScope?: string;
  outOfScope?: string;
  assumptions?: string;
  constraints?: string;
  acceptanceCriteria?: string;

  // İlişkili koleksiyonlar
  stakeholders?: CreateProjectStakeholderPayload[];
  requirements?: CreateProjectRequirementPayload[];
  risks?: CreateProjectRiskPayload[];
  costItems?: CreateProjectCostItemPayload[];
  testItems?: CreateProjectTestItemPayload[];

  // WBS
  createDefaultWbsTasks?: boolean;
  selectedWbsTemplate?: 'software-default' | 'empty';
}

export interface UpdateProjectPayload extends Omit<CreateProjectPayload,
  'stakeholders' | 'requirements' | 'risks' | 'costItems' | 'testItems' |
  'createDefaultWbsTasks' | 'selectedWbsTemplate'
> {
  progress?: number;
  status?: ProjectStatus;
}

// ---------------------------------------------------------------------------
// Project Wizard — Read models (backend'den dönen veriler)
// ---------------------------------------------------------------------------

export interface ProjectPlanningDetails {
  id: string;
  projectId: string;
  purpose: string | null;
  problemStatement: string | null;
  targetUsers: string | null;
  projectType: string | null;
  directValue: string | null;
  indirectValue: string | null;
  strategicAlignment: string | null;
  sustainabilityNotes: string | null;
  expectedBenefits: string | null;
  notDoingImpact: string | null;
  feasibilityScore: number | null;
  inScope: string | null;
  outOfScope: string | null;
  assumptions: string | null;
  constraints: string | null;
  acceptanceCriteria: string | null;
}

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  name: string;
  role: string;
  interest: 'Düşük' | 'Orta' | 'Yüksek';
  power: 'Düşük' | 'Orta' | 'Yüksek';
  expectation: string | null;
  communicationMethod: string | null;
}

export interface ProjectRequirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'İşlevsel' | 'İşlevsel Olmayan';
  priority: 'Must' | 'Should' | 'Could' | "Won't";
  difficulty: number;
  businessValue: number;
  acceptanceCriteria: string | null;
  status: string;
}

export type ProjectRiskPriority = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';

export interface ProjectRisk {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  category: ProjectRiskCategory;
  probability: number;
  impact: number;
  score: number;
  priority: ProjectRiskPriority;
  mitigation: string | null;
  contingency: string | null;
  status: string;
}

export interface ProjectCostItem {
  id: string;
  projectId: string;
  title: string;
  category: ProjectCostCategory;
  estimatedCost: number;
  actualCost: number;
  currency: ProjectCostCurrency;
}

export interface ProjectTestItem {
  id: string;
  projectId: string;
  title: string;
  testType: ProjectTestType;
  expectedResult: string | null;
  status: string;
}

export interface ProjectCommunicationPlan {
  id: string;
  projectId: string;
  meetingType: string;
  frequency: string | null;
  channel: string | null;
  participants: string | null;
  responsibleUserId: string | null;
  responsibleUserName?: string | null;
}

export interface CreateProjectCommunicationPlanPayload {
  meetingType: string;
  frequency?: string;
  channel?: string;
  participants?: string;
  responsibleUserId?: string;
}
export interface CreateCalendarEventPayload {
  title: string;
  date: string;
  endDate?: string;
  reminderOffset?: number;
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
  workspaceName: string;
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
  action: 'role_update' | 'department_update' | 'user_deletion';
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

// ---------------------------------------------------------------------------
// Settings types
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'tr' | 'en';

export interface UserSettings {
  theme: ThemeMode;
  language: LanguageCode;
  notifyTaskAssigned: boolean;
  notifyProjectUpdates: boolean;
  notifyDeadlineReminders: boolean;
}

export interface UserProfileSettings {
  fullName: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  avatarUrl: string;
}

export interface SettingsBundle {
  profile: UserProfileSettings;
  settings: UserSettings;
}

export interface UpdateSettingsPayload {
  theme?: ThemeMode;
  language?: LanguageCode;
  notifyTaskAssigned?: boolean;
  notifyProjectUpdates?: boolean;
  notifyDeadlineReminders?: boolean;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  department?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
