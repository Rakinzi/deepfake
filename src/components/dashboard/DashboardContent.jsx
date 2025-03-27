import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data for stats
  const stats = [
    { 
      id: 'scanned', 
      title: 'Images Scanned', 
      value: '3,842', 
      change: '+12.3%', 
      isPositive: true,
      icon: Image,
      color: 'bg-blue-500'
    },
    { 
      id: 'detected', 
      title: 'Fakes Detected', 
      value: '427', 
      change: '+8.7%', 
      isPositive: false,
      icon: ShieldAlert,
      color: 'bg-red-500'
    },
    { 
      id: 'accuracy', 
      title: 'Detection Accuracy', 
      value: '98.2%', 
      change: '+1.5%', 
      isPositive: true,
      icon: Check,
      color: 'bg-green-500'
    },
    { 
      id: 'processing', 
      title: 'Avg. Processing Time', 
      value: '1.8s', 
      change: '-0.3s', 
      isPositive: true,
      icon: Clock,
      color: 'bg-purple-500'
    },
  ];

  // Sample data for recent detections
  const recentDetections = [
    { id: 1, filename: 'vacation_photo.jpg', result: 'Authentic', confidence: '98.7%', time: '3 minutes ago' },
    { id: 2, filename: 'profile_picture.png', result: 'AI Generated', confidence: '99.3%', time: '12 minutes ago' },
    { id: 3, filename: 'news_image.jpg', result: 'Manipulated', confidence: '94.2%', time: '37 minutes ago' },
    { id: 4, filename: 'landscape.jpg', result: 'Authentic', confidence: '97.6%', time: '2 hours ago' },
    { id: 5, filename: 'celebrity_photo.jpg', result: 'Deepfake', confidence: '99.8%', time: '3 hours ago' },
  ];

  // Fake image detection techniques
  const detectionMethods = [
    { name: 'Metadata Analysis', accuracy: 92, description: 'Examines EXIF data for inconsistencies' },
    { name: 'Noise Pattern Analysis', accuracy: 95, description: 'Analyzes noise patterns that differ in AI-generated images' },
    { name: 'Facial Inconsistency', accuracy: 97, description: 'Detects unnatural features in faces' },
    { name: 'Color Inconsistency', accuracy: 94, description: 'Identifies unusual color patterns and gradients' }
  ];

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
              {/* Detection chart placeholder */}
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6 h-64 flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <BarChart className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 font-medium">Image Detection Results (Last 30 Days)</p>
                </div>
                <div className="w-full max-w-md flex justify-between px-6">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-16 bg-green-500 rounded-t-sm"></div>
                    <span className="text-xs mt-1 text-gray-500">Authentic</span>
                    <span className="text-xs font-bold text-gray-700">68%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-10 bg-yellow-500 rounded-t-sm"></div>
                    <span className="text-xs mt-1 text-gray-500">Modified</span>
                    <span className="text-xs font-bold text-gray-700">21%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-6 bg-red-500 rounded-t-sm"></div>
                    <span className="text-xs mt-1 text-gray-500">AI Generated</span>
                    <span className="text-xs font-bold text-gray-700">11%</span>
                  </div>
                </div>
              </div>

              {/* Recent detections */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Detections</h3>
                <div className="space-y-4">
                  {recentDetections.map((detection) => (
                    <div
                      key={detection.id}
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
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="h-36 bg-gray-100 relative">
                      <div className="absolute top-2 right-2">
                        {item % 3 === 0 ? (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">AI Generated</span>
                        ) : item % 3 === 1 ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Authentic</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Modified</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800">image_{item}.jpg</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Scanned 3h ago</span>
                        <span className="text-xs font-medium text-gray-700">Confidence: 98%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
          <button className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
            <Users className="w-5 h-5 mr-2" />
            View Detection History
          </button>
          <button className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Detection Trends
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;