import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="panel empty-state">
      <p className="eyebrow">Missing route</p>
      <h1>That page does not exist.</h1>
      <p>
        The link may be outdated, or the recipe you were trying to access may
        have been removed from the collection.
      </p>
      <Link className="button" to="/recipes">
        Go back to recipes
      </Link>
    </section>
  );
}
