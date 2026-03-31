import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import {
  applyTheme,
  getDefaultSettings,
  loadSettings,
  saveSettings
} from '../utils/settings';

function SettingsPage() {
  const [settings, setSettings] = useState(getDefaultSettings());
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentSettings = loadSettings();
    setSettings(currentSettings);
  }, []);

  function handleChange(field, value) {
    const nextSettings = {
      ...settings,
      [field]: value
    };

    setSettings(nextSettings);

    if (field === 'theme') {
      applyTheme(value);
    }
  }

  function handleSave() {
    const saved = saveSettings(settings);
    setSettings(saved);
    applyTheme(saved.theme);
    setMessage('Настройки сохранены.');
  }

  return (
    <div className="app-page min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <AppHeader />

        <header className="mb-8">
          <h1 className="app-title text-4xl font-black tracking-tight sm:text-5xl">
            Настройки
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 app-text-muted sm:text-base">
            Здесь можно настроить внешний вид приложения и поведение некоторых блоков.
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <section className="app-card rounded-[28px] p-6 shadow-2xl">
            <h2 className="text-xl font-bold app-title">Тема оформления</h2>
            <p className="mt-2 text-sm app-text-soft">
              Выбери, как должно выглядеть приложение.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleChange('theme', 'dark')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  settings.theme === 'dark'
                    ? 'bg-fuchsia-600 text-white'
                    : 'app-card app-text-muted hover:opacity-90'
                }`}
              >
                Тёмная
              </button>

              <button
                type="button"
                onClick={() => handleChange('theme', 'light')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  settings.theme === 'light'
                    ? 'bg-fuchsia-600 text-white'
                    : 'app-card app-text-muted hover:opacity-90'
                }`}
              >
                Светлая
              </button>

              <button
                type="button"
                onClick={() => handleChange('theme', 'system')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  settings.theme === 'system'
                    ? 'bg-fuchsia-600 text-white'
                    : 'app-card app-text-muted hover:opacity-90'
                }`}
              >
                Системная
              </button>
            </div>
          </section>

          <section className="app-card rounded-[28px] p-6 shadow-2xl">
            <h2 className="text-xl font-bold app-title">Страна провайдеров</h2>
            <p className="mt-2 text-sm app-text-soft">
              Эта настройка пригодится для блока «Где смотреть».
            </p>

            <div className="mt-4">
              <select
                value={settings.providersRegion}
                onChange={(event) =>
                  handleChange('providersRegion', event.target.value)
                }
                className="app-input w-full max-w-xs rounded-2xl px-4 py-3 text-sm outline-none"
              >
                <option value="RU">Россия (RU)</option>
                <option value="US">США (US)</option>
                <option value="GB">Великобритания (GB)</option>
                <option value="DE">Германия (DE)</option>
                <option value="FR">Франция (FR)</option>
              </select>
            </div>
          </section>

          <section className="app-card rounded-[28px] p-6 shadow-2xl">
            <h2 className="text-xl font-bold app-title">Поведение трейлера</h2>
            <p className="mt-2 text-sm app-text-soft">
              Можно показывать встроенный плеер или только кнопку открытия трейлера.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleChange('trailerMode', 'embed')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  settings.trailerMode === 'embed'
                    ? 'bg-fuchsia-600 text-white'
                    : 'app-card app-text-muted hover:opacity-90'
                }`}
              >
                Встроенный трейлер
              </button>

              <button
                type="button"
                onClick={() => handleChange('trailerMode', 'link')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  settings.trailerMode === 'link'
                    ? 'bg-fuchsia-600 text-white'
                    : 'app-card app-text-muted hover:opacity-90'
                }`}
              >
                Только ссылка
              </button>
            </div>
          </section>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;