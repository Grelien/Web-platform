import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import './Auth.css';

export function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-blur-overlay" />
      </div>
      
      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}
