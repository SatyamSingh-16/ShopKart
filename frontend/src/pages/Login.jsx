import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginCustomer, errorMessage } from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/home';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await loginCustomer({
        email: form.email.trim(),
        password: form.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Failed to sign in. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/login">
            <span className="brand-mark">S</span> ShopKart<span className="brand-dot">.</span>
          </Link>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        {location.state?.registered && (
          <div className="inline-success mb-4" role="status">
            Registration successful! Please sign in with your credentials.
          </div>
        )}

        {error && (
          <div className="inline-error mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-label">
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          <label className="auth-label">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </p>

        <div className="developer-tag">
          ShopKart · Developed by <strong>Satyam Singh</strong>
        </div>
      </div>
    </div>
  );
}
