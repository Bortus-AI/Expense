import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [llmModel, setLlmModel] = useState('');
  const [llmConnected, setLlmConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      setSettings(response.data.settings);
      
      // Load LLM model setting
      const llmResponse = await settingsAPI.getLLMModel();
      setLlmModel(llmResponse.data.model);
      
      // Test connection
      await testLLMConnection();
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const testLLMConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await settingsAPI.testLLMConnection();
      setLlmConnected(response.data.connected);
      
      if (response.data.connected) {
        toast.success('LLM connection successful');
      } else {
        toast.error('LLM connection failed');
      }
    } catch (error) {
      console.error('Error testing LLM connection:', error);
      setLlmConnected(false);
      toast.error('Failed to test LLM connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const updateLLMModel = async () => {
    try {
      setSaving(true);
      await settingsAPI.setLLMModel(llmModel);
      toast.success('LLM model updated successfully');
      await testLLMConnection();
    } catch (error) {
      console.error('Error updating LLM model:', error);
      toast.error('Failed to update LLM model');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key, value, description) => {
    try {
      setSaving(true);
      await settingsAPI.updateSetting(key, value, description);
      toast.success('Setting updated successfully');
      await loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading settings...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.currentRole !== 'admin') {
    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              <h4>Access Denied</h4>
              <p>You need admin privileges to access the settings page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3>System Settings</h3>
              <p className="text-muted mb-0">Manage system configuration and AI settings</p>
            </div>
            <div className="card-body">
              
              {/* LLM Model Configuration */}
              <div className="mb-4">
                <h4>🤖 LLM Model Configuration</h4>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="llmModel" className="form-label">LLM Model</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="llmModel"
                          value={llmModel}
                          onChange={(e) => setLlmModel(e.target.value)}
                          placeholder="e.g., llama3.1:8b, llama3.2:3b"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={updateLLMModel}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      <small className="form-text text-muted">
                        The LLM model used for AI features like OCR processing and categorization
                      </small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Connection Status</label>
                      <div className="d-flex align-items-center">
                        <div className={`badge ${llmConnected ? 'bg-success' : 'bg-danger'} me-2`}>
                          {llmConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={testLLMConnection}
                          disabled={testingConnection}
                        >
                          {testingConnection ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <small className="form-text text-muted">
                        Test the connection to your Ollama server
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* All Settings */}
              <div className="mb-4">
                <h4>⚙️ All Settings</h4>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Setting</th>
                        <th>Value</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(settings).map(([key, setting]) => (
                        <tr key={key}>
                          <td>
                            <code>{key}</code>
                            {setting.isAdminOnly && (
                              <span className="badge bg-warning ms-2">Admin Only</span>
                            )}
                          </td>
                          <td>
                            <code>{String(setting.value)}</code>
                          </td>
                          <td>
                            <span className="badge bg-info">{setting.type}</span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {setting.description || 'No description'}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                // For now, just show the current value
                                toast.info(`Current value: ${setting.value}`);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Help Section */}
              <div className="alert alert-info">
                <h5>💡 Help</h5>
                <ul className="mb-0">
                  <li><strong>LLM Model:</strong> Set the Ollama model to use for AI features. Common models include <code>llama3.1:8b</code>, <code>llama3.2:3b</code>, <code>llama3.2:8b</code>, etc.</li>
                  <li><strong>Connection Test:</strong> Verify that your Ollama server is running and accessible.</li>
                  <li><strong>Settings:</strong> All system settings are stored per company and can be overridden by company-specific settings.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 