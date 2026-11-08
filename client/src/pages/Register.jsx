import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
     navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">List pets, send adoption requests and chat with owners.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <label>Full name<input className="field" required autoComplete="name" value={form.name} onChange={set('name')} /></label>
        <label>Email<input className="field" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
        <label>Password<input className="field" type="password" minLength={6} required autoComplete="new-password" value={form.password} onChange={set('password')} /></label>
        <div className="form-grid">
          <label>City<input className="field" value={form.city} onChange={set('city')} /></label>
          <label>Phone (optional)<input className="field" value={form.phone} onChange={set('phone')} /></label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="muted small center">Already registered? <Link to="/login" className="link">Log in</Link></p>
      </form>
    </div>
  );
}
