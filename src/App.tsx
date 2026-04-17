import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import TaskList from './components/TaskList';
import Projects from './components/Projects';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import Team from './components/Team';
import Notifications from './components/Notifications';
import TaskDetailModal from './components/TaskDetailModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import CreateProjectModal from './components/CreateProjectModal';
import CreateTaskModal from './components/CreateTaskModal';
import ConfirmModal from './components/ConfirmModal';
import { defaultBootstrapData } from './lib/defaultData';
import { getVisibleTabs } from './lib/permissions';
import { login, logout, register, restoreSession } from './services/auth';
import {
  addProjectMember,
  addTaskAssignee,
  addTaskAttachment,
  addTaskComment,
  createCalendarEvent,
  createProject,
  createTask,
  deleteCalendarEvent,
  deleteProject,
  deleteTask,
  deleteTaskComment,
  getAdminAuditLogs,
  getBootstrapData,
  getTaskTree,
  markAllNotificationsRead,
  removeTaskAssignee,
  updateTaskComment,
  updateCalendarEvent,
  updateProject,
  updateTask,
  updateTaskStatus,
  updateUserDepartment,
  updateUserRole,
  deleteTeamMember,
  deleteNotification,
  deleteAllNotifications,
  setNotificationReadState,
  getNotificationsPage,
} from './services/dashboard';
import { clearStoredAuthToken, getStoredAuthToken } from './services/session';
import {
  AppBootstrap,
  AppRole,
  CreateCalendarEventPayload,
  CreateProjectPayload,
  CreateTaskPayload,
  LoginPayload,
  Project,
  RegisterPayload,
  Task,
  TaskTreeItem,
  UserAuditLogItem,
  Notification,
  NotificationCursor,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [presetParentTask, setPresetParentTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [taskProjectFilter, setTaskProjectFilter] = useState<Project | null>(null);
  const [data, setData] = useState<AppBootstrap>(defaultBootstrapData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [updatingUserRoleId, setUpdatingUserRoleId] = useState<string | null>(null);
  const [updatingUserDepartmentId, setUpdatingUserDepartmentId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserAuditLogItem[]>([]);
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);
  const [taskTreeTasks, setTaskTreeTasks] = useState<Task[] | null>(null);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);

  const [pendingDeleteNotification, setPendingDeleteNotification] = useState<Notification | null>(null);
  const pendingDeleteRef = useRef<NodeJS.Timeout | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    showCancel?: boolean;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [notificationFeed, setNotificationFeed] = useState<Notification[]>([]);
  const [notificationFeedHasMore, setNotificationFeedHasMore] = useState(false);
  const [notificationFeedCursor, setNotificationFeedCursor] = useState<NotificationCursor | undefined>(undefined);
  const [isLoadingOlderNotifications, setIsLoadingOlderNotifications] = useState(false);
  const [hasInitializedNotificationFeed, setHasInitializedNotificationFeed] = useState(false);

  const deletedNotificationIds = useRef<Set<string>>(new Set());

  const activeNotifications = useMemo(() => {
    return data.notifications.filter(n => !deletedNotificationIds.current.has(n.id));
  }, [data.notifications]);

  const refreshData = async () => {
    setError(null);
    const bootstrap = await getBootstrapData();
    setData(bootstrap);
    return bootstrap;
  };

  useEffect(() => {
    const initialize = async () => {
      const token = getStoredAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await restoreSession();
        setData(response.bootstrap);
        setIsAuthenticated(true);
      } catch (restoreError) {
        clearStoredAuthToken();
        setIsAuthenticated(false);
        setAuthError(restoreError instanceof Error ? restoreError.message : 'Oturum geri yuklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, []);

  const visibleTabs = useMemo(() => getVisibleTabs(data.permissions), [data.permissions]);

  useEffect(() => {
    if (isAuthenticated && visibleTabs.length && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, isAuthenticated, visibleTabs]);

  useEffect(() => {
    if (activeTab === 'notifications' && !hasInitializedNotificationFeed) {
      setNotificationFeed(activeNotifications);
      setHasInitializedNotificationFeed(true);
      
      if (activeNotifications.length === 20) {
        setNotificationFeedHasMore(true);
        const last = activeNotifications[activeNotifications.length - 1];
        setNotificationFeedCursor({ createdAt: last.createdAt, id: last.id });
      } else {
        setNotificationFeedHasMore(false);
      }
    }
  }, [activeTab, hasInitializedNotificationFeed, activeNotifications]);

  useEffect(() => {
    if (hasInitializedNotificationFeed) {
      setNotificationFeed(prev => {
        const existingMap = new Map<string, Notification>(prev.map(n => [n.id, n]));
        let hasChanges = false;
        const toAdd: Notification[] = [];
        
        activeNotifications.forEach(n => {
          if (!existingMap.has(n.id)) {
            toAdd.push(n);
            hasChanges = true;
          } else if (existingMap.get(n.id)!.read !== n.read) {
            existingMap.set(n.id, n);
            hasChanges = true;
          }
        });
        
        if (!hasChanges) return prev;
        
        const merged = [...toAdd, ...Array.from(existingMap.values())].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB !== tA ? tB - tA : (b.id ?? '').localeCompare(a.id ?? '');
        });
        return merged;
      });
    }
  }, [activeNotifications, hasInitializedNotificationFeed]);

  const handleLogin = async (payload: LoginPayload) => {
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const response = await login(payload);
      // Premium animasyonun görülmesi için yapay gecikme
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setData(response.bootstrap);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : 'Giris yapilamadi.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const response = await register(payload);
      // Premium animasyonun görülmesi için yapay gecikme
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setData(response.bootstrap);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
    } catch (registerError) {
      setAuthError(registerError instanceof Error ? registerError.message : 'Kayit olusturulamadi.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (activeTab === 'settings' && isSettingsDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Ayarlar sayfasında kaydedilmemiş değişiklikleriniz var. Çıkış yapmak istediğinize emin misiniz?',
        confirmLabel: 'Çıkış Yap',
        variant: 'warning',
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setIsSettingsDirty(false);
          await logout();
          setIsAuthenticated(false);
          setData(defaultBootstrapData);
          setSelectedTask(null);
          setSelectedProject(null);
          setTaskProjectFilter(null);
        },
      });
      return;
    }
    await logout();
    setIsAuthenticated(false);
    setData(defaultBootstrapData);
    setSelectedTask(null);
    setSelectedProject(null);
    setTaskProjectFilter(null);
  };

  const canManageProjects = data.permissions.canManageProjects;
  const canManageTasks = data.permissions.canManageTasks;
  const canManageTeam = data.permissions.canManageTeam;
  const canManageCalendar = data.permissions.canManageCalendar;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleNavigateToTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDetailModalOpen(true);
  };

  const handleTabChange = (tab: string) => {
    if (activeTab === 'settings' && isSettingsDirty && tab !== 'settings') {
      setConfirmModal({
        isOpen: true,
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Ayarlar sayfasında kaydedilmemiş değişiklikleriniz var. Ayrılmak istediğinize emin misiniz?',
        confirmLabel: 'Ayrıl',
        variant: 'warning',
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setIsSettingsDirty(false);
          setActiveTab(tab);
        },
      });
    } else {
      setActiveTab(tab);
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    const updatedData = editingTask
      ? await updateTask(editingTask.id, {
          ...payload,
          status: editingTask.status,
          parentTaskId: payload.parentTaskId ?? editingTask.parentTaskId ?? undefined,
        })
      : await createTask(payload);

    setData(updatedData);
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setPresetParentTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDetailModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmModal({
      isOpen: true,
      title: 'Görevi Sil',
      message: `"${task.title}" görevini silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const updatedData = await deleteTask(task.id);
        setData(updatedData);
        setIsTaskDetailModalOpen(false);

        if (selectedTask?.id === task.id) {
          setSelectedTask(null);
        }
      }
    });
  };

  const handleAddTaskComment = async (task: Task, content: string) => {
    const updatedData = await addTaskComment(task.id, data.currentUser.id, content);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
  };

  const handleAddTaskAssignee = async (task: Task, userId: string) => {
    const updatedData = await addTaskAssignee(task.id, userId);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
  };

  const handleAddTaskAttachment = async (task: Task, file: File) => {
    const updatedData = await addTaskAttachment(task.id, file);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
  };

  const handleRemoveTaskAssignee = async (task: Task, userId: string) => {
    const user = data.users.find(u => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Atamayı Kaldır',
      message: `${user?.name || 'Kullanıcı'} kullanıcısının bu görevdeki atamasını kaldırmak istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const updatedData = await removeTaskAssignee(task.id, userId);
          setData(updatedData);
          setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
        } catch {
          setConfirmModal({
            isOpen: true,
            title: 'Hata',
            message: 'Kullanıcı ataması kaldırılamadı.',
            confirmLabel: 'Tamam',
            showCancel: false,
            variant: 'danger',
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        }
      }
    });
  };

  const handleUpdateTaskComment = async (task: Task, commentId: string, content: string) => {
    const updatedData = await updateTaskComment(task.id, commentId, content);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
  };

  const handleMoveTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updatedData = await updateTaskStatus(taskId, status);
      setData(updatedData);
    } catch (moveError) {
      setConfirmModal({
        isOpen: true,
        title: 'Hata',
        message: moveError instanceof Error ? moveError.message : 'Görev durumu güncellenemedi.',
        confirmLabel: 'Tamam',
        showCancel: false,
        variant: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleDeleteTaskComment = async (task: Task, commentId: string) => {
    const updatedData = await deleteTaskComment(task.id, commentId);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
  };

  const flattenTaskTree = (items: TaskTreeItem[]): Task[] => {
    const flattened: Task[] = [];

    const walk = (nodes: TaskTreeItem[], parentTaskId: string | null = null) => {
      for (const node of nodes) {
        const { children, ...task } = node;
        flattened.push({
          ...task,
          parentTaskId: parentTaskId || task.parentTaskId || null,
        });
        walk(children || [], node.id);
      }
    };

    walk(items, null);
    return flattened;
  };

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'tasks' || taskView !== 'list') {
      setTaskTreeTasks(null);
      return;
    }

    let cancelled = false;

    const loadTaskTree = async () => {
      const tasksForScope = taskProjectFilter
        ? data.tasks.filter((task) => task.projectId === taskProjectFilter.id)
        : data.tasks;

      const projectIds = taskProjectFilter
        ? [taskProjectFilter.id]
        : Array.from(new Set(tasksForScope.map((task) => task.projectId)));

      if (!projectIds.length) {
        if (!cancelled) {
          setTaskTreeTasks([]);
        }
        return;
      }

      try {
        const responses = await Promise.all(
          projectIds.map(async (projectId) => ({
            projectId,
            result: await getTaskTree(projectId),
          })),
        );

        const merged = responses.flatMap(({ result }) => flattenTaskTree(result.items));
        if (!cancelled) {
          setTaskTreeTasks(merged);
        }
      } catch {
        if (!cancelled) {
          setTaskTreeTasks(null);
        }
      }
    };

    void loadTaskTree();

    return () => {
      cancelled = true;
    };
  }, [activeTab, data.tasks, isAuthenticated, taskProjectFilter, taskView]);

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    const updatedData = editingProject
      ? await updateProject(editingProject.id, {
          ...payload,
          progress: editingProject.progress,
          status: editingProject.status,
        })
      : await createProject(payload);

    setData(updatedData);
    setIsCreateProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectDetailModalOpen(false);
    setIsCreateProjectModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setConfirmModal({
      isOpen: true,
      title: 'Projeyi Sil',
      message: `"${project.name}" projesini silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const updatedData = await deleteProject(project.id);
        setData(updatedData);
        setIsProjectDetailModalOpen(false);
        if (selectedProject?.id === project.id) {
          setSelectedProject(null);
        }
      }
    });
  };

  const syncNotificationFeed = (updatedData: typeof data, customFeedUpdater?: (prevFeed: Notification[]) => Notification[]) => {
    setData(updatedData);
    if (!hasInitializedNotificationFeed) return;

    setNotificationFeed(prevFeed => {
      let nextFeed = customFeedUpdater ? customFeedUpdater(prevFeed) : prevFeed;
      
      const newBootstrapNotifs = updatedData.notifications;
      
      const existingMap = new Map<string, Notification>(nextFeed.map(n => [n.id, n]));
      const newItemsToAdd: Notification[] = [];
      newBootstrapNotifs.forEach(n => {
        if (existingMap.has(n.id)) {
          existingMap.set(n.id, n);
        } else {
          newItemsToAdd.push(n);
        }
      });
      
      let mergedFeed = [...newItemsToAdd, ...Array.from(existingMap.values())];
      mergedFeed.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id ?? '').localeCompare(a.id ?? '');
      });
      return mergedFeed;
    });
  };

  const handleReadAllNotifications = async () => {
    const updatedData = await markAllNotificationsRead();
    syncNotificationFeed(updatedData, (prev) => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (notificationId: string) => {
    const target = (hasInitializedNotificationFeed ? notificationFeed : data.notifications).find((n) => n.id === notificationId);
    if (!target) return;

    deletedNotificationIds.current.add(notificationId);

    if (pendingDeleteNotification) {
      clearTimeout(pendingDeleteRef.current!);
      deleteNotification(pendingDeleteNotification.id).catch(console.error);
    }

    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== notificationId),
    }));
    
    if (hasInitializedNotificationFeed) {
      setNotificationFeed(prev => prev.filter(n => n.id !== notificationId));
    }

    setPendingDeleteNotification(target);

    pendingDeleteRef.current = setTimeout(async () => {
      setPendingDeleteNotification(null);
      try {
        const updatedData = await deleteNotification(notificationId);
        setData(updatedData);
      } catch (e) {
        console.error(e);
      }
    }, 5000);
  };

  const handleUndoDeleteNotification = () => {
    if (pendingDeleteNotification) {
      deletedNotificationIds.current.delete(pendingDeleteNotification.id);
      clearTimeout(pendingDeleteRef.current!);
      setData((prev) => ({
        ...prev,
        notifications: [(pendingDeleteNotification as Notification), ...prev.notifications].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        }),
      }));
      if (hasInitializedNotificationFeed) {
        setNotificationFeed(prev => {
          const merged = [(pendingDeleteNotification as Notification), ...prev].sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
          });
          return merged;
        });
      }
      setPendingDeleteNotification(null);
    }
  };

  const handleDeleteAllNotifications = async () => {
    const updatedData = await deleteAllNotifications();
    setData(updatedData);
    if (hasInitializedNotificationFeed) {
      setNotificationFeed([]);
      setNotificationFeedHasMore(false);
      setNotificationFeedCursor(undefined);
    }
  };

  const handleToggleNotificationRead = async (notificationId: string, read: boolean) => {
    if (hasInitializedNotificationFeed) {
      setNotificationFeed(prev => prev.map(n => n.id === notificationId ? { ...n, read } : n));
    }
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notificationId ? { ...n, read } : n)
    }));
    try {
      const updatedData = await setNotificationReadState(notificationId, read);
      setData(updatedData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadOlderNotifications = async () => {
    if (!notificationFeedHasMore || isLoadingOlderNotifications) return;
    setIsLoadingOlderNotifications(true);
    try {
      const res = await getNotificationsPage(20, notificationFeedCursor?.createdAt, notificationFeedCursor?.id);
      
      setNotificationFeed(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newUnique = res.items.filter(i => !existingIds.has(i.id));
        return [...prev, ...newUnique];
      });
      setNotificationFeedHasMore(res.hasMore);
      setNotificationFeedCursor(res.nextCursor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOlderNotifications(false);
    }
  };

  const handleOpenNotificationDetail = (notification: Notification) => {
    if (!notification.read) {
      handleToggleNotificationRead(notification.id, true);
    }
    if (notification.entityType === 'task' && notification.entityId) {
      const t = data.tasks.find(t => t.id === notification.entityId) || null;
      setSelectedTask(t);
      setIsTaskDetailModalOpen(true);
    } else if (notification.entityType === 'project' && notification.entityId) {
      const p = data.projects.find(p => p.id === notification.entityId) || null;
      setSelectedProject(p);
      setIsProjectDetailModalOpen(true);
    }
  };

  const checkIsValidNotificationTarget = (notification: Notification) => {
    if (notification.entityType === 'task' && notification.entityId) {
      return data.tasks.some((t) => t.id === notification.entityId);
    }
    if (notification.entityType === 'project' && notification.entityId) {
      return data.projects.some((p) => p.id === notification.entityId);
    }
    return false;
  };

  const handleCreateCalendarEvent = async (payload: CreateCalendarEventPayload) => {
    const updatedData = await createCalendarEvent(payload);
    setData(updatedData);
  };

  const handleUpdateCalendarEvent = async (eventId: string, payload: CreateCalendarEventPayload) => {
    const updatedData = await updateCalendarEvent(eventId, payload);
    setData(updatedData);
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    const updatedData = await deleteCalendarEvent(eventId);
    setData(updatedData);
  };

  const handleViewProjectTasks = (project: Project) => {
    setTaskProjectFilter(project);
    setActiveTab('tasks');
    setIsProjectDetailModalOpen(false);
  };

  const handleDashboardStatNavigation = (targetTab: 'projects' | 'tasks') => {
    if (targetTab === 'tasks') {
      setTaskProjectFilter(null);
    }

    setActiveTab(targetTab);
  };

  const handleAddProjectMember = async (project: Project, userId: string) => {
    const updatedData = await addProjectMember(project.id, userId);
    setData(updatedData);
    setSelectedProject(updatedData.projects.find((item) => item.id === project.id) || null);
  };

  const handleUpdateTeamMemberRole = async (userId: string, role: AppRole) => {
    try {
      setUpdatingUserRoleId(userId);
      const updatedData = await updateUserRole(userId, { role });
      setData(updatedData);
      if (data.permissions.canManageTeam) {
        const response = await getAdminAuditLogs(100);
        setAuditLogs(response.items);
      }
    } catch (updateError) {
      setConfirmModal({
        isOpen: true,
        title: 'Hata',
        message: updateError instanceof Error ? updateError.message : 'Kullanıcı rolü güncellenemedi.',
        confirmLabel: 'Tamam',
        showCancel: false,
        variant: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setUpdatingUserRoleId(null);
    }
  };

  const handleUpdateTeamMemberDepartment = async (userId: string, department: string) => {
    setUpdatingUserDepartmentId(userId);
    try {
      const updatedData = await updateUserDepartment(userId, { department });
      setData(updatedData);
      if (data.permissions.canManageTeam) {
        const response = await getAdminAuditLogs(100);
        setAuditLogs(response.items);
      }
    } catch (updateError) {
      setConfirmModal({
        isOpen: true,
        title: 'Hata',
        message: updateError instanceof Error ? updateError.message : 'Kullanıcı departmanı güncellenemedi.',
        confirmLabel: 'Tamam',
        showCancel: false,
        variant: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setUpdatingUserDepartmentId(null);
    }
  };

  const handleDeleteTeamMember = async (userId: string) => {
    try {
      const updatedData = await deleteTeamMember(userId);
      setData(updatedData);
    } catch (error) {
      setConfirmModal({
        isOpen: true,
        title: 'Hata',
        message: error instanceof Error ? error.message : 'Kullanıcı silinemedi.',
        confirmLabel: 'Tamam',
        showCancel: false,
        variant: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'team' || !data.permissions.canManageTeam) {
      return;
    }

    let cancelled = false;

    const loadAuditLogs = async () => {
      try {
        setIsAuditLogsLoading(true);
        const response = await getAdminAuditLogs(100);
        if (!cancelled) {
          setAuditLogs(response.items);
        }
      } catch {
        if (!cancelled) {
          setAuditLogs([]);
        }
      } finally {
        if (!cancelled) {
          setIsAuditLogsLoading(false);
        }
      }
    };

    void loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [activeTab, data.permissions.canManageTeam, isAuthenticated]);

  const selectedTaskData = useMemo(
    () => data.tasks.find((task) => task.id === selectedTask?.id) || selectedTask,
    [data.tasks, selectedTask],
  );

  const selectedProjectData = useMemo(
    () => data.projects.find((project) => project.id === selectedProject?.id) || selectedProject,
    [data.projects, selectedProject],
  );

  const filteredTasks = taskProjectFilter
    ? data.tasks.filter((task) => task.projectId === taskProjectFilter.id)
    : data.tasks;

  const listTasks = taskTreeTasks || filteredTasks;

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} error={authError} isLoading={isAuthLoading} />;
  }

  const renderTasksContent = () => (
    <div className="space-y-6">
      {taskProjectFilter && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-indigo-700">{taskProjectFilter.name} görevleri gösteriliyor</p>
            <p className="text-xs text-indigo-600">Filtreyi temizlersen tüm görev listesine geri dönersin.</p>
          </div>
          <button
            onClick={() => setTaskProjectFilter(null)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Filtreyi Temizle
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Görevler</h1>
          <p className="mt-1 text-slate-500">Rolüne göre erişebildiğin görevleri ve süreçleri buradan takip edebilirsin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
            <button
              onClick={() => setTaskView('kanban')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                taskView === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setTaskView('list')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                taskView === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
          </div>
          {canManageTasks && (
            <button
              onClick={() => {
                setPresetParentTask(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Yeni Görev</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {taskView === 'kanban' ? (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <KanbanBoard
              tasks={filteredTasks}
              showHeader={false}
              onAddTask={canManageTasks ? () => setIsTaskModalOpen(true) : undefined}
              onTaskClick={handleTaskClick}
              onMoveTask={handleMoveTaskStatus}
              currentUser={data.currentUser}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <TaskList
              tasks={listTasks}
              onAddTask={
                canManageTasks
                  ? () => {
                      setPresetParentTask(null);
                      setIsTaskModalOpen(true);
                    }
                  : undefined
              }
              onAddSubtask={
                canManageTasks
                  ? (task) => {
                      setPresetParentTask(task);
                      setEditingTask(null);
                      setIsTaskModalOpen(true);
                    }
                  : undefined
              }
              onTaskClick={handleTaskClick}
              onEditTask={canManageTasks ? handleEditTask : undefined}
              onDeleteTask={canManageTasks ? handleDeleteTask : undefined}
              canManageTasks={canManageTasks}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="text-sm font-medium text-slate-500">Veriler yükleniyor...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center rounded-3xl border border-rose-100 bg-white px-6 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Bağlantı kurulamadı</h2>
          <p className="mt-2 max-w-xl text-slate-500">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              refreshData()
                .catch((fetchError: Error) => setError(fetchError.message))
                .finally(() => setIsLoading(false));
            }}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            stats={data.stats}
            upcomingTasks={data.tasks.slice(0, 3)}
            projectProgress={data.projectProgress}
            currentUser={data.currentUser}
            onNavigateFromStat={handleDashboardStatNavigation}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={data.projects}
            tasks={data.tasks}
            onProjectClick={handleProjectClick}
            onAddProject={canManageProjects ? () => setIsCreateProjectModalOpen(true) : undefined}
            onEditProject={canManageProjects ? handleEditProject : undefined}
            onDeleteProject={canManageProjects ? handleDeleteProject : undefined}
            canManageProjects={canManageProjects}
          />
        );
      case 'calendar':
        return (
          <Calendar
            events={data.calendarEvents}
            projects={data.projects}
            tasks={data.tasks}
            onCreateEvent={canManageCalendar ? handleCreateCalendarEvent : undefined}
            onUpdateEvent={canManageCalendar ? handleUpdateCalendarEvent : undefined}
            onDeleteEvent={canManageCalendar ? handleDeleteCalendarEvent : undefined}
          />
        );
      case 'team':
        return (
          <Team
            members={data.teamMembers}
            projects={data.projects}
            canInvite={data.permissions.canInviteMembers}
            canManageRoles={data.permissions.canManageTeam}
            currentUserId={data.currentUser.id}
            onUpdateMemberRole={handleUpdateTeamMemberRole}
            updatingUserRoleId={updatingUserRoleId}
            onUpdateMemberDepartment={handleUpdateTeamMemberDepartment}
            updatingUserDepartmentId={updatingUserDepartmentId}
            auditLogs={auditLogs}
            isAuditLogsLoading={isAuditLogsLoading}
            onDeleteMember={handleDeleteTeamMember}
          />
        );
      case 'notifications':
        return (
          <Notifications 
            notifications={notificationFeed} 
            onReadAll={handleReadAllNotifications} 
            onDelete={handleDeleteNotification}
            onDeleteAll={handleDeleteAllNotifications}
            onToggleRead={handleToggleNotificationRead}
            onOpenDetail={handleOpenNotificationDetail}
            checkIsValidTarget={checkIsValidNotificationTarget}
            hasMore={notificationFeedHasMore}
            isLoadingMore={isLoadingOlderNotifications}
            onLoadMore={handleLoadOlderNotifications}
          />
        );
      case 'settings':
        return (
          <Settings
            currentUser={data.currentUser}
            onDataRefresh={async () => {
              try { await refreshData(); } catch { /* silent refresh */ }
            }}
            onDirtyChange={setIsSettingsDirty}
          />
        );
      case 'tasks':
        return renderTasksContent();
      default:
        return null;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      notifications={activeNotifications}
      onReadAllNotifications={handleReadAllNotifications}
      onDeleteNotification={handleDeleteNotification}
      onDeleteAllNotifications={handleDeleteAllNotifications}
      onToggleNotificationRead={handleToggleNotificationRead}
      currentUser={data.currentUser}
      visibleTabs={visibleTabs}
      onLogout={handleLogout}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="min-h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setPresetParentTask(null);
        }}
        onCreate={handleCreateTask}
        projects={data.projects}
        tasks={data.tasks}
        members={data.users}
        initialTask={editingTask}
        presetParentTask={presetParentTask}
      />

      <TaskDetailModal
        task={selectedTaskData}
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        users={data.users}
        allTasks={data.tasks}
        onEdit={canManageTasks ? handleEditTask : undefined}
        onDelete={canManageTasks ? handleDeleteTask : undefined}
        onNavigateToTask={handleNavigateToTask}
        onAddComment={handleAddTaskComment}
        onAddAssignee={canManageTasks ? handleAddTaskAssignee : undefined}
        onAddAttachment={handleAddTaskAttachment}
        onRemoveAssignee={canManageTasks ? handleRemoveTaskAssignee : undefined}
        onUpdateComment={handleUpdateTaskComment}
        onDeleteComment={handleDeleteTaskComment}
      />

      <ProjectDetailModal
        project={selectedProjectData}
        isOpen={isProjectDetailModalOpen}
        onClose={() => setIsProjectDetailModalOpen(false)}
        users={data.users}
        tasks={data.tasks}
        onEdit={canManageProjects ? handleEditProject : undefined}
        onDelete={canManageProjects ? handleDeleteProject : undefined}
        onViewAllTasks={handleViewProjectTasks}
        onAddMember={canManageTeam ? handleAddProjectMember : undefined}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => {
          setIsCreateProjectModalOpen(false);
          setEditingProject(null);
        }}
        onCreate={handleCreateProject}
        managers={data.users}
        initialProject={editingProject}
      />

      {/* Undo Toast */}
      <AnimatePresence>
        {pendingDeleteNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-4 rounded-full bg-slate-900 px-6 py-3 text-sm text-white shadow-xl"
          >
            <span>Bildirim silindi.</span>
            <button
              onClick={handleUndoDeleteNotification}
              className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Geri Al
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
}
