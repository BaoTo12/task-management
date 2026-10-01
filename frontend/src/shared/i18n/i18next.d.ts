// 25.12 typed translation keys: declaration merging (06.10) into i18next's CustomTypeOptions.
// From now on t('tasks:form.titel') is a COMPILE error, t() knows which keys take which namespace, and
// template-literal keys like t(`common:status.${status}`) are checked against the union of possible keys.
// The English files are the source of truth: a key missing from them doesn't exist.
import 'i18next';

import type activity from '../../../public/locales/en/activity.json';
import type common from '../../../public/locales/en/common.json';
import type dashboard from '../../../public/locales/en/dashboard.json';
import type notifications from '../../../public/locales/en/notifications.json';
import type projects from '../../../public/locales/en/projects.json';
import type reports from '../../../public/locales/en/reports.json';
import type tasks from '../../../public/locales/en/tasks.json';
import type work from '../../../public/locales/en/work.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      tasks: typeof tasks;
      dashboard: typeof dashboard;
      projects: typeof projects;
      notifications: typeof notifications;
      activity: typeof activity;
      work: typeof work;
      reports: typeof reports;
    };
  }
}
