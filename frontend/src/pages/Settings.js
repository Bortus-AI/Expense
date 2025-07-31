import React, { useState, useEffect, useCallback } from 'react';
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

  const loadSettings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  // const updateSetting = async (key, value, description) => {
  //   try {
  //     setSaving(true);
  //     await settingsAPI.updateSetting(key, value, description);
  //     toast.success('Setting updated successfully');
  //     await loadSettings();
  //   } catch (error) {
  //     console.error('Error updating setting:', error);
  //     toast.error('Failed to update setting');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

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

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3>Settings</h3>
            </div>
            <div className="card-body">
              {/* LLM Configuration */}
              <div className="mb-4">
                <h5>LLM Configuration</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="llmModel" className="form-label">LLM Model</label>
                      <select
                        id="llmModel"
                        className="form-select"
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                      >
                        <option value="">Select Model</option>
                        <option value="llama3.1:8b">Llama 3.1 8B</option>
                        <option value="llama3.2:3b">Llama 3.2 3B</option>
                        <option value="llama3.1:70b">Llama 3.1 70B</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Connection Status</label>
                      <div>
                        <span className={`badge ${llmConnected ? 'bg-success' : 'bg-danger'}`}>
                          {llmConnected ? 'Connected' : 'Disconnected'}
                        </span>
                        <button
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={testLLMConnection}
                          disabled={testingConnection}
                        >
                          {testingConnection ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={updateLLMModel}
                  disabled={saving || !llmModel}
                >
                  {saving ? 'Saving...' : 'Update Model'}
                </button>
              </div>

              {/* General Settings */}
              <div className="mb-4">
                <h5>General Settings</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Auto Match Threshold</label>
                      <input
                        type="number"
                        className="form-control"
                        value={settings.autoMatchThreshold || 70}
                        readOnly
                      />
                      <small className="text-muted">Percentage threshold for automatic matching</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Max File Size</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.maxFileSize || '50MB'}
                        readOnly
                      />
                      <small className="text-muted">Maximum file size for uploads</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Features */}
              <div className="mb-4">
                <h5>AI Features</h5>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="aiEnabled"
                        checked={settings.aiEnabled !== false}
                        readOnly
                      />
                      <label className="form-check-label" htmlFor="aiEnabled">
                        AI Features Enabled
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="autoCategorization"
                        checked={settings.autoCategorization !== false}
                        readOnly
                      />
                      <label className="form-check-label" htmlFor="autoCategorization">
                        Auto Categorization
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="duplicateDetection"
                        checked={settings.duplicateDetection !== false}
                        readOnly
                      />
                      <label className="form-check-label" htmlFor="duplicateDetection">
                        Duplicate Detection
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="mb-4">
                <h5>System Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>User:</strong> {user?.email}</p>
                    <p><strong>Company:</strong> {user?.company_name || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
                    <p><strong>Version:</strong> 1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 