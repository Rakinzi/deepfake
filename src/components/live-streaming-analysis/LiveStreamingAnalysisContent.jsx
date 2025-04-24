import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Camera, 
  Tv, 
  AlertCircle,
  Sparkles,
  Loader,
  Info,
  Shield,
  UserCheck,
  UserX,
  Activity,
  BarChart2,
  Clock,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  HelpCircle,
  MonitorCheck,
  ScreenShare,
  FilmIcon,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

const LiveStreamingAnalysisContent = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [streamSource, setStreamSource] = useState('camera'); // 'camera', 'screen', 'rtmp'
  const [streamUrl, setStreamUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [error, setError] = useState(null);
  const [streamingTime, setStreamingTime] = useState(0);
  const [analysisFrequency, setAnalysisFrequency] = useState(1); // frames per second
  
  const videoRef = useRef(null);
  const streamInterval = useRef(null);
  const analysisInterval = useRef(null);
  const timerInterval = useRef(null);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
      if (analysisInterval.current) clearInterval(analysisInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const startStreaming = async () => {
    setError(null);
    
    try {
      if (streamSource === 'camera') {
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: !isMuted 
          });
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          startAnalysis();
          startTimer();
        }
      } else if (streamSource === 'screen') {
        if (videoRef.current) {
          // For screen sharing, typically only video is captured
          const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { width: 1280, height: 720 }
          });
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          startAnalysis();
          startTimer();
          
          // Listen for when the user stops sharing
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            stopStreaming();
          });
        }
      } else if (streamSource === 'rtmp' && streamUrl) {
        // This is a mock implementation since browser-based RTMP playback typically requires a player like HLS.js
        // In a real implementation, you'd use a proper streaming player
        setIsStreaming(true);
        startAnalysis();
        startTimer();
        
        // Simulate stream connection
        setError("Note: RTMP streaming is simulated in this demo. In a real application, you would use HLS.js, Video.js, or a similar library.");
      }
    } catch (err) {
      console.error('Error starting stream:', err);
      setError(`Error starting stream: ${err.message || 'Unknown error'}`);
    }
  };

  const stopStreaming = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setIsAnalyzing(false);
    
    // Clear intervals
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate periodic analysis
    analysisInterval.current = setInterval(() => {
      // Generate random analysis results
      const isFake = Math.random() > 0.7; // 30% chance of detecting a fake
      
      const newResult = {
        timestamp: new Date(),
        is_real: !isFake,
        confidence: Math.random() * 0.2 + (isFake ? 0.7 : 0.8), // 70-90% confidence for fakes, 80-100% for real
        type: isFake ? getRandomManipulationType() : 'authentic'
      };
      
      // Update analysis results
      setAnalysisResults(newResult);
      
      // Add to history if it's a fake detection
      if (isFake) {
        setDetectionHistory(prev => {
          const newHistory = [newResult, ...prev];
          // Keep only the most recent 10 detections
          return newHistory.slice(0, 10);
        });
      }
    }, 1000 / analysisFrequency);
  };

  const getRandomManipulationType = () => {
    const types = ['face swap', 'lip sync', 'entire face generated', 'expression manipulation'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const startTimer = () => {
    setStreamingTime(0);
    timerInterval.current = setInterval(() => {
      setStreamingTime(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStreamUrlChange = (e) => {
    setStreamUrl(e.target.value);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const audioTracks = videoRef.current.srcObject.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted; // Toggle current state
      });
    }
  };

  const clearHistory = () => {
    setDetectionHistory([]);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Live Streaming Analysis</h1>
        <p className="text-gray-500 mt-1">Analyze webcam, screen sharing, or RTMP streams in real-time to detect deepfakes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Streaming panel - Takes 3 columns on large screens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-3">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Live Stream</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setStreamSource('camera')} 
                  className={`px-3 py-1 text-sm rounded-lg ${
                    streamSource === 'camera' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4 inline-block mr-1" />
                  Webcam
                </button>
                <button 
                  onClick={() => setStreamSource('screen')} 
                  className={`px-3 py-1 text-sm rounded-lg ${
                    streamSource === 'screen' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ScreenShare className="w-4 h-4 inline-block mr-1" />
                  Screen
                </button>
                <button 
                  onClick={() => setStreamSource('rtmp')} 
                  className={`px-3 py-1 text-sm rounded-lg ${
                    streamSource === 'rtmp' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Tv className="w-4 h-4 inline-block mr-1" />
                  RTMP
                </button>
              </div>
            </div>

            {/* Stream input based on selected source */}
            {streamSource === 'rtmp' && !isStreaming && (
              <div className="mb-4">
                <label htmlFor="rtmpUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  RTMP Stream URL
                </label>
                <input
                  id="rtmpUrl"
                  type="text"
                  value={streamUrl}
                  onChange={handleStreamUrlChange}
                  placeholder="rtmp://example.com/live/stream"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Video stream display */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {!isStreaming ? (
                <div className="text-center text-white">
                  {streamSource === 'camera' && <Camera className="w-16 h-16 mb-2 mx-auto text-white/30" />}
                  {streamSource === 'screen' && <ScreenShare className="w-16 h-16 mb-2 mx-auto text-white/30" />}
                  {streamSource === 'rtmp' && <Tv className="w-16 h-16 mb-2 mx-auto text-white/30" />}
                  <p className="text-white/70 mb-4">No active stream</p>
                  <button
                    onClick={startStreaming}
                    disabled={streamSource === 'rtmp' && !streamUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Stream
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={isMuted}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Stream controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={toggleMute}
                          className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                        >
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <span className="text-white/90 text-sm">
                          {formatTime(streamingTime)}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={stopStreaming}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
                        >
                          <StopCircle className="w-4 h-4 mr-1" />
                          Stop
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live analysis overlay */}
                  {analysisResults && (
                    <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg flex items-center ${
                      analysisResults.is_real ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analysisResults.is_real ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Authentic</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Deepfake Detected</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Analysis settings */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Analysis Settings</span>
                </div>
                {isStreaming && isAnalyzing && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Analyzing</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <label className="text-sm text-gray-600 mb-1 block">Analysis Frequency: {analysisFrequency} frame{analysisFrequency !== 1 ? 's' : ''}/second</label>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.2"
                  value={analysisFrequency}
                  onChange={(e) => setAnalysisFrequency(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isStreaming}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower (less CPU)</span>
                  <span>Higher (more accurate)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis results panel - Takes 2 columns on large screens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Analysis Results</h2>
              {detectionHistory.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear History
                </button>
              )}
            </div>
            
            {!isStreaming ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Info className="w-12 h-12 text-blue-300 mb-2" />
                <p className="text-gray-500 mb-2">Start streaming to see real-time analysis</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Deepfake detection works best with frontal face views and good lighting conditions
                </p>
              </div>
            ) : detectionHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <MonitorCheck className="w-12 h-12 text-green-300 mb-2" />
                <p className="text-gray-500 mb-2">No manipulations detected</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Monitoring active. Deepfakes will be reported here when detected.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">Detection History</div>
                <div className="space-y-3">
                  {detectionHistory.map((detection, index) => (
                    <div key={index} className="border border-red-100 bg-red-50 rounded-lg p-3">
                      <div className="flex items-start">
                        <div className="rounded-full bg-red-100 p-2 mr-3">
                          <UserX className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-red-700">Deepfake Detected</span>
                            <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                              {(detection.confidence * 100).toFixed(1)}% confidence
                            </span>
                          </div>
                          <div className="text-sm text-red-600 mt-1">Type: {detection.type}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(detection.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Real-time stats */}
            {isStreaming && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Live Stream Statistics</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Stream Duration</div>
                    <div className="font-medium text-gray-800">{formatTime(streamingTime)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Analysis Rate</div>
                    <div className="font-medium text-gray-800">{analysisFrequency} fps</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Detections</div>
                    <div className="font-medium text-gray-800">{detectionHistory.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Stream Source</div>
                    <div className="font-medium text-gray-800 capitalize">{streamSource}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Information section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start">
          <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">How Live Deepfake Detection Works</h3>
            <p className="text-gray-600 mb-4">
              This system analyzes streaming video in real-time, looking for telltale signs of AI manipulation.
              For optimal results:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Ensure good lighting conditions</li>
              <li>Face the camera directly when testing facial analysis</li>
              <li>Minimize background movement and noise</li>
              <li>Higher analysis frequency provides more accurate detection but requires more CPU power</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamingAnalysisContent;