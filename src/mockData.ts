import { CalendarEvent, Notification, Project, ProjectProgress, Stat, Task, TeamMember, User } from './types';

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'ev1', title: 'Tasarım Teslimi', date: '2026-03-28', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'ev2', title: 'Müşteri Toplantısı', date: '2026-03-29', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'ev3', title: 'Sprint Review', date: '2026-03-30', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

export const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'E-Ticaret Mobil Uygulama',
    description: 'Yeni nesil alışveriş deneyimi için mobil uygulama geliştirme süreci.',
    manager: 'Celal Halilov',
    managerAvatar: 'user1',
    progress: 75,
    daysLeft: 12,
    team: ['user1', 'user2', 'user3'],
    status: 'Aktif',
    category: 'Mobil Geliştirme',
    themeColor: 'bg-indigo-600',
    startDate: '2026-03-01',
    endDate: '2026-04-08',
  },
];

export const mockUsers: User[] = [
  { id: 'user1', name: 'Celal Halilov', avatar: 'user1', role: 'Admin', email: 'celal@projex.com', status: 'Online', lastActive: 'Şimdi' },
  { id: 'user2', name: 'Ayşe Kaya', avatar: 'user2', role: 'Senior Developer', email: 'ayse@projex.com', status: 'Online', lastActive: '2 dk önce' },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'user1',
    name: 'Celal Halilov',
    avatar: 'user1',
    role: 'Admin',
    email: 'celal@projex.com',
    status: 'Online',
    lastActive: 'Şimdi',
    department: 'Yönetim',
    projectsCount: 5,
    tasksCount: 12,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'nt1',
    title: 'Yeni Görev Atandı',
    description: 'Celal Halilov size "Dashboard Geliştirme" görevini atadı.',
    time: '5 dakika önce',
    type: 'task',
    read: false,
  },
];

export const mockStats: Stat[] = [
  { label: 'Toplam Proje', value: '12', trend: '+8%', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50', iconName: 'Briefcase' },
  { label: 'Aktif Görevler', value: '48', trend: '+12%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50', iconName: 'Clock' },
];

export const mockTasks: Task[] = [
  {
    id: 'TSK-001',
    title: 'Kullanıcı Araştırması',
    description: 'Yeni özellikler için kullanıcı geri bildirimlerini analiz et.',
    priority: 'Yüksek',
    status: 'Yapılacak',
    date: '30 Mart',
    dueDate: '2026-03-30',
    assignees: ['user1', 'user2'],
    assigneeNames: ['Celal Halilov', 'Ayşe Kaya'],
    comments: 1,
    commentsList: [
      {
        id: 'c1',
        authorId: 'user2',
        authorName: 'Ayşe Kaya',
        authorAvatar: 'user2',
        content: 'İlk görüşme notlarını tamamladım.',
        time: '2 saat önce',
        createdAt: '2026-03-28T10:00:00.000Z',
      },
    ],
    attachments: 2,
    attachmentsList: [
      {
        id: 'att1',
        name: 'Tasarim_Rehberi.pdf',
        fileType: 'PDF',
        fileSizeLabel: '2.4 MB',
      },
      {
        id: 'att2',
        name: 'Logo_Alternatif.png',
        fileType: 'PNG',
        fileSizeLabel: '1.1 MB',
      },
    ],
    project: 'E-Ticaret Mobil Uygulama',
    projectId: 'PRJ-001',
  },
];

export const mockProjectProgress: ProjectProgress[] = [
  { id: 1, name: 'E-Ticaret Mobil Uygulama', progress: 75, color: 'bg-indigo-600' },
];
