import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Video, 
  X, 
  FileText, 
  Shield, 
  Check, 
  AlertCircle,
  Sparkles,
  Loader,
  Info,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize
} from 'lucide-react';

const VideoAnalysisContent = () => {
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.match('video.*')) {
      setError('Please select a video file (MP4, MOV, AVI, etc.)');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target.result);
      setVideo(file);
      setError(null);
      setAnalysisResults(null);
      setIsPlaying(false);
      setCurrentTime(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    setAnalysisResults(null);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const analyzeVideo = async () => {
    if (!video) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock analysis results
        setAnalysisResults({
          deepfake_probability: 0.87,
          authenticity_score: 0.13,
          manipulation_type: 'Face Swap',
          detected_frames: 34,
          total_frames: 120,
          confidence: 0.92,
          detection_regions: [
            { start_time: 2.4, end_time: 5.6, type: 'Face Manipulation' },
            { start_time: 12.1, end_time: 18.3, type: 'Voice Synthesis' },
          ],
          audio_analysis: {
            authenticity: 0.22,
            voice_cloning_detected: true,
            voice_manipulation_regions: [
              { start_time: 3.2, end_time: 8.7 },
              { start_time: 14.5, end_time: 20.1 },
            ]
          }
        });
        
        setIsAnalyzing(false);
      }, 3000);
    } catch (err) {
      console.error('Error analyzing video:', err);
      setError('Server error. Please try again later.');
      setIsAnalyzing(false);
    }
  };

  // Video player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
  };
  
  const skipForward = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime += 10;
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const skipBackward = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime -= 10;
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleSeek = (e) => {
    if (!videoRef.current) return;
    
    const seekTime = (e.target.value / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Video Analysis & Deepfake Detection</h1>
        <p className="text-gray-500 mt-1">Upload a video to analyze and check if it contains manipulated content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Video</h2>

            {!videoPreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadButtonClick}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600">Drag and drop a video here, or click to browse</p>
                <p className="mt-1 text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
              </div>
            ) : (
              <div className="relative">
                <div className="rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full h-auto max-h-72 object-contain mx-auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    controls={false}
                  />
                  
                  {/* Custom video controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xs">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(currentTime / (duration || 1)) * 100}
                        onChange={handleSeek}
                        className="w-full mx-2 cursor-pointer"
                      />
                      <span className="text-white text-xs">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button onClick={skipBackward} className="text-white p-1 hover:bg-white/20 rounded">
                          <SkipBack size={16} />
                        </button>
                        <button onClick={togglePlay} className="text-white p-1 hover:bg-white/20 rounded-full bg-white/10">
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={skipForward} className="text-white p-1 hover:bg-white/20 rounded">
                          <SkipForward size={16} />
                        </button>
                      </div>
                      <div className="flex items-center">
                        <button onClick={toggleMute} className="text-white p-1 hover:bg-white/20 rounded">
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button className="text-white p-1 hover:bg-white/20 rounded ml-2">
                          <Maximize size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={clearVideo}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {videoPreview && !analysisResults && !isAnalyzing && (
              <button
                onClick={analyzeVideo}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Video
              </button>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 w-full bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Video...
              </div>
            )}
          </div>
        </div>

        {/* Analysis results */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!analysisResults && !isAnalyzing ? 'lg:opacity-60' : ''}`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
            
            {!videoPreview && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Video className="w-12 h-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Upload a video to see analysis results</p>
              </div>
            )}
            
            {videoPreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Info className="w-12 h-12 text-blue-300" />
                <p className="mt-2 text-gray-500">Click "Analyze Video" to start analysis</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-blue-600 font-medium">Analyzing your video...</p>
                <p className="text-sm text-gray-500 mt-2">This may take several minutes for longer videos</p>
              </div>
            )}
            
            {analysisResults && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Detection Results</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">
                        {analysisResults.deepfake_probability > 0.5 ? 
                          "Manipulated Content Detected" : 
                          "Likely Authentic Content"}
                      </span>
                      <span className={`text-sm font-semibold ${
                        analysisResults.deepfake_probability > 0.5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analysisResults.deepfake_probability > 0.5 ? 
                          `${(analysisResults.deepfake_probability * 100).toFixed(1)}% manipulated` :
                          `${(analysisResults.authenticity_score * 100).toFixed(1)}% authentic`
                        }
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={analysisResults.deepfake_probability > 0.5 ? 'bg-red-500' : 'bg-green-500'}
                        style={{ 
                          width: `${analysisResults.deepfake_probability > 0.5 ? 
                            analysisResults.deepfake_probability * 100 : 
                            analysisResults.authenticity_score * 100}%`, 
                          height: '100%' 
                        }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Detection confidence: {(analysisResults.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* More details */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-500">Manipulation Type</div>
                      <div className="font-medium text-gray-800">{analysisResults.manipulation_type}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-500">Affected Frames</div>
                      <div className="font-medium text-gray-800">
                        {analysisResults.detected_frames} / {analysisResults.total_frames}
                        <span className="text-xs text-gray-500 ml-1">
                          ({Math.round(analysisResults.detected_frames / analysisResults.total_frames * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time regions */}
                <div>
                  <div className="flex items-center mb-3">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Manipulated Segments</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {analysisResults.detection_regions.map((region, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">{region.type}</span>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {formatTime(region.start_time)} - {formatTime(region.end_time)}
                          </span>
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full relative">
                          <div 
                            className="absolute h-full bg-red-500 rounded-full"
                            style={{ 
                              left: `${(region.start_time / duration) * 100}%`, 
                              width: `${((region.end_time - region.start_time) / duration) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Audio analysis */}
                <div>
                  <div className="flex items-center mb-3">
                    <Volume2 className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Audio Analysis</h3>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700">Audio Authenticity</span>
                      <span className={`text-sm font-medium ${
                        analysisResults.audio_analysis.authenticity < 0.5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(analysisResults.audio_analysis.authenticity * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                      <div 
                        className={analysisResults.audio_analysis.authenticity < 0.5 ? 'bg-red-500' : 'bg-green-500'}
                        style={{ width: `${analysisResults.audio_analysis.authenticity * 100}%`, height: '100%' }}
                      ></div>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {analysisResults.audio_analysis.voice_cloning_detected ? 
                        "Voice cloning detected" : "No voice cloning detected"}
                    </div>
                    
                    {analysisResults.audio_analysis.voice_manipulation_regions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Voice manipulation regions:</p>
                        <div className="space-y-2">
                          {analysisResults.audio_analysis.voice_manipulation_regions.map((region, index) => (
                            <div key={index} className="text-xs flex justify-between">
                              <span className="text-gray-600">Region {index + 1}</span>
                              <span className="text-gray-800">
                                {formatTime(region.start_time)} - {formatTime(region.end_time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisContent;