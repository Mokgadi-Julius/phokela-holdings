import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailCancellations: true,
    emailContact: true,
    smsAlerts: false
  });
  const [general, setGeneral] = useState({
    siteName: 'Phokela Guest House',
    supportEmail: 'admin@phokelaholdings.co.za',
    supportPhone: '+27 12 345 6789',
    address: '123 Guest House Lane, Polokwane'
  });
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await settingsAPI.getAll();
      if (response.success && response.data) {
        const data = response.data;
        setGeneral({
          siteName: data.siteName || 'Phokela Guest House',
          supportEmail: data.supportEmail || 'admin@phokelaholdings.co.za',
          supportPhone: data.supportPhone || '+27 12 345 6789',
          address: data.address || '123 Guest House Lane, Polokwane'
        });
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneral(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurity(prev => ({ ...prev, [name]: value }));
  };

  const showFeedback = (error = '') => {
    setSaveError(error);
    setSaveSuccess(error ? '' : 'Settings saved successfully.');
    if (!error) setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const response = await settingsAPI.update({ ...general, notifications }, 'general');
      if (response.success) {
        showFeedback();
      } else {
        showFeedback(response.message || 'Failed to save settings.');
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!security.currentPassword) {
      setSaveError('Current password is required.');
      return;
    }
    if (!security.newPassword) {
      setSaveError('New password is required.');
      return;
    }
    if (security.newPassword.length < 8) {
      setSaveError('New password must be at least 8 characters.');
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setSaveError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await settingsAPI.update(
        { currentPassword: security.currentPassword, newPassword: security.newPassword },
        'security'
      );
      if (response.success) {
        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showFeedback();
      } else {
        showFeedback(response.message || 'Failed to change password.');
      }
    } catch (err) {
      showFeedback(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-gray-600">Manage application configuration and preferences</p>
        </div>
        {activeTab !== 'security' && (
          <button
            onClick={handleSave}
            disabled={saving || fetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{saveSuccess}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'general', label: 'General' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'security', label: 'Security' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSaveError(''); setSaveSuccess(''); }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900">General Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input type="text" name="siteName" value={general.siteName} onChange={handleGeneralChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input type="email" name="supportEmail" value={general.supportEmail} onChange={handleGeneralChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                  <input type="tel" name="supportPhone" value={general.supportPhone} onChange={handleGeneralChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea name="address" rows="3" value={general.address} onChange={handleGeneralChange} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { name: 'emailBookings',      label: 'New Bookings',  desc: 'Receive an email when a new booking is made' },
                  { name: 'emailCancellations', label: 'Cancellations', desc: 'Receive an email when a booking is cancelled' },
                  { name: 'emailContact',       label: 'Contact Form',  desc: 'Receive an email when someone submits the contact form' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.name}
                        checked={notifications[item.name]}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" name="currentPassword" value={security.currentPassword} onChange={handleSecurityChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(min 8 characters)</span></label>
                  <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} className={inputCls} />
                </div>
              </div>
              <button
                onClick={handlePasswordSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
