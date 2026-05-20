import { NavLink, Outlet } from 'react-router-dom';
import AppLogo from '../components/AppLogo';

const navLinkClass = ({ isActive }) =>
  isActive ? 'topbar-link topbar-link-active' : 'topbar-link';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-content">
          <NavLink className="brand-link" to="/">
            <AppLogo />
          </NavLink>

          <nav className="topbar-nav" aria-label="Main navigation">
            <NavLink className={navLinkClass} to="/">
              Home
            </NavLink>
            <NavLink className={navLinkClass} end to="/recipes">
              Recipes
            </NavLink>
            <NavLink className={navLinkClass} to="/recipes/statistics">
              Statistics
            </NavLink>
            <NavLink className={navLinkClass} to="/recipes/new">
              Add Recipe
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
