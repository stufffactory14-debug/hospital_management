import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || 'Unable to sign in. Check your connection and try again.';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="auth-layout login-auth-layout">
      <section className="auth-brand-panel" aria-label="MediCore product information">
        <div className="auth-brand-mark" aria-hidden="true">+</div>
        <p className="auth-brand-name">MediCore</p>
        <h1>Hospital operations,<br />in one place.</h1>
        <p>Coordinate patient flow, appointments, and clinical workflows from one focused workspace.</p>
        <div className="auth-capabilities"><span>Patient flow</span><span>Appointment coordination</span><span>Clinical workflows</span></div>
      </section>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-card-heading"><p className="eyebrow">MediCore workspace</p><h2 id="login-title">Sign in to MediCore</h2><p className="auth-intro">Use your staff account to continue.</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@hospital.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div className="auth-field"><label htmlFor="password">Password</label><div className="auth-password-field"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
