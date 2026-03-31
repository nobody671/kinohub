const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  appName: 'Кинохаб',
  getPopularMovies: () => ipcRenderer.invoke('tmdb:get-popular-movies')
});