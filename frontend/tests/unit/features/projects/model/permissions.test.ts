import { describe, expect, it } from 'vitest';

import { assignableRoles, canArchive, canEditProject, roleAtLeast } from '@/features/projects';

describe('project permissions (mirror of the server rules)', () => {
  it('ranks roles', () => {
    expect(roleAtLeast('OWNER', 'MEMBER')).toBe(true);
    expect(roleAtLeast('VIEWER', 'MEMBER')).toBe(false);
    expect(roleAtLeast(null, 'VIEWER')).toBe(false);
  });

  it('maintainers edit, only owners archive', () => {
    expect(canEditProject('MAINTAINER')).toBe(true);
    expect(canArchive('MAINTAINER')).toBe(false);
  });

  it('only an owner can hand out OWNER', () => {
    expect(assignableRoles('MAINTAINER')).not.toContain('OWNER');
    expect(assignableRoles('OWNER')).toContain('OWNER');
  });
});
