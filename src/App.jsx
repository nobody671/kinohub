import { Route, Routes } from 'react-router-dom';
import FavoritesPage from './pages/FavoritesPage';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import MoviePage from './pages/MoviePage';
import SeriesPage from './pages/SeriesPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import TvShowPage from './pages/TvShowPage';
import WatchlistPage from './pages/WatchlistPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:movieId" element={<MoviePage />} />
      <Route path="/series" element={<SeriesPage />} />
      <Route path="/tv/:tvId" element={<TvShowPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;