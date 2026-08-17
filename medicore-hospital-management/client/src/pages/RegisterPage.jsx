import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || 'Unable to create your account. Check your connection and try again.';

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'receptionist' });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }

    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/app', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="register-title">
        <p className="eyebrow">MediCore</p>
        <h1 id="register-title">Create an account</h1>
        <p className="auth-intro">Register as a doctor or receptionist.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input id="name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />

          <label htmlFor="register-email">Email</label>
          <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />

          <label htmlFor="register-password">Password</label>
          <input id="register-password" type="password" minLength="8" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />

          <label htmlFor="role">Role</label>
          <select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
          </select>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
        </form>

        <p className="auth-link">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}

export default RegisterPage;
