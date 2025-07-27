import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, companyAPI } from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = ({ analyticsData, systemHealth, processingMetrics }) => {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    // Set up auto-refresh every 2 minutes for admin dashboard
    const interval = setInterval(() => {
      // Trigger refresh of parent component
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    }, 2 * 60 * 1000); // 2 minutes
    setRefreshInterval(interval);

    // Load company users for filtering
    loadCompanyUsers();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadCompanyUsers = async () => {
    try {
      const response = await companyAPI.getUsersForFilter();
      setCompanyUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading company users:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const getHealthStatus = (health) => {
    switch (health) {
      case 'healthy': return { icon: '🟢', color: 'text-success', label: 'Healthy' };
      case 'warning': return { icon: '🟡', color: 'text-warning', label: 'Warning' };
      case 'critical': return { icon: '🔴', color: 'text-danger', label: 'Critical' };
      default: return { icon: '⚪', color: 'text-gray', label: 'Unknown' };
    }
  };

  const getPerformanceScore = (metrics) => {
    if (!metrics) return 0;
    
    const processingRate = metrics.processingRate || 0;
    const matchRate = metrics.matchRate || 0;
    const successRate = metrics.successRate || 0;
    
    return Math.round((processingRate + matchRate + successRate) / 3);
  };

  const handleUserFilterChange = (userId) => {
    setSelectedUser(userId);
    // Trigger dashboard refresh with user filter
    window.dispatchEvent(new CustomEvent('refreshDashboard', { 
      detail: { userId: userId || null } 
    }));
  };

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="flex-between">
          <div>
            <h2>🔧 Admin Dashboard</h2>
            <p className="text-gray">System monitoring and analytics overview</p>
          </div>
          <div className="admin-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="auto-refresh-indicator">
              <span className="spinner"></span>
              Auto-refresh enabled
            </div>
          </div>
        </div>
      </div>

      {/* User Filter Section */}
      <div className="card enhanced mb-3">
        <div className="card-header">
          <h3 className="card-title">User Filter</h3>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>
        <div className="p-3">
          <div className="flex gap-2 flex-wrap">
            <select 
              value={selectedUser || ''} 
              onChange={(e) => handleUserFilterChange(e.target.value || null)}
              className="form-select"
            >
              <option value="">All Users</option>
              {companyUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.role})
                </option>
              ))}
            </select>
            
            {showAdvancedFilters && (
              <div className="advanced-filters">
                <div className="grid grid-3 gap-2">
                  <input 
                    type="date" 
                    placeholder="Start Date"
                    className="form-input"
                  />
                  <input 
                    type="date" 
                    placeholder="End Date"
                    className="form-input"
                  />
                  <select className="form-select">
                    <option value="">All Categories</option>
                    <option value="food">Food & Dining</option>
                    <option value="transportation">Transportation</option>
                    <option value="utilities">Utilities</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="stat-value text-danger">
            {formatCurrency(analyticsData?.financial?.totalExpenses || 0)}
          </div>
          <div className="stat-label">Total Expenses</div>
        </div>
        
        <div className="quick-stat-card">
          <div className="stat-value text-success">
            {formatPercentage(processingMetrics?.processingRate || 0)}
          </div>
          <div className="stat-label">Processing Rate</div>
        </div>
        
        <div className="quick-stat-card">
          <div className="stat-value text-info">
            {formatPercentage(processingMetrics?.matchRate || 0)}
          </div>
          <div className="stat-label">Match Rate</div>
        </div>
        
        <div className="quick-stat-card">
          <div className="stat-value">
            {processingMetrics?.totalReceipts || 0}
          </div>
          <div className="stat-label">Total Receipts</div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-2 mb-3">
        <div className="card enhanced">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
            <div className={`status-indicator ${systemHealth?.overallHealth || 'unknown'}`}>
              {getHealthStatus(systemHealth?.overallHealth).icon}
              {getHealthStatus(systemHealth?.overallHealth).label}
            </div>
          </div>
          <div className="p-3">
            <div className="metric-item">
              <span>Overall Score</span>
              <span className="font-bold">{systemHealth?.healthScore || 0}%</span>
            </div>
            <div className="metric-item">
              <span>Processing Rate</span>
              <span className="font-bold text-info">{processingMetrics?.processingRate || 0}%</span>
            </div>
            <div className="metric-item">
              <span>Match Rate</span>
              <span className="font-bold text-success">{processingMetrics?.matchRate || 0}%</span>
            </div>
            <div className="metric-item">
              <span>Success Rate</span>
              <span className="font-bold text-success">{processingMetrics?.successRate || 0}%</span>
            </div>
            <div className="metric-item">
              <span>Failed Processing</span>
              <span className="font-bold text-danger">{processingMetrics?.failedReceipts || 0}</span>
            </div>
            <div className="metric-item">
              <span>Currently Processing</span>
              <span className="font-bold text-warning">{processingMetrics?.processingReceipts || 0}</span>
            </div>
          </div>
        </div>

        <div className="card enhanced">
          <div className="card-header">
            <h3 className="card-title">Performance Metrics</h3>
          </div>
          <div className="p-3">
            <div className="metric-item">
              <span>Performance Score</span>
              <span className="font-bold">{getPerformanceScore(processingMetrics)}%</span>
            </div>
            <div className="metric-item">
              <span>Avg Receipt Amount</span>
              <span className="font-bold">{formatCurrency(processingMetrics?.avgAmount || 0)}</span>
            </div>
            <div className="metric-item">
              <span>Avg File Size</span>
              <span className="font-bold">{(processingMetrics?.avgFileSize || 0).toLocaleString()} bytes</span>
            </div>
            <div className="metric-item">
              <span>Receipts This Week</span>
              <span className="font-bold">{processingMetrics?.receiptsThisWeek || 0}</span>
            </div>
            <div className="metric-item">
              <span>Receipts This Month</span>
              <span className="font-bold">{processingMetrics?.receiptsThisMonth || 0}</span>
            </div>
            <div className="metric-item">
              <span>Last Updated</span>
              <span className="font-bold text-sm">
                {systemHealth?.lastUpdated ? new Date(systemHealth.lastUpdated).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card enhanced mb-3">
        <div className="card-header">
          <h3 className="card-title">Financial Summary</h3>
          <Link to="/exports" className="btn btn-sm btn-secondary">
            Export Report
          </Link>
        </div>
        <div className="p-3">
          <div className="grid grid-4">
            <div className="text-center">
              <div className="text-lg font-bold text-danger">
                {formatCurrency(analyticsData?.financial?.totalExpenses || 0)}
              </div>
              <div className="text-sm text-gray">Total Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {formatCurrency(analyticsData?.financial?.matchedExpenses || 0)}
              </div>
              <div className="text-sm text-gray">Matched Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {formatCurrency(analyticsData?.financial?.unmatchedExpenses || 0)}
              </div>
              <div className="text-sm text-gray">Unmatched Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-info">
                {formatPercentage(analyticsData?.financial?.matchRate || 0)}
              </div>
              <div className="text-sm text-gray">Match Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {analyticsData?.categories && analyticsData.categories.length > 0 && (
        <div className="card enhanced mb-3">
          <div className="card-header">
            <h3 className="card-title">Top Spending Categories</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-2">
              {analyticsData.categories.slice(0, 6).map((category, index) => (
                <div key={index} className="category-item">
                  <span>{category.category}</span>
                  <span className="font-bold">{formatCurrency(category.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card enhanced">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="p-3">
          <div className="flex gap-2 flex-wrap">
            <Link to="/exports" className="btn btn-primary">
              📊 Generate Reports
            </Link>
            <Link to="/company-settings" className="btn btn-secondary">
              ⚙️ Company Settings
            </Link>
            <Link to="/matches" className="btn btn-warning">
              🔗 Review Matches
            </Link>
            <Link to="/receipts" className="btn btn-success">
              📷 Manage Receipts
            </Link>
            <Link to="/transactions" className="btn btn-info">
              📄 View Transactions
            </Link>
            <button className="btn btn-danger">
              🚨 System Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 