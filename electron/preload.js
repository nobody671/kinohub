const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  appName: 'Кинохаб',

  saveFavorite: (movie) => ipcRenderer.invoke('db:save-favorite', movie),
  saveWatchlist: (movie) => ipcRenderer.invoke('db:save-watchlist', movie),
  removeMovie: (movieId) => ipcRenderer.invoke('db:remove-movie', movieId),
  getSavedMovie: (movieId) => ipcRenderer.invoke('db:get-saved-movie', movieId),
  getFavorites: () => ipcRenderer.invoke('db:get-favorites'),
  getWatchlist: () => ipcRenderer.invoke('db:get-watchlist'),
  getStats: () => ipcRenderer.invoke('db:get-stats'),
  exportDatabase: () => ipcRenderer.invoke('db:export-database'),
  importDatabase: () => ipcRenderer.invoke('db:import-database')
});