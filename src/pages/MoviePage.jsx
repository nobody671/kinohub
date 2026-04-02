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
import AppFooter from '../components/AppFooter';

const savedTypeOptions = [
  { value: '', label: 'Не сохранено' },
  { value: 'favorite', label: 'В избранном' },
  { value: 'watchlist', label: 'Хочу посмотреть' },
  { value: 'watching', label: 'Смотрю' },
  { value: 'watched', label: 'Просмотрено' },
  { value: 'dropped', label: 'Брошено' },
  { value: 'rewatch', label: 'Пересмотреть' }
];

function getSavedTypeLabel(type) {
  const matchedOption = savedTypeOptions.find((option) => option.value === type);
  return matchedOption ? matchedOption.label : 'Не сохранено';
}

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
  const [userRatingInput, setUserRatingInput] = useState('');
  const [userNoteInput, setUserNoteInput] = useState('');

  const similarSliderRef = useRef(null);
  const recommendedSliderRef = useRef(null);

  async function loadSavedState(id) {
    const saved = await window.electronAPI.getSavedMovie(Number(id));
    setSavedMovie(saved);
    setUserRatingInput(saved?.user_rating ? String(saved.user_rating) : '');
    setUserNoteInput(saved?.user_note || '');
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

  async function handleChangeSavedType(event) {
    const nextType = event.target.value;

    if (!movie) {
      return;
    }

    try {
      if (!nextType) {
        await window.electronAPI.removeMovie(movie.id);
        await loadSavedState(movieId);
        setActionMessage('Фильм удалён из сохранённых.');
        return;
      }

      await window.electronAPI.saveMovieStatus(movie, nextType);
      await loadSavedState(movieId);
      setActionMessage(`Статус фильма обновлён: ${getSavedTypeLabel(nextType)}.`);
    } catch {
      setActionMessage('Не удалось обновить статус фильма.');
    }
  }

  async function handleSaveUserRating() {
    if (!savedMovie) {
      setActionMessage('Сначала сохрани фильм в библиотеку, а потом ставь свою оценку.');
      return;
    }

    try {
      await window.electronAPI.saveUserRating(movie.id, userRatingInput);
      await loadSavedState(movieId);
      setActionMessage('Моя оценка сохранена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось сохранить личную оценку.');
    }
  }

  async function handleRemoveUserRating() {
    if (!savedMovie) {
      return;
    }

    try {
      await window.electronAPI.saveUserRating(movie.id, null);
      await loadSavedState(movieId);
      setActionMessage('Моя оценка удалена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось удалить личную оценку.');
    }
  }

  async function handleSaveUserNote() {
    if (!savedMovie) {
      setActionMessage('Сначала сохрани фильм в библиотеку, а потом добавляй заметку.');
      return;
    }

    try {
      await window.electronAPI.saveUserNote(movie.id, userNoteInput);
      await loadSavedState(movieId);
      setActionMessage('Моя заметка сохранена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось сохранить заметку.');
    }
  }

  async function handleClearUserNote() {
    if (!savedMovie) {
      return;
    }

    try {
      await window.electronAPI.saveUserNote(movie.id, '');
      await loadSavedState(movieId);
      setActionMessage('Моя заметка очищена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось очистить заметку.');
    }
  }

  async function handleRemoveMovie() {
    if (!movie) {
      return;
    }

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
          <div className="app-alert-danger rounded-3xl p-6">
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
  const currentSavedType = savedMovie?.type || '';
  const hasUserRating = typeof savedMovie?.user_rating === 'number' && savedMovie.user_rating > 0;
  const hasUserNote =
    typeof savedMovie?.user_note === 'string' && savedMovie.user_note.trim().length > 0;

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
          <div className="space-y-6">
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

            <div className="app-card rounded-[28px] p-5 shadow-2xl">
              <h2 className="text-lg font-bold app-title">Кратко о фильме</h2>

              <div className="mt-4 space-y-3">
                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Рейтинг TMDB</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Дата выхода</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {movie.release_date || 'Неизвестно'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Длительность</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {movie.runtime ? `${movie.runtime} мин.` : 'Неизвестно'}
                  </p>
                </div>

                {!!movie.original_title && movie.original_title !== movie.title && (
                  <div className="app-card-strong rounded-2xl px-4 py-3">
                    <p className="text-xs uppercase tracking-wide app-text-soft">
                      Оригинальное название
                    </p>
                    <p className="mt-1 text-sm font-semibold app-title">
                      {movie.original_title}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="app-card rounded-[28px] p-6 shadow-2xl">
              <h1 className="app-title text-3xl font-black sm:text-5xl">
                {getMovieTitle(movie)}
              </h1>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="app-btn-accent-soft rounded-2xl px-4 py-2 text-sm font-semibold">
                  Рейтинг TMDB: {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
                </div>

                <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                  Дата выхода: {movie.release_date || 'Неизвестно'}
                </div>

                <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                  Длительность: {movie.runtime ? `${movie.runtime} мин.` : 'Неизвестно'}
                </div>

                {hasUserRating && (
                  <div className="app-btn-success-soft rounded-2xl px-4 py-2 text-sm font-semibold">
                    Моя оценка: {savedMovie.user_rating}
                  </div>
                )}
              </div>

              <section className="mt-8">
                <div className="rounded-[28px] app-card-strong p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold app-title">Ваши действия</h2>
                      <p className="mt-2 text-sm leading-6 app-text-muted">
                        Здесь собраны все твои личные данные по фильму: статус в библиотеке,
                        собственная оценка и заметка.
                      </p>
                    </div>

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

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl app-card px-4 py-4">
                      <p className="text-xs uppercase tracking-wide app-text-soft">Статус</p>
                      <p className="mt-2 text-sm font-semibold app-title">
                        {getSavedTypeLabel(currentSavedType)}
                      </p>
                    </div>

                    <div className="rounded-2xl app-card px-4 py-4">
                      <p className="text-xs uppercase tracking-wide app-text-soft">Моя оценка</p>
                      <p className="mt-2 text-sm font-semibold app-title">
                        {hasUserRating ? savedMovie.user_rating : 'Нет оценки'}
                      </p>
                    </div>

                    <div className="rounded-2xl app-card px-4 py-4">
                      <p className="text-xs uppercase tracking-wide app-text-soft">Моя заметка</p>
                      <p className="mt-2 text-sm font-semibold app-title">
                        {hasUserNote ? 'Есть заметка' : 'Пока пусто'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    <section className="rounded-[24px] app-card p-5">
                      <h3 className="text-lg font-bold app-title">Статус в библиотеке</h3>

                      <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-medium app-text-muted">
                          Выбери статус
                        </span>

                        <select
                          value={currentSavedType}
                          onChange={handleChangeSavedType}
                          className="app-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        >
                          {savedTypeOptions.map((option) => (
                            <option key={option.value || 'empty'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="mt-3 text-sm app-text-soft">
                        Один фильм может иметь только один текущий статус.
                      </p>
                    </section>

                    <section className="rounded-[24px] app-card p-5">
                      <h3 className="text-lg font-bold app-title">Моя оценка</h3>

                      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium app-text-muted">
                            Оценка от 1 до 10
                          </span>

                          <select
                            value={userRatingInput}
                            onChange={(event) => setUserRatingInput(event.target.value)}
                            className="app-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                          >
                            <option value="">Без оценки</option>
                            {Array.from({ length: 10 }, (_, index) => {
                              const value = String(index + 1);

                              return (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <div className="flex flex-wrap items-end gap-3">
                          <button
                            type="button"
                            onClick={handleSaveUserRating}
                            className="app-btn-success-soft rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                          >
                            Сохранить оценку
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveUserRating}
                            className="app-card rounded-2xl px-4 py-3 text-sm font-semibold app-text transition hover:opacity-90"
                          >
                            Убрать оценку
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm app-text-soft">
                        Личная оценка хранится локально и не зависит от рейтинга TMDB.
                      </p>
                    </section>
                  </div>

                  <section className="mt-6 rounded-[24px] app-card p-5">
                    <h3 className="text-lg font-bold app-title">Моя заметка</h3>

                    <div className="mt-4">
                      <textarea
                        value={userNoteInput}
                        onChange={(event) => setUserNoteInput(event.target.value)}
                        rows={5}
                        placeholder="Напиши здесь свои мысли о фильме, почему хочешь посмотреть его позже или что особенно понравилось..."
                        className="app-input w-full rounded-2xl px-4 py-3 text-sm leading-6 outline-none transition"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveUserNote}
                        className="app-btn-info-soft rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                      >
                        Сохранить заметку
                      </button>

                      <button
                        type="button"
                        onClick={handleClearUserNote}
                        className="app-card rounded-2xl px-4 py-3 text-sm font-semibold app-text transition hover:opacity-90"
                      >
                        Очистить заметку
                      </button>
                    </div>

                    <p className="mt-3 text-sm app-text-soft">
                      Заметка тоже хранится локально и привязана к фильму в твоей библиотеке.
                    </p>
                  </section>
                </div>
              </section>

              {actionMessage && (
                <div className="app-alert-info mt-4 rounded-2xl px-4 py-3 text-sm">
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
                      <div
                        key={person.cast_id || person.credit_id}
                        className="app-card-strong rounded-2xl p-4"
                      >
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
                        <div
                          key={provider.provider_id}
                          className="app-card-strong flex items-center gap-3 rounded-2xl p-4"
                        >
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
            <div
              ref={recommendedSliderRef}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
            >
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

        <AppFooter />
      </div>
    </div>
  );
}

export default MoviePage;