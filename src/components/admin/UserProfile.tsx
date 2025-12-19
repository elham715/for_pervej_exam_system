import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserData } from '../../lib/auth';
import { userApi } from '../../lib/api';
import { User, Mail, Phone, Building, MapPin, Shield } from 'lucide-react';

const UserProfile = () => {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [address, setAddress] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setCollegeName(userData.college_name || '');
      setAddress(userData.address || '');
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Try to update via API first
      console.log('🔄 Updating user profile via API...');
      await userApi.updateProfile({
        name,
        phone: phone || undefined,
        college_name: collegeName || undefined,
        address: address || undefined,
      });
      console.log('✅ Profile updated via API');

      await refreshUserData();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ Error updating via API, trying Firestore...', error);
      // Fallback to Firestore
      try {
        await updateUserData(currentUser.uid, {
          name,
          phone: phone || undefined,
          college_name: collegeName || undefined,
          address: address || undefined,
        });
        await refreshUserData();
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } catch (firestoreError: any) {
        setError(firestoreError.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setCollegeName(userData.college_name || '');
      setAddress(userData.address || '');
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!currentUser || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">{userData.name}</h1>
            <p className="text-blue-100 text-center mt-1">{userData.email}</p>
            {userData.role && (
              <div className="flex items-center justify-center mt-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  userData.role === 'ADMIN' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <Shield className="w-4 h-4" />
                  {userData.role === 'ADMIN' ? 'Admin' : 'Student'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {!isEditing ? (
              // View Mode
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <User className="w-5 h-5" />
                    <label className="font-medium">Full Name</label>
                  </div>
                  <p className="text-gray-900 ml-7">{userData.name || 'Not provided'}</p>
                </div>

                <div className="border-b pb-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Mail className="w-5 h-5" />
                    <label className="font-medium">Email</label>
                  </div>
                  <p className="text-gray-900 ml-7">{userData.email}</p>
                </div>

                <div className="border-b pb-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Phone className="w-5 h-5" />
                    <label className="font-medium">Phone</label>
                  </div>
                  <p className="text-gray-900 ml-7">{userData.phone || 'Not provided'}</p>
                </div>

                <div className="border-b pb-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Building className="w-5 h-5" />
                    <label className="font-medium">College</label>
                  </div>
                  <p className="text-gray-900 ml-7">{userData.college_name || 'Not provided'}</p>
                </div>

                <div className="border-b pb-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-5 h-5" />
                    <label className="font-medium">Address</label>
                  </div>
                  <p className="text-gray-900 ml-7">{userData.address || 'Not provided'}</p>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-500">
                    Member since: {new Date(userData.created_at || userData.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <User className="w-5 h-5" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <Mail className="w-5 h-5" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <Phone className="w-5 h-5" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <Building className="w-5 h-5" />
                    College Name
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your college name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <MapPin className="w-5 h-5" />
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your address"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
