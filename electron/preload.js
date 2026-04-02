const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  appName: 'Кинохаб',

  saveFavorite: (movie) => ipcRenderer.invoke('db:save-favorite', movie),
  saveWatchlist: (movie) => ipcRenderer.invoke('db:save-watchlist', movie),
  saveMovieStatus: (movie, type) => ipcRenderer.invoke('db:save-movie-status', movie, type),
  saveMediaStatus: (item, type, mediaType) =>
    ipcRenderer.invoke('db:save-media-status', item, type, mediaType),

  saveUserRating: (movieId, rating) => ipcRenderer.invoke('db:save-user-rating', movieId, rating),
  saveUserRatingForMedia: (itemId, rating, mediaType) =>
    ipcRenderer.invoke('db:save-user-rating-for-media', itemId, rating, mediaType),

  saveUserNote: (movieId, note) => ipcRenderer.invoke('db:save-user-note', movieId, note),
  saveUserNoteForMedia: (itemId, note, mediaType) =>
    ipcRenderer.invoke('db:save-user-note-for-media', itemId, note, mediaType),

  removeMovie: (movieId) => ipcRenderer.invoke('db:remove-movie', movieId),
  removeSavedItem: (itemId, mediaType) =>
    ipcRenderer.invoke('db:remove-saved-item', itemId, mediaType),

  getSavedMovie: (movieId) => ipcRenderer.invoke('db:get-saved-movie', movieId),
  getSavedItem: (itemId, mediaType) =>
    ipcRenderer.invoke('db:get-saved-item', itemId, mediaType),

  getFavorites: () => ipcRenderer.invoke('db:get-favorites'),
  getWatchlist: () => ipcRenderer.invoke('db:get-watchlist'),
  getSavedMoviesByType: (type, mediaType) =>
    ipcRenderer.invoke('db:get-saved-movies-by-type', type, mediaType),

  getSavedTypes: () => ipcRenderer.invoke('db:get-saved-types'),
  getStats: () => ipcRenderer.invoke('db:get-stats'),
  exportDatabase: () => ipcRenderer.invoke('db:export-database'),
  importDatabase: () => ipcRenderer.invoke('db:import-database')
});