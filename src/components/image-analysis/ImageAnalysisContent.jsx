import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Image, X, FileText, Shield, Check, AlertCircle,
  Sparkles, Loader, Info, UserCheck, UserX, Activity, History
} from 'lucide-react';
import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const ImageAnalysisContent = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!AuthService.isLoggedIn()) navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await AuthService.getUserHistory();
      if (response.success) setHistory(response.history);
    } catch { } finally { setIsLoadingHistory(false); }
  };

  const processFile = (file) => {
    if (!file.type.match('image.*')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size exceeds 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setImagePreview(e.target.result); setImage(file); setError(null); setAnalysisResults(null); };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await ApiService.analyzeFace(image);
      if (response.success) {
        setAnalysisResults(response);
        if (showHistory) loadHistory();
      } else {
        setError(response.error || 'Analysis failed.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-xl">Face Analysis & Fake Detection</CardTitle>
              <CardDescription>Upload a face image to check if it's real or AI-generated.</CardDescription>
            </div>
            <Button
              variant={showHistory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
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
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">No analysis history found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="h-28 bg-muted flex items-center justify-center">
                      <Image className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{item.original_filename}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant={item.is_real ? 'outline' : 'destructive'} className="text-xs">
                          {item.is_real ? 'Authentic' : 'Fake'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                      </div>
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
          </CardHeader>
          <CardContent>
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
                <p className="text-sm text-muted-foreground">Drag and drop a face image, or <span className="text-foreground font-medium">browse</span></p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-80" />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => { setImage(null); setImagePreview(null); setAnalysisResults(null); setError(null); }}
                  className="absolute top-2 right-2 h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {imagePreview && !analysisResults && !isAnalyzing && (
              <Button onClick={analyzeImage} className="mt-4 w-full gap-2">
                <Sparkles className="w-4 h-4" /> Analyze Face
              </Button>
            )}

            {isAnalyzing && (
              <div className="mt-4 w-full bg-muted text-muted-foreground py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm">
                <Loader className="w-4 h-4 animate-spin" /> Analyzing image...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={!analysisResults && !isAnalyzing ? 'opacity-60' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!imagePreview && (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <Image className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload an image to see results</p>
              </div>
            )}

            {imagePreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <Info className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click "Analyze Face" to start</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-56">
                <div className="w-12 h-12 border-4 border-border border-t-foreground rounded-full animate-spin mb-4" />
                <p className="font-medium text-sm">Analyzing your image...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            )}

            {analysisResults && (
              <div className="space-y-5">
                {/* Main result */}
                {analysisResults.faces?.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-sm">Detection Result</h3>
                    </div>
                    {analysisResults.faces.map((face, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {face.is_real
                              ? <><UserCheck className="w-5 h-5" /><span className="font-semibold text-sm">Real Face</span></>
                              : <><UserX className="w-5 h-5 text-destructive" /><span className="font-semibold text-sm text-destructive">Fake / AI-Generated</span></>
                            }
                          </div>
                          <Badge variant={face.is_real ? 'default' : 'destructive'}>
                            {face.is_real
                              ? `${(face.real_score * 100).toFixed(1)}% real`
                              : `${((1 - face.real_score) * 100).toFixed(1)}% synthetic`
                            }
                          </Badge>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${face.is_real ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${face.is_real ? face.real_score * 100 : (1 - face.real_score) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Confidence: {face.confidence ? `${(face.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Attributes */}
                {analysisResults.analysis && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-sm">Person Attributes</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {analysisResults.analysis.age !== undefined && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="text-lg font-bold mt-0.5">{Math.round(analysisResults.analysis.age)}</p>
                        </div>
                      )}
                      {analysisResults.analysis.race && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Ethnicity</p>
                          <p className="text-sm font-semibold mt-0.5 capitalize">{analysisResults.analysis.race}</p>
                        </div>
                      )}
                      {analysisResults.analysis.emotion && (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Emotion</p>
                          <p className="text-sm font-semibold mt-0.5 capitalize">{getDominantEmotion(analysisResults.analysis.emotion)}</p>
                        </div>
                      )}
                    </div>

                    {analysisResults.analysis.emotion && (
                      <div className="mt-3 bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Emotion Breakdown</p>
                        <div className="space-y-1.5">
                          {Object.entries(analysisResults.analysis.emotion).sort(([,a],[,b]) => b-a).slice(0,3).map(([emotion, score]) => (
                            <div key={emotion} className="flex items-center gap-2">
                              <span className="text-xs capitalize w-16 shrink-0">{emotion}</span>
                              <Progress value={score * 100} className="flex-1 h-1.5" />
                              <span className="text-xs text-muted-foreground w-10 text-right">{(score * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quality */}
                {analysisResults.quality && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-sm">Image Quality</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['sharpness', 'brightness', 'contrast'].map((k) => (
                        <div key={k} className="bg-muted rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground capitalize">{k}</p>
                          <p className="text-sm font-semibold mt-0.5">{parseFloat(analysisResults.quality[k]).toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResults.model_used && (
                  <p className="text-xs text-muted-foreground italic">Model: {analysisResults.model_used}</p>
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
