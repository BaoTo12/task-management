import { useId, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import styled from 'styled-components';

import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
}

/** What the parent can call through the ref: an imperative, promise-based API (08.06, 13B.06). */
export interface ConfirmDialogHandle {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const Dialog = styled.dialog`
  max-width: min(420px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.space(5)};
  /* An inked sticker, like a lifted card: the dialog is the one thing to deal with right now. */
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.ink};

  &::backdrop {
    background: ${({ theme }) => theme.colors.scrim};
  }

  h2 {
    margin: 0 0 ${({ theme }) => theme.space(2)};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(4)};
`;

/**
 * A replacement for window.confirm(): styled, translated, accessible (native <dialog> = focus trap, Esc, top layer).
 *
 * - React 19: `ref` is a plain prop (13B.04): no forwardRef.
 * - useImperativeHandle: the parent's ref receives `{ confirm }`, NOT the <dialog> element. The component decides
 *   what it exposes, so callers can't reach in and break it (e.g. call .close() without resolving the promise).
 * - Usage: `const dialog = useRef<ConfirmDialogHandle>(null); … if (await dialog.current?.confirm({...})) …`
 */
export function ConfirmDialog({ ref }: { ref?: Ref<ConfirmDialogHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const titleId = useId();

  useImperativeHandle(
    ref,
    () => ({
      confirm(next) {
        resolveRef.current?.(false); // a second confirm() while open cancels the first
        setOptions(next);
        dialogRef.current?.showModal();
        return new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
      },
    }),
    [],
  );

  function settle(ok: boolean) {
    dialogRef.current?.close();
    resolveRef.current?.(ok);
    resolveRef.current = null;
  }

  return (
    // onCancel = Esc key: the browser closes the dialog; we still have to resolve the promise.
    <Dialog ref={dialogRef} aria-labelledby={titleId} onCancel={() => settle(false)}>
      {options && (
        <>
          <h2 id={titleId}>{options.title}</h2>
          <p>{options.message}</p>
          <Actions>
            {/* autoFocus on the SAFE choice: Enter right after opening must not delete anything */}
            <Button autoFocus onClick={() => settle(false)}>
              {options.cancelLabel}
            </Button>
            <Button variant={options.tone ?? 'danger'} onClick={() => settle(true)}>
              {options.confirmLabel}
            </Button>
          </Actions>
        </>
      )}
    </Dialog>
  );
}
