import React, { useState, useRef } from 'react';
import {
  Upload,
  Video,
  X,
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
  Maximize,
  AlertTriangle,
  Cpu,
  Wifi,
  BarChart2,
  Film,
  Activity,
  Zap
} from 'lucide-react';
import ApiService from '../../services/ApiService';

const VIDEO_ANALYSIS_STEPS = [
  { id: 'upload',    label: 'Uploading video to server',              icon: Upload },
  { id: 'extract',  label: 'Extracting video metadata & frames',     icon: Film },
  { id: 'classify', label: 'Running deepfake detection per frame',   icon: Cpu },
  { id: 'regions',  label: 'Mapping manipulated segments',           icon: Activity },
  { id: 'done',     label: 'Analysis complete',                      icon: Check },
];

const VideoAnalysisContent = () => {
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysisTime, setAnalysisTime] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const startTimeRef = useRef(null);
  const stepTimersRef = useRef([]);

  const startStepProgression = () => {
    setCurrentStep(0);
    const timings = [600, 2000, 4000, 7000];
    stepTimersRef.current = timings.map((t, i) =>
      setTimeout(() => setCurrentStep(i + 1), t)
    );
  };

  const clearStepTimers = () => {
    stepTimersRef.current.forEach(clearTimeout);
    stepTimersRef.current = [];
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    if (!file.type.match('video.*')) {
      setError('Please select a video file (MP4, MOV, AVI, MKV, WEBM).');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100 MB. Please use a shorter or compressed video.');
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
      setUploadProgress(0);
      setUploadStatus('');
      setAnalysisTime(null);
      setCurrentStep(-1);
    };
    reader.readAsDataURL(file);
  };

  const clearVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    setAnalysisResults(null);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setUploadProgress(0);
    setUploadStatus('');
    setAnalysisTime(null);
    setCurrentStep(-1);
    clearStepTimers();
  };

  const analyzeVideo = async () => {
    if (!video) return;
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('Preparing video for upload...');
    startTimeRef.current = Date.now();
    startStepProgression();

    try {
      const formData = new FormData();
      formData.append('video', video);

      const progressHandler = (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
        setUploadStatus(`Uploading video... ${pct}%`);
        if (pct === 100) setUploadStatus('Processing frames on server — this may take a while...');
      };

      setUploadStatus('Uploading video...');
      const response = await ApiService.analyzeVideo(formData, progressHandler);

      clearStepTimers();

      if (response.success) {
        setCurrentStep(4);
        setAnalysisTime(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
        setAnalysisResults(response);
        setUploadStatus('Analysis complete!');
      } else {
        setError(response.error || 'Analysis failed. Please try another video.');
        setUploadStatus('');
        setCurrentStep(-1);
      }
    } catch (err) {
      clearStepTimers();
      console.error('Error analyzing video:', err);
      setError(err.error || 'Server error. Please try again later.');
      setUploadStatus('');
      setCurrentStep(-1);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // --- Video player controls ---
  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setIsPlaying(!isPlaying);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };
  const skipForward = () => { if (videoRef.current) { videoRef.current.currentTime += 10; setCurrentTime(videoRef.current.currentTime); } };
  const skipBackward = () => { if (videoRef.current) { videoRef.current.currentTime -= 10; setCurrentTime(videoRef.current.currentTime); } };
  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const t = (e.target.value / 100) * duration;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isInManipulationRegion = () =>
    analysisResults?.detection_regions?.some(r => currentTime >= r.start_time && currentTime <= r.end_time);

  const getCurrentRegion = () =>
    analysisResults?.detection_regions?.find(r => currentTime >= r.start_time && currentTime <= r.end_time);

  const jumpToNextManipulation = () => {
    if (!analysisResults?.detection_regions || !videoRef.current) return;
    const next = analysisResults.detection_regions.find(r => r.start_time > currentTime);
    if (next) { videoRef.current.currentTime = next.start_time; setCurrentTime(next.start_time); }
  };

  const verdictColor = analysisResults
    ? analysisResults.deepfake_probability > 0.5 ? 'text-red-600' : 'text-emerald-600'
    : '';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Video Analysis & Deepfake Detection</h1>
        <p className="text-gray-500 mt-1">
          Upload a video to detect AI-manipulated frames. Each sampled frame is classified by a Vision Transformer
          model (<code className="text-xs bg-gray-100 px-1 rounded">dima806/deepfake_vs_real_image_detection</code>)
          running locally, with automatic fallback to the HuggingFace Inference API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Upload Video</h2>
              <p className="text-sm text-gray-500 mt-0.5">MP4, MOV, AVI, MKV or WEBM — max 100 MB</p>
            </div>

            {!videoPreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 font-medium text-gray-600">Drop a video here</p>
                <p className="mt-1 text-sm text-gray-500">or <span className="text-blue-600 underline underline-offset-2">click to browse</span></p>
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

                  {/* Manipulation overlay */}
                  {analysisResults && isInManipulationRegion() && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center text-xs py-1.5 px-2 animate-pulse flex items-center justify-center gap-1.5">
                      <AlertTriangle size={12} />
                      Deepfake Detected: {getCurrentRegion()?.type || 'Face Manipulation'}
                    </div>
                  )}

                  {/* Custom controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center mb-1.5">
                      <span className="text-white text-xs mr-2 w-10 text-right shrink-0">{formatTime(currentTime)}</span>
                      <div className="flex-1 relative">
                        <input
                          type="range" min="0" max="100"
                          value={(currentTime / (duration || 1)) * 100}
                          onChange={handleSeek}
                          className="w-full cursor-pointer accent-white"
                        />
                        {analysisResults?.detection_regions && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none">
                            {analysisResults.detection_regions.map((r, i) => (
                              <div
                                key={i}
                                className="absolute h-full bg-red-500 rounded"
                                style={{ left: `${(r.start_time / duration) * 100}%`, width: `${((r.end_time - r.start_time) / duration) * 100}%` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-white text-xs ml-2 w-10 shrink-0">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <button onClick={skipBackward} className="text-white p-1 hover:bg-white/20 rounded"><SkipBack size={15} /></button>
                        <button onClick={togglePlay} className="text-white p-1.5 hover:bg-white/20 rounded-full bg-white/10">
                          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button onClick={skipForward} className="text-white p-1 hover:bg-white/20 rounded"><SkipForward size={15} /></button>
                      </div>
                      <button onClick={toggleMute} className="text-white p-1 hover:bg-white/20 rounded">
                        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={clearVideo} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}

            {/* File info */}
            {video && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 flex justify-between">
                <span className="font-medium truncate">{video.name}</span>
                <span className="ml-2 shrink-0">{formatFileSize(video.size)}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {videoPreview && !analysisResults && !isAnalyzing && (
              <button
                onClick={analyzeVideo}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Analyze Video
              </button>
            )}

            {/* Step-by-step progress */}
            {isAnalyzing && (
              <div className="space-y-3">
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  {VIDEO_ANALYSIS_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const done = idx < currentStep;
                    const active = idx === currentStep;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2 text-sm transition-opacity ${
                          done ? 'opacity-50' : active ? 'opacity-100' : 'opacity-25'
                        }`}
                      >
                        {done
                          ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          : active
                          ? <Loader className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                          : <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
                        <span className={active ? 'font-medium text-blue-700' : 'text-gray-600'}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {uploadStatus && (
                  <p className="text-xs text-blue-600 italic">{uploadStatus}</p>
                )}
              </div>
            )}

            {/* Jump to manipulation */}
            {analysisResults?.detection_regions?.length > 0 && (
              <button
                onClick={jumpToNextManipulation}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Jump to Next Detected Manipulation
              </button>
            )}

            {analysisResults && (
              <button
                onClick={clearVideo}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Upload className="w-4 h-4" /> Analyze Another Video
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!analysisResults && !isAnalyzing ? 'lg:opacity-60' : ''}`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Analysis Results</h2>
              {analysisTime && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {analysisTime}s
                </span>
              )}
            </div>

            {!videoPreview && (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                <Video className="w-12 h-12 mb-2" />
                <p className="font-medium">No video uploaded</p>
                <p className="text-sm mt-1">Upload a video to see detection results here.</p>
              </div>
            )}

            {videoPreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                <Info className="w-12 h-12 mb-2 text-blue-300" />
                <p className="font-medium text-gray-600">Ready to analyze</p>
                <p className="text-sm mt-1">Click "Analyze Video" to start frame-by-frame detection.</p>
                <p className="text-xs mt-2 text-gray-400">Each frame is classified independently using a ViT model.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-blue-600 font-medium">Analyzing video frames...</p>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  Each sampled frame is passed through the deepfake detection model individually.
                  Longer videos take more time.
                </p>
              </div>
            )}

            {analysisResults && (
              <div className="space-y-5">

                {/* Inference source */}
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md border ${
                  analysisResults.model_used && !analysisResults.model_used.includes('fallback')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {analysisResults.model_used && !analysisResults.model_used.includes('fallback')
                    ? <Cpu className="w-3.5 h-3.5 shrink-0" />
                    : <Wifi className="w-3.5 h-3.5 shrink-0" />}
                  <span>
                    {analysisResults.model_used && !analysisResults.model_used.includes('fallback')
                      ? 'Local inference'
                      : 'HF API fallback'} —{' '}
                    <span className="opacity-75">{analysisResults.model_used || 'dima806/deepfake_vs_real_image_detection'}</span>
                  </span>
                </div>

                {/* Main verdict */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Detection Verdict</h3>
                  </div>

                  <div className={`rounded-md px-4 py-3 flex items-center gap-3 ${
                    analysisResults.deepfake_probability > 0.5 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <div>
                      <p className={`font-bold text-base ${verdictColor}`}>
                        {analysisResults.deepfake_probability > 0.5 ? 'Manipulated Content Detected' : 'Likely Authentic Content'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {analysisResults.deepfake_probability > 0.5
                          ? `${(analysisResults.deepfake_probability * 100).toFixed(2)}% of analyzed frames are classified as deepfake`
                          : `${(analysisResults.authenticity_score * 100).toFixed(2)}% of analyzed frames appear authentic`}
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Authentic</span>
                      <span>Manipulated</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${analysisResults.deepfake_probability > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(analysisResults.deepfake_probability > 0.5 ? analysisResults.deepfake_probability : analysisResults.authenticity_score) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Deepfake probability: <span className="font-semibold text-gray-700">{(analysisResults.deepfake_probability * 100).toFixed(2)}%</span></span>
                      <span>Confidence: <span className="font-semibold text-gray-700">{(analysisResults.confidence * 100).toFixed(1)}%</span></span>
                    </div>
                  </div>

                  {/* Frame stats */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <p className="text-xs text-gray-400">Frames Analyzed</p>
                      <p className="text-lg font-bold text-gray-800">{analysisResults.total_frames}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <p className="text-xs text-gray-400">Fake Frames</p>
                      <p className={`text-lg font-bold ${analysisResults.detected_frames > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {analysisResults.detected_frames}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <p className="text-xs text-gray-400">Detection Rate</p>
                      <p className={`text-lg font-bold ${analysisResults.deepfake_probability > 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {analysisResults.total_frames > 0
                          ? `${Math.round((analysisResults.detected_frames / analysisResults.total_frames) * 100)}%`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {analysisResults.manipulation_type && (
                    <div className="text-sm text-gray-600 bg-white rounded px-3 py-2 border border-gray-200">
                      Manipulation type: <span className="font-semibold text-gray-800">{analysisResults.manipulation_type}</span>
                    </div>
                  )}

                  {analysisResults.threshold_used !== undefined && (
                    <p className="text-xs text-gray-400">
                      Threshold used: a frame is flagged as fake when its real-score is below{' '}
                      <span className="font-medium">{(analysisResults.threshold_used * 100).toFixed(0)}%</span> (stricter than image mode).
                    </p>
                  )}
                </div>

                {/* Video metadata */}
                {analysisResults.video_metadata && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">Video Properties</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Duration',      value: formatTime(analysisResults.video_metadata.duration) },
                        { label: 'Resolution',    value: analysisResults.video_metadata.resolution },
                        { label: 'Frame Rate',    value: `${analysisResults.video_metadata.fps.toFixed(1)} fps` },
                        { label: 'Total Frames',  value: analysisResults.video_metadata.frames },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="font-semibold text-gray-800 text-sm mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manipulated segments */}
                {analysisResults.detection_regions?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <h3 className="font-semibold text-gray-800">
                        Manipulated Segments
                        <span className="ml-2 text-xs font-normal text-gray-400">({analysisResults.detection_regions.length} region{analysisResults.detection_regions.length > 1 ? 's' : ''})</span>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResults.detection_regions.map((region, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-red-800 text-sm">{region.type || 'Face Manipulation'}</span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              {formatTime(region.start_time)} to {formatTime(region.end_time)}
                            </span>
                          </div>
                          <p className="text-xs text-red-500 mt-1">
                            Duration: {(region.end_time - region.start_time).toFixed(1)}s
                          </p>
                          <div className="mt-2 w-full h-1.5 bg-red-100 rounded-full relative">
                            <div
                              className="absolute h-full bg-red-500 rounded-full"
                              style={{
                                left: `${(region.start_time / (duration || 1)) * 100}%`,
                                width: `${((region.end_time - region.start_time) / (duration || 1)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResults.detection_regions?.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 shrink-0" />
                    No manipulated segments detected in this video.
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

export default VideoAnalysisContent;
