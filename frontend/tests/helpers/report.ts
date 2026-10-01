import type { ReportSummary } from '@/shared/domain/types';

/** A small report, overridable field by field. */
export function report(overrides: Partial<ReportSummary> = {}): ReportSummary {
  return {
    from: '2026-09-01',
    to: '2026-09-03',
    projectId: null,
    totals: { created: 4, completed: 3, open: 1, overdue: 0 },
    byStatus: { TODO: 1, IN_PROGRESS: 0, DONE: 3 },
    byPriority: { LOW: 1, MEDIUM: 2, HIGH: 1 },
    byAssignee: [],
    byProject: [],
    completedPerDay: [
      { date: '2026-09-01', count: 1 },
      { date: '2026-09-02', count: 2 },
      { date: '2026-09-03', count: 0 },
    ],
    trackedMinutes: 90,
    timeByUser: [],
    ...overrides,
  };
}
