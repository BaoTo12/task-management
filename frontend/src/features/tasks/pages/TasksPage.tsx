import { skipToken } from '@reduxjs/toolkit/query/react';
import { useCallback, useRef, useState, useTransition } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { useAuth } from '@/features/auth';
import { CategorySidebar } from '@/features/categories';
import { commentsApi } from '@/features/comments';
import { type PageSize, pageSizeChanged, SortControl } from '@/features/listPrefs';
import { readLastTaskId } from '@/features/preferences';
import { taskSelectionToggled } from '@/features/ui';

import { apiSlice, useClearCompletedMutation, useGetTasksQuery } from '@/shared/api/apiSlice';
import type { TaskQuery } from '@/shared/api/tasks-api';
import { isTaskStatus } from '@/shared/domain/guards';
import type { TaskStatus } from '@/shared/domain/types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { ConfirmDialogHandle } from '@/shared/ui/ConfirmDialog';
import { ProgressRing } from '@/shared/ui/styled/ProgressRing';
import { Stack } from '@/shared/ui/styled/Stack';

import { Board } from '../components/Board';
import { BulkBar } from '../components/BulkBar';
import { FilterBar } from '../components/FilterBar';
import { WorkFilters } from '../components/WorkFilters';
import { Pager } from '../components/Pager';
import { SearchBox } from '../components/SearchBox';
import { TaskList } from '../components/TaskList';
import { TaskListSkeleton } from '../components/TaskListSkeleton';
import { parseCategoryParam } from '../model/list-link';
import { toggleTask } from '../state/taskActions';
import { selectCompletedTaskIds, selectSort, selectTaskStats } from '../state/taskListSelectors';
import { LIST_QUERY, selectTaskById } from '../state/taskSelectors';

type View = 'list' | 'board';

export function TasksPage() {
  // The app-wide list (22.09): the progress ring, "Clear completed" and the board read it through selectors.
  // The same argument as AppLayout's subscription → the same cache entry, no second request (22.02).
  const listResult = useGetTasksQuery(LIST_QUERY);
  // Namespace 'tasks' loads on first use (25.11); 'common' is always there. Suspense waits for it (main.tsx).
  const { t } = useTranslation(['tasks', 'common']);
  const errorMessage = useErrorMessage();
  // Stable results only (21.05): memoised stats and ids. They read the same cache entry.
  const stats = useAppSelector(selectTaskStats);
  const completedIds = useAppSelector(selectCompletedTaskIds);
  const [clearCompleted] = useClearCompletedMutation();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // 08.14 §3 useTransition: switching list ↔ board re-renders every card. Marked NON-URGENT, the click is
  // acknowledged at once (the buttons update), the old view stays interactive, and React can interrupt the
  // expensive render if the user clicks again. isSwitching dims the content meanwhile.
  const [isSwitching, startSwitching] = useTransition();
  const confirmDialog = useRef<ConfirmDialogHandle>(null);
  const sort = useAppSelector(selectSort);
  const pageSize = useAppSelector((state) => state.listPrefs.pageSize);
  const prefetchComments = commentsApi.usePrefetch('getComments'); // 23.13: hover a card → its comments are ready
  // 24.16: "Continue where you left off", from the session cookie. Read once per mount; shown only if the task exists.
  const [lastTaskId] = useState(readLastTaskId);
  const lastTask = useAppSelector((state) => (lastTaskId === undefined ? undefined : selectTaskById(state, lastTaskId)));

  // The URL is the source of truth for filters (12.03). Parse and VALIDATE: the URL is user input.
  const rawStatus = searchParams.get('status');
  const statusFilter: TaskStatus | null = isTaskStatus(rawStatus) ? rawStatus : null;
  const view: View = searchParams.get('view') === 'board' ? 'board' : 'list';
  const q = searchParams.get('q') ?? '';
  const categoryFilter = parseCategoryParam(searchParams.get('category'));
  // Team filters (Spring Boot backend): same validation as category, the URL is user input.
  const projectFilter = parseCategoryParam(searchParams.get('project'));
  const labelFilter = parseCategoryParam(searchParams.get('label'));
  const mineOnly = searchParams.get('mine') === '1';
  // ?page=2 in the URL is 1-based for humans; the API is 0-based (23.07).
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam - 1 : 0;

  /** Update one query parameter, keeping the others. replace: filter tweaks shouldn't flood history. */
  function setParam(name: string, value: string | null) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null || value === '') next.delete(name);
        else next.set(name, value);
        if (name !== 'page') next.delete('page'); // a new filter starts at page 1 (23.07)
        return next;
      },
      { replace: true },
    );
  }

  // The input shows q immediately; filtering uses a debounced copy (08.12).
  const debouncedQ = useDebounce(q, 300);

  // S23: the LIST view asks the SERVER for one page: filtered, sorted and paged there (23.07). Each distinct
  // argument is its own cache entry, so going back to page 1 is instant. A new object each render is fine:
  // the hook serializes the argument (22.05). undefined fields are dropped from the key and the URL.
  const pageQuery: TaskQuery = {
    q: debouncedQ || undefined,
    status: statusFilter ?? undefined,
    categoryId: categoryFilter ?? undefined,
    projectId: projectFilter ?? undefined,
    labelId: labelFilter ?? undefined,
    assigneeId: mineOnly && user ? user.id : undefined,
    sort: `${sort.key},${sort.direction}`,
    page,
    size: pageSize,
  };
  // skipToken on the board: it shows every task from the app-wide list instead.
  const pageResult = useGetTasksQuery(view === 'list' ? pageQuery : skipToken);
  // The flags of whichever entry this view shows.
  const { isLoading, isFetching, isError, error, refetch } = view === 'list' ? pageResult : listResult;

  // STABLE callbacks (useCallback, 21.10): they're props of every memoised TaskListItem.
  // A new function on each render would defeat React.memo and re-render every card.
  // The mutations run through dispatch (22.09): stable callbacks, success/error toasts from listeners.
  const handleToggle = useCallback((id: number) => dispatch(toggleTask(id)), [dispatch]);
  // S27 bulk selection: stable, like the other card callbacks (21.10).
  const handleSelect = useCallback((id: number) => dispatch(taskSelectionToggled(id)), [dispatch]);
  const selectedIds = useAppSelector((state) => state.ui.selectedTaskIds);
  const handleEditTitle = useCallback(
    (id: number, title: string) => void dispatch(apiSlice.endpoints.patchTask.initiate({ id, changes: { title } })),
    [dispatch],
  );

  const hasData = stats.total > 0 || !isLoading;
  const doneCount = completedIds.length;

  async function handleClearCompleted() {
    const confirmed = await confirmDialog.current?.confirm({
      title: t('clearCompleted', { count: doneCount }),
      message: t('clearConfirm', { count: doneCount }),
      confirmLabel: t('clearCompleted', { count: doneCount }),
      cancelLabel: t('common:confirm.cancel'),
    });
    if (!confirmed) return;
    void clearCompleted(completedIds); // a listener reports the result with a toast
  }

  const reload = () => void refetch();
  const handlePageSize = (size: PageSize) => {
    dispatch(pageSizeChanged(size));
    setParam('page', null);
  };
  // `data`, not `currentData`: while page 2 loads, page 1 stays on screen, dimmed (22.05 §3).
  const shown = pageResult.data;

  let content;
  if (isError && (view === 'list' ? !shown : stats.total === 0)) {
    content = (
      <div role="alert">
        <p className="text-danger">{errorMessage(error)}</p>
        <Button onClick={reload}>{t('common:tryAgain')}</Button>
      </div>
    );
  } else if (isLoading) {
    // First load only (22.05): placeholders in the list's shape; the board keeps the simple text.
    content = view === 'list' ? <TaskListSkeleton /> : <p className="text-muted">{t('loadingList')}</p>;
  } else {
    content =
      view === 'list' ? (
        <>
          <CategorySidebar selected={categoryFilter} />
          <FilterBar value={statusFilter} onChange={(s) => setParam('status', s)} />
          <WorkFilters projectId={projectFilter} labelId={labelFilter} mine={mineOnly} onChange={setParam} />
          <BulkBar />
          <div style={{ opacity: pageResult.isFetching ? 0.6 : 1 }} aria-busy={pageResult.isFetching}>
            <TaskList
              tasks={shown?.items ?? []}
              onToggle={handleToggle}
              onEditTitle={handleEditTitle}
              onHoverTask={prefetchComments}
              selectedIds={selectedIds}
              onSelect={handleSelect}
            />
          </div>
          {shown && (
            <Pager
              page={shown.page}
              totalPages={shown.totalPages}
              totalItems={shown.totalItems}
              pageSize={pageSize}
              onPageChange={(next) => setParam('page', String(next + 1))}
              onPageSizeChange={handlePageSize}
            />
          )}
        </>
      ) : (
        <Board onToggle={handleToggle} onEditTitle={handleEditTitle} />
      );
  }

  return (
    <>
      <h1 className="page__title">
        {t('title')} {hasData && <span className="text-muted">({stats.total})</span>}
        {isFetching && !isLoading && <span className="text-muted"> · {t('refreshing')}</span>}
      </h1>
      {isError && (view === 'list' ? shown !== undefined : stats.total > 0) && (
        <p role="alert" className="text-danger">
          {t('refreshFailed', { message: errorMessage(error) })}{' '}
          <Button size="sm" onClick={reload}>
            {t('common:tryAgain')}
          </Button>
        </p>
      )}
      {hasData && (
        <Stack $direction="row" $gap={4} $align="center">
          <ProgressRing done={stats.done} total={stats.total} />
          <span className="text-muted">{t('tasksDone')}</span>
        </Stack>
      )}
      <Stack $direction="row" $gap={2} $align="center" $wrap>
        <div role="group" aria-label={t('view.label')}>
          <Button size="sm" variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => startSwitching(() => setParam('view', null))}>
            {t('view.list')}
          </Button>
          <Button size="sm" variant={view === 'board' ? 'primary' : 'secondary'} onClick={() => startSwitching(() => setParam('view', 'board'))}>
            {t('view.board')}
          </Button>
        </div>
        <ButtonLink variant="primary" size="sm" to="/tasks/new">
          {t('newTask')}
        </ButtonLink>
        {user && doneCount > 0 && (
          <Button size="sm" variant="danger" onClick={() => void handleClearCompleted()}>
            {t('clearCompleted', { count: doneCount })}
          </Button>
        )}
        <SortControl />
      </Stack>
      {lastTask && (
        <p className="text-muted">
          {/* <Trans> (25.08): the translation decides WHERE the link goes in the sentence (word order differs
              between languages); <link> in the string is replaced by the element below. The title is a VALUE:
              escaped by React like any text, never parsed as markup. */}
          <Trans
            t={t}
            i18nKey="continueTask"
            values={{ title: lastTask.title }}
            components={{ link: <Link to={`/tasks/${lastTask.id}`} /> }}
          />
        </p>
      )}
      {view === 'list' && <SearchBox value={q} onChange={(value) => setParam('q', value)} />}
      <hr />
      <div style={{ opacity: isSwitching ? 0.6 : 1 }} aria-busy={isSwitching}>
        {content}
      </div>
      <ConfirmDialog ref={confirmDialog} />
    </>
  );
}
