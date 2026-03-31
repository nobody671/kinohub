import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import MovieCard from '../components/MovieCard';
import {
  getImageUrl,
  getRecommendedTvShows,
  getSimilarTvShows,
  getTrailer,
  getTvDetails,
  getTvOverview,
  getTvTitle
} from '../services/tmdb';
import { loadSettings } from '../utils/settings';

function TvShowPage() {
  const { tvId } = useParams();
  const [show, setShow] = useState(null);
  const [similarShows, setSimilarShows] = useState([]);
  const [recommendedShows, setRecommendedShows] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const similarSliderRef = useRef(null);
  const recommendedSliderRef = useRef(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        setIsLoading(true);
        setError('');

        const [showData, similarData, recommendedData] = await Promise.all([
          getTvDetails(tvId),
          getSimilarTvShows(tvId),
          getRecommendedTvShows(tvId)
        ]);

        setShow(showData);
        setSimilarShows(similarData.slice(0, 8));
        setRecommendedShows(recommendedData.slice(0, 8));
      } catch (err) {
        setError(err.message || 'Не удалось загрузить данные сериала.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [tvId]);

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
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-700 backdrop-blur-xl dark:text-red-100">
            <p className="text-lg font-semibold">Ошибка</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!show) return null;

  const posterUrl = getImageUrl(show.poster_path);
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const cast = Array.isArray(show.credits?.cast) ? show.credits.cast.slice(0, 8) : [];
  const trailer = getTrailer(show.videos?.results || []);

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
          to="/series"
          className="app-btn-accent-soft mb-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-950/10 transition hover:opacity-90"
        >
          <span className="text-base">←</span>
          <span>К сериалам</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
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

          <div className="app-card rounded-[28px] p-6 shadow-2xl">
            <h1 className="app-title text-3xl font-black sm:text-5xl">
              {getTvTitle(show)}
            </h1>

            {!!show.original_name && show.original_name !== show.name && (
              <p className="mt-3 text-sm app-text-soft">
                Оригинальное название: {show.original_name}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="app-btn-accent-soft rounded-2xl px-4 py-2 text-sm font-semibold">
                Рейтинг: {show.vote_average ? show.vote_average.toFixed(1) : '—'}
              </div>

              <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                Первый выход: {show.first_air_date || 'Неизвестно'}
              </div>

              <div className="app-chip rounded-2xl px-4 py-2 text-sm">
                Сезонов: {show.number_of_seasons ?? 'Неизвестно'}
              </div>
            </div>

            <section className="mt-8">
              <h2 className="text-xl font-bold app-title">Описание</h2>
              <p className="mt-3 text-sm leading-7 app-text-muted">
                {getTvOverview(show)}
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
                <MovieCard key={item.id} movie={item} mediaType="tv" compact />
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

          {recommendedShows.length > 0 ? (
            <div ref={recommendedSliderRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {recommendedShows.map((item) => (
                <MovieCard key={item.id} movie={item} mediaType="tv" compact />
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

export default TvShowPage;