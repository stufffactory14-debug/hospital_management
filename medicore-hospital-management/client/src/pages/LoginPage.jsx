import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || 'Unable to sign in. Check your connection and try again.';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
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
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">MediCore</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="auth-intro">Sign in to access the MediCore workspace.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <p className="auth-link">Need an account? <Link to="/register">Register here</Link></p>
      </section>
    </main>
  );
}

export default LoginPage;
