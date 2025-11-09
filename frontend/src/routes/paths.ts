export const ROUTES = {
  write: '/write',
  playback: '/playback',
  analysis: '/analysis',
  learn: '/learn',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
