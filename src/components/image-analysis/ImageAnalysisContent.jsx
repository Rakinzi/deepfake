import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image, 
  X, 
  FileText, 
  Shield, 
  Check, 
  AlertCircle,
  Sparkles,
  Loader,
  Info,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';

const ImageAnalysisContent = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImage(file);
      setError(null);
      setAnalysisResults(null);
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

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setAnalysisResults(null);
    setError(null);
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Create form data to send to the backend
      const formData = new FormData();
      formData.append('image', image);
      
      // Send image to backend for analysis
      const response = await fetch('http://localhost:5000/api/analyze-face', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisResults(data.results);
        console.log('Results:', data.results);
      } else {
        setError(data.error || 'Analysis failed. Please try another image.');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Server error. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get the dominant emotion from emotion object
  const getDominantEmotion = (emotions) => {
    if (!emotions) return null;
    return Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Face Analysis & Fake Detection</h1>
        <p className="text-gray-500 mt-1">Upload a face image to analyze and check if it's real or AI-generated using DeepFace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Image</h2>

            {!imagePreview ? (
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
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-600">Drag and drop a face image here, or click to browse</p>
                <p className="mt-1 text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-auto rounded-lg object-contain max-h-96"
                />
                <button
                  onClick={clearImage}
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
            
            {imagePreview && !analysisResults && !isAnalyzing && (
              <button
                onClick={analyzeImage}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Face
              </button>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 w-full bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Image...
              </div>
            )}
          </div>
        </div>

        {/* Analysis results */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!analysisResults && !isAnalyzing ? 'lg:opacity-60' : ''}`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
            
            {!imagePreview && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Image className="w-12 h-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Upload an image to see analysis results</p>
              </div>
            )}
            
            {imagePreview && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Info className="w-12 h-12 text-blue-300" />
                <p className="mt-2 text-gray-500">Click "Analyze Face" to start analysis</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-blue-600 font-medium">Analyzing your image...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            )}
            
            {analysisResults && (
              <div className="space-y-6">
                {/* Face detection result */}
                {analysisResults.faces && analysisResults.faces.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <Shield className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">DeepFace Anti-Spoofing Results</h3>
                    </div>
                    
                    {analysisResults.faces.map((face, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {face.is_real ? (
                              <>
                                <UserCheck className="w-6 h-6 text-green-500" />
                                <span className="font-medium text-green-600">Real Face Detected</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-6 h-6 text-red-500" />
                                <span className="font-medium text-red-600">Fake/AI-Generated Face</span>
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {face.is_real ? 
                                `${(face.real_score * 100).toFixed(1)}% real` : 
                                `Spoof type: ${face.spoofing_type}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={face.is_real ? 'bg-green-500' : 'bg-red-500'}
                            style={{ width: `${face.is_real ? face.real_score * 100 : 100 - (face.real_score * 100)}%`, height: '100%' }}
                          ></div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Detection confidence: {face.confidence ? `${(face.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Person attributes */}
                {analysisResults.analysis && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Activity className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Person Attributes</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {analysisResults.analysis.age !== undefined && (
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Age</div>
                          <div className="text-xl font-semibold text-gray-800">{Math.round(analysisResults.analysis.age)}</div>
                        </div>
                      )}
                      
                      {analysisResults.analysis.gender && (
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Gender</div>
                          <div className="text-xl font-semibold text-gray-800">{analysisResults.analysis.gender}</div>
                        </div>
                      )}
                      
                      {analysisResults.analysis.race && (
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Ethnicity</div>
                          <div className="text-xl font-semibold text-gray-800 capitalize">{analysisResults.analysis.race}</div>
                        </div>
                      )}
                      
                      {analysisResults.analysis.emotion && (
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Emotion</div>
                          <div className="text-xl font-semibold text-gray-800 capitalize">{getDominantEmotion(analysisResults.analysis.emotion)}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Emotion details */}
                    {analysisResults.analysis.emotion && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-2">Emotion Analysis</div>
                        <div className="space-y-2">
                          {Object.entries(analysisResults.analysis.emotion)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([emotion, score]) => (
                              <div key={emotion} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{emotion}</span>
                                <div className="flex items-center">
                                  <span className="text-xs mr-2">{(score * 100).toFixed(1)}%</span>
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600" 
                                      style={{ width: `${score * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Image quality */}
                {analysisResults.quality && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Check className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Image Quality Metrics</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-800">Sharpness</div>
                        <div className="text-gray-600 mt-1">{parseFloat(analysisResults.quality.sharpness).toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-800">Brightness</div>
                        <div className="text-gray-600 mt-1">{parseFloat(analysisResults.quality.brightness).toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-800">Contrast</div>
                        <div className="text-gray-600 mt-1">{parseFloat(analysisResults.quality.contrast).toFixed(1)}</div>
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

export default ImageAnalysisContent;