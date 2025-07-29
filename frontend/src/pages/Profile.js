import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const Profile = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailVerified: false,
    lastLogin: '',
    memberSince: ''
  });

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      const userData = response.data.user;
      
      setProfileData(userData);
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/profile', {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim()
      });

      toast.success('Profile updated successfully');
      await loadProfile(); // Reload profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !profileData.email) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 Profile Settings</h1>
        <p>Manage your account information and security settings</p>
      </div>

      <div className="profile-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📋 Profile Information
          </button>
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            🔐 Change Password
          </button>
          <button 
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            ⚙️ Account Details
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <h3>Personal Information</h3>
              <p>Update your profile details</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="email-info">
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="form-input disabled"
                  />
                  <div className="email-status">
                    {profileData.emailVerified ? (
                      <span className="badge badge-success">✓ Verified</span>
                    ) : (
                      <span className="badge badge-warning">⚠ Unverified</span>
                    )}
                  </div>
                </div>
                <small className="text-gray">
                  Email address cannot be changed. Contact support if needed.
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <div className="card-header">
              <h3>Change Password</h3>
              <p>Update your account password for security</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  disabled={loading}
                  className="form-input"
                />
                <small className="text-gray">
                  Password must be at least 8 characters long
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Details Tab */}
        {activeTab === 'account' && (
          <div className="card">
            <div className="card-header">
              <h3>Account Information</h3>
              <p>View your account details and status</p>
            </div>
            
            <div className="account-details">
              <div className="detail-row">
                <div className="detail-label">User ID</div>
                <div className="detail-value">{profileData.id}</div>
              </div>
              
              <div className="detail-row">
                <div className="detail-label">Email Address</div>
                <div className="detail-value">
                  {profileData.email}
                  {profileData.emailVerified ? (
                    <span className="badge badge-success">Verified</span>
                  ) : (
                    <span className="badge badge-warning">Unverified</span>
                  )}
                </div>
              </div>
              
              <div className="detail-row">
                <div className="detail-label">Last Login</div>
                <div className="detail-value">{formatDate(profileData.lastLogin)}</div>
              </div>
              
              <div className="detail-row">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">{formatDate(profileData.memberSince)}</div>
              </div>
              
              <div className="detail-row">
                <div className="detail-label">Account Status</div>
                <div className="detail-value">
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </div>

            <div className="danger-zone">
              <h4>⚠️ Danger Zone</h4>
              <p>These actions cannot be undone</p>
              
              <div className="danger-actions">
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Sign Out of All Devices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 