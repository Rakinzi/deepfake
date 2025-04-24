import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  AudioWaveform, 
  X, 
  FileText, 
  Shield, 
  Check, 
  AlertCircle,
  Sparkles,
  Loader,
  Info,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Mic,
    Radio,
    Activity
} from 'lucide-react';

const AudioAnalysisContent = () => {
  const [audio, setAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Generate dummy waveform data for visualization
  useEffect(() => {
    if (audioPreview) {
      const sampleCount = 100;
      const dummyWaveform = Array(sampleCount).fill().map(() => Math.random() * 0.8 + 0.2);
      setWaveformData(dummyWaveform);
    }
  }, [audioPreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.match('audio.*')) {
      setError('Please select an audio file (MP3, WAV, OGG, etc.)');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAudioPreview(e.target.result);
      setAudio(file);
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

  const clearAudio = () => {
    setAudio(null);
    setAudioPreview(null);
    setAnalysisResults(null);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const analyzeAudio = async () => {
    if (!audio) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock analysis results
        setAnalysisResults({
          voice_authenticity: 0.23,
          ai_generated_probability: 0.92,
          voice_cloning_detected: true,
          emotion_analysis: {
            primary_emotion: "neutral",
            secondary_emotion: "stress",
            emotions: {
              neutral: 0.62,
              stress: 0.23,
              calm: 0.08,
              anger: 0.04,
              happiness: 0.03
            }
          },
          speaker_verification: {
            matched: false,
            confidence: 0.87,
            potential_speakers: ["Unknown AI", "Synthetic Voice"]
          },
          audio_quality: {
            background_noise: 0.12,
            clarity: 0.89,
            consistency: 0.78
          },
          suspicious_segments: [
            { start_time: 2.5, end_time: 8.1, issue: "Voice synthesis artifacts" },
            { start_time: 15.3, end_time: 22.7, issue: "Unnatural intonation patterns" }
          ]
        });
        
        setIsAnalyzing(false);
      }, 3000);
    } catch (err) {
      console.error('Error analyzing audio:', err);
      setError('Server error. Please try again later.');
      setIsAnalyzing(false);
    }
  };

  // Audio player controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    setCurrentTime(audioRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    
    setDuration(audioRef.current.duration);
  };
  
  const skipForward = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime += 10;
    setCurrentTime(audioRef.current.currentTime);
  };
  
  const skipBackward = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime -= 10;
    setCurrentTime(audioRef.current.currentTime);
  };
  
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
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
        <h1 className="text-2xl font-bold text-gray-800">Audio Analysis & Voice Verification</h1>
        <p className="text-gray-500 mt-1">Upload an audio file to analyze and check if it contains AI-generated voice or manipulated content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Audio</h2>

            {!audioPreview ? (
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
                  accept="audio/*"
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600">Drag and drop an audio file here, or click to browse</p>
                <p className="mt-1 text-sm text-gray-500">MP3, WAV, OGG up to 50MB</p>
              </div>
            ) : (
              <div className="relative">
                <div className="rounded-lg overflow-hidden bg-gray-50 p-4">
                  <audio
                    ref={audioRef}
                    src={audioPreview}
                    className="hidden"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                  />
                  
                  {/* Audio waveform visualization */}
                  <div className="h-20 w-full flex items-center justify-center mb-2">
                    {waveformData.map((amplitude, index) => (
                      <div 
                        key={index}
                        className={`mx-0.5 rounded-full ${
                          (currentTime / duration) * waveformData.length > index ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ 
                          height: `${amplitude * 100}%`, 
                          width: '4px'
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Custom audio controls */}
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 text-xs">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(currentTime / (duration || 1)) * 100}
                        onChange={handleSeek}
                        className="w-full mx-2 cursor-pointer"
                      />
                      <span className="text-gray-700 text-xs">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <button onClick={skipBackward} className="text-gray-700 p-1 hover:bg-gray-100 rounded">
                        <SkipBack size={16} />
                      </button>
                      <button onClick={togglePlay} className="text-blue-600 p-2 hover:bg-blue-50 rounded-full mx-2">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button onClick={skipForward} className="text-gray-700 p-1 hover:bg-gray-100 rounded">
                        <SkipForward size={16} />
                      </button>
                      <button onClick={toggleMute} className="text-gray-700 p-1 hover:bg-gray-100 rounded ml-4">
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={clearAudio}
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
            
            {audioPreview && !analysisResults && !isAnalyzing && (
              <button
                onClick={analyzeAudio}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Audio
              </button>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 w-full bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Audio...
              </div>
            )}
          </div>
        </div>

        {/* Analysis results */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!analysisResults && !isAnalyzing ? 'lg:opacity-60' : ''}`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
            
            {!audioPreview && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AudioWaveform className="w-12 h-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Upload an audio file to see analysis results</p>
              </div>
            )}
            
            {audioPreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Info className="w-12 h-12 text-blue-300" />
                <p className="mt-2 text-gray-500">Click "Analyze Audio" to start analysis</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-blue-600 font-medium">Analyzing your audio...</p>
                <p className="text-sm text-gray-500 mt-2">Identifying voice patterns and synthetic markers</p>
              </div>
            )}
            
            {analysisResults && (
              <div className="space-y-6">
                {/* Main result */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Voice Authentication</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">
                        {analysisResults.ai_generated_probability > 0.5 ? 
                          "AI-Generated Voice Detected" : 
                          "Authentic Human Voice"}
                      </span>
                      <span className={`text-sm font-semibold ${
                        analysisResults.ai_generated_probability > 0.5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analysisResults.ai_generated_probability > 0.5 ? 
                          `${(analysisResults.ai_generated_probability * 100).toFixed(1)}% synthetic` :
                          `${(analysisResults.voice_authenticity * 100).toFixed(1)}% authentic`
                        }
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={analysisResults.ai_generated_probability > 0.5 ? 'bg-red-500' : 'bg-green-500'}
                        style={{ 
                          width: `${analysisResults.ai_generated_probability > 0.5 ? 
                            analysisResults.ai_generated_probability * 100 : 
                            analysisResults.voice_authenticity * 100}%`, 
                          height: '100%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Speaker verification */}
                  {analysisResults.speaker_verification && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mic className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Speaker Identification</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          analysisResults.speaker_verification.matched ? 
                            'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                        }`}>
                          {analysisResults.speaker_verification.matched ? 'Match' : 'No Match'}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Confidence:</span>
                          <span>{(analysisResults.speaker_verification.confidence * 100).toFixed(1)}%</span>
                        </div>
                        
                        {analysisResults.speaker_verification.potential_speakers && (
                          <div className="mt-1">
                            <span className="text-gray-600">Detected voice type:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {analysisResults.speaker_verification.potential_speakers.map((speaker, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                  {speaker}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Emotion analysis */}
                {analysisResults.emotion_analysis && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Activity className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Emotion Analysis</h3>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          Primary: {analysisResults.emotion_analysis.primary_emotion}
                        </div>
                        {analysisResults.emotion_analysis.secondary_emotion && (
                          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            Secondary: {analysisResults.emotion_analysis.secondary_emotion}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        {Object.entries(analysisResults.emotion_analysis.emotions)
                          .sort(([,a], [,b]) => b - a)
                          .map(([emotion, value]) => (
                            <div key={emotion} className="flex items-center">
                              <span className="text-xs w-16 text-gray-600 capitalize">{emotion}</span>
                              <div className="flex-1 mx-2">
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${value * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-600 w-10 text-right">{(value * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Suspicious segments */}
                {analysisResults.suspicious_segments && analysisResults.suspicious_segments.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Radio className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Suspicious Segments</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {analysisResults.suspicious_segments.map((segment, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-red-700">{segment.issue}</span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Audio quality */}
                {analysisResults.audio_quality && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Volume2 className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Audio Quality</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-500 mb-1">Background Noise</div>
                        <div className="text-lg font-medium text-gray-800">
                          {(analysisResults.audio_quality.background_noise * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-500 mb-1">Clarity</div>
                        <div className="text-lg font-medium text-gray-800">
                          {(analysisResults.audio_quality.clarity * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-500 mb-1">Consistency</div>
                        <div className="text-lg font-medium text-gray-800">
                          {(analysisResults.audio_quality.consistency * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAnalysisContent;