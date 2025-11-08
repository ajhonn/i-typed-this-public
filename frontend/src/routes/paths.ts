export const ROUTES = {
  write: '/write',
  playback: '/playback',
  learn: '/learn',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
