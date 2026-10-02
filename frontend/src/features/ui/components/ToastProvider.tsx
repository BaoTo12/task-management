import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { ToastContext } from '@/shared/toast/toast-context';
import type { Toast, ToastContextValue } from '@/shared/toast/toast-context';

import { toastDismissed, toastShown } from '../state/toastActions';

import { Close, Item, Viewport } from './ToastProvider.styles';

const AUTO_DISMISS_MS = 4000;

/**
 * S18: the toast LIST lives in the Redux ui slice, so thunks (non-React code) can show toasts too.
 * This provider keeps the useToast() API from S10: show() and dismiss() now dispatch actions.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  const value = useMemo<ToastContextValue>(
    () => ({
      show: (input) => dispatch(toastShown(input)),
      dismiss: (id) => dispatch(toastDismissed(id)),
    }),
    [dispatch],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* createPortal: the toasts render into <body>, outside #root's layout and stacking context (a transformed or
          overflow:hidden ancestor can't clip them), while staying in THIS React tree: context and events work as usual. */}
      {createPortal(
        <Viewport>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={value.dismiss} />
          ))}
        </Viewport>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/** One toast. Its own effect schedules the auto-dismiss, and cleans up if it's dismissed early. */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);
  const { t } = useTranslation();
  const text = toast.i18nKey ? t(toast.i18nKey, { ...toast.values, defaultValue: toast.message }) : toast.message;

  return (
    <Item
      $tone={toast.tone}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
    >
      <span>{text}</span>
      <Close aria-label={t('toasts.dismiss')} onClick={() => onDismiss(toast.id)}>
        ×
      </Close>
    </Item>
  );
}
