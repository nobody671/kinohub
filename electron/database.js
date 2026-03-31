const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

let db;
let dbPath;

function getDatabasePath() {
  if (dbPath) {
    return dbPath;
  }

  dbPath = path.join(app.getPath('userData'), 'kinohub.db');
  return dbPath;
}

function getDatabase() {
  if (db) {
    return db;
  }

  db = new Database(getDatabasePath());

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_movies (
      id INTEGER PRIMARY KEY,
      title TEXT,
      original_title TEXT,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      vote_average REAL,
      release_date TEXT,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

function saveMovie(movie, type) {
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT INTO saved_movies (
      id,
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
      @title,
      @original_title,
      @overview,
      @poster_path,
      @backdrop_path,
      @vote_average,
      @release_date,
      @type
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      original_title = excluded.original_title,
      overview = excluded.overview,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      vote_average = excluded.vote_average,
      release_date = excluded.release_date,
      type = excluded.type
  `);

  stmt.run({
    id: movie.id,
    title: movie.title || movie.name || '',
    original_title: movie.original_title || movie.original_name || '',
    overview: movie.overview || '',
    poster_path: movie.poster_path || '',
    backdrop_path: movie.backdrop_path || '',
    vote_average: movie.vote_average || 0,
    release_date: movie.release_date || movie.first_air_date || '',
    type
  });

  return { success: true };
}

function removeMovie(movieId) {
  const database = getDatabase();

  const stmt = database.prepare(`
    DELETE FROM saved_movies
    WHERE id = ?
  `);

  stmt.run(movieId);

  return { success: true };
}

function getSavedMovie(movieId) {
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT *
    FROM saved_movies
    WHERE id = ?
  `);

  return stmt.get(movieId) || null;
}

function getSavedMoviesByType(type) {
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT *
    FROM saved_movies
    WHERE type = ?
    ORDER BY datetime(created_at) DESC
  `);

  return stmt.all(type);
}

module.exports = {
  getDatabase,
  getDatabasePath,
  closeDatabase,
  saveMovie,
  removeMovie,
  getSavedMovie,
  getSavedMoviesByType
};