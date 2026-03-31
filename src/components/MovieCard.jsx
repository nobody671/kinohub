import { Link } from 'react-router-dom';
import {
  getImageUrl,
  getMovieOverview,
  getMovieTitle,
  getTvOverview,
  getTvTitle
} from '../services/tmdb';

function MovieCard({
  movie,
  compact = false,
  savedType = '',
  onRemove = null,
  mediaType = 'movie'
}) {
  const posterUrl = getImageUrl(movie.poster_path);

  const title =
    mediaType === 'tv' ? getTvTitle(movie) : getMovieTitle(movie);

  const overview =
    mediaType === 'tv' ? getTvOverview(movie) : getMovieOverview(movie);

  const releaseDate =
    mediaType === 'tv'
      ? movie.first_air_date || 'Дата неизвестна'
      : movie.release_date || 'Дата неизвестна';

  const detailsLink =
    mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

  return (
    <article
      className={`app-card overflow-hidden rounded-[24px] shadow-xl ${
        compact ? 'w-[190px] shrink-0' : ''
      }`}
    >
      <div className="relative aspect-[2/3] bg-slate-900/80">
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

        {savedType === 'favorite' && (
          <div className="absolute left-3 top-3 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            В избранном
          </div>
        )}

        {savedType === 'watchlist' && (
          <div className="absolute left-3 top-3 rounded-full border border-cyan-400/20 bg-cyan-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            Хочу посмотреть
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-bold app-title">
            {title}
          </h2>

          <div className="app-btn-accent-soft shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
            {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
          </div>
        </div>

        <p className="mb-2 text-xs app-text-soft">{releaseDate}</p>

        <p className="line-clamp-3 text-sm leading-6 app-text-muted">
          {overview}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={detailsLink}
            className="inline-flex rounded-2xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
          >
            Подробнее
          </Link>

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(movie.id)}
              className="app-btn-danger-soft inline-flex rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
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