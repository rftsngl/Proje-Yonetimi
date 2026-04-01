import { PermissionSet } from '../types';

export const getVisibleTabs = (permissions: PermissionSet) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projeler' },
    { id: 'tasks', label: 'Görevler' },
    { id: 'team', label: 'Ekip' },
    { id: 'calendar', label: 'Takvim' },
    { id: 'notifications', label: 'Bildirimler' },
    { id: 'settings', label: 'Ayarlar' },
  ];

  return tabs.filter((tab) => {
    if (tab.id === 'team') {
      return permissions.canManageTeam || permissions.canViewAllData;
    }

    return true;
  });
};
