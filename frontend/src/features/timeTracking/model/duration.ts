// Pure time formatting for the timer and the entries (tested in tests/unit/features/timeTracking/model).

/** 3909 → "1:05:09" (a stopwatch). */
export function formatStopwatch(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 135 → "2h 15m", 45 → "45m". */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

/** Seconds between an ISO start and "now" (epoch ms). */
export function elapsedSeconds(startedAt: string, nowMs: number): number {
  return Math.max(0, (nowMs - Date.parse(startedAt)) / 1000);
}
