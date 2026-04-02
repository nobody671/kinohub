import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';
import {
  getImageUrl,
  getLogoUrl,
  getProviderLink,
  getRecommendedTvShows,
  getSimilarTvShows,
  getTrailer,
  getTvDetails,
  getTvOverview,
  getTvTitle,
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

function TvShowPage() {
  const { tvId } = useParams();
  const [show, setShow] = useState(null);
  const [savedShow, setSavedShow] = useState(null);
  const [similarShows, setSimilarShows] = useState([]);
  const [recommendedShows, setRecommendedShows] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [userRatingInput, setUserRatingInput] = useState('');
  const [userNoteInput, setUserNoteInput] = useState('');

  const similarSliderRef = useRef(null);
  const recommendedSliderRef = useRef(null);

  async function loadSavedState(id) {
    const saved = await window.electronAPI.getSavedItem(Number(id), 'tv');
    setSavedShow(saved);
    setUserRatingInput(saved?.user_rating ? String(saved.user_rating) : '');
    setUserNoteInput(saved?.user_note || '');
  }

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        setIsLoading(true);
        setError('');
        setActionMessage('');

        const [showData, similarData, recommendedData] = await Promise.all([
          getTvDetails(tvId),
          getSimilarTvShows(tvId),
          getRecommendedTvShows(tvId)
        ]);

        setShow(showData);
        setSimilarShows(similarData.slice(0, 8));
        setRecommendedShows(recommendedData.slice(0, 8));

        await loadSavedState(tvId);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить данные сериала.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [tvId]);

  async function handleChangeSavedType(event) {
    const nextType = event.target.value;

    if (!show) {
      return;
    }

    try {
      if (!nextType) {
        await window.electronAPI.removeSavedItem(show.id, 'tv');
        await loadSavedState(tvId);
        setActionMessage('Сериал удалён из сохранённых.');
        return;
      }

      await window.electronAPI.saveMediaStatus(show, nextType, 'tv');
      await loadSavedState(tvId);
      setActionMessage(`Статус сериала обновлён: ${getSavedTypeLabel(nextType)}.`);
    } catch {
      setActionMessage('Не удалось обновить статус сериала.');
    }
  }

  async function handleSaveUserRating() {
    if (!savedShow) {
      setActionMessage('Сначала сохрани сериал в библиотеку, а потом ставь свою оценку.');
      return;
    }

    try {
      await window.electronAPI.saveUserRatingForMedia(show.id, userRatingInput, 'tv');
      await loadSavedState(tvId);
      setActionMessage('Моя оценка сохранена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось сохранить личную оценку.');
    }
  }

  async function handleRemoveUserRating() {
    if (!savedShow) {
      return;
    }

    try {
      await window.electronAPI.saveUserRatingForMedia(show.id, null, 'tv');
      await loadSavedState(tvId);
      setActionMessage('Моя оценка удалена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось удалить личную оценку.');
    }
  }

  async function handleSaveUserNote() {
    if (!savedShow) {
      setActionMessage('Сначала сохрани сериал в библиотеку, а потом добавляй заметку.');
      return;
    }

    try {
      await window.electronAPI.saveUserNoteForMedia(show.id, userNoteInput, 'tv');
      await loadSavedState(tvId);
      setActionMessage('Моя заметка сохранена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось сохранить заметку.');
    }
  }

  async function handleClearUserNote() {
    if (!savedShow) {
      return;
    }

    try {
      await window.electronAPI.saveUserNoteForMedia(show.id, '', 'tv');
      await loadSavedState(tvId);
      setActionMessage('Моя заметка очищена.');
    } catch (errorObject) {
      setActionMessage(errorObject?.message || 'Не удалось очистить заметку.');
    }
  }

  async function handleRemoveShow() {
    if (!show) {
      return;
    }

    try {
      await window.electronAPI.removeSavedItem(show.id, 'tv');
      await loadSavedState(tvId);
      setActionMessage('Сериал удалён из сохранённых.');
    } catch {
      setActionMessage('Не удалось удалить сериал.');
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
            Загружаю страницу сериала...
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
              to="/series"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl app-card px-5 py-3 text-sm font-semibold app-text transition hover:opacity-90"
            >
              <span>←</span>
              <span>К сериалам</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!show) return null;

  const posterUrl = getImageUrl(show.poster_path);
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const cast = Array.isArray(show.credits?.cast) ? show.credits.cast.slice(0, 10) : [];
  const trailer = getTrailer(show.videos?.results || []);
  const createdBy = Array.isArray(show.created_by) ? show.created_by : [];
  const networks = Array.isArray(show.networks) ? show.networks : [];
  const productionCountries = Array.isArray(show.origin_country) ? show.origin_country : [];
  const episodeRunTime = Array.isArray(show.episode_run_time) ? show.episode_run_time : [];
  const providers = getWatchProviders(show, settings.providersRegion);
  const providerLink = getProviderLink(show, settings.providersRegion);

  let trailerExternalUrl = '';
  let trailerEmbedUrl = '';

  if (trailer?.site === 'YouTube' && trailer?.key) {
    trailerExternalUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    trailerEmbedUrl = `https://www.youtube.com/embed/${trailer.key}`;
  }

  const showEmbeddedTrailer = settings.trailerMode === 'embed';
  const currentSavedType = savedShow?.type || '';
  const hasUserRating = typeof savedShow?.user_rating === 'number' && savedShow.user_rating > 0;
  const hasUserNote =
    typeof savedShow?.user_note === 'string' && savedShow.user_note.trim().length > 0;

  return (
    <div className="app-page min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader />

        <Link
          to="/series"
          className="app-btn-accent-soft mb-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-950/10 transition hover:opacity-90"
        >
          <span className="text-base">←</span>
          <span>К сериалам</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <div className="app-card overflow-hidden rounded-[28px] shadow-2xl">
              <div className="aspect-[2/3] bg-slate-900/80">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={getTvTitle(show)}
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
              <h2 className="text-lg font-bold app-title">Основные факты</h2>

              <div className="mt-4 space-y-3">
                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Рейтинг TMDB</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {show.vote_average ? show.vote_average.toFixed(1) : '—'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Первый выход</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {show.first_air_date || 'Неизвестно'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Статус</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {show.status || 'Неизвестно'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Сезонов</p>
                  <p className="mt-1 text-sm font-semibold app-title">
                    {show.number_of_seasons ?? 'Неизвестно'}
                  </p>
                </div>

                {!!show.original_name && show.original_name !== show.name && (
                  <div className="app-card-strong rounded-2xl px-4 py-3">
                    <p className="text-xs uppercase tracking-wide app-text-soft">
                      Оригинальное название
                    </p>
                    <p className="mt-1 text-sm font-semibold app-title">
                      {show.original_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="app-card rounded-[28px] p-6 shadow-2xl">
              <h1 className="app-title text-3xl font-black sm:text-5xl">
                {getTvTitle(show)}
              </h1>

              {!!show.tagline && (
                <p className="mt-3 text-sm italic app-text-soft">
                  {show.tagline}
                </p>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="app-card-strong rounded-2xl px-4 py-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Статус</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {getSavedTypeLabel(currentSavedType)}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Моя оценка</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {hasUserRating ? savedShow.user_rating : 'Нет оценки'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Моя заметка</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {hasUserNote ? 'Есть заметка' : 'Пока пусто'}
                  </p>
                </div>

                <div className="app-card-strong rounded-2xl px-4 py-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Эпизодов</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {show.number_of_episodes ?? 'Неизвестно'}
                  </p>
                </div>
              </div>

              <section className="mt-8">
                <div className="rounded-[28px] app-card-strong p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold app-title">Ваши действия</h2>
                      <p className="mt-2 text-sm leading-6 app-text-muted">
                        Здесь собраны все твои личные данные по сериалу: статус в библиотеке,
                        собственная оценка и заметка.
                      </p>
                    </div>

                    {savedShow && (
                      <button
                        type="button"
                        onClick={handleRemoveShow}
                        className="app-btn-danger-soft rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                      >
                        Удалить из сохранённых
                      </button>
                    )}
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
                        Один сериал может иметь только один текущий статус.
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
                        placeholder="Напиши здесь свои мысли о сериале, что в нём нравится или почему хочешь вернуться к нему позже..."
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
                      Заметка тоже хранится локально и привязана к сериалу в твоей библиотеке.
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
                  {getTvOverview(show)}
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-xl font-bold app-title">Дополнительная информация</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="app-card-strong rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide app-text-soft">Страны</p>
                    <p className="mt-2 text-sm font-semibold app-title">
                      {productionCountries.length > 0
                        ? productionCountries.join(', ')
                        : 'Неизвестно'}
                    </p>
                  </div>

                  <div className="app-card-strong rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide app-text-soft">Эпизодов</p>
                    <p className="mt-2 text-sm font-semibold app-title">
                      {show.number_of_episodes ?? 'Неизвестно'}
                    </p>
                  </div>

                  <div className="app-card-strong rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide app-text-soft">Длительность серии</p>
                    <p className="mt-2 text-sm font-semibold app-title">
                      {episodeRunTime.length > 0 ? `${episodeRunTime[0]} мин.` : 'Неизвестно'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 app-card-strong rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Создатели</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {createdBy.length > 0
                      ? createdBy.map((person) => person.name).join(', ')
                      : 'Информация не указана'}
                  </p>
                </div>

                <div className="mt-4 app-card-strong rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide app-text-soft">Сети / телеканалы</p>
                  <p className="mt-2 text-sm font-semibold app-title">
                    {networks.length > 0
                      ? networks.map((network) => network.name).join(', ')
                      : 'Информация не указана'}
                  </p>
                </div>
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
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold app-title">Актёры</h2>
                  <p className="text-sm app-text-soft">Первые {cast.length} актёров</p>
                </div>

                {cast.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                    {cast.map((person) => (
                      <div
                        key={person.cast_id || person.credit_id}
                        className="app-card-strong rounded-2xl p-4"
                      >
                        <p className="text-sm font-semibold app-title">{person.name}</p>
                        <p className="mt-1 text-xs app-text-soft">
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
                        title="Трейлер сериала"
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
                  <p className="mt-3 text-sm app-text-soft">Трейлер для этого сериала пока не найден.</p>
                )}
              </section>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold app-title">Где смотреть</h2>
              <p className="mt-1 text-sm app-text-soft">
                Регион провайдеров: {settings.providersRegion}
              </p>
            </div>

            {providerLink && (
              <a
                href={providerLink}
                target="_blank"
                rel="noreferrer"
                className="app-btn-info-soft inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              >
                Все варианты просмотра ↗
              </a>
            )}
          </div>

          {providers.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => {
                const logoUrl = getLogoUrl(provider.logo_path);

                const providerCardContent = (
                  <>
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

                    <div className="min-w-0">
                      <p className="truncate font-semibold app-title">
                        {provider.provider_name}
                      </p>
                      <p className="mt-1 text-xs app-text-soft">
                        Открыть варианты просмотра ↗
                      </p>
                    </div>
                  </>
                );

                if (providerLink) {
                  return (
                    <a
                      key={provider.provider_id}
                      href={providerLink}
                      target="_blank"
                      rel="noreferrer"
                      className="app-card-strong flex items-center gap-3 rounded-2xl p-4 transition hover:opacity-90"
                      title={`Открыть варианты просмотра для ${provider.provider_name}`}
                    >
                      {providerCardContent}
                    </a>
                  );
                }

                return (
                  <div
                    key={provider.provider_id}
                    className="app-card-strong flex items-center gap-3 rounded-2xl p-4"
                  >
                    {providerCardContent}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="app-card-strong mt-4 rounded-2xl p-4">
              <p className="text-sm app-text-muted">
                Для этого сериала пока нет данных о провайдерах просмотра для региона {settings.providersRegion}.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold app-title">Похожие сериалы</h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollLeft(similarSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить похожие сериалы влево"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => scrollRight(similarSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить похожие сериалы вправо"
              >
                →
              </button>
            </div>
          </div>

          {similarShows.length > 0 ? (
            <div ref={similarSliderRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {similarShows.map((item) => (
                <MovieCard key={item.id} movie={item} compact mediaType="tv" />
              ))}
            </div>
          ) : (
            <div className="app-card rounded-3xl p-6 app-text-muted">
              Похожие сериалы пока не найдены.
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
                aria-label="Прокрутить рекомендации сериалов влево"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => scrollRight(recommendedSliderRef)}
                className="app-card flex h-11 w-11 items-center justify-center rounded-full text-xl app-text transition hover:opacity-90"
                aria-label="Прокрутить рекомендации сериалов вправо"
              >
                →
              </button>
            </div>
          </div>

          {recommendedShows.length > 0 ? (
            <div
              ref={recommendedSliderRef}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
            >
              {recommendedShows.map((item) => (
                <MovieCard key={item.id} movie={item} compact mediaType="tv" />
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

export default TvShowPage;