import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/customers/login', {
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/home');
    } catch {
      setServerError('Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>
          ShopKart<span className="brand-dot ml-1"></span>
        </h1>
        <p className="auth-subtitle">Sign in to your customer account</p>

        {serverError && <p className="form-error">{serverError}</p>}

        <div className="auth-form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            disabled={loading}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="auth-form-group">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pwd-toggle-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <p className="auth-switch">
          New to ShopKart? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
