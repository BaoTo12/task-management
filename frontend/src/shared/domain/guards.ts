import type { ApiError, CursorPage, Page } from './api-types';
import { ACTIVITY_TYPES, NOTIFICATION_TYPES, PRIORITIES, PROJECT_ROLES, TASK_STATUSES } from './types';
import type {
  Activity,
  AppNotification,
  Category,
  Comment,
  Label,
  Member,
  Priority,
  Project,
  ReportSummary,
  Subtask,
  Task,
  TaskStatus,
  TimeEntry,
  User,
  UserSummary,
} from './types';

/** Compile-time exhaustiveness helper: only callable with `never`. */
/**
 * Generic guard built from a runtime list (13B.05): `isOneOf(TASK_STATUSES, x)` narrows x to TaskStatus.
 * `const T` makes an inline array literal infer its literal types: isOneOf(['a', 'b'], x) → x is 'a' | 'b'.
 */
export function isOneOf<const T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringOrNull = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === 'number';

export function isCategory(value: unknown): value is Category {
  // color is validated again before it reaches CSS (isSafeHexColor, 10.10): here we only check the shape.
  return isObject(value) && typeof value.id === 'number' && typeof value.name === 'string' && typeof value.color === 'string';
}

/** A task comment (22.11). The body is plain text: React escapes it when rendering (S26). */
export function isComment(value: unknown): value is Comment {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.taskId === 'number' &&
    typeof value.authorId === 'number' &&
    typeof value.body === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export function isTask(value: unknown): value is Task {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isTaskStatus(value.status) &&
    isPriority(value.priority) &&
    isStringOrNull(value.dueDate) &&
    isNumberOrNull(value.categoryId) &&
    isNumberOrNull(value.projectId) &&
    typeof value.ownerId === 'number' &&
    isNumberOrNull(value.assigneeId) &&
    Array.isArray(value.labelIds) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    isStringOrNull(value.completedAt)
  );
}

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isObject(value) && Object.values(value).every((v) => typeof v === 'string');

export function isApiError(value: unknown): value is ApiError {
  return (
    isObject(value) &&
    typeof value.status === 'number' &&
    typeof value.error === 'string' &&
    typeof value.message === 'string' &&
    (value.fieldErrors === undefined || isStringRecord(value.fieldErrors))
  );
}

/** Generic guard for the Page<T> envelope (13.05): checks the envelope AND every item. */
export function isPageOf<T>(value: unknown, isItem: (item: unknown) => item is T): value is Page<T> {
  return (
    isObject(value) &&
    Array.isArray(value.items) &&
    value.items.every(isItem) &&
    typeof value.page === 'number' &&
    typeof value.size === 'number' &&
    typeof value.totalItems === 'number' &&
    typeof value.totalPages === 'number'
  );
}

/** Assertion function: returns normally only if value is a Task; narrows the caller's variable. */
export function assertIsTask(value: unknown): asserts value is Task {
  if (!isTask(value)) {
    throw new Error('Invalid task payload');
  }
}

/** Turn anything thrown into a readable message. `catch (e)` gives `unknown` under strict. */
export function toErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  // e.g. a rejectWithValue payload (20.09): a plain object with a message
  if (isObject(error) && typeof error.message === 'string') return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected error';
}

/** The user from POST /api/auth/login and GET /api/auth/me (24.12). */
export function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.username === 'string' &&
    typeof value.displayName === 'string' &&
    (value.role === 'USER' || value.role === 'ADMIN') &&
    (value.locale === 'en' || value.locale === 'vi')
  );
}

// ── Spring Boot backend additions ───────────────────────────────────────────

export function isUserSummary(value: unknown): value is UserSummary {
  return isObject(value) && typeof value.id === 'number' && typeof value.username === 'string' && typeof value.displayName === 'string';
}

export function isProject(value: unknown): value is Project {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.archived === 'boolean' &&
    isOneOf(PROJECT_ROLES, value.myRole) &&
    typeof value.memberCount === 'number'
  );
}

export function isMember(value: unknown): value is Member {
  return isObject(value) && typeof value.projectId === 'number' && typeof value.userId === 'number' && isOneOf(PROJECT_ROLES, value.role);
}

export function isSubtask(value: unknown): value is Subtask {
  return isObject(value) && typeof value.id === 'number' && typeof value.taskId === 'number' && typeof value.title === 'string' && typeof value.done === 'boolean';
}

export function isLabel(value: unknown): value is Label {
  return isObject(value) && typeof value.id === 'number' && typeof value.name === 'string' && typeof value.color === 'string';
}

export function isTimeEntry(value: unknown): value is TimeEntry {
  return (
    isObject(value) &&
    typeof value.id === 'number' &&
    typeof value.taskId === 'number' &&
    typeof value.startedAt === 'string' &&
    isStringOrNull(value.endedAt) &&
    typeof value.minutes === 'number'
  );
}

export function isNotification(value: unknown): value is AppNotification {
  return isObject(value) && typeof value.id === 'number' && isOneOf(NOTIFICATION_TYPES, value.type) && typeof value.read === 'boolean';
}

export function isActivity(value: unknown): value is Activity {
  return isObject(value) && typeof value.id === 'number' && isOneOf(ACTIVITY_TYPES, value.type) && typeof value.subject === 'string';
}

/** Generic guard for the cursor envelope, like isPageOf for numbered pages. */
export function isCursorPageOf<T>(value: unknown, isItem: (item: unknown) => item is T): value is CursorPage<T> {
  return isObject(value) && Array.isArray(value.items) && value.items.every(isItem) && isNumberOrNull(value.nextCursor);
}

/** Only the envelope: the report is read-only data that goes straight to the screen. */
export function isReportSummary(value: unknown): value is ReportSummary {
  return isObject(value) && isObject(value.totals) && Array.isArray(value.completedPerDay) && typeof value.trackedMinutes === 'number';
}

export const isArrayOf =
  <T,>(isItem: (item: unknown) => item is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(isItem);
