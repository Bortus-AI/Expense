import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';

const AIDashboard = () => {
  // const { user } = useAuth(); // Removed unused variable
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [recurringPatterns, setRecurringPatterns] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, duplicatesRes, patternsRes] = await Promise.all([
        aiAPI.getDashboardStats(),
        aiAPI.getDuplicateGroups(),
        aiAPI.getRecurringPatterns()
      ]);

      setStats(statsRes.data.dashboard);
      setDuplicateGroups(duplicatesRes.data.duplicateGroups || []);
      setRecurringPatterns(patternsRes.data.patterns || []);
    } catch (error) {
      console.error('Error loading AI dashboard data:', error);
      toast.error('Error loading AI dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const handleDuplicateGroupUpdate = async (groupId, status) => {
    try {
      await aiAPI.updateDuplicateGroup(groupId, status);
      toast.success('Duplicate group updated successfully');
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error updating duplicate group:', error);
      toast.error('Error updating duplicate group');
    }
  };

  const handleBatchProcessDuplicates = async () => {
    try {
      const response = await aiAPI.batchProcessDuplicates(100);
      toast.success(`Batch processing completed: ${response.data.results.processed} processed, ${response.data.results.duplicatesFound} duplicates found`);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast.error('Error in batch processing');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading AI Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="ai-dashboard">
      <div className="page-header">
        <h1>AI/ML Dashboard</h1>
        <p>Advanced analytics and machine learning insights</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>

        <button 
          className={`tab-button ${activeTab === 'duplicates' ? 'active' : ''}`}
          onClick={() => setActiveTab('duplicates')}
        >
          Duplicate Detection
        </button>
        <button 
          className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Recurring Patterns
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Categorization</h3>
              <div className="stat-content">
                <div className="stat-number">{stats?.categorization?.total_predictions || 0}</div>
                <div className="stat-label">Total Predictions</div>
                <div className="stat-detail">
                  Accuracy: {((stats?.categorization?.accuracy || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>



            <div className="stat-card">
              <h3>Duplicate Detection</h3>
              <div className="stat-content">
                <div className="stat-number">{stats?.duplicates?.total_groups || 0}</div>
                <div className="stat-label">Duplicate Groups</div>
                <div className="stat-detail">
                  Prevented: {stats?.duplicates?.prevented_duplicates || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleBatchProcessDuplicates}
              >
                Batch Process Duplicates
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Duplicate Detection Tab */}
      {activeTab === 'duplicates' && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3>Duplicate Groups</h3>
              <p>Groups of similar transactions and receipts</p>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Group ID</th>
                    <th>Confidence</th>
                    <th>Count</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateGroups.map((group) => (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>
                        <span className={`badge ${group.confidence_score > 0.8 ? 'badge-danger' : group.confidence_score > 0.6 ? 'badge-warning' : 'badge-info'}`}>
                          {(group.confidence_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>{group.duplicate_count}</td>
                      <td>
                        <span className={`badge ${group.status === 'pending' ? 'badge-warning' : group.status === 'confirmed' ? 'badge-danger' : 'badge-success'}`}>
                          {group.status}
                        </span>
                      </td>
                      <td>
                        {group.status === 'pending' && (
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDuplicateGroupUpdate(group.id, 'confirmed')}
                            >
                              Confirm
                            </button>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleDuplicateGroupUpdate(group.id, 'dismissed')}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3>Recurring Patterns</h3>
              <p>Detected recurring transaction patterns</p>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pattern</th>
                    <th>Category</th>
                    <th>Frequency</th>
                    <th>Occurrences</th>
                    <th>Last Match</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringPatterns.map((pattern) => (
                    <tr key={pattern.id}>
                      <td>{pattern.description}</td>
                      <td>{pattern.category_name || 'N/A'}</td>
                      <td>{pattern.frequency}</td>
                      <td>{pattern.occurrence_count}</td>
                      <td>{pattern.last_match ? new Date(pattern.last_match).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDashboard;