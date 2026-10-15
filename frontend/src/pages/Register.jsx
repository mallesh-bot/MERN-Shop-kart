import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
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

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
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
      await api.post('/customers/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });
      navigate('/login');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(message);
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
        <p className="auth-subtitle">Create your new customer account</p>

        {serverError && <p className="form-error">{serverError}</p>}

        <div className="auth-form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Alex Morgan"
            disabled={loading}
          />
          {errors.fullName && <p className="field-error">{errors.fullName}</p>}
        </div>

        <div className="auth-form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="alex@example.com"
            disabled={loading}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="auth-form-group">
          <label htmlFor="password">Password (min 6 characters)</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
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

        <div className="auth-form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            disabled={loading}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in here</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
