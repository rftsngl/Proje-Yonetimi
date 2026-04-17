import { ThemeMode } from '../types';

/**
 * Apply theme to the document root element.
 *
 * - 'light' => removes .dark class
 * - 'dark' => adds .dark class
 * - 'system' => follows prefers-color-scheme
 */
export const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

/**
 * Listen for system theme changes when mode is 'system'.
 * Returns a cleanup function.
 */
export const watchSystemTheme = (callback: (isDark: boolean) => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (event: MediaQueryListEvent) => callback(event.matches);
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
};
