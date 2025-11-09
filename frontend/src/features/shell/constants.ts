import { ROUTES } from '@routes/paths';

export const SHELL_TABS = [
  {
    key: 'write',
    label: 'Write',
    path: ROUTES.write,
    helper: 'Draft & capture sessions',
  },
  {
    key: 'playback',
    label: 'Playback',
    path: ROUTES.playback,
    helper: 'Inspect timelines',
  },
  {
    key: 'analysis',
    label: 'Analysis',
    path: ROUTES.analysis,
    helper: 'Deep-dive signals',
  },
  {
    key: 'learn',
    label: 'Learn',
    path: ROUTES.learn,
    helper: 'Read the product story',
  },
] as const;

export type ShellTabKey = (typeof SHELL_TABS)[number]['key'];
