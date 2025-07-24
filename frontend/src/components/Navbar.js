import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const location = useLocation();
  const { user, currentCompany, companies, logout, switchCompany } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const handleCompanySwitch = (company) => {
    switchCompany(company);
    setShowCompanySelector(false);
    toast.success(`Switched to ${company.name}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          💳 Expense Receipt Matcher
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/transactions" className={`nav-link ${isActive('/transactions')}`}>
              Transactions
            </Link>
          </li>
          <li>
            <Link to="/receipts" className={`nav-link ${isActive('/receipts')}`}>
              Receipts
            </Link>
          </li>
          <li>
            <Link to="/matches" className={`nav-link ${isActive('/matches')}`}>
              Matches
            </Link>
          </li>
          <li>
            <Link to="/import" className={`nav-link ${isActive('/import')}`}>
              Import
            </Link>
          </li>
          <li>
            <Link to="/exports" className={`nav-link ${isActive('/exports')}`}>
              Export
            </Link>
          </li>
        </ul>

        <div className="navbar-user">
          {/* Company Selector */}
          {companies && companies.length > 1 && (
            <div className="company-selector">
              <button 
                className="company-button"
                onClick={() => setShowCompanySelector(!showCompanySelector)}
              >
                🏢 {currentCompany?.name || 'Select Company'}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showCompanySelector && (
                <div className="company-dropdown">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      className={`company-option ${currentCompany?.id === company.id ? 'active' : ''}`}
                      onClick={() => handleCompanySwitch(company)}
                    >
                      <span className="company-name">{company.name}</span>
                      <span className="company-role">{company.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="user-menu">
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
                    <span className="current-company">
                      {currentCompany.name} • {currentCompany.role}
                    </span>
                  )}
                </div>
                <div className="user-actions">
                  <button className="dropdown-item">
                    👤 Profile Settings
                  </button>
                  <button className="dropdown-item">
                    🏢 Company Settings
                  </button>
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