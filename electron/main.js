const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: 'Кинохаб',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL('http://localhost:5173');
}

function buildTmdbHeaders() {
  const token = process.env.TMDB_API_TOKEN;

  if (!token) {
    throw new Error(
      'Не найден TMDB_API_TOKEN. Добавь токен в файл .env в корне проекта.'
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    accept: 'application/json'
  };
}

function mapMovie(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.original_title || 'Без названия',
    originalTitle: movie.original_title || '',
    overview: movie.overview || '',
    originalOverview: movie.original_overview || '',
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null,
    voteAverage: movie.vote_average || 0,
    releaseDate: movie.release_date || '',
    originalLanguage: movie.original_language || '',
    genreIds: Array.isArray(movie.genre_ids) ? movie.genre_ids : []
  };
}

ipcMain.handle('tmdb:get-popular-movies', async () => {
  const url = `${TMDB_BASE_URL}/movie/popular?language=ru-RU&page=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildTmdbHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка TMDB: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    page: data.page,
    results: Array.isArray(data.results) ? data.results.map(mapMovie) : []
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});