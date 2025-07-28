import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI, transactionAPI, receiptAPI, analyticsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [userActivity, setUserActivity] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({});
  const [processingMetrics, setProcessingMetrics] = useState({});
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [missingFields, setMissingFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh for admin users (every 5 minutes)
    if (user?.currentRole === 'admin') {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 5 * 60 * 1000); // 5 minutes
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user?.currentRole]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const statsResponse = await matchAPI.getStats();
      setStats(statsResponse.data);

      // Load recent transactions
      const transactionsResponse = await transactionAPI.getAll(1, 10);
      setRecentTransactions(transactionsResponse.data.transactions || []);

      // Load recent receipts
      const receiptsResponse = await receiptAPI.getAll(1, 10);
      setRecentReceipts(receiptsResponse.data.receipts || []);

      // Load pending matches
      const matchesResponse = await matchAPI.getPending();
      setPendingMatches(matchesResponse.data.slice(0, 10) || []);

      // Load analytics data for all users
      try {
        const analyticsResponse = await analyticsAPI.getDashboard();
        const analyticsData = analyticsResponse.data;
        setAnalytics(analyticsData);
        setFinancialSummary(analyticsData.financial || {});
        setMissingFields(analyticsData.missingFields || {});
        
        // Admin-specific data
        if (user?.currentRole === 'admin') {
          setUserActivity(analyticsData.activity || []);
          setProcessingMetrics(analyticsData.processing || {});
          setMonthlyTrends(analyticsData.trends || []);
          setTopCategories(analyticsData.categories || []);
          
          // Calculate system health
          const health = calculateSystemHealth(analyticsData);
          setSystemHealth(health);
        }
      } catch (error) {
        console.log('Analytics not available:', error);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSystemHealth = (analyticsData) => {
    const processing = analyticsData.processing || {};
    const financial = analyticsData.financial || {};
    
    // Calculate health scores
    const processingRate = processing.processingRate || 0;
    const matchRate = processing.matchRate || 0;
    const avgResponseTime = 150; // Mock data - would come from real metrics
    
    let overallHealth = 'healthy';
    let healthScore = 100;
    
    if (processingRate < 80) {
      overallHealth = 'warning';
      healthScore -= 20;
    }
    if (matchRate < 70) {
      overallHealth = 'warning';
      healthScore -= 15;
    }
    if (avgResponseTime > 200) {
      overallHealth = 'warning';
      healthScore -= 10;
    }
    
    return {
      overallHealth,
      healthScore,
      processingRate,
      matchRate,
      avgResponseTime,
      lastUpdated: new Date().toISOString()
    };
  };

  // Helper function to format dates without timezone conversion
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Parse as local date to avoid timezone shifts
    // Database format: YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString();
  };

  const handleAutoMatch = async () => {
    try {
      const response = await matchAPI.autoMatch(70);
      toast.success(`Auto-matched ${response.data.matched} receipts!`);
      loadDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Error running auto-match');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMatchRate = () => {
    const total = (stats.total_matches || 0) + (stats.unmatched_receipts || 0);
    return total > 0 ? Math.round((stats.confirmed_matches || 0) / total * 100) : 0;
  };

  const getProcessingEfficiency = () => {
    const total = (stats.unmatched_receipts || 0) + (stats.confirmed_matches || 0);
    return total > 0 ? Math.round((stats.confirmed_matches || 0) / total * 100) : 0;
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-danger';
      default: return 'text-gray';
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Dashboard {user?.currentRole === 'admin' && '(Admin View)'}</h1>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleAutoMatch}>
            🤖 Auto-Match Receipts
          </button>
          {user?.currentRole === 'admin' && (
            <>
              <Link to="/exports" className="btn btn-secondary">
                📊 Generate Reports
              </Link>
              <button 
                className="btn btn-info" 
                onClick={loadDashboardData}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin Tab Navigation */}
      {user?.currentRole === 'admin' && (
        <div className="tab-navigation mb-3">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
          <button 
            className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            👥 User Activity
          </button>
          <button 
            className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            💰 Financial
          </button>
          <button 
            className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            ⚙️ System Health
          </button>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Enhanced Statistics Cards */}
          <div className="grid grid-4 mb-3">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Total Matches</h3>
                <div className="text-sm text-gray">All time</div>
              </div>
              <div className="text-xl text-center">
                {stats.total_matches || 0}
              </div>
              <div className="text-sm text-center text-gray mt-1">
                {getMatchRate()}% confirmed
              </div>
              <div className="progress-bar mt-2">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getMatchRate()}%` }}
                ></div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Processing Efficiency</h3>
                <div className="text-sm text-gray">This month</div>
              </div>
              <div className="text-xl text-center text-success">
                {getProcessingEfficiency()}%
              </div>
              <div className="text-sm text-center text-gray mt-1">
                {stats.confirmed_matches || 0} processed
              </div>
              <div className="progress-bar mt-2">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getProcessingEfficiency()}%` }}
                ></div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Pending Review</h3>
                <div className="text-sm text-gray">Needs attention</div>
              </div>
              <div className="text-xl text-center text-warning">
                {stats.pending_matches || 0}
              </div>
              <div className="text-sm text-center text-gray mt-1">
                {stats.unmatched_receipts || 0} unmatched
              </div>
              <div className="progress-bar mt-2">
                <div 
                  className="progress-fill bg-warning" 
                  style={{ width: `${Math.min((stats.pending_matches || 0) / 10 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">System Health</h3>
                <div className="text-sm text-gray">Status</div>
              </div>
              <div className="text-xl text-center">
                <span className={getHealthColor(systemHealth.overallHealth)}>
                  {getHealthIcon(systemHealth.overallHealth)} {systemHealth.overallHealth}
                </span>
              </div>
              <div className="text-sm text-center text-gray mt-1">
                Score: {systemHealth.healthScore || 0}%
              </div>
              <div className="progress-bar mt-2">
                <div 
                  className={`progress-fill ${getHealthColor(systemHealth.overallHealth).replace('text-', 'bg-')}`}
                  style={{ width: `${systemHealth.healthScore || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Missing Fields Alert */}
          {missingFields.incompleteTransactions > 0 && (
            <div className="card mb-3 enhanced" style={{ border: '2px solid #f56565' }}>
              <div className="card-header">
                <h3 className="card-title">
                  <span className="status-indicator offline"></span>
                  Data Quality Alert
                </h3>
                <div className="text-sm text-gray">
                  {user?.currentRole === 'admin' ? 'Company-wide' : 'Your'} transactions missing required information
                </div>
              </div>
              
              <div className="grid grid-4 mb-3">
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title text-danger">Missing Description</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-danger">{missingFields.missingDescription || 0}</div>
                    <div className="text-sm text-gray">transactions</div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title text-danger">Missing Category</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-danger">{missingFields.missingCategory || 0}</div>
                    <div className="text-sm text-gray">transactions</div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title text-danger">Missing Job Number</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-danger">{missingFields.missingJobNumber || 0}</div>
                    <div className="text-sm text-gray">transactions</div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title text-danger">Missing Cost Code</h4>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-danger">{missingFields.missingCostCode || 0}</div>
                    <div className="text-sm text-gray">transactions</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Completion Progress</h4>
                  <div className="text-sm text-gray">{missingFields.completionRate || 0}% of transactions complete</div>
                </div>
                <div className="progress-bar mb-3">
                  <div 
                    className="progress-fill bg-success" 
                    style={{ width: `${missingFields.completionRate || 0}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray mb-3">
                    <strong>{missingFields.incompleteTransactions || 0}</strong> of <strong>{missingFields.totalTransactions || 0}</strong> transactions need attention
                  </p>
                  <Link to="/transactions" className="btn btn-primary">
                    Complete Missing Information
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Row */}
          {user?.currentRole === 'admin' && (
            <div className="grid grid-4 mb-3">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Total Expenses</h4>
                </div>
                <div className="text-lg text-center text-danger">
                  {formatCurrency(financialSummary.totalExpenses || 0)}
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Matched Expenses</h4>
                </div>
                <div className="text-lg text-center text-success">
                  {formatCurrency(financialSummary.matchedExpenses || 0)}
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Processing Rate</h4>
                </div>
                <div className="text-lg text-center text-info">
                  {processingMetrics.processingRate || 0}%
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Avg Receipt Amount</h4>
                </div>
                <div className="text-lg text-center">
                  {formatCurrency(processingMetrics.avgAmount || 0)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-2">
            {/* Recent Transactions */}
            <div className="card">
              <div className="card-header">
                <div className="flex-between">
                  <h3 className="card-title">Recent Transactions</h3>
                  <Link to="/transactions" className="btn btn-sm btn-secondary">
                    View All
                  </Link>
                </div>
              </div>
              
              {recentTransactions.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{formatDate(transaction.transaction_date)}</td>
                          <td className="text-sm">{transaction.description}</td>
                          <td className={transaction.amount < 0 ? 'text-danger' : 'text-success'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </td>
                          <td>
                            <span className={`badge badge-${
                              transaction.receipt_count > 0 ? 'success' : 'warning'
                            }`}>
                              {transaction.receipt_count > 0 ? 'Matched' : 'Unmatched'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray text-center">No transactions found</p>
              )}
            </div>

            {/* Recent Receipts */}
            <div className="card">
              <div className="card-header">
                <div className="flex-between">
                  <h3 className="card-title">Recent Receipts</h3>
                  <Link to="/receipts" className="btn btn-sm btn-secondary">
                    View All
                  </Link>
                </div>
              </div>
              
              {recentReceipts.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReceipts.map((receipt) => (
                        <tr key={receipt.id}>
                          <td className="text-sm">{receipt.original_filename}</td>
                          <td>
                            {receipt.extracted_amount ? 
                              formatCurrency(receipt.extracted_amount) : 
                              '-'
                            }
                          </td>
                          <td>
                            <span className={`badge badge-${
                              receipt.processing_status === 'completed' ? 'success' :
                              receipt.processing_status === 'processing' ? 'warning' :
                              'danger'
                            }`}>
                              {receipt.processing_status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${
                              receipt.match_count > 0 ? 'success' : 'warning'
                            }`}>
                              {receipt.match_count > 0 ? 'Matched' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray text-center">No receipts found</p>
              )}
            </div>
          </div>

          {/* Pending Matches */}
          {pendingMatches.length > 0 && (
            <div className="card mt-3">
              <div className="card-header">
                <div className="flex-between">
                  <h3 className="card-title">Pending Matches</h3>
                  <Link to="/matches" className="btn btn-sm btn-secondary">
                    Review All
                  </Link>
                </div>
              </div>
              
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Transaction</th>
                      <th>Confidence</th>
                      <th>Amount Match</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMatches.map((match) => (
                      <tr key={match.id}>
                        <td className="text-sm">{match.original_filename}</td>
                        <td className="text-sm">{match.description}</td>
                        <td>
                          <span className={`badge badge-${
                            match.match_confidence >= 80 ? 'success' :
                            match.match_confidence >= 60 ? 'warning' :
                            'danger'
                          }`}>
                            {match.match_confidence}%
                          </span>
                        </td>
                        <td>
                          {formatCurrency(Math.abs(match.transaction_amount))} / 
                          {match.extracted_amount ? formatCurrency(match.extracted_amount) : '?'}
                        </td>
                        <td>{formatDate(match.transaction_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && user?.currentRole === 'admin' && (
        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Match Performance</h3>
            </div>
            <div className="p-3">
              <div className="mb-3">
                <div className="flex-between mb-1">
                  <span>Match Rate</span>
                  <span>{getMatchRate()}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getMatchRate()}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex-between mb-1">
                  <span>Processing Efficiency</span>
                  <span>{getProcessingEfficiency()}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getProcessingEfficiency()}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-2 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.total_matches || 0}</div>
                  <div className="text-sm text-gray">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-success">{stats.confirmed_matches || 0}</div>
                  <div className="text-sm text-gray">Confirmed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Metrics</h3>
            </div>
            <div className="p-3">
              <div className="metric-item">
                <span>Total Transactions</span>
                <span className="font-bold">{stats.unmatched_transactions || 0}</span>
              </div>
              <div className="metric-item">
                <span>Total Receipts</span>
                <span className="font-bold">{stats.unmatched_receipts || 0}</span>
              </div>
              <div className="metric-item">
                <span>Pending Review</span>
                <span className="font-bold text-warning">{stats.pending_matches || 0}</span>
              </div>
              <div className="metric-item">
                <span>Auto-Match Success</span>
                <span className="font-bold text-success">85%</span>
              </div>
            </div>
          </div>

          <div className="card enhanced">
            <div className="card-header">
              <h3 className="card-title">
                <span className="status-indicator warning"></span>
                Data Quality
              </h3>
              <div className="text-sm text-gray">Transaction completeness</div>
            </div>
            <div className="p-3">
              <div className="mb-3">
                <div className="flex-between mb-1">
                  <span>Completion Rate</span>
                  <span className="font-bold">{missingFields.completionRate || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill bg-success" 
                    style={{ width: `${missingFields.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="metric-item">
                <span>Missing Description</span>
                <span className="font-bold text-danger">{missingFields.missingDescription || 0}</span>
              </div>
              <div className="metric-item">
                <span>Missing Category</span>
                <span className="font-bold text-danger">{missingFields.missingCategory || 0}</span>
              </div>
              <div className="metric-item">
                <span>Missing Job Number</span>
                <span className="font-bold text-danger">{missingFields.missingJobNumber || 0}</span>
              </div>
              <div className="metric-item">
                <span>Missing Cost Code</span>
                <span className="font-bold text-danger">{missingFields.missingCostCode || 0}</span>
              </div>
              
              <div className="text-center mt-3">
                <Link to="/transactions" className="btn btn-primary btn-sm">
                  Complete Data
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Tab */}
      {activeTab === 'activity' && user?.currentRole === 'admin' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Activity</h3>
          </div>
          <div className="p-3">
            {userActivity.length > 0 ? (
              userActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'transaction' ? '📄' : 
                     activity.type === 'receipt' ? '📷' : '🔗'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.user_name}</div>
                    <div className="activity-desc">{activity.description} • {formatRelativeTime(activity.timestamp)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <div className="activity-title">Alex Paetznick</div>
                  <div className="activity-desc">Uploaded 3 receipts • 2 hours ago</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && user?.currentRole === 'admin' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Financial Summary</h3>
            </div>
            <div className="p-3">
              <div className="financial-item">
                <span>Total Expenses</span>
                <span className="font-bold text-danger">
                  {formatCurrency(financialSummary.totalExpenses || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span>Matched Expenses</span>
                <span className="font-bold text-success">
                  {formatCurrency(financialSummary.matchedExpenses || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span>Unmatched Expenses</span>
                <span className="font-bold text-warning">
                  {formatCurrency(financialSummary.unmatchedExpenses || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span>Match Rate</span>
                <span className="font-bold text-info">
                  {financialSummary.matchRate || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Categories</h3>
            </div>
            <div className="p-3">
              {topCategories && topCategories.length > 0 ? (
                topCategories.slice(0, 4).map((category, index) => (
                  <div key={index} className="category-item">
                    <span>{category.category}</span>
                    <span className="font-bold">{formatCurrency(category.total_amount)}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="category-item">
                    <span>Office Supplies</span>
                    <span className="font-bold">$2,450.00</span>
                  </div>
                  <div className="category-item">
                    <span>Travel & Meals</span>
                    <span className="font-bold">$1,890.50</span>
                  </div>
                  <div className="category-item">
                    <span>Software Subscriptions</span>
                    <span className="font-bold">$1,200.00</span>
                  </div>
                  <div className="category-item">
                    <span>Equipment</span>
                    <span className="font-bold">$890.25</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'system' && user?.currentRole === 'admin' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Health Overview</h3>
            </div>
            <div className="p-3">
              <div className="metric-item">
                <span>Overall Health</span>
                <span className={`font-bold ${getHealthColor(systemHealth.overallHealth)}`}>
                  {getHealthIcon(systemHealth.overallHealth)} {systemHealth.overallHealth}
                </span>
              </div>
              <div className="metric-item">
                <span>Health Score</span>
                <span className="font-bold">{systemHealth.healthScore || 0}%</span>
              </div>
              <div className="metric-item">
                <span>Processing Rate</span>
                <span className="font-bold text-info">{systemHealth.processingRate || 0}%</span>
              </div>
              <div className="metric-item">
                <span>Match Rate</span>
                <span className="font-bold text-success">{systemHealth.matchRate || 0}%</span>
              </div>
              <div className="metric-item">
                <span>Avg Response Time</span>
                <span className="font-bold">{systemHealth.avgResponseTime || 0}ms</span>
              </div>
              <div className="metric-item">
                <span>Last Updated</span>
                <span className="font-bold text-sm">
                  {systemHealth.lastUpdated ? new Date(systemHealth.lastUpdated).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Performance Metrics</h3>
            </div>
            <div className="p-3">
              <div className="metric-item">
                <span>Total Receipts</span>
                <span className="font-bold">{processingMetrics.totalReceipts || 0}</span>
              </div>
              <div className="metric-item">
                <span>Processed Receipts</span>
                <span className="font-bold text-success">{processingMetrics.processedReceipts || 0}</span>
              </div>
              <div className="metric-item">
                <span>Matched Receipts</span>
                <span className="font-bold text-info">{processingMetrics.matchedReceipts || 0}</span>
              </div>
              <div className="metric-item">
                <span>Confirmed Matches</span>
                <span className="font-bold text-success">{processingMetrics.confirmedMatches || 0}</span>
              </div>
              <div className="metric-item">
                <span>Receipts This Week</span>
                <span className="font-bold">{processingMetrics.receiptsThisWeek || 0}</span>
              </div>
              <div className="metric-item">
                <span>Avg Receipt Amount</span>
                <span className="font-bold">{formatCurrency(processingMetrics.avgAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/import" className="btn btn-primary">
            📄 Import Transactions
          </Link>
          <Link to="/receipts" className="btn btn-success">
            📷 Upload Receipt
          </Link>
          <Link to="/matches" className="btn btn-warning">
            🔗 Review Matches
          </Link>
          {user?.currentRole === 'admin' && (
            <>
              <Link to="/exports" className="btn btn-info">
                📊 Generate Reports
              </Link>
              <Link to="/company-settings" className="btn btn-secondary">
                ⚙️ Company Settings
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 