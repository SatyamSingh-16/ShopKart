import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer, errorMessage } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      setError('All fields are required.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerCustomer({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(errorMessage(err, 'Failed to create account. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/register">
            <span className="brand-mark">S</span> ShopKart<span className="brand-dot">.</span>
          </Link>
          <h2>Create an account</h2>
          <p className="auth-subtitle">Join ShopKart for a seamless shopping experience</p>
        </div>

        {error && (
          <div className="inline-error mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-label">
            <span>Full Name</span>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Satyam Singh"
              required
              disabled={loading}
            />
          </label>

          <label className="auth-label">
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="satyam@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          <label className="auth-label">
            <span>Phone Number</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              autoComplete="tel"
              required
              disabled={loading}
            />
          </label>

          <label className="auth-label">
            <span>Password (min 6 characters)</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </p>

        <div className="developer-tag">
          ShopKart · Developed by <strong>Satyam Singh</strong>
        </div>
      </div>
    </div>
  );
}
