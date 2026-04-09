import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Image, X, FileText, Shield, Check, AlertCircle,
  Sparkles, Loader, Info, UserCheck, UserX, Activity, History,
  Cpu, Wifi, Eye, BarChart2, Zap, Clock
} from 'lucide-react';
import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ANALYSIS_STEPS = [
  { id: 'upload',     label: 'Uploading image to server',           icon: Upload },
  { id: 'preprocess', label: 'Preprocessing & quality check',        icon: Eye },
  { id: 'inference',  label: 'Running deepfake detection model',     icon: Cpu },
  { id: 'deepface',   label: 'Extracting facial attributes',         icon: Activity },
  { id: 'done',       label: 'Analysis complete',                    icon: Check },
];

const ImageAnalysisContent = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(null);

  const fileInputRef = useRef(null);
  const startTimeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!AuthService.isLoggedIn()) navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory]);

  // Simulate step progression while waiting for the real response
  useEffect(() => {
    if (!isAnalyzing) { setCurrentStep(-1); return; }
    setCurrentStep(0);
    const timings = [400, 900, 1800, 3200];
    const timers = timings.map((t, i) =>
      setTimeout(() => setCurrentStep(i + 1), t)
    );
    return () => timers.forEach(clearTimeout);
  }, [isAnalyzing]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await AuthService.getUserHistory();
      if (response.success) setHistory(response.history);
    } catch { } finally { setIsLoadingHistory(false); }
  };

  const processFile = (file) => {
    if (!file.type.match('image.*')) { setError('Please select an image file (PNG, JPG, WEBP, etc.)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size exceeds 5 MB. Please use a smaller image.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImage(file);
      setError(null);
      setAnalysisResults(null);
      setAnalysisTime(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    startTimeRef.current = Date.now();
    try {
      const response = await ApiService.analyzeFace(image);
      if (response.success) {
        setCurrentStep(4);
        setAnalysisTime(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
        setAnalysisResults(response);
        if (showHistory) loadHistory();
      } else {
        setError(response.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      setError(err.error || 'Server error. Please try again.');
      if (err.status === 401) { AuthService.logout(); navigate('/'); }
    } finally { setIsAnalyzing(false); }
  };

  const getDominantEmotion = (emotions) => {
    if (!emotions) return null;
    return Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLocalInference = (modelUsed) =>
    modelUsed && !modelUsed.toLowerCase().includes('fallback') && !modelUsed.toLowerCase().includes('api');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-xl">Face Analysis & Deepfake Detection</CardTitle>
              <CardDescription>
                Upload a face image to determine if it's real or AI-generated.
                Uses a local Vision Transformer model (dima806/deepfake_vs_real_image_detection)
                with automatic fallback to the HuggingFace Inference API.
              </CardDescription>
            </div>
            <Button
              variant={showHistory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 shrink-0"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'Show History'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* History */}
      {showHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analysis History</CardTitle>
            <CardDescription>Your previously analyzed images and their results.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-10 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-medium">No analyses yet</p>
                <p className="text-xs mt-1">Analyze your first image to see results here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="h-28 bg-muted flex items-center justify-center">
                      <Image className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-medium truncate">{item.original_filename}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={item.is_real ? 'outline' : 'destructive'} className="text-xs flex items-center gap-1">
                          {item.is_real
                            ? <><UserCheck className="w-3 h-3" /> Authentic</>
                            : <><UserX className="w-3 h-3" /> Deepfake</>}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(item.real_score * 100).toFixed(1)}% real
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upload Image</CardTitle>
            <CardDescription>PNG, JPG, or WEBP — max 5 MB. Best results with clear face photos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-foreground bg-muted/50' : 'border-border hover:border-foreground/50 hover:bg-muted/20'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current.click()}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]); }} accept="image/*" className="hidden" />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop an image here</p>
                <p className="text-xs text-muted-foreground mt-1">or <span className="text-foreground underline underline-offset-2">click to browse</span></p>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-80" />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => { setImage(null); setImagePreview(null); setAnalysisResults(null); setError(null); setAnalysisTime(null); }}
                  className="absolute top-2 right-2 h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* File info */}
            {image && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 flex items-center justify-between">
                <span className="truncate font-medium">{image.name}</span>
                <span className="ml-2 shrink-0">{formatFileSize(image.size)}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {imagePreview && !analysisResults && !isAnalyzing && (
              <Button onClick={analyzeImage} className="w-full gap-2">
                <Sparkles className="w-4 h-4" /> Analyze Image
              </Button>
            )}

            {/* Step-by-step progress */}
            {isAnalyzing && (
              <div className="space-y-2 pt-1">
                {ANALYSIS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const done = idx < currentStep;
                  const active = idx === currentStep;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-sm transition-opacity ${
                        done ? 'opacity-50' : active ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {done ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : active ? (
                        <Loader className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={active ? 'font-medium' : ''}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {analysisResults && (
              <Button
                variant="outline"
                onClick={() => { setImage(null); setImagePreview(null); setAnalysisResults(null); setError(null); setAnalysisTime(null); }}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" /> Analyze Another Image
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={!analysisResults && !isAnalyzing ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analysis Results</CardTitle>
            {analysisTime && (
              <CardDescription className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Completed in {analysisTime}s
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!imagePreview && (
              <div className="flex flex-col items-center justify-center h-56 text-center text-muted-foreground">
                <Image className="w-10 h-10 mb-2" />
                <p className="text-sm">Upload an image to see results</p>
              </div>
            )}

            {imagePreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-56 text-center text-muted-foreground">
                <Info className="w-10 h-10 mb-2" />
                <p className="text-sm">Click "Analyze Image" to begin</p>
                <p className="text-xs mt-1">The model will classify the image and extract facial attributes.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-56 gap-3">
                <div className="w-12 h-12 border-4 border-border border-t-foreground rounded-full animate-spin" />
                <p className="font-medium text-sm">Running analysis pipeline...</p>
                <p className="text-xs text-muted-foreground text-center max-w-52">
                  The model processes your image through a Vision Transformer to detect AI-generated artifacts.
                </p>
              </div>
            )}

            {analysisResults && (
              <div className="space-y-5">

                {/* Inference source badge */}
                {analysisResults.model_used && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md border ${
                    isLocalInference(analysisResults.model_used)
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                  }`}>
                    {isLocalInference(analysisResults.model_used)
                      ? <Cpu className="w-3.5 h-3.5 shrink-0" />
                      : <Wifi className="w-3.5 h-3.5 shrink-0" />}
                    <span>
                      {isLocalInference(analysisResults.model_used) ? 'Local inference' : 'HF API fallback'} —{' '}
                      <span className="opacity-80">{analysisResults.model_used}</span>
                    </span>
                  </div>
                )}

                {/* Main verdict */}
                {analysisResults.faces?.length > 0 && analysisResults.faces.map((face, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Detection Verdict</h3>
                    </div>

                    <div className={`rounded-md px-4 py-3 flex items-center gap-3 ${
                      face.is_real ? 'bg-emerald-500/10' : 'bg-destructive/10'
                    }`}>
                      {face.is_real
                        ? <UserCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                        : <UserX className="w-6 h-6 text-destructive shrink-0" />}
                      <div>
                        <p className={`font-semibold text-sm ${face.is_real ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
                          {face.is_real ? 'Real / Authentic Face' : 'Fake / AI-Generated Face'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {face.is_real
                            ? `${(face.real_score * 100).toFixed(2)}% probability of being real`
                            : `${((1 - face.real_score) * 100).toFixed(2)}% probability of being synthetic`}
                        </p>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Fake</span>
                        <span>Real</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"
                          style={{ width: `${face.real_score * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Real score: <span className="font-medium text-foreground">{(face.real_score * 100).toFixed(2)}%</span></span>
                        <span className="text-muted-foreground">Confidence: <span className="font-medium text-foreground">{(face.confidence * 100).toFixed(2)}%</span></span>
                      </div>
                    </div>

                    {!face.is_real && face.spoofing_type && face.spoofing_type !== 'unknown' && (
                      <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                        Detected manipulation type: <span className="font-medium text-foreground">{face.spoofing_type}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Facial attributes */}
                {analysisResults.analysis && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Detected Facial Attributes</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {analysisResults.analysis.age !== undefined && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Estimated Age</p>
                          <p className="text-2xl font-bold mt-0.5">{Math.round(analysisResults.analysis.age)}</p>
                          <p className="text-xs text-muted-foreground">years</p>
                        </div>
                      )}
                      {analysisResults.analysis.race && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Ethnicity</p>
                          <p className="text-sm font-semibold mt-1 capitalize">{analysisResults.analysis.race}</p>
                        </div>
                      )}
                      {analysisResults.analysis.emotion && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Dominant Emotion</p>
                          <p className="text-sm font-semibold mt-1 capitalize">{getDominantEmotion(analysisResults.analysis.emotion)}</p>
                        </div>
                      )}
                    </div>

                    {analysisResults.analysis.emotion && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Emotion Breakdown (top 5)</p>
                        </div>
                        {Object.entries(analysisResults.analysis.emotion)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([emotion, score]) => (
                            <div key={emotion} className="flex items-center gap-2">
                              <span className="text-xs capitalize w-16 shrink-0">{emotion}</span>
                              <Progress value={score * 100} className="flex-1 h-1.5" />
                              <span className="text-xs text-muted-foreground w-12 text-right">{(score * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Image quality */}
                {analysisResults.quality && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Image Quality Metrics</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'sharpness', label: 'Sharpness', hint: 'Laplacian variance' },
                        { key: 'brightness', label: 'Brightness', hint: 'Mean pixel intensity' },
                        { key: 'contrast', label: 'Contrast', hint: 'Std deviation' },
                      ].map(({ key, label, hint }) => (
                        <div key={key} className="bg-muted rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-semibold mt-0.5">{parseFloat(analysisResults.quality[key]).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageAnalysisContent;
