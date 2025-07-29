import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, companies, logout, switchCompany } = useAuth();
  const location = useLocation();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const companyMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const handleCompanySwitch = (company) => {
    switchCompany(company);
    setShowCompanyMenu(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target)) {
        setShowCompanyMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentCompany = user?.currentCompany;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/dashboard">💳 Expense Matcher</Link>
        </div>
        
        <div className="navbar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/transactions" 
            className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
          >
            💳 Transactions
          </Link>
          <Link 
            to="/receipts" 
            className={`nav-link ${isActive('/receipts') ? 'active' : ''}`}
          >
            🧾 Receipts
          </Link>
          <Link 
            to="/matches" 
            className={`nav-link ${isActive('/matches') ? 'active' : ''}`}
          >
            🔗 Matches
          </Link>
          <Link 
            to="/import" 
            className={`nav-link ${isActive('/import') ? 'active' : ''}`}
          >
            📤 Import
          </Link>
          <Link 
            to="/exports" 
            className={`nav-link ${isActive('/exports') ? 'active' : ''}`}
          >
            📋 Export
          </Link>
          <Link 
            to="/ai-dashboard" 
            className={`nav-link ${isActive('/ai-dashboard') ? 'active' : ''}`}
          >
            🤖 AI Dashboard
          </Link>
          <Link 
            to="/llm-test" 
            className={`nav-link ${isActive('/llm-test') ? 'active' : ''}`}
          >
            🧪 LLM Test
          </Link>
        </div>

        <div className="navbar-user">
          {/* Company Selector */}
          {companies && companies.length > 1 && (
            <div className="company-selector" ref={companyMenuRef}>
              <button 
                className="company-button"
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              >
                🏢 {currentCompany?.name || 'Select Company'}
              </button>
              {showCompanyMenu && (
                <div className="company-dropdown">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      className={`company-option ${currentCompany?.id === company.id ? 'active' : ''}`}
                      onClick={() => handleCompanySwitch(company)}
                    >
                      <div className="company-name">{company.name}</div>
                      <div className="company-role">{company.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="user-menu" ref={userMenuRef}>
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <strong>{user?.firstName} {user?.lastName}</strong>
                  <span>{user?.email}</span>
                  {currentCompany && (
                    <div className="role-info">
                      <span className="current-company">
                        {currentCompany.name} • {currentCompany.role}
                      </span>
                      <span className="data-scope text-sm">
                        {currentCompany.role === 'admin' 
                          ? '👑 Viewing all company data' 
                          : '👤 Viewing your personal data'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="user-actions">
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 Profile Settings
                  </Link>
                  {user?.currentRole === 'admin' && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/company-settings">
                          🏢 Company Settings
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/master-data-settings">
                          📊 Master Data
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/settings">
                          ⚙️ Settings
                        </Link>
                      </li>
                    </>
                  )}
                  <hr />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 