export const ROUTES = {
  write: '/write',
  playback: '/playback',
  analysis: '/analysis',
  about: '/about',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
