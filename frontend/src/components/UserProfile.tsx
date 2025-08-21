import { useState } from 'react';
import { User, LogOut, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './UserProfile.css';

export function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset data
      setEditData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
      });
      setError('');
      setSuccess('');
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(editData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={40} />
          </div>
          <div className="profile-info">
            <h2>{user.firstName} {user.lastName}</h2>
            <p>{user.email}</p>
            <span className="profile-role">{user.role}</span>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button
                className="btn btn--icon"
                onClick={handleEditToggle}
                title="Edit Profile"
              >
                <Edit3 size={20} />
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="btn btn--icon btn--success"
                  onClick={handleSave}
                  disabled={isLoading}
                  title="Save Changes"
                >
                  <Save size={20} />
                </button>
                <button
                  className="btn btn--icon btn--secondary"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                  title="Cancel"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {(error || success) && (
          <div className={`profile-message ${error ? 'error' : 'success'}`}>
            {error || success}
          </div>
        )}

        {isEditing && (
          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="profile-meta">
          <div className="meta-item">
            <span className="meta-label">Member since:</span>
            <span className="meta-value">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          {user.lastLogin && (
            <div className="meta-item">
              <span className="meta-label">Last login:</span>
              <span className="meta-value">
                {new Date(user.lastLogin).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="profile-footer">
          <button
            className="btn btn--secondary btn--icon"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
