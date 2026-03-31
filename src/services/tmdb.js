const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w300';

function getToken() {
  const token = import.meta.env.VITE_TMDB_API_TOKEN;

  if (!token) {
    throw new Error(
      'Не найден VITE_TMDB_API_TOKEN. Добавь его в файл .env в корне проекта.'
    );
  }

  return token;
}

async function fetchFromTmdb(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка TMDB: ${response.status} ${errorText}`);
  }

  return response.json();
}

export function getImageUrl(path) {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}${path}`;
}

export function getLogoUrl(path) {
  if (!path) {
    return null;
  }

  return `${TMDB_LOGO_BASE_URL}${path}`;
}

export function getMovieTitle(movie) {
  return movie.title || movie.original_title || 'Без названия';
}

export function getMovieOverview(movie) {
  return movie.overview || movie.original_overview || 'Описание пока отсутствует.';
}

export function getTvTitle(show) {
  return show.name || show.original_name || 'Без названия';
}

export function getTvOverview(show) {
  return show.overview || show.original_overview || 'Описание пока отсутствует.';
}

export async function getPopularMovies() {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/movie/popular?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function searchMovies(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/search/movie?language=ru-RU&query=${encodeURIComponent(trimmedQuery)}&page=1&include_adult=false`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function getMovieDetails(movieId) {
  return fetchFromTmdb(
    `${TMDB_BASE_URL}/movie/${movieId}?language=ru-RU&append_to_response=credits,videos,watch/providers`
  );
}

export async function getSimilarMovies(movieId) {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/movie/${movieId}/similar?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function getRecommendedMovies(movieId) {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/movie/${movieId}/recommendations?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function getPopularTvShows() {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/tv/popular?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function searchTvShows(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/search/tv?language=ru-RU&query=${encodeURIComponent(trimmedQuery)}&page=1&include_adult=false`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function getTvDetails(tvId) {
  return fetchFromTmdb(
    `${TMDB_BASE_URL}/tv/${tvId}?language=ru-RU&append_to_response=credits,videos,watch/providers`
  );
}

export async function getSimilarTvShows(tvId) {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/tv/${tvId}/similar?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export async function getRecommendedTvShows(tvId) {
  const data = await fetchFromTmdb(
    `${TMDB_BASE_URL}/tv/${tvId}/recommendations?language=ru-RU&page=1`
  );

  return Array.isArray(data.results) ? data.results : [];
}

export function getTrailer(videoResults) {
  if (!Array.isArray(videoResults)) {
    return null;
  }

  const trailer =
    videoResults.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    ) ||
    videoResults.find(
      (video) => video.site === 'YouTube' && video.type === 'Teaser'
    ) ||
    videoResults.find((video) => video.site === 'YouTube');

  return trailer || null;
}

function getRegionData(watchProvidersObject, regionCode = 'RU') {
  const results = watchProvidersObject?.results;

  if (!results) {
    return null;
  }

  return results[regionCode] || results.RU || results.US || Object.values(results)[0] || null;
}

export function getWatchProviders(mediaObject, regionCode = 'RU') {
  const region = getRegionData(mediaObject?.['watch/providers'], regionCode);

  if (!region) {
    return [];
  }

  const providers = [
    ...(region.flatrate || []),
    ...(region.rent || []),
    ...(region.buy || [])
  ];

  const uniqueProviders = [];
  const seen = new Set();

  for (const provider of providers) {
    if (!seen.has(provider.provider_id)) {
      seen.add(provider.provider_id);
      uniqueProviders.push(provider);
    }
  }

  return uniqueProviders;
}

export function getProviderLink(mediaObject, regionCode = 'RU') {
  const region = getRegionData(mediaObject?.['watch/providers'], regionCode);
  return region?.link || '';
}