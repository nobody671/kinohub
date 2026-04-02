import { useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';
import AppFooter from '../components/AppFooter';

const savedTypeOptions = [
  { value: 'all', label: 'Все' },
  { value: 'favorite', label: 'В избранном' },
  { value: 'watchlist', label: 'Хочу посмотреть' },
  { value: 'watching', label: 'Смотрю' },
  { value: 'watched', label: 'Просмотрено' },
  { value: 'dropped', label: 'Брошено' },
  { value: 'rewatch', label: 'Пересмотреть' }
];

function sortMoviesByCreatedAt(movies) {
  return [...movies].sort((a, b) => {
    const firstDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const secondDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return secondDate - firstDate;
  });
}

function LibraryPage() {
  const [movies, setMovies] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadLibrary() {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      const savedTypes = await window.electronAPI.getSavedTypes();

      const results = await Promise.all(
        (savedTypes || []).map(async (type) => {
          const data = await window.electronAPI.getSavedMoviesByType(type);
          return Array.isArray(data) ? data : [];
        })
      );

      const allMovies = results.flat();
      setMovies(sortMoviesByCreatedAt(allMovies));
    } catch {
      setError('Не удалось загрузить библиотеку.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMovie(movieId, mediaType) {
    try {
      await window.electronAPI.removeSavedItem(movieId, mediaType || 'movie');

      setMovies((prev) =>
        prev.filter((movie) => !(movie.id === movieId && (movie.media_type || 'movie') === (mediaType || 'movie')))
      );

      setMessage('Материал удалён из библиотеки.');
    } catch {
      setMessage('Не удалось удалить материал.');
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const filteredMovies = useMemo(() => {
    if (selectedType === 'all') {
      return movies;
    }

    return movies.filter((movie) => movie.type === selectedType);
  }, [movies, selectedType]);

  const currentFilterLabel =
    savedTypeOptions.find((option) => option.value === selectedType)?.label || 'Все';

  return (
    <div className="app-page min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AppHeader />

        <header className="mb-8">
          <h1 className="app-title text-4xl font-black tracking-tight sm:text-5xl">
            Моя библиотека
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 app-text-muted sm:text-base">
            Здесь собраны все сохранённые фильмы и сериалы. Можно быстро
            переключаться между статусами и смотреть, что ты уже посмотрел,
            отложил или хочешь пересмотреть.
          </p>
        </header>

        <section className="app-card mb-8 rounded-[28px] p-5 shadow-2xl">
          <p className="text-sm font-semibold app-title">Фильтр по статусу</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {savedTypeOptions.map((option) => {
              const isActive = selectedType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-fuchsia-600 text-white'
                      : 'app-card app-text-muted hover:opacity-90'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {message && (
          <div className="app-alert-info mb-6 rounded-2xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {isLoading && (
          <div className="app-card rounded-3xl p-6 app-text-muted">
            Загружаю библиотеку...
          </div>
        )}

        {!isLoading && error && (
          <div className="app-alert-danger rounded-3xl p-6">
            <p className="text-lg font-semibold">Ошибка</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="mb-6 app-card rounded-2xl px-4 py-3 text-sm app-text-muted">
              Текущий фильтр: <span className="font-semibold app-title">{currentFilterLabel}</span>
              {' · '}
              Найдено: <span className="font-semibold app-title">{filteredMovies.length}</span>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="app-card rounded-3xl p-6 app-text-muted">
                По выбранному статусу пока ничего нет.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={`${movie.media_type || 'movie'}-${movie.id}`}
                    movie={movie}
                    small
                    savedType={movie.type || ''}
                    mediaType={movie.media_type || 'movie'}
                    onRemove={handleRemoveMovie}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <AppFooter />
      </div>
    </div>
  );
}

export default LibraryPage;