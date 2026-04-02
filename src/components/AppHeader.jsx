import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
        isActive
          ? 'bg-fuchsia-600 text-white'
          : 'app-card app-text-muted hover:opacity-90'
      }`}
    >
      {children}
    </Link>
  );
}

function AppHeader() {
  const [message, setMessage] = useState('');

  async function handleExport() {
    const result = await window.electronAPI.exportDatabase();

    if (result?.canceled) {
      return;
    }

    if (result?.success) {
      setMessage('База успешно экспортирована.');
      return;
    }

    setMessage(result?.error || 'Не удалось экспортировать базу.');
  }

  async function handleImport() {
    const result = await window.electronAPI.importDatabase();

    if (result?.canceled) {
      return;
    }

    if (result?.success) {
      setMessage('База успешно импортирована. Лучше перезапустить приложение.');
      return;
    }

    setMessage(result?.error || 'Не удалось импортировать базу.');
  }

  return (
    <>
      <div className="app-card mb-8 flex flex-col gap-4 rounded-[28px] p-5 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="inline-block text-lg font-black tracking-wide app-title transition hover:text-fuchsia-500"
            >
              Кинохаб
            </Link>

            <p className="mt-1 text-sm app-text-soft">
              Фильмы, сериалы, личная библиотека и подборки на будущее
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <NavLink to="/">Главная</NavLink>
            <NavLink to="/series">Сериалы</NavLink>
            <NavLink to="/library">Моя библиотека</NavLink>
            <NavLink to="/stats">Статистика</NavLink>
            <NavLink to="/settings">Настройки</NavLink>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="app-btn-success-soft rounded-2xl px-4 py-2 text-sm font-medium transition hover:opacity-90"
          >
            Экспорт базы
          </button>

          <button
            type="button"
            onClick={handleImport}
            className="app-btn-info-soft rounded-2xl px-4 py-2 text-sm font-medium transition hover:opacity-90"
          >
            Импорт базы
          </button>
        </div>
      </div>

      {message && (
        <div className="app-card mb-8 rounded-2xl px-4 py-3 text-sm app-text-muted">
          {message}
        </div>
      )}
    </>
  );
}

export default AppHeader;