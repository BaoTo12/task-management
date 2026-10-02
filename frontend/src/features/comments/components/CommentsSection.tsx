import { useId, useOptimistic, useState, useTransition } from 'react';
// React's SubmitEvent, not the DOM global of the same name: this import shadows it (13B.03)
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth';

import { fieldErrorsOf } from '@/shared/api/api-error';
import type { Comment } from '@/shared/domain/types';
import { formatDate } from '@/shared/i18n/format';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { SanitizedHtml } from '@/shared/security/RichText';
import { Button } from '@/shared/ui/Button';

import { useAddCommentMutation, useGetCommentsQuery } from '../api/commentsApi';

import styles from './CommentsSection.module.scss';

const MAX_LENGTH = 1000; // the server's limit (02-project-spec §5); the server checks it again

/**
 * 22.11: a task's comments. Server state only: no slice. The list comes from `getComments(taskId)`;
 * posting invalidates `{ type: 'Comment', id: taskId }`, so exactly this list refetches.
 */
export function CommentsSection({ taskId }: { taskId: number }) {
  const { user } = useAuth();
  const { data: comments = [], isLoading, isFetching, isError, error } = useGetCommentsQuery(taskId, {
    // 22.06: the cache may hold this task's comments from a visit minutes ago. Reuse them if younger than
    // 30 s, refetch otherwise: other people comment too, and there is no push from the server.
    refetchOnMountOrArgChange: 30,
  });
  const [addComment] = useAddCommentMutation();
  // React 19 useOptimistic: a copy of `comments` that can run AHEAD of the server while a transition is pending.
  // When the transition ends, it snaps back to the real `comments` (by then refetched with the saved comment,
  // or unchanged if the post failed: the optimistic one disappears on its own, no manual rollback).
  const [shownComments, addOptimisticComment] = useOptimistic(comments, (current: Comment[], draft: Comment) => [
    ...current,
    draft,
  ]);
  const [isPosting, startPosting] = useTransition();
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  // 26.04: plain text by default; "Show formatting" renders the SAME bodies as sanitised HTML.
  const [showFormatting, setShowFormatting] = useState(false);
  const fieldId = useId();
  const { t, i18n } = useTranslation('tasks');
  const errorMessage = useErrorMessage();

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (text === '') return setFormError(t('comments.blank'));
    if (!user) return;
    // An ASYNC transition (React 19): isPosting stays true until the awaited mutation settles.
    startPosting(async () => {
      // A negative id can never collide with a server id; it also marks the row as "sending" below.
      addOptimisticComment({ id: -Date.now(), taskId, authorId: user.id, body: text, createdAt: new Date().toISOString() });
      setBody(''); // the text moves into the list at once
      setFormError(null);
      try {
        await addComment({ taskId, body: text }).unwrap();
      } catch (err) {
        setBody(text); // a failed post gives the text back
        // Field messages come from the server in English: S44's backend localises them from the lang cookie.
        setFormError(fieldErrorsOf(err)?.body ?? errorMessage(err));
      }
    });
  }

  return (
    <section className={`${styles.comments} panel`} aria-labelledby={`${fieldId}-heading`}>
      <h2 id={`${fieldId}-heading`} className={styles.heading}>
        {t('comments.heading')} {isFetching && !isLoading && <span className="text-muted">{t('comments.refreshing')}</span>}
      </h2>
      {comments.length > 0 && (
        <label className="text-muted">
          <input type="checkbox" checked={showFormatting} onChange={(e) => setShowFormatting(e.target.checked)} />{' '}
          {t('comments.showFormatting')}
        </label>
      )}
      {isLoading && <p className="text-muted">{t('comments.loading')}</p>}
      {isError && (
        <p role="alert" className="text-danger">
          {errorMessage(error)}
        </p>
      )}
      {!isLoading && !isError && comments.length === 0 && <p className="text-muted">{t('comments.empty')}</p>}
      <ul className={styles.list}>
        {shownComments.map((comment) => (
          <li key={comment.id} className={styles.comment} data-pending={comment.id < 0 || undefined} aria-busy={comment.id < 0}>
            {/* Plain text: React escapes it (26.02). Formatting: DOMPurify first, always (26.04). */}
            {showFormatting ? <SanitizedHtml html={comment.body} /> : <p>{comment.body}</p>}
            <span className="text-muted">{formatDate(comment.createdAt.slice(0, 10), i18n.language)}</span>
          </li>
        ))}
      </ul>
      {user && (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className={`form-field${formError ? ' form-field--error' : ''}`}>
            <label className="form-field__label" htmlFor={fieldId}>
              {t('comments.add')}
            </label>
            <textarea
              id={fieldId}
              className="form-field__input"
              value={body}
              maxLength={MAX_LENGTH}
              aria-invalid={formError !== null}
              aria-describedby={formError ? `${fieldId}-error` : undefined}
              onChange={(e) => {
                setBody(e.target.value);
                setFormError(null);
              }}
            />
            {formError && (
              <span id={`${fieldId}-error`} className="form-field__error">
                {formError}
              </span>
            )}
          </div>
          <div className="form__actions">
            <Button type="submit" size="sm" disabled={isPosting}>
              {isPosting ? t('comments.posting') : t('comments.post')}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
