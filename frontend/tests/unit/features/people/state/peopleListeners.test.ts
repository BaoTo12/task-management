import { describe, expect, it } from 'vitest';

import { userIdsIn } from '@/features/people';

describe('userIdsIn', () => {
  it('finds user ids at any depth, in any shape the API returns', () => {
    const page = { items: [{ id: 1, ownerId: 1, assigneeId: 4 }, { id: 2, ownerId: 2, assigneeId: null }], page: 0 };
    const infinite = { pages: [{ items: [{ id: 9, actorId: 5 }], nextCursor: null }] };
    expect([...userIdsIn(page)].sort()).toEqual([1, 2, 4]);
    expect([...userIdsIn(infinite)]).toEqual([5]);
  });

  it('ignores ids that aren’t user ids', () => {
    expect([...userIdsIn({ id: 3, taskId: 7, projectId: 1 })]).toEqual([]);
  });
});
