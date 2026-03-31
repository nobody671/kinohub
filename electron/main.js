const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  getDatabase,
  getDatabasePath,
  closeDatabase,
  saveMovie,
  removeMovie,
  getSavedMovie,
  getSavedMoviesByType
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
  const db = getDatabase();

  const favorites = getSavedMoviesByType('favorite');
  const watchlist = getSavedMoviesByType('watchlist');
  const allSaved = [...favorites, ...watchlist];

  const uniqueMoviesMap = new Map();

  for (const movie of allSaved) {
    if (!uniqueMoviesMap.has(movie.id)) {
      uniqueMoviesMap.set(movie.id, movie);
    }
  }

  const uniqueMovies = Array.from(uniqueMoviesMap.values());

  const totalFavorites = favorites.length;
  const totalWatchlist = watchlist.length;
  const totalSaved = uniqueMovies.length;

  const ratedMovies = uniqueMovies.filter(
    (movie) => typeof movie.vote_average === 'number' && movie.vote_average > 0
  );

  const averageRating =
    ratedMovies.length > 0
      ? ratedMovies.reduce((sum, movie) => sum + movie.vote_average, 0) /
        ratedMovies.length
      : 0;

  return {
    totalFavorites,
    totalWatchlist,
    totalSaved,
    averageRating
  };
}

ipcMain.handle('db:save-favorite', async (_, movie) => {
  return saveMovie(movie, 'favorite');
});

ipcMain.handle('db:save-watchlist', async (_, movie) => {
  return saveMovie(movie, 'watchlist');
});

ipcMain.handle('db:remove-movie', async (_, movieId) => {
  return removeMovie(movieId);
});

ipcMain.handle('db:get-saved-movie', async (_, movieId) => {
  return getSavedMovie(movieId);
});

ipcMain.handle('db:get-favorites', async () => {
  return getSavedMoviesByType('favorite');
});

ipcMain.handle('db:get-watchlist', async () => {
  return getSavedMoviesByType('watchlist');
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