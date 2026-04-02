const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  VALID_SAVED_TYPES,
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
} = require('./database');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
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

  mainWindow.loadURL('http://localhost:5173');
}

function getStats() {
  const allSaved = getAllSavedMovies();

  const totalSaved = allSaved.length;
  const totalFavorites = allSaved.filter((movie) => movie.type === 'favorite').length;
  const totalWatchlist = allSaved.filter((movie) => movie.type === 'watchlist').length;
  const totalWatching = allSaved.filter((movie) => movie.type === 'watching').length;
  const totalWatched = allSaved.filter((movie) => movie.type === 'watched').length;
  const totalDropped = allSaved.filter((movie) => movie.type === 'dropped').length;
  const totalRewatch = allSaved.filter((movie) => movie.type === 'rewatch').length;

  const ratedMovies = allSaved.filter(
    (movie) => typeof movie.vote_average === 'number' && movie.vote_average > 0
  );

  const averageRating =
    ratedMovies.length > 0
      ? ratedMovies.reduce((sum, movie) => sum + movie.vote_average, 0) /
        ratedMovies.length
      : 0;

  const userRatedMovies = allSaved.filter(
    (movie) => typeof movie.user_rating === 'number' && movie.user_rating > 0
  );

  const totalUserRated = userRatedMovies.length;

  const averageUserRating =
    userRatedMovies.length > 0
      ? userRatedMovies.reduce((sum, movie) => sum + movie.user_rating, 0) /
        userRatedMovies.length
      : 0;

  const moviesWithNotes = allSaved.filter(
    (movie) => typeof movie.user_note === 'string' && movie.user_note.trim().length > 0
  );

  const totalUserNotes = moviesWithNotes.length;

  return {
    totalSaved,
    totalFavorites,
    totalWatchlist,
    totalWatching,
    totalWatched,
    totalDropped,
    totalRewatch,
    averageRating,
    totalUserRated,
    averageUserRating,
    totalUserNotes
  };
}

ipcMain.handle('db:save-favorite', async (_, movie) => {
  return saveMovie(movie, 'favorite', 'movie');
});

ipcMain.handle('db:save-watchlist', async (_, movie) => {
  return saveMovie(movie, 'watchlist', 'movie');
});

ipcMain.handle('db:save-movie-status', async (_, movie, type) => {
  return saveMovie(movie, type, 'movie');
});

ipcMain.handle('db:save-media-status', async (_, item, type, mediaType) => {
  return saveMovie(item, type, mediaType);
});

ipcMain.handle('db:save-user-rating', async (_, movieId, rating) => {
  return saveUserRating(movieId, rating, 'movie');
});

ipcMain.handle('db:save-user-rating-for-media', async (_, itemId, rating, mediaType) => {
  return saveUserRating(itemId, rating, mediaType);
});

ipcMain.handle('db:save-user-note', async (_, movieId, note) => {
  return saveUserNote(movieId, note, 'movie');
});

ipcMain.handle('db:save-user-note-for-media', async (_, itemId, note, mediaType) => {
  return saveUserNote(itemId, note, mediaType);
});

ipcMain.handle('db:remove-movie', async (_, movieId) => {
  return removeMovie(movieId, 'movie');
});

ipcMain.handle('db:remove-saved-item', async (_, itemId, mediaType) => {
  return removeMovie(itemId, mediaType);
});

ipcMain.handle('db:get-saved-movie', async (_, movieId) => {
  return getSavedMovie(movieId, 'movie');
});

ipcMain.handle('db:get-saved-item', async (_, itemId, mediaType) => {
  return getSavedMovie(itemId, mediaType);
});

ipcMain.handle('db:get-favorites', async () => {
  return getSavedMoviesByType('favorite', 'movie');
});

ipcMain.handle('db:get-watchlist', async () => {
  return getSavedMoviesByType('watchlist', 'movie');
});

ipcMain.handle('db:get-saved-movies-by-type', async (_, type, mediaType) => {
  return getSavedMoviesByType(type, mediaType || null);
});

ipcMain.handle('db:get-saved-types', async () => {
  return VALID_SAVED_TYPES;
});

ipcMain.handle('db:get-stats', async () => {
  return getStats();
});

ipcMain.handle('db:export-database', async () => {
  try {
    const sourcePath = getDatabasePath();

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Экспорт базы Кинохаб',
      defaultPath: 'kinohub-backup.db',
      filters: [
        { name: 'SQLite Database', extensions: ['db', 'sqlite'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    closeDatabase();
    fs.copyFileSync(sourcePath, result.filePath);
    getDatabase();

    return {
      success: true,
      canceled: false,
      filePath: result.filePath
    };
  } catch (error) {
    getDatabase();

    return {
      success: false,
      canceled: false,
      error: error.message || 'Не удалось экспортировать базу.'
    };
  }
});

ipcMain.handle('db:import-database', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Импорт базы Кинохаб',
      properties: ['openFile'],
      filters: [
        { name: 'SQLite Database', extensions: ['db', 'sqlite'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths?.length) {
      return { success: false, canceled: true };
    }

    const importPath = result.filePaths[0];
    const targetPath = getDatabasePath();

    closeDatabase();
    fs.copyFileSync(importPath, targetPath);
    getDatabase();

    return {
      success: true,
      canceled: false,
      filePath: importPath
    };
  } catch (error) {
    getDatabase();

    return {
      success: false,
      canceled: false,
      error: error.message || 'Не удалось импортировать базу.'
    };
  }
});

app.whenReady().then(() => {
  getDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});