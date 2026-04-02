import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';

function StatCard({ title, value, subtitle = '' }) {
  return (
    <div className="app-card rounded-[28px] p-6 shadow-2xl">
      <p className="text-sm app-text-soft">{title}</p>
      <p className="mt-3 text-4xl font-black app-title">{value}</p>
      {subtitle && <p className="mt-2 text-sm app-text-soft">{subtitle}</p>}
    </div>
  );
}

function StatsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setError('');

        const data = await window.electronAPI.getStats();
        setStats(data);
      } catch {
        setError('Не удалось загрузить статистику.');
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="app-page min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AppHeader />

        <header className="mb-8">
          <h1 className="app-title text-4xl font-black tracking-tight sm:text-5xl">
            Статистика
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 app-text-muted sm:text-base">
            Здесь собрана краткая информация по твоей локальной базе Кинохаб.
          </p>
        </header>

        {isLoading && (
          <div className="app-card rounded-3xl p-6 app-text-muted">
            Загружаю статистику...
          </div>
        )}

        {!isLoading && error && (
          <div className="app-alert-danger rounded-3xl p-6">
            <p className="text-lg font-semibold">Ошибка</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && stats && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Всего сохранено"
              value={stats.totalSaved}
              subtitle="Уникальные фильмы из всех статусов"
            />

            <StatCard
              title="В избранном"
              value={stats.totalFavorites}
              subtitle="Фильмы, отмеченные как любимые"
            />

            <StatCard
              title="Хочу посмотреть"
              value={stats.totalWatchlist}
              subtitle="Фильмы, отложенные на потом"
            />

            <StatCard
              title="Смотрю"
              value={stats.totalWatching}
              subtitle="Фильмы, которые ты сейчас смотришь"
            />

            <StatCard
              title="Просмотрено"
              value={stats.totalWatched}
              subtitle="Фильмы, просмотр которых уже завершён"
            />

            <StatCard
              title="Брошено"
              value={stats.totalDropped}
              subtitle="Фильмы, которые ты решил не продолжать"
            />

            <StatCard
              title="Пересмотреть"
              value={stats.totalRewatch}
              subtitle="Фильмы, к которым хочешь вернуться ещё раз"
            />

            <StatCard
              title="Средний рейтинг TMDB"
              value={stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
              subtitle="Средняя внешняя оценка сохранённых фильмов"
            />

            <StatCard
              title="Оценено лично"
              value={stats.totalUserRated}
              subtitle="Сколько фильмов уже получили твою оценку"
            />

            <StatCard
              title="Средняя моя оценка"
              value={stats.averageUserRating ? stats.averageUserRating.toFixed(1) : '—'}
              subtitle="Средняя личная оценка по твоей библиотеке"
            />

            <StatCard
              title="Фильмов с заметками"
              value={stats.totalUserNotes}
              subtitle="Сколько фильмов уже получили твою личную заметку"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPage;