import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

function ProtectedPlaceholderPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="auth-layout">
      <section className="auth-card workspace-card" aria-labelledby="workspace-title">
        <p className="eyebrow">Authenticated workspace</p>
        <h1 id="workspace-title">MediCore Hospital Management System</h1>
        <p className="auth-intro">Signed in as {user.name} ({user.role}).</p>
        <p className="placeholder-copy">Clinical and operational modules will be added here in later phases.</p>
        <button type="button" onClick={handleLogout}>Log out</button>
      </section>
    </main>
  );
}

export default ProtectedPlaceholderPage;
