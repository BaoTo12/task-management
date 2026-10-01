// TaskFlow domain model = the JSON contract of the API (02-project-spec.md §5).
// Values first (usable at runtime), types derived from them (06.05).

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Role = 'USER' | 'ADMIN';

/** '2026-10-03' */
export type IsoDate = string;
/** '2026-10-01T09:30:00Z' */
export type IsoDateTime = string;

export interface HasId {
  id: number;
}

export interface Task extends HasId {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: IsoDate | null;
  categoryId: number | null;
  /** Spring Boot backend (V3): the project the task belongs to, and who it's assigned to. */
  projectId: number | null;
  ownerId: number;
  assigneeId: number | null;
  /** V4: the task's labels (ids into the labels cache). */
  labelIds: number[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** Set by the server when the status becomes DONE (the reports count completions by it). */
  completedAt: IsoDateTime | null;
}

export interface Category extends HasId {
  name: string;
  color: string;
}

export interface User extends HasId {
  username: string;
  displayName: string;
  role: Role;
  locale: 'en' | 'vi';
}

export interface Comment extends HasId {
  taskId: number;
  authorId: number;
  body: string;
  createdAt: IsoDateTime;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: number;
  projectId?: number;
  assigneeId?: number;
  labelId?: number;
  q?: string;
}

export type SortKey = 'title' | 'priority' | 'dueDate';

/** The status of a request we track ourselves (19.03). RTK Query tracks its own (22.05). */
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type SortDirection = 'asc' | 'desc';

// ── Teams: people, projects, members ────────────────────────────────────────

/** Anyone, as the people pickers and avatars need them: GET /api/users?q= | ?ids= */
export interface UserSummary extends HasId {
  username: string;
  displayName: string;
}

/** Strongest first: the index is the rank (OWNER > MAINTAINER > MEMBER > VIEWER). */
export const PROJECT_ROLES = ['OWNER', 'MAINTAINER', 'MEMBER', 'VIEWER'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export interface Project extends HasId {
  name: string;
  description: string;
  color: string;
  ownerId: number;
  archived: boolean;
  createdAt: IsoDateTime;
  /** The CALLER's role in it (OWNER for admins). */
  myRole: ProjectRole;
  memberCount: number;
}

/** A membership: ids only. Joined with the users cache in a selector. */
export interface Member {
  projectId: number;
  userId: number;
  role: ProjectRole;
  joinedAt: IsoDateTime;
}

// ── Inside a task: checklist, labels, time ─────────────────────────────────

export interface Subtask extends HasId {
  taskId: number;
  title: string;
  done: boolean;
  position: number;
}

export interface Label extends HasId {
  name: string;
  color: string;
  createdBy: number | null;
}

/** endedAt null = the timer is running. `minutes` counts a running entry up to the server's "now". */
export interface TimeEntry extends HasId {
  taskId: number;
  userId: number;
  startedAt: IsoDateTime;
  endedAt: IsoDateTime | null;
  note: string;
  minutes: number;
}

// ── What happened: notifications, activity ─────────────────────────────────

export const NOTIFICATION_TYPES = [
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'TASK_DELETED',
  'COMMENT_ADDED',
  'PROJECT_INVITED',
  'PROJECT_REMOVED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification extends HasId {
  type: NotificationType;
  actorId: number | null;
  taskId: number | null;
  projectId: number | null;
  subject: string;
  read: boolean;
  createdAt: IsoDateTime;
}

export const ACTIVITY_TYPES = [
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_STATUS_CHANGED',
  'TASK_ASSIGNED',
  'TASK_DELETED',
  'COMMENT_ADDED',
  'SUBTASK_COMPLETED',
  'TIME_LOGGED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Activity extends HasId {
  actorId: number | null;
  type: ActivityType;
  taskId: number | null;
  projectId: number | null;
  subject: string;
  details: string;
  createdAt: IsoDateTime;
}

// ── Reports (GET /api/reports/summary) ─────────────────────────────────────

export interface ReportSummary {
  from: IsoDate;
  to: IsoDate;
  projectId: number | null;
  totals: { created: number; completed: number; open: number; overdue: number };
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  byAssignee: { userId: number | null; total: number; done: number }[];
  byProject: { projectId: number | null; total: number; done: number }[];
  completedPerDay: { date: IsoDate; count: number }[];
  trackedMinutes: number;
  timeByUser: { userId: number; minutes: number }[];
}
