import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const actions = [
  { label: 'Add Patient', icon: '+', path: '/app/patients', roles: ['admin', 'receptionist'] },
  { label: 'Add Doctor', icon: '✚', path: '/app/doctors', roles: ['admin'] },
  { label: 'Create Appointment', icon: '◷', path: '/app/appointments', roles: ['admin', 'doctor', 'receptionist'] },
  { label: 'Create Invoice', icon: '◈', path: '/app/billing', roles: ['admin', 'receptionist'] },
];

function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visibleActions = actions.filter((action) => action.roles.includes(user?.role));
  return (
    <section className="content-card quick-actions" aria-labelledby="quick-actions-title">
      <div className="section-heading">
        <div>
          <p className="section-label">Common tasks</p>
          <h2 id="quick-actions-title">Quick Actions</h2>
        </div>
      </div>
      <div className="action-grid">
        {visibleActions.map((action) => (
          <button className="action-button" type="button" key={action.label} onClick={() => navigate(action.path)} aria-label={action.label}>
            <span aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;
