const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

let db;
let dbPath;

const VALID_SAVED_TYPES = [
  'favorite',
  'watchlist',
  'watching',
  'watched',
  'dropped',
  'rewatch'
];

const VALID_MEDIA_TYPES = ['movie', 'tv'];

function getDatabasePath() {
  if (dbPath) {
    return dbPath;
  }

  dbPath = path.join(app.getPath('userData'), 'kinohub.db');
  return dbPath;
}

function normalizeSavedType(type) {
  if (!type || typeof type !== 'string') {
    throw new Error('Не указан тип сохранения.');
  }

  const normalizedType = type.trim().toLowerCase();

  if (!VALID_SAVED_TYPES.includes(normalizedType)) {
    throw new Error('Неизвестный тип сохранения.');
  }

  return normalizedType;
}

function normalizeMediaType(mediaType) {
  if (!mediaType || typeof mediaType !== 'string') {
    return 'movie';
  }

  const normalizedMediaType = mediaType.trim().toLowerCase();

  if (!VALID_MEDIA_TYPES.includes(normalizedMediaType)) {
    throw new Error('Неизвестный тип медиа.');
  }

  return normalizedMediaType;
}

function normalizeUserRating(rating) {
  if (rating === null || rating === undefined || rating === '') {
    return null;
  }

  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating)) {
    throw new Error('Некорректная пользовательская оценка.');
  }

  if (numericRating < 1 || numericRating > 10) {
    throw new Error('Оценка должна быть от 1 до 10.');
  }

  return numericRating;
}

function normalizeUserNote(note) {
  if (note === null || note === undefined) {
    return '';
  }

  if (typeof note !== 'string') {
    throw new Error('Некорректная заметка.');
  }

  return note.trim();
}

function createSavedMoviesTable(database, tableName = 'saved_movies') {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'movie',
      title TEXT,
      original_title TEXT,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      vote_average REAL,
      release_date TEXT,
      type TEXT NOT NULL,
      user_rating REAL DEFAULT NULL,
      user_note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, media_type)
    )
  `);
}

function migrateSavedMoviesTable(database) {
  const tableExists = database
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = 'saved_movies'
    `)
    .get();

  if (!tableExists) {
    createSavedMoviesTable(database);
    return;
  }

  const columns = database.prepare(`PRAGMA table_info(saved_movies)`).all();
  const hasMediaType = columns.some((column) => column.name === 'media_type');
  const hasUserRating = columns.some((column) => column.name === 'user_rating');
  const hasUserNote = columns.some((column) => column.name === 'user_note');

  if (!hasMediaType) {
    createSavedMoviesTable(database, 'saved_movies_new');

    const userRatingSelect = hasUserRating ? 'user_rating' : 'NULL AS user_rating';
    const userNoteSelect = hasUserNote ? "user_note" : "'' AS user_note";

    database.exec(`
      INSERT INTO saved_movies_new (
        id,
        media_type,
        title,
        original_title,
        overview,
        poster_path,
        backdrop_path,
        vote_average,
        release_date,
        type,
        user_rating,
        user_note,
        created_at
      )
      SELECT
        id,
        'movie' AS media_type,
        title,
        original_title,
        overview,
        poster_path,
        backdrop_path,
        vote_average,
        release_date,
        type,
        ${userRatingSelect},
        ${userNoteSelect},
        created_at
      FROM saved_movies
    `);

    database.exec(`DROP TABLE saved_movies`);
    database.exec(`ALTER TABLE saved_movies_new RENAME TO saved_movies`);
    return;
  }

  if (!hasUserRating) {
    database.exec(`
      ALTER TABLE saved_movies
      ADD COLUMN user_rating REAL DEFAULT NULL
    `);
  }

  if (!hasUserNote) {
    database.exec(`
      ALTER TABLE saved_movies
      ADD COLUMN user_note TEXT DEFAULT ''
    `);
  }
}

function getDatabase() {
  if (db) {
    return db;
  }

  db = new Database(getDatabasePath());
  db.pragma('journal_mode = WAL');

  migrateSavedMoviesTable(db);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

function getMediaPayload(movie, type, mediaType = 'movie') {
  return {
    id: movie.id,
    media_type: normalizeMediaType(mediaType),
    title: movie.title || movie.name || '',
    original_title: movie.original_title || movie.original_name || '',
    overview: movie.overview || '',
    poster_path: movie.poster_path || '',
    backdrop_path: movie.backdrop_path || '',
    vote_average: movie.vote_average || 0,
    release_date: movie.release_date || movie.first_air_date || '',
    type: normalizeSavedType(type)
  };
}

function saveMovie(movie, type, mediaType = 'movie') {
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT INTO saved_movies (
      id,
      media_type,
      title,
      original_title,
      overview,
      poster_path,
      backdrop_path,
      vote_average,
      release_date,
      type
    )
    VALUES (
      @id,
      @media_type,
      @title,
      @original_title,
      @overview,
      @poster_path,
      @backdrop_path,
      @vote_average,
      @release_date,
      @type
    )
    ON CONFLICT(id, media_type) DO UPDATE SET
      title = excluded.title,
      original_title = excluded.original_title,
      overview = excluded.overview,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      vote_average = excluded.vote_average,
      release_date = excluded.release_date,
      type = excluded.type
  `);

  stmt.run(getMediaPayload(movie, type, mediaType));

  return { success: true };
}

function removeMovie(movieId, mediaType = 'movie') {
  const database = getDatabase();
  const normalizedMediaType = normalizeMediaType(mediaType);

  const stmt = database.prepare(`
    DELETE FROM saved_movies
    WHERE id = ? AND media_type = ?
  `);

  stmt.run(movieId, normalizedMediaType);

  return { success: true };
}

function getSavedMovie(movieId, mediaType = 'movie') {
  const database = getDatabase();
  const normalizedMediaType = normalizeMediaType(mediaType);

  const stmt = database.prepare(`
    SELECT *
    FROM saved_movies
    WHERE id = ? AND media_type = ?
  `);

  return stmt.get(movieId, normalizedMediaType) || null;
}

function getSavedMoviesByType(type, mediaType = null) {
  const database = getDatabase();
  const normalizedType = normalizeSavedType(type);

  if (mediaType) {
    const normalizedMediaType = normalizeMediaType(mediaType);

    const stmt = database.prepare(`
      SELECT *
      FROM saved_movies
      WHERE type = ? AND media_type = ?
      ORDER BY datetime(created_at) DESC
    `);

    return stmt.all(normalizedType, normalizedMediaType);
  }

  const stmt = database.prepare(`
    SELECT *
    FROM saved_movies
    WHERE type = ?
    ORDER BY datetime(created_at) DESC
  `);

  return stmt.all(normalizedType);
}

function getAllSavedMovies() {
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT *
    FROM saved_movies
    ORDER BY datetime(created_at) DESC
  `);

  return stmt.all();
}

function saveUserRating(movieId, rating, mediaType = 'movie') {
  const database = getDatabase();
  const normalizedRating = normalizeUserRating(rating);
  const normalizedMediaType = normalizeMediaType(mediaType);

  const existingMovie = getSavedMovie(movieId, normalizedMediaType);

  if (!existingMovie) {
    throw new Error('Сначала сохрани материал в библиотеку, а потом ставь свою оценку.');
  }

  const stmt = database.prepare(`
    UPDATE saved_movies
    SET user_rating = ?
    WHERE id = ? AND media_type = ?
  `);

  stmt.run(normalizedRating, movieId, normalizedMediaType);

  return { success: true };
}

function saveUserNote(movieId, note, mediaType = 'movie') {
  const database = getDatabase();
  const normalizedNote = normalizeUserNote(note);
  const normalizedMediaType = normalizeMediaType(mediaType);

  const existingMovie = getSavedMovie(movieId, normalizedMediaType);

  if (!existingMovie) {
    throw new Error('Сначала сохрани материал в библиотеку, а потом добавляй заметку.');
  }

  const stmt = database.prepare(`
    UPDATE saved_movies
    SET user_note = ?
    WHERE id = ? AND media_type = ?
  `);

  stmt.run(normalizedNote, movieId, normalizedMediaType);

  return { success: true };
}

module.exports = {
  VALID_SAVED_TYPES,
  VALID_MEDIA_TYPES,
  getDatabase,
  getDatabasePath,
  closeDatabase,
  saveMovie,
  removeMovie,
  getSavedMovie,
  getSavedMoviesByType,
  getAllSavedMovies,
  saveUserRating,
  saveUserNote
};