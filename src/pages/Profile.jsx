import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import { 
  User, 
  Lock, 
  Mail, 
  Clock, 
  Edit, 
  X, 
  Check, 
  Image as ImageIcon,
  Shield,
  AlertCircle,
  History,
  Video,
  Info
} from 'lucide-react';
import AuthService from '../services/AuthService';
import { motion } from 'framer-motion';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [history, setHistory] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(()=> {
    document.title = 'Profile';
  }, [])
  
  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user profile
        const response = await AuthService.getUserProfile();
        if (response.success) {
          setUser(response.user);
          setFormData({
            ...formData,
            username: response.user.username,
            email: response.user.email
          });
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Load history when tab is changed to history
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
      loadVideoHistory();
    }
  }, [activeTab]);
  
  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getUserHistory();
      if (response.success) {
        setHistory(response.history);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadVideoHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/video/history', {
        headers: {
          'Authorization': `Bearer ${AuthService.getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVideoHistory(data.history);
        }
      }
    } catch (err) {
      console.error('Error loading video history:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    // This would be implemented to update user profile
    // For now, we'll just toggle editing mode
    setIsEditing(false);
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    // Password change logic would be implemented here
    alert('Password change functionality would be implemented here');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Format duration for display
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  if (loading && !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information and view analysis history</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analysis History
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center text-blue-600 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Username</p>
                        <p className="font-medium">{user?.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Account Created</p>
                        <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Password</h2>
                  <p className="text-gray-500 text-sm mt-1">Update your password to ensure account security</p>
                </div>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                        placeholder="Enter your current password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                        placeholder="Enter your new password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border"
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Sessions & Security</h2>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start mb-4">
                    <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Your account is secure</p>
                      <p className="text-sm text-blue-600 mt-1">We recommend using a strong password and enabling two-factor authentication when available.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Image Analysis History</h2>
                  <p className="text-gray-500 text-sm mt-1">View all your previous image analysis results</p>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
                    <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No image analysis history found. Start analyzing images to see your history.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-40 h-32 bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-400" />
                          </div>
                          <div className="p-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">{item.original_filename}</p>
                                <p className="text-sm text-gray-500 mt-1">Analyzed on {formatDate(item.created_at)}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.is_real ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.is_real ? 'Authentic' : 'Fake/AI-Generated'}
                              </span>
                            </div>
                            
                            <div className="mt-4 flex items-center">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Confidence:</span> {(item.real_score * 100).toFixed(1)}%
                              </div>
                              {item.spoofing_type && (
                                <div className="ml-6 text-sm text-gray-600">
                                  <span className="font-medium">Type:</span> {item.spoofing_type}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Video Analysis History */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Video Analysis History</h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-blue-700 mb-6 flex items-start">
                    <Info className="w-5 h-5 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Your video analysis history</p>
                      <p className="text-sm mt-1">Below are the videos you've analyzed for deepfake detection.</p>
                    </div>
                  </div>
                  
                  {videoHistory && videoHistory.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
                      <Video className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No video analysis history found. Start analyzing videos to see your history.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {videoHistory && videoHistory.map((item) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-40 h-28 bg-gray-100 flex items-center justify-center relative">
                              <Video className="w-10 h-10 text-gray-400" />
                              {item.duration && (
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                                  {formatDuration(item.duration)}
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-800">{item.original_filename}</p>
                                  <p className="text-sm text-gray-500 mt-1">Analyzed on {formatDate(item.created_at)}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.is_real ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.is_real ? 'Authentic' : (item.manipulation_type || 'Manipulated')}
                                </span>
                              </div>
                              
                              <div className="mt-4 flex flex-wrap gap-4">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Confidence:</span> {(item.is_real ? 
                                    (item.real_score * 100) : 
                                    (item.deepfake_probability * 100)).toFixed(1)}%
                                </div>
                                {item.resolution && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Resolution:</span> {item.resolution}
                                  </div>
                                )}
                                {item.detected_frames && item.total_frames && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Affected Frames:</span> {item.detected_frames}/{item.total_frames} 
                                    ({Math.round(item.detected_frames/item.total_frames*100)}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;