import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '@/features/auth';
import { ToastProvider } from '@/features/ui';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { LoadingBlock, Spinner } from '@/shared/ui/styled/Spinner';

import { store } from './store';


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      {/* BASE_URL comes from Vite's `base` option: '/' in dev, '/taskflow/app/' when deployed in the WAR (49.10) */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {/* useTranslation suspends until a namespace is loaded (25.11): no flash of raw keys. */}
              <Suspense
                fallback={
                  <LoadingBlock>
                    <Spinner $size="lg" />
                  </LoadingBlock>
                }
              >
                {children}
              </Suspense>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}
