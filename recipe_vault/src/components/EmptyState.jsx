import { Link } from 'react-router-dom';

export default function EmptyState({
  title,
  description,
  actionLabel = 'Create item',
  actionTo = '/recipes/new'
}) {
  return (
    <section className="panel empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button" to={actionTo}>
        {actionLabel}
      </Link>
    </section>
  );
}
