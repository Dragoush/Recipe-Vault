export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </section>
  );
}
