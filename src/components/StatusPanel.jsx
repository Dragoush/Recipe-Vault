export default function StatusPanel({
  title,
  description,
  actionLabel,
  onAction,
  tone = 'default'
}) {
  const panelClassName =
    tone === 'error'
      ? 'panel empty-state status-panel status-panel-error'
      : 'panel empty-state status-panel';

  return (
    <section className={panelClassName} role={tone === 'error' ? 'alert' : undefined}>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <div className="status-panel-actions">
          <button className="button button-secondary" onClick={onAction} type="button">
            {actionLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
