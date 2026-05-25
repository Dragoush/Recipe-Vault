import { NavLink, Outlet } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import useAuth from '../features/auth/useAuth';

const TOPBAR_COPY = {
  navigationLabel: 'Main navigation',
  home: 'Home',
  recipes: 'Recipes',
  statistics: 'Statistics',
  addRecipe: 'Add Recipe',
  login: 'Login',
  register: 'Register',
  logout: 'Logout',
  restoringSession: 'Restoring session...'
};

const navLinkClass = ({ isActive }) =>
  isActive ? 'topbar-link topbar-link-active' : 'topbar-link';

export default function AppLayout() {
  const auth = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-content">
          <NavLink className="brand-link" to="/">
            <AppLogo />
          </NavLink>

          <nav className="topbar-nav" aria-label={TOPBAR_COPY.navigationLabel}>
            <NavLink className={navLinkClass} to="/">
              {TOPBAR_COPY.home}
            </NavLink>
            {auth.isAuthenticated ? (
              <>
                <NavLink className={navLinkClass} end to="/recipes">
                  {TOPBAR_COPY.recipes}
                </NavLink>
                <NavLink className={navLinkClass} to="/recipes/statistics">
                  {TOPBAR_COPY.statistics}
                </NavLink>
                <NavLink className={navLinkClass} to="/recipes/new">
                  {TOPBAR_COPY.addRecipe}
                </NavLink>
              </>
            ) : null}
            {!auth.isBootstrapping && !auth.isAuthenticated ? (
              <>
                <NavLink className={navLinkClass} to="/login">
                  {TOPBAR_COPY.login}
                </NavLink>
                <NavLink className={navLinkClass} to="/register">
                  {TOPBAR_COPY.register}
                </NavLink>
              </>
            ) : null}
          </nav>

          {auth.isAuthenticated || auth.isBootstrapping ? (
            <div className="topbar-session">
              {auth.isAuthenticated ? (
                <>
                  <span className="session-pill">{auth.user.username}</span>
                  <button
                    className="button button-secondary topbar-session-action"
                    onClick={auth.logout}
                    type="button"
                  >
                    {TOPBAR_COPY.logout}
                  </button>
                </>
              ) : auth.isBootstrapping ? (
                <span className="session-copy">{TOPBAR_COPY.restoringSession}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
