import { useState } from 'react';
import { UserPlus, User, Mail, Lock, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';
import type { RegisterData } from '../types';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateStep1 = (): boolean => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter both first and last name');
      return false;
    }
    if (formData.firstName.length < 2 || formData.lastName.length < 2) {
      setError('Names must be at least 2 characters long');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.email) {
      setError('Please enter your email address');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Please enter a password (minimum 6 characters)');
      return false;
    }
    if (!formData.phoneNumber) {
      setError('Please enter your phone number');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      nextStep();
      return;
    }

    if (!validateStep2()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={32} />
          </div>
          <h1>Create Account</h1>
          <p>{step === 1 ? 'Enter your name to get started' : 'Complete your profile'}</p>
          
          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step ${step === 1 ? 'active' : 'complete'}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>2</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Name information */
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <div className="input-wrapper phone-input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                    disabled={isLoading}
                    autoFocus
                    className="phone-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <div className="input-wrapper phone-input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                    className="phone-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Contact & Security information */
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper phone-input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@example.com"
                    required
                    disabled={isLoading}
                    className="phone-input"
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper phone-input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    required
                    disabled={isLoading}
                    className="phone-input"
                  />
                </div>
                <small className="input-hint">Must be at least 6 characters</small>
              </div>

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
                    className="phone-input"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-buttons">
            {step === 2 && (
              <button
                type="button"
                className="auth-back-button"
                onClick={prevStep}
                disabled={isLoading}
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}
            
            <button
              type="submit"
              className={`auth-submit ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  {step === 1 ? (
                    <>
                      Next
                      <ArrowRight size={20} />
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Create Account
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="auth-switch">
            <span>Already have an account?</span>
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
