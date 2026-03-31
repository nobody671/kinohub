import { useEffect, useState } from 'react';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function getMovieTitle(movie) {
  return movie.title || movie.originalTitle || 'Без названия';
}

function getMovieOverview(movie) {
  return movie.overview || movie.originalOverview || 'Описание пока отсутствует.';
}

function getPosterUrl(posterPath) {
  if (!posterPath) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

function App() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMovies() {
      try {
        setIsLoading(true);
        setError('');

        const data = await window.electronAPI.getPopularMovies();
        setMovies(data.results || []);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить фильмы.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();
  }, []);

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-block rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-200">
              Кинохаб
            </p>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Популярные фильмы
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Первый экран уже получает фильмы из TMDB с приоритетом русского языка.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Язык запросов
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              ru-RU + fallback на оригинал
            </p>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur-xl">
            Загружаю популярные фильмы...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-100 backdrop-blur-xl">
            <p className="text-lg font-semibold">Ошибка загрузки</p>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {movies.map((movie) => {
              const posterUrl = getPosterUrl(movie.posterPath);

              return (
                <article
                  key={movie.id}
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="aspect-[2/3] bg-slate-900/80">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={getMovieTitle(movie)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                        Постер отсутствует
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 text-lg font-bold text-white">
                        {getMovieTitle(movie)}
                      </h2>

                      <div className="shrink-0 rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-200">
                        {movie.voteAverage ? movie.voteAverage.toFixed(1) : '—'}
                      </div>
                    </div>

                    <p className="mb-3 text-sm text-slate-400">
                      {movie.releaseDate || 'Дата неизвестна'}
                    </p>

                    <p className="line-clamp-5 text-sm leading-6 text-slate-300">
                      {getMovieOverview(movie)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;