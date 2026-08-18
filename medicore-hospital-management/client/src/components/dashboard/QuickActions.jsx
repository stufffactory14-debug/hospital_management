import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'Add Patient', icon: '+', path: '/app/patients' },
  { label: 'Add Doctor', icon: '✚', path: '/app/doctors' },
  { label: 'Create Appointment', icon: '◷', path: '/app/appointments' },
  { label: 'Generate Bill', icon: '◈', comingSoon: true },
];

function QuickActions() {
  const navigate = useNavigate();
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
          <button className="action-button" type="button" key={action.label} onClick={() => action.path && navigate(action.path)} disabled={action.comingSoon} aria-label={action.comingSoon ? `${action.label}, coming soon` : action.label}>
            <span aria-hidden="true">{action.icon}</span>
            {action.label}
            {action.comingSoon && <em>Coming soon</em>}
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;
