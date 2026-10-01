import { describe, expect, it } from 'vitest';

import { elapsedSeconds, formatMinutes, formatStopwatch } from '@/features/timeTracking';

describe('duration formatting', () => {
  it('formats a stopwatch', () => {
    expect(formatStopwatch(0)).toBe('0:00:00');
    expect(formatStopwatch(3909)).toBe('1:05:09');
    expect(formatStopwatch(-5)).toBe('0:00:00');
  });

  it('formats minutes', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(135)).toBe('2h 15m');
  });

  it('measures from an ISO start', () => {
    expect(elapsedSeconds('2026-10-01T08:00:00Z', Date.parse('2026-10-01T08:01:30Z'))).toBe(90);
  });
});
