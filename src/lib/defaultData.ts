import { AppBootstrap } from '../types';

export const defaultBootstrapData: AppBootstrap = {
  stats: [],
  tasks: [],
  projectProgress: [],
  projects: [],
  calendarEvents: [],
  teamMembers: [],
  notifications: [],
  users: [],
  currentUser: {
    id: '',
    name: '',
    avatar: 'user1',
    role: 'Frontend Developer',
    email: '',
  },
  permissions: {
    canManageProjects: false,
    canManageTasks: false,
    canManageTeam: false,
    canInviteMembers: false,
    canManageCalendar: false,
    canViewAllData: false,
  },
};
