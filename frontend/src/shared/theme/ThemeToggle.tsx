import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/Button';

// NOT styled-components' useTheme: this is OUR theme-preference context (light/dark/system).
import { useTheme as useThemePreference } from './theme-context';
import type { ThemePreference } from './theme-context';

const ICON: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { preference, cycle } = useThemePreference();
  const { t } = useTranslation();
  const name = t(`theme.${preference}`); // S27: 'light' | 'dark' | 'system' → translated
  const Icon = ICON[preference];
  const label = t('theme.label', { name });
  return (
    <Button icon aria-label={label} title={label} onClick={cycle}>
      <Icon aria-hidden="true" />
    </Button>
  );
}
