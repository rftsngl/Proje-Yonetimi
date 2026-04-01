type AppRole =
  | 'Admin'
  | 'Product Manager'
  | 'Senior Developer'
  | 'Frontend Developer'
  | 'UI/UX Designer'
  | 'QA Engineer';

const privilegedRoles = new Set<AppRole>(['Admin', 'Product Manager']);

export const getPermissionsForRole = (role: AppRole) => {
  const isPrivileged = privilegedRoles.has(role);
  const canManageTasks = isPrivileged || role === 'Senior Developer';

  return {
    canManageProjects: isPrivileged,
    canManageTasks,
    canManageTeam: isPrivileged,
    canInviteMembers: isPrivileged,
    canManageCalendar: canManageTasks,
    canViewAllData: isPrivileged,
  };
};

export const canViewAllData = (role: AppRole) => privilegedRoles.has(role);
