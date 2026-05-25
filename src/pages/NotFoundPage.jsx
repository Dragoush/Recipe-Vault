import { Link } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

export default function NotFoundPage() {
  const auth = useAuth();
  const returnPath = auth.isAuthenticated ? '/recipes' : '/';
  const returnLabel = auth.isAuthenticated ? 'Go back to recipes' : 'Go back home';

  return (
    <section className="panel empty-state">
      <p className="eyebrow">Missing route</p>
      <h1>That page does not exist.</h1>
      <p>
        The link may be outdated, or the recipe you were trying to access may
        have been removed from the collection.
      </p>
      <Link className="button" to={returnPath}>
        {returnLabel}
      </Link>
    </section>
  );
}
