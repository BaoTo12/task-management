import { useTranslation } from 'react-i18next';

import { IconButton } from '@/shared/ui/styled/IconButton';

// NOT styled-components' useTheme: this is OUR theme-preference context (light/dark/system).
import { useTheme as useThemePreference } from './theme-context';
import type { ThemePreference } from './theme-context';

const ICON: Record<ThemePreference, string> = { light: '☀', dark: '☾', system: '◐' };

export function ThemeToggle() {
  const { preference, cycle } = useThemePreference();
  const { t } = useTranslation();
  const name = t(`theme.${preference}`); // S27: 'light' | 'dark' | 'system' → translated
  return (
    <IconButton $size="sm" label={t('theme.label', { name })} onClick={cycle}>
      <span aria-hidden="true">{ICON[preference]}</span>
    </IconButton>
  );
}
