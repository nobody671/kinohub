import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';
import {
  getImageUrl,
  getLogoUrl,
  getMovieDetails,
  getMovieOverview,
  getMovieTitle,
  getProviderLink,
  getRecommendedMovies,
  getSimilarMovies,
  getTrailer,
  getWatchProviders
} from '../services/tmdb';
import { loadSettings } from '../utils/settings';

function MoviePage() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [savedMovie, setSavedMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');

  const similarSliderRef = useRef(null);
  const recommendedSliderRef = useRef(null);

  async function loadSavedState(id) {
    const saved = await window.electronAPI.getSavedMovie(Number(id));
    setSavedMovie(saved);
  }

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    async function loadMoviePage() {
      try {
        setIsLoading(true);
        setError('');
        setActionMessage('');

        const [movieData, similarData, recommendedData] = await Promise.all([
          getMovieDetails(movieId),
          getSimilarMovies(movieId),
          getRecommendedMovies(movieId)
        ]);

        setMovie(movieData);
        setSimilarMovies(similarData.slice(0, 8));
        setRecommendedMovies(recommendedData.slice(0, 8));

        await loadSavedState(movieId);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить данные фильма.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMoviePage();
  }, [movieId]);

  async function handleSaveFavorite() {
    try {
      await window.electronAPI.saveFavorite(movie);
      await loadSavedState(movieId);
      setActionMessage('Фильм добавлен в избранное.');
    } catch {
      setActionMessage('Не удалось добавить фильм в избранное.');
    }
  }

  async function handleSaveWatchlist() {
    try {
      await window.electronAPI.saveWatchlist(movie);
      await loadSavedState(movieId);
      setActionMessage('Фильм добавлен в список "хочу посмотреть".');
    } catch {
      setActionMessage('Не удалось добавить фильм в список.');
    }
  }

  async function handleRemoveMovie() {
    try {
      await window.electronAPI.removeMovie(movie.id);
      await loadSavedState(movieId);
      setActionMessage('Фильм удалён из сохранённых.');
    } catch {
      setActionMessage('Не удалось удалить фильм.');
    }
  }

  function scrollLeft(ref) {
    if (!ref.current) return;
    ref.current.scrollBy({ left: -700, behavior: 'smooth' });
  }

  function scrollRight(ref) {
    if (!ref.current) return;
    ref.current.scrollBy({ left: 700, behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <div className="app-page min-h-screen px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <AppHeader />
          <div className="app-card rounded-3xl p-6 app-text-muted">
            Загружаю страницу фильма...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page min-h-screen px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <AppHeader />
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-700 backdrop-blur-xl dark:text-red-100">
            <p className="text-lg font-semibold">Ошибка</p>
            <p className="mt-2 text-sm">{error}</p>

            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl app-card px-5 py-3 text-sm font-semibold app-text transition hover:opacity-90"
            >
              <span>←</span>
              <span>На главную</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const posterUrl = getImageUrl(movie.poster_path);
  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  const cast = Array.isArray(movie.credits?.cast) ? movie.credits.cast.slice(0, 8) : [];
  const trailer = getTrailer(movie.videos?.results || []);
  const providers = getWatchProviders(movie, settings.providersRegion);
  const providerLink = getProviderLink(movie, settings.providersRegion);

  let trailerExternalUrl = '';
  let trailerEmbedUrl = '';

  if (trailer?.site === 'YouTube' && trailer?.key) {
    trailerExternalUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    trailerEmbedUrl = `https://www.youtube.com/embed/${trailer.key}`;
  }

  const showEmbeddedTrailer = settings.trailerMode === 'embed';

  return (
    <div className="app-page min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader />

        <Link
          to="/"
          className="app-btn-accent-soft mb-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-950/10 transition hover:opacity-90"
        >
          <span className="text-base">←</span>
          <span>На главную</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="app-card overflow-hidden rounded-[28px] shadow-2xl">
            <div className="aspect-[2/3] bg-slate-900/80">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={getMovieTitle(movie)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm app-text-soft">
                  Постер отсутствует
                </div>
              )}
            </div>
          </div>

          <div className="app-card rounded-[28px] p-6 shadow-2xl">
            <h1 className="app-title text-3xl font-black sm:text-5xl">
              {getMovieTitle(movie)}
            </h1>

            {!!movie.original_title && movie.original_title !== movie.title && (
              <p className="mt-3 text-sm app-text-soft">
                Оригинальное название: {movie.original_title}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="app-btn-accent-soft rounded-2xl px-4 py-2 text-sm font-semibold">
                Рейтинг: {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
              </div>

              <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                Дата выхода: {movie.release_date || 'Неизвестно'}
              </div>

              <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                Длительность: {movie.runtime ? `${movie.runtime} мин.` : 'Неизвестно'}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveFavorite}
                className="rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
              >
                В избранное
              </button>

              <button
                type="button"
                onClick={handleSaveWatchlist}
                className="app-btn-info-soft rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
              >
                Хочу посмотреть
              </button>

              {savedMovie && (
                <button
                  type="button"
                  onClick={handleRemoveMovie}
                  className="app-btn-danger-soft rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                >
                  Удалить из сохранённых
                </button>
              )}
            </div>

            {savedMovie && (
              <div className="app-alert-success mt-4 rounded-2xl px-4 py-3 text-sm">
                Сейчас фильм сохранён как{' '}
                <span className="font-semibold">
                  {savedMovie.type === 'favorite' ? 'избранное' : 'хочу посмотреть'}
                </span>
              </div>
            )}

            {actionMessage && (
              <div className="app-card mt-4 rounded-2xl px-4 py-3 text-sm app-text-muted">
                {actionMessage}
              </div>
            )}

            <section className="mt-8">
              <h2 className="text-xl font-bold app-title">Описание</h2>
              <p className="mt-3 text-sm leading-7 app-text-muted">
                {getMovieOverview(movie)}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold app-title">Жанры</h2>

              {genres.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <span key={genre.id} className="app-chip rounded-2xl px-3 py-2 text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm app-text-soft">Жанры не указаны.</p>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold app-title">Актёры</h2>

              {cast.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {cast.map((person) => (
                    <div key={person.cast_id || person.credit_id} className="app-card-strong rounded-2xl p-4">
                      <p className="font-semibold app-title">{person.name}</p>
                      <p className="mt-1 text-sm app-text-soft">
                        {person.character || 'Роль не указана'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm app-text-soft">Информация об актёрах отсутствует.</p>
              )}
            </section>

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold app-title">Трейлер</h2>

                {trailerExternalUrl && (
                  <a
                    href={trailerExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="app-btn-accent-soft inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  >
                    Открыть трейлер ↗
                  </a>
                )}
              </div>

              {trailer && (
                <div className="app-alert-warning mt-4 rounded-2xl px-4 py-3 text-sm">
                  Трейлер может не загрузиться без VPN, если источник недоступен в твоём регионе.
                </div>
              )}

              {showEmbeddedTrailer && trailerEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-slate-950/40">
                  <div className="aspect-video">
                    <iframe
                      src={trailerEmbedUrl}
                      title="Трейлер фильма"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : trailer ? (
                <div className="app-card-strong mt-4 rounded-[24px] p-5">
                  <p className="text-base font-semibold app-title">
                    {showEmbeddedTrailer
                      ? `Трейлер найден: ${trailer.name || 'Без названия'}`
                      : 'Встроенный трейлер отключён в настройках'}
                  </p>

                  <p className="mt-3 text-sm leading-7 app-text-muted">
                    {showEmbeddedTrailer
                      ? `Источник трейлера: ${trailer.site || 'неизвестно'}. Встроенный просмотр для этого источника сейчас не поддерживается.`
                      : 'Сейчас выбран режим только со ссылкой. Открой трейлер через кнопку выше.'}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm app-text-soft">Трейлер для этого фильма пока не найден.</p>
              )}
            </section>

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold app-title">Где смотреть</h2>

                {providerLink && (
                  <a
                    href={providerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="app-btn-info-soft inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  >
                    Открыть у провайдера ↗
                  </a>
                )}
              </div>

              <p className="mt-3 text-sm app-text-soft">
                Текущий регион провайдеров: {settings.providersRegion}
              </p>

              {providers.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {providers.map((provider) => {
                    const logoUrl = getLogoUrl(provider.logo_path);

                    return (
                      <div key={provider.provider_id} className="app-card-strong flex items-center gap-3 rounded-2xl p-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/20">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={provider.provider_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs app-text-soft">Лого</span>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold app-title">{provider.provider_name}</p>
                          <p className="mt-1 text-sm app-text-soft">Доступно у провайдера</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm app-text-soft">
                  Для этого фильма пока нет данных о провайдерах просмотра для региона {settings.providersRegion}.
                </p>
              )}
            </section>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold app-title">Похожие фильмы</h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollLeft(similarSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить похожие фильмы влево"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => scrollRight(similarSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить похожие фильмы вправо"
              >
                →
              </button>
            </div>
          </div>

          {similarMovies.length > 0 ? (
            <div ref={similarSliderRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {similarMovies.map((item) => (
                <MovieCard key={item.id} movie={item} compact />
              ))}
            </div>
          ) : (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Похожие фильмы пока не найдены.
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold app-title">Рекомендуем посмотреть</h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollLeft(recommendedSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить рекомендации влево"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => scrollRight(recommendedSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить рекомендации вправо"
              >
                →
              </button>
            </div>
          </div>

          {recommendedMovies.length > 0 ? (
            <div ref={recommendedSliderRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {recommendedMovies.map((item) => (
                <MovieCard key={item.id} movie={item} compact />
              ))}
            </div>
          ) : (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Рекомендации пока не найдены.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MoviePage;