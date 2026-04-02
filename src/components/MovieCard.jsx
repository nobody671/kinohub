import { Link } from 'react-router-dom';
import {
  getImageUrl,
  getMovieOverview,
  getMovieTitle,
  getTvOverview,
  getTvTitle
} from '../services/tmdb';

function getSavedTypeLabel(savedType) {
  if (savedType === 'favorite') return 'В избранном';
  if (savedType === 'watchlist') return 'Хочу посмотреть';
  if (savedType === 'watching') return 'Смотрю';
  if (savedType === 'watched') return 'Просмотрено';
  if (savedType === 'dropped') return 'Брошено';
  if (savedType === 'rewatch') return 'Пересмотреть';
  return '';
}

function MovieCard({
  movie,
  compact = false,
  small = false,
  savedType = '',
  onRemove = null,
  mediaType = ''
}) {
  const resolvedMediaType = mediaType || movie.media_type || 'movie';
  const posterUrl = getImageUrl(movie.poster_path);

  const title =
    resolvedMediaType === 'tv' ? getTvTitle(movie) : getMovieTitle(movie);

  const overview =
    resolvedMediaType === 'tv' ? getTvOverview(movie) : getMovieOverview(movie);

  const releaseDate =
    resolvedMediaType === 'tv'
      ? movie.first_air_date || movie.release_date || 'Дата неизвестна'
      : movie.release_date || 'Дата неизвестна';

  const detailsLink =
    resolvedMediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

  const savedTypeLabel = getSavedTypeLabel(savedType);
  const userRating =
    typeof movie.user_rating === 'number' && movie.user_rating > 0
      ? movie.user_rating
      : null;

  const userNote =
    typeof movie.user_note === 'string' && movie.user_note.trim().length > 0
      ? movie.user_note.trim()
      : '';

  return (
    <article
      className={`app-card overflow-hidden rounded-[24px] shadow-xl ${
        compact ? 'w-[190px] shrink-0' : ''
      } ${small ? 'max-w-[220px]' : ''}`}
    >
      <div className={`relative bg-slate-900/80 ${small ? 'aspect-[2/2.7]' : 'aspect-[2/3]'}`}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm app-text-soft">
            Постер отсутствует
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {savedTypeLabel && (
            <div className="rounded-full app-card-strong px-3 py-1 text-xs font-semibold app-text shadow-lg">
              {savedTypeLabel}
            </div>
          )}

          {userRating && (
            <div className="rounded-full app-btn-success-soft px-3 py-1 text-xs font-semibold shadow-lg">
              Моя оценка: {userRating}
            </div>
          )}
        </div>
      </div>

      <div className={small ? 'p-3' : 'p-4'}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className={`${small ? 'text-sm' : 'text-base'} line-clamp-2 font-bold app-title`}>
            {title}
          </h2>

          <div
            className={`app-btn-accent-soft shrink-0 rounded-full ${
              small ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
            } font-semibold`}
          >
            {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
          </div>
        </div>

        <p className={`${small ? 'text-[11px]' : 'text-xs'} mb-2 app-text-soft`}>
          {releaseDate}
        </p>

        <p
          className={`app-text-muted ${
            small ? 'line-clamp-2 text-xs leading-5' : 'line-clamp-3 text-sm leading-6'
          }`}
        >
          {overview}
        </p>

        {userNote && (
          <div className="mt-3 rounded-2xl app-card-strong px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide app-text-soft">
              Моя заметка
            </p>
            <p className="mt-1 line-clamp-3 text-xs leading-5 app-text-muted">
              {userNote}
            </p>
          </div>
        )}

        <div className={`flex flex-wrap gap-2 ${small ? 'mt-3' : 'mt-4'}`}>
          <Link
            to={detailsLink}
            className={`app-btn-accent-soft inline-flex rounded-2xl font-semibold transition hover:opacity-90 ${
              small ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            Подробнее
          </Link>

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(movie.id, resolvedMediaType)}
              className={`app-btn-danger-soft inline-flex rounded-2xl font-semibold transition hover:opacity-90 ${
                small ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
              }`}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default MovieCard;