// S13B: React + TypeScript types. Two kinds of checks live here:
//  - runtime assertions (Vitest), on markup rendered to a string (no DOM needed: react-dom/server);
//  - COMPILE-TIME assertions: expectTypeOf(…) and `// @ts-expect-error` lines. `npm run build` (tsc -b)
//    type-checks this file too, so a type that loosens (or an error that disappears) fails the build.

import { createRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { isOneOf } from '@/shared/domain/guards';
import { PRIORITIES, TASK_STATUSES } from '@/shared/domain/types';
import type { Priority, TaskStatus } from '@/shared/domain/types';
import { Button } from '@/shared/ui/Button';
import type { ButtonProps } from '@/shared/ui/Button';
import { buttonClasses } from '@/shared/ui/button-classes';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { SelectField } from '@/shared/ui/forms/SelectField';

// The app translates labels with i18next; a plain map is enough for these type tests.
const STATUS_LABEL: Record<TaskStatus, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
const statusLabel = (status: TaskStatus) => STATUS_LABEL[status];

const noop = () => {};

describe('isOneOf (13B.05)', () => {
  it('accepts only the listed strings', () => {
    expect(isOneOf(TASK_STATUSES, 'DONE')).toBe(true);
    expect(isOneOf(TASK_STATUSES, 'done')).toBe(false);
    expect(isOneOf(TASK_STATUSES, 3)).toBe(false);
    expect(isOneOf(TASK_STATUSES, undefined)).toBe(false);
  });

  it('narrows unknown to the union of the options', () => {
    const fromUrl: unknown = new URLSearchParams('status=TODO').get('status');
    if (isOneOf(TASK_STATUSES, fromUrl)) expectTypeOf(fromUrl).toEqualTypeOf<TaskStatus>();
    const inline: unknown = 'list';
    // `const T`: an inline array keeps its literal types instead of widening to string
    if (isOneOf(['list', 'board'], inline)) expectTypeOf(inline).toEqualTypeOf<'list' | 'board'>();
  });
});

describe('SelectField<T> (13B.05)', () => {
  it('renders every option with its label and selects the value', () => {
    const html = renderToStaticMarkup(
      <SelectField label="Status" options={TASK_STATUSES} value="IN_PROGRESS" getLabel={statusLabel} onChange={noop} />,
    );
    expect(html).toContain('<option value="TODO">To do</option>');
    expect(html).toContain('<option value="IN_PROGRESS" selected="">In progress</option>');
    expect(html).toMatch(/<label class="form-field__label" for="([^"]+)">Status<\/label><select id="\1"/);
  });

  it('infers T from options and types the callbacks with it', () => {
    const check = () => (
      <SelectField
        label="Priority"
        options={PRIORITIES}
        value="HIGH"
        getLabel={(priority) => {
          expectTypeOf(priority).toEqualTypeOf<Priority>();
          return priority;
        }}
        onChange={(priority) => expectTypeOf(priority).toEqualTypeOf<Priority>()}
      />
    );
    expect(check).toBeTypeOf('function');
  });

  it('rejects a value that is not one of the options (NoInfer)', () => {
    const check = () => (
      // @ts-expect-error: 'BLOCKED' is not a TaskStatus; NoInfer stops it from widening T
      <SelectField label="Status" options={TASK_STATUSES} value="BLOCKED" getLabel={statusLabel} onChange={noop} />
    );
    expect(check).toBeTypeOf('function');
  });
});

describe('Button and ButtonLink (13B.06)', () => {
  it('builds the design-system classes', () => {
    expect(buttonClasses({})).toBe('btn btn--secondary');
    expect(buttonClasses({ variant: 'primary', size: 'sm' }, 'extra')).toBe('btn btn--primary btn--sm extra');
    expect(buttonClasses({ icon: true })).toBe('btn btn--secondary btn--icon');
  });

  it('ButtonLink renders a real link with button classes', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ButtonLink variant="primary" size="sm" to="/tasks/new">
          + New task
        </ButtonLink>
      </MemoryRouter>,
    );
    expect(html).toBe('<a class="btn btn--primary btn--sm" href="/tasks/new" data-discover="true">+ New task</a>');
  });

  it('accepts every native button prop, including ref (React 19: ref is a prop)', () => {
    const ref = createRef<HTMLButtonElement>();
    const check = () => (
      // DOM element types are too big for toEqualTypeOf's deep comparison (13B.10): check assignability instead
      <Button ref={ref} variant="danger" aria-busy onClick={(e) => expectTypeOf(e.currentTarget).toExtend<HTMLButtonElement>()}>
        Delete
      </Button>
    );
    expect(check).toBeTypeOf('function');
    expectTypeOf<ButtonProps['children']>().toEqualTypeOf<ReactNode>();
  });

  it('keeps the style props closed and Link props intact', () => {
    const check = () => (
      <>
        {/* @ts-expect-error: typo in a variant is a compile error */}
        <Button variant="primay">Save</Button>
        {/* @ts-expect-error: ButtonLink requires Link's `to` prop */}
        <ButtonLink variant="primary">Nowhere</ButtonLink>
      </>
    );
    expect(check).toBeTypeOf('function');
    expectTypeOf<ComponentProps<typeof ButtonLink>['replace']>().toEqualTypeOf<boolean | undefined>();
  });
});
