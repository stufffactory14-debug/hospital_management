const actions = [
  { label: 'Add Patient', icon: '+' },
  { label: 'Add Doctor', icon: '✚' },
  { label: 'Create Appointment', icon: '◷' },
  { label: 'Generate Bill', icon: '◈' },
];

function QuickActions() {
  return (
    <section className="content-card quick-actions" aria-labelledby="quick-actions-title">
      <div className="section-heading">
        <div>
          <p className="section-label">Common tasks</p>
          <h2 id="quick-actions-title">Quick Actions</h2>
        </div>
      </div>
      <div className="action-grid">
        {actions.map((action) => (
          <button className="action-button" type="button" key={action.label}>
            <span aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;
