import { useEffect, useMemo, useState, useRef } from 'react';
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
  updateProject,
  updateTask,
  updateTaskStatus,
  updateUserDepartment,
  updateUserRole,
  deleteNotification,
  deleteAllNotifications,
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

  const [pendingDeleteNotification, setPendingDeleteNotification] = useState<Notification | null>(null);
  const pendingDeleteRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleLogin = async (payload: LoginPayload) => {
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const response = await login(payload);
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

  const handleDeleteTask = async (task: Task) => {
    const confirmed = window.confirm(`"${task.title}" görevini silmek istediğinize emin misiniz?`);

    if (!confirmed) {
      return;
    }

    const updatedData = await deleteTask(task.id);
    setData(updatedData);
    setIsTaskDetailModalOpen(false);

    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }
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
    const updatedData = await removeTaskAssignee(task.id, userId);
    setData(updatedData);
    setSelectedTask(updatedData.tasks.find((item) => item.id === task.id) || null);
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
      window.alert(moveError instanceof Error ? moveError.message : 'Görev durumu güncellenemedi.');
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

  const handleDeleteProject = async (project: Project) => {
    const confirmed = window.confirm(`"${project.name}" projesini silmek istediğinize emin misiniz?`);

    if (!confirmed) {
      return;
    }

    const updatedData = await deleteProject(project.id);
    setData(updatedData);
    setIsProjectDetailModalOpen(false);
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
    }
  };

  const handleReadAllNotifications = async () => {
    const updatedData = await markAllNotificationsRead();
    setData(updatedData);
  };

  const handleDeleteNotification = (notificationId: string) => {
    const target = data.notifications.find((n) => n.id === notificationId);
    if (!target) return;

    if (pendingDeleteNotification) {
      clearTimeout(pendingDeleteRef.current!);
      deleteNotification(pendingDeleteNotification.id).catch(console.error);
    }

    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== notificationId),
    }));

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
      clearTimeout(pendingDeleteRef.current!);
      setData((prev) => ({
        ...prev,
        // En başa ekleyip geri getiriyoruz. (Sıralama sonraki refetch ile düzelir)
        notifications: [pendingDeleteNotification, ...prev.notifications],
      }));
      setPendingDeleteNotification(null);
    }
  };

  const handleDeleteAllNotifications = async () => {
    const updatedData = await deleteAllNotifications();
    setData(updatedData);
  };

  const handleCreateCalendarEvent = async (payload: CreateCalendarEventPayload) => {
    const updatedData = await createCalendarEvent(payload);
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
      window.alert(updateError instanceof Error ? updateError.message : 'Kullanici rolu guncellenemedi.');
    } finally {
      setUpdatingUserRoleId(null);
    }
  };

  const handleUpdateTeamMemberDepartment = async (userId: string, department: string) => {
    try {
      setUpdatingUserDepartmentId(userId);
      const updatedData = await updateUserDepartment(userId, { department });
      setData(updatedData);
      if (data.permissions.canManageTeam) {
        const response = await getAdminAuditLogs(100);
        setAuditLogs(response.items);
      }
    } catch (updateError) {
      window.alert(updateError instanceof Error ? updateError.message : 'Kullanici departmani guncellenemedi.');
    } finally {
      setUpdatingUserDepartmentId(null);
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

      {taskView === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          showHeader={false}
          onAddTask={canManageTasks ? () => setIsTaskModalOpen(true) : undefined}
          onTaskClick={handleTaskClick}
          onMoveTask={handleMoveTaskStatus}
          currentUser={data.currentUser}
        />
      ) : (
        <TaskList
          tasks={listTasks}
          onAddTask={canManageTasks ? () => {
            setPresetParentTask(null);
            setIsTaskModalOpen(true);
          } : undefined}
          onAddSubtask={canManageTasks ? (task) => {
            setPresetParentTask(task);
            setEditingTask(null);
            setIsTaskModalOpen(true);
          } : undefined}
          onTaskClick={handleTaskClick}
          onEditTask={canManageTasks ? handleEditTask : undefined}
          onDeleteTask={canManageTasks ? handleDeleteTask : undefined}
          canManageTasks={canManageTasks}
        />
      )}
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
            onCreateEvent={canManageCalendar ? handleCreateCalendarEvent : undefined}
            onDeleteEvent={canManageCalendar ? handleDeleteCalendarEvent : undefined}
          />
        );
      case 'team':
        return (
          <Team
            members={data.teamMembers}
            canInvite={data.permissions.canInviteMembers}
            canManageRoles={data.permissions.canManageTeam}
            currentUserId={data.currentUser.id}
            onUpdateMemberRole={handleUpdateTeamMemberRole}
            updatingUserRoleId={updatingUserRoleId}
            onUpdateMemberDepartment={handleUpdateTeamMemberDepartment}
            updatingUserDepartmentId={updatingUserDepartmentId}
            auditLogs={auditLogs}
            isAuditLogsLoading={isAuditLogsLoading}
          />
        );
      case 'notifications':
        return (
          <Notifications 
            notifications={data.notifications} 
            onReadAll={handleReadAllNotifications} 
            onDelete={handleDeleteNotification}
            onDeleteAll={handleDeleteAllNotifications}
          />
        );
      case 'settings':
        return <Settings currentUser={data.currentUser} />;
      case 'tasks':
        return renderTasksContent();
      default:
        return null;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      notifications={data.notifications}
      onReadAllNotifications={handleReadAllNotifications}
      onDeleteNotification={handleDeleteNotification}
      onDeleteAllNotifications={handleDeleteAllNotifications}
      currentUser={data.currentUser}
      visibleTabs={visibleTabs}
      onLogout={handleLogout}
    >
      {renderContent()}

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
      {pendingDeleteNotification && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-slate-900 px-6 py-3 text-sm text-white shadow-xl animate-in slide-in-from-bottom-5">
          <span>Bildirim silindi.</span>
          <button
            onClick={handleUndoDeleteNotification}
            className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Geri Al
          </button>
        </div>
      )}
    </Layout>
  );
}
