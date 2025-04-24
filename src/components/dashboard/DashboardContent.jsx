import React, { useState, useEffect } from 'react';
import { 
  Image, 
  ShieldAlert, 
  Check, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight, 
  BarChart, 
  FileWarning,
  Users,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardService from '../../services/DashboardService';
import AuthService from '../../services/AuthService';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  
  const navigate = useNavigate();

  // Default static stats (backup if API fails)
  const defaultStats = [
    { 
      id: 'scanned', 
      title: 'Images Scanned', 
      value: '0', 
      change: '0%', 
      isPositive: true,
      icon: Image,
      color: 'bg-blue-500'
    },
    { 
      id: 'detected', 
      title: 'Fakes Detected', 
      value: '0', 
      change: '0%', 
      isPositive: false,
      icon: ShieldAlert,
      color: 'bg-red-500'
    },
    { 
      id: 'accuracy', 
      title: 'Detection Accuracy', 
      value: '0%', 
      change: '0%', 
      isPositive: true,
      icon: Check,
      color: 'bg-green-500'
    },
    { 
      id: 'processing', 
      title: 'Avg. Processing Time', 
      value: '0s', 
      change: '0s', 
      isPositive: true,
      icon: Clock,
      color: 'bg-purple-500'
    },
  ];

  // Check authentication and fetch data
  useEffect(() => {
    // Verify authentication
    if (!AuthService.isLoggedIn()) {
      navigate('/');
      return;
    }

    // Load dashboard data
    fetchDashboardData();
    
    // Load recent analyses if on recent scans tab
    if (activeTab === 'recent scans') {
      fetchRecentAnalyses();
    }
  }, [navigate]);

  // Reload data when tab changes
  useEffect(() => {
    if (activeTab === 'recent scans') {
      fetchRecentAnalyses();
    }
  }, [activeTab]);

  // Fetch dashboard statistics and data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await DashboardService.getDashboardStats();
      
      if (response.success) {
        // Format stats as array for rendering
        const statsArray = Object.keys(response.stats).map(key => ({
          id: key,
          title: response.stats[key].title,
          value: response.stats[key].value,
          change: response.stats[key].change,
          isPositive: response.stats[key].isPositive,
          icon: getIconForStat(key),
          color: getColorForStat(key)
        }));
        
        setStats(statsArray);
        setRecentDetections(response.recent_detections);
        setChartData(response.chart_data);
      } else {
        setError('Failed to load dashboard data');
        // Use default stats as fallback
        setStats(defaultStats);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.error || 'Failed to load dashboard data');
      // Use default stats as fallback
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent analyses
  const fetchRecentAnalyses = async () => {
    try {
      const response = await DashboardService.getRecentAnalyses();
      
      if (response.success) {
        setRecentAnalyses(response.analyses);
      }
    } catch (err) {
      console.error('Error fetching recent analyses:', err);
    }
  };

  // Helper functions for icons and colors
  const getIconForStat = (statId) => {
    switch (statId) {
      case 'scanned': return Image;
      case 'detected': return ShieldAlert;
      case 'accuracy': return Check;
      case 'processing': return Clock;
      default: return Image;
    }
  };

  const getColorForStat = (statId) => {
    switch (statId) {
      case 'scanned': return 'bg-blue-500';
      case 'detected': return 'bg-red-500';
      case 'accuracy': return 'bg-green-500';
      case 'processing': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  // Fake image detection techniques
  const detectionMethods = [
    { name: 'Metadata Analysis', accuracy: 92, description: 'Examines EXIF data for inconsistencies' },
    { name: 'Noise Pattern Analysis', accuracy: 95, description: 'Analyzes noise patterns that differ in AI-generated images' },
    { name: 'Facial Inconsistency', accuracy: 97, description: 'Detects unnatural features in faces' },
    { name: 'Color Inconsistency', accuracy: 94, description: 'Identifies unusual color patterns and gradients' }
  ];

  // Determine the dominant analysis result type for chart visualization
  const getDominantResult = () => {
    if (!chartData) return { authentic: 68, aiGenerated: 32 };
    
    return {
      authentic: chartData.authentic.percent,
      aiGenerated: chartData.ai_generated.percent
    };
  };

  // Get result type for recent analyses
  const getResultType = (isReal, spoofingType) => {
    if (isReal) return 'Authentic';
    if (spoofingType === 'AI-generated') return 'AI Generated';
    return spoofingType || 'Modified';
  };

  // Format date for display
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader size={40} className="text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Image Verification Dashboard</h1>
            <p className="text-gray-500 mt-1">Monitor and analyze potentially manipulated or AI-generated images.</p>
          </div>
          <div className="hidden sm:block">
            <a 
              href="/image-analysis"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <span>Analyze New Image</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Error message if needed */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Error loading dashboard data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold flex items-center ${
                  stat.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                  {stat.change}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className="h-1 w-full bg-gray-100">
              <div 
                className={`h-full ${stat.color}`}
                style={{ width: `${75 + Math.random() * 25}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex">
            {['overview', 'detection methods', 'recent scans'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detection chart */}
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6 h-64 flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <BarChart className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 font-medium">Image Detection Results (Last 30 Days)</p>
                </div>
                <div className="w-full max-w-md flex justify-between px-6">
                  {/* Dynamic chart based on real data */}
                  {chartData ? (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-16 bg-green-500 rounded-t-sm" style={{ 
                          height: `${getDominantResult().authentic / 100 * 64}px` 
                        }}></div>
                        <span className="text-xs mt-1 text-gray-500">Authentic</span>
                        <span className="text-xs font-bold text-gray-700">{Math.round(getDominantResult().authentic)}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-10 bg-red-500 rounded-t-sm" style={{ 
                          height: `${getDominantResult().aiGenerated / 100 * 64}px` 
                        }}></div>
                        <span className="text-xs mt-1 text-gray-500">AI Generated</span>
                        <span className="text-xs font-bold text-gray-700">{Math.round(getDominantResult().aiGenerated)}%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-16 bg-green-500 rounded-t-sm"></div>
                        <span className="text-xs mt-1 text-gray-500">Authentic</span>
                        <span className="text-xs font-bold text-gray-700">68%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-10 bg-red-500 rounded-t-sm"></div>
                        <span className="text-xs mt-1 text-gray-500">AI Generated</span>
                        <span className="text-xs font-bold text-gray-700">32%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent detections */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Detections</h3>
                {recentDetections.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <FileWarning className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No recent detections found</p>
                    <p className="text-sm text-gray-400 mt-1">Start analyzing images to see your history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDetections.map((detection, index) => (
                      <div
                        key={index}
                        className="flex items-start"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          detection.result === 'Authentic' ? 'bg-green-100' : 
                          (detection.result === 'AI Generated' || detection.result === 'Deepfake') ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {detection.result === 'Authentic' ? (
                            <Check className={`w-5 h-5 text-green-600`} />
                          ) : detection.result === 'AI Generated' || detection.result === 'Deepfake' ? (
                            <AlertTriangle className={`w-5 h-5 text-red-600`} />
                          ) : (
                            <FileWarning className={`w-5 h-5 text-yellow-600`} />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800 font-medium">
                            {detection.filename}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              detection.result === 'Authentic' ? 'bg-green-100 text-green-800' : 
                              (detection.result === 'AI Generated' || detection.result === 'Deepfake') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {detection.result}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{detection.confidence}</span>
                            <span className="text-xs text-gray-400 ml-auto">{detection.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'detection methods' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 text-blue-700 mb-4 flex items-start">
                <Cpu className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Our system uses multiple detection methods to identify manipulated or AI-generated images with high accuracy.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectionMethods.map((method, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">{method.name}</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {method.accuracy}% accuracy
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recent scans' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-800">Recently Analyzed Images</h3>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              
              {recentAnalyses.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 rounded-lg">
                  <Image className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600 font-medium">No images analyzed yet</p>
                  <p className="text-gray-500 mt-1">Start analyzing images to see them here</p>
                  <a 
                    href="/image-analysis"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Analyze First Image
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAnalyses.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="h-36 bg-gray-100 relative flex items-center justify-center">
                        <Image className="w-10 h-10 text-gray-300" />
                        <div className="absolute top-2 right-2">
                          <span className={`bg-${item.is_real ? 'green' : 'red'}-100 text-${item.is_real ? 'green' : 'red'}-800 text-xs px-2 py-1 rounded-full`}>
                            {getResultType(item.is_real, item.spoofing_type)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-800">{item.original_filename}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">Scanned {formatTimeAgo(item.created_at)}</span>
                          <span className="text-xs font-medium text-gray-700">
                            Confidence: {Math.round(item.is_real ? item.real_score * 100 : (1 - item.real_score) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a 
            href="/image-analysis"
            className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Image className="w-5 h-5 mr-2" />
            Analyze New Image
          </a>
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            View Detection History
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            View Detection Trends
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;