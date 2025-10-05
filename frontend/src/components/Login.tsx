import { useState } from 'react';
import { LogIn, Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // For phone number, only keep digits (no formatting)
    if (name === 'phoneNumber') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);

      setFormData(prev => ({
        ...prev,
        [name]: limitedDigits
      }));
    }

    // Clear error when user starts typing
    if (error) setError('');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      setIsLoading(false);
      return;
    }

    try {
      // Extract digits only for API call
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      await login({
        phoneNumber: phoneDigits
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Enter your phone number to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className="input-wrapper phone-input-wrapper">
              <Phone className="input-icon" size={20} />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="0776384481"
                required
                disabled={isLoading}
                autoFocus
                className="phone-input"
              />
            </div>
            <small className="input-hint">Enter your 10-digit phone number</small>
          </div>

          <button
            type="submit"
            className={`auth-submit ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>

          <div className="auth-switch">
            <span>Don't have an account?</span>
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
