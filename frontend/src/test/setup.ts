import '@testing-library/jest-dom/vitest';
import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  const ResponsiveContainer = ({ width, height, children }: { width?: number | string; height?: number | string; children: ReactNode }) => {
    const resolvedWidth = width === '100%' ? 400 : width ?? 400;
    const resolvedHeight = height === '100%' ? 300 : height ?? 300;
    return createElement(
      'div',
      { style: { width: resolvedWidth, height: resolvedHeight }, 'data-testid': 'responsive-container' },
      children
    );
  };
  return {
    ...actual,
    ResponsiveContainer,
  };
});

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () =>
    ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
