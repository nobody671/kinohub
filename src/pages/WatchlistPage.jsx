import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';

function WatchlistPage() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadWatchlist() {
    try {
      setIsLoading(true);
      setError('');

      const data = await window.electronAPI.getWatchlist();
      setMovies(Array.isArray(data) ? data : []);
    } catch {
      setError('Не удалось загрузить список "хочу посмотреть".');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(movieId) {
    try {
      await window.electronAPI.removeMovie(movieId);
      setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
      setMessage('Фильм удалён из списка "хочу посмотреть".');
    } catch {
      setMessage('Не удалось удалить фильм.');
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  return (
    <div className="app-page min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AppHeader />

        <header className="mb-8">
          <h1 className="app-title text-4xl font-black tracking-tight sm:text-5xl">
            Хочу посмотреть
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 app-text-muted sm:text-base">
            Здесь находятся фильмы, которые ты сохранил на потом.
          </p>
        </header>

        {message && (
          <div className="app-card mb-6 rounded-2xl px-4 py-3 text-sm app-text-muted">
            {message}
          </div>
        )}

        {isLoading && (
          <div className="app-card rounded-3xl p-6 app-text-muted">
            Загружаю список...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-700 backdrop-blur-xl dark:text-red-100">
            <p className="text-lg font-semibold">Ошибка</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && movies.length === 0 && (
          <div className="app-card rounded-3xl p-6 app-text-muted">
            Пока здесь пусто. Открой фильм и нажми «Хочу посмотреть».
          </div>
        )}

        {!isLoading && !error && movies.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                savedType="watchlist"
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchlistPage;