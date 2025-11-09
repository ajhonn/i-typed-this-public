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
    key: 'about',
    label: 'About',
    path: ROUTES.about,
    helper: 'Product story & proof',
  },
] as const;

export type ShellTabKey = (typeof SHELL_TABS)[number]['key'];
