const SETTINGS_KEY = 'kinohub_settings';

const defaultSettings = {
  theme: 'dark',
  providersRegion: 'RU',
  trailerMode: 'embed'
};

export function getDefaultSettings() {
  return defaultSettings;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw);

    return {
      ...defaultSettings,
      ...parsed
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  const nextSettings = {
    ...defaultSettings,
    ...settings
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  return nextSettings;
}

export function getResolvedTheme(theme) {
  if (theme === 'system') {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  return theme;
}

export function applyTheme(theme) {
  const resolvedTheme = getResolvedTheme(theme);
  const root = document.documentElement;

  if (resolvedTheme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
  }
}