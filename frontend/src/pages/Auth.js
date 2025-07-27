import React, { useState, useEffect } from 'react';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-content">
          <div className="auth-brand">
            <h1>💳 Expense Receipt Matcher</h1>
            <p>Smart receipt matching for modern businesses</p>
            <div className="auth-features">
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <span>OCR Recognition</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🤖</span>
                <span>AI Matching</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🏢</span>
                <span>Multi-Company</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>Export Reports</span>
              </div>
            </div>
          </div>
          
          <div className="auth-forms-wrapper">
            {isLogin ? (
              <Login onToggleForm={toggleForm} />
            ) : (
              <Register onToggleForm={toggleForm} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 