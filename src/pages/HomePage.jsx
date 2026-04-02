import { useEffect, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';
import { getPopularMovies, searchMovies } from '../services/tmdb';
import AppFooter from '../components/AppFooter';

function HomePage() {
  const [popularMovies, setPopularMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [savedMap, setSavedMap] = useState({});
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');

  const sliderRef = useRef(null);

  async function loadSavedStatuses() {
    try {
      const savedTypes = await window.electronAPI.getSavedTypes();
      const nextMap = {};

      const results = await Promise.all(
        (savedTypes || []).map(async (type) => {
          const data = await window.electronAPI.getSavedMoviesByType(type);
          return { type, data: Array.isArray(data) ? data : [] };
        })
      );

      for (const result of results) {
        for (const movie of result.data) {
          nextMap[movie.id] = result.type;
        }
      }

      setSavedMap(nextMap);
    } catch {
      // ничего страшного
    }
  }

  async function loadPopular() {
    try {
      setIsLoadingPopular(true);
      setError('');

      const movies = await getPopularMovies();
      setPopularMovies(movies);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить популярные фильмы.');
    } finally {
      setIsLoadingPopular(false);
    }
  }

  async function handleSearch(query) {
    try {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setCurrentQuery('');
        setSearchResults([]);
        return;
      }

      setIsLoadingSearch(true);
      setError('');

      const movies = await searchMovies(trimmedQuery);
      setSearchResults(movies);
      setCurrentQuery(trimmedQuery);
    } catch (err) {
      setError(err.message || 'Не удалось выполнить поиск.');
    } finally {
      setIsLoadingSearch(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSearch(searchInput);
  }

  function handleResetSearch() {
    setSearchInput('');
    setCurrentQuery('');
    setSearchResults([]);
  }

  function scrollSliderLeft() {
    if (!sliderRef.current) {
      return;
    }

    sliderRef.current.scrollBy({
      left: -700,
      behavior: 'smooth'
    });
  }

  function scrollSliderRight() {
    if (!sliderRef.current) {
      return;
    }

    sliderRef.current.scrollBy({
      left: 700,
      behavior: 'smooth'
    });
  }

  useEffect(() => {
    async function loadPage() {
      await Promise.all([loadPopular(), loadSavedStatuses()]);
    }

    loadPage();
  }, []);

  return (
    <div className="app-page min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AppHeader />

        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="app-title text-4xl font-black tracking-tight sm:text-5xl">
              Каталог фильмов
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 app-text-muted sm:text-base">
              Популярные фильмы можно листать кнопками, а ниже — искать по названию.
            </p>
          </div>

          <div className="app-card rounded-3xl px-5 py-4 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] app-text-soft">
              Язык запросов
            </p>
            <p className="mt-2 text-sm font-medium app-text">
              ru-RU + fallback на оригинал
            </p>
          </div>
        </header>

        <section className="app-card mb-8 rounded-[28px] p-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Введите название фильма..."
              className="app-input flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
            />

            <button
              type="submit"
              className="rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
            >
              Найти
            </button>

            <button
              type="button"
              onClick={handleResetSearch}
              className="app-card rounded-2xl px-5 py-3 text-sm font-semibold app-text transition hover:opacity-90"
            >
              Сбросить
            </button>
          </form>
        </section>

        {error && (
          <div className="app-alert-danger mb-8 rounded-3xl p-6">
            <p className="text-lg font-semibold">Ошибка загрузки</p>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </div>
        )}

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold app-title">Популярные фильмы</h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollSliderLeft}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить влево"
              >
                ←
              </button>

              <button
                type="button"
                onClick={scrollSliderRight}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить вправо"
              >
                →
              </button>
            </div>
          </div>

          {isLoadingPopular ? (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Загружаю популярные фильмы...
            </div>
          ) : (
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
            >
              {popularMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  compact
                  savedType={savedMap[movie.id] || ''}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold app-title">
              {currentQuery ? `Результаты поиска: ${currentQuery}` : 'Результаты поиска'}
            </h2>
          </div>

          {isLoadingSearch && (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Выполняю поиск...
            </div>
          )}

          {!isLoadingSearch && currentQuery && searchResults.length === 0 && (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              По вашему запросу ничего не найдено.
            </div>
          )}

          {!isLoadingSearch && searchResults.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  savedType={savedMap[movie.id] || ''}
                />
              ))}
            </div>
          )}

          {!isLoadingSearch && !currentQuery && (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Введите название фильма, чтобы увидеть результаты поиска.
            </div>
          )}
        </section>

        <AppFooter />
      </div>
    </div>
  );
}

export default HomePage;