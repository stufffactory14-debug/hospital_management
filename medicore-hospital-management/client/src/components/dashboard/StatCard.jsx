function StatCard({ label, value, trend, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`} aria-hidden="true">{tone === 'teal' ? '◉' : tone === 'blue' ? '✚' : tone === 'violet' ? '◷' : '◌'}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{trend}</small>
      </div>
    </article>
  );
}

export default StatCard;
