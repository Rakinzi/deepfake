import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Text as TextIcon, 
  X, 
  FileText, 
  Shield, 
  Check, 
  AlertCircle,
  Sparkles,
  Loader,
  Info,
  Braces,
  Bot,
  Brain,
  BarChart,
  ListFilter,
  Lightbulb,
  User
} from 'lucide-react';

const TextAnalysisContent = () => {
  const [text, setText] = useState('');
  const [textFile, setTextFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [textSource, setTextSource] = useState('input'); // 'input' or 'file'
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setAnalysisResults(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.match('text.*') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Please select a text file (.txt, .md, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setText(content);
      setTextFile(file);
      setTextSource('file');
      setError(null);
      setAnalysisResults(null);
    };
    reader.readAsText(file);
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

  const clearText = () => {
    setText('');
    setTextFile(null);
    setTextSource('input');
    setAnalysisResults(null);
    setError(null);
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      setError('Please enter or upload text to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock analysis results
        setAnalysisResults({
          ai_generated_probability: 0.93,
          human_written_probability: 0.07,
          classification: "AI-Generated",
          confidence: 0.91,
          language_metrics: {
            perplexity: 14.2, // Lower values indicate likely AI-generated
            burstiness: 0.31, // Lower values indicate likely AI-generated
            complexity: 0.58, // Scale of 0-1
            creativity: 0.42, // Scale of 0-1
            repetitiveness: 0.34, // Scale of 0-1
          },
          ai_model_detection: {
            likely_models: [
              { name: "GPT-4", probability: 0.75 },
              { name: "Claude", probability: 0.15 },
              { name: "Other LLM", probability: 0.10 }
            ]
          },
          content_analysis: {
            word_count: text.split(/\s+/).filter(word => word.length > 0).length,
            sentence_count: text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length,
            readability_score: 68.5, // Flesch Reading Ease (0-100)
            grade_level: "10th Grade",
            sentiment: {
              positive: 0.35,
              neutral: 0.52,
              negative: 0.13
            }
          },
          key_phrases: [
            "artificial intelligence",
            "natural language processing",
            "machine learning",
            "data analysis",
            "neural networks"
          ]
        });
        
        setIsAnalyzing(false);
      }, 2000);
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError('Server error. Please try again later.');
      setIsAnalyzing(false);
    }
  };

  const renderTextInput = () => {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter or paste text here for analysis..."
        ></textarea>
        <div className="absolute top-2 right-2 flex space-x-2">
          {text && (
            <button
              onClick={clearText}
              className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100 border border-gray-200"
              title="Clear text"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={handleUploadButtonClick}
            className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100 border border-gray-200"
            title="Upload text file"
          >
            <Upload className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.text,text/plain"
          className="hidden"
        />
      </div>
    );
  };

  const renderFileDropZone = () => {
    return (
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
          accept=".txt,.md,.text,text/plain"
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-600">Drag and drop a text file here, or click to browse</p>
        <p className="mt-1 text-sm text-gray-500">TXT, MD up to 10MB</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Text Analysis & AI Detection</h1>
        <p className="text-gray-500 mt-1">Analyze text to determine if it was written by a human or generated by an AI system.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Text Input</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setTextSource('input')} 
                  className={`px-3 py-1 text-sm rounded-lg ${
                    textSource === 'input' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Type/Paste
                </button>
                <button 
                  onClick={() => setTextSource('file')} 
                  className={`px-3 py-1 text-sm rounded-lg ${
                    textSource === 'file' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {textSource === 'input' ? renderTextInput() : renderFileDropZone()}

            {textFile && textSource === 'file' && (
              <div className="mt-2 flex items-center bg-blue-50 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">{textFile.name}</span>
                <button 
                  onClick={clearText}
                  className="ml-auto p-1 hover:bg-blue-100 rounded-full"
                >
                  <X className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {text && !analysisResults && !isAnalyzing && (
              <button
                onClick={analyzeText}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Text
              </button>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 w-full bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center">
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Text...
              </div>
            )}
          </div>
        </div>

        {/* Analysis results */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${!analysisResults && !isAnalyzing ? 'lg:opacity-60' : ''}`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h2>
            
            {!text && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <TextIcon className="w-12 h-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Enter or upload text to see analysis results</p>
              </div>
            )}
            
            {text && !analysisResults && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Info className="w-12 h-12 text-blue-300" />
                <p className="mt-2 text-gray-500">Click "Analyze Text" to start analysis</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-blue-600 font-medium">Analyzing your text...</p>
                <p className="text-sm text-gray-500 mt-2">Detecting patterns and language characteristics</p>
              </div>
            )}
            
            {analysisResults && (
              <div className="space-y-6">
                {/* Main classification */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Detection Results</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${
                          analysisResults.classification === "AI-Generated" ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {analysisResults.classification === "AI-Generated" ? (
                            <Bot className={`w-6 h-6 text-red-500`} />
                          ) : (
                            <User className={`w-6 h-6 text-green-500`} />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-gray-800">
                            {analysisResults.classification}
                          </div>
                          <div className="text-xs text-gray-500">
                            Confidence: {(analysisResults.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysisResults.classification === "AI-Generated" ? 
                            'bg-red-100 text-red-700' : 
                            'bg-green-100 text-green-700'
                        }`}>
                          {analysisResults.classification === "AI-Generated" ? 
                            `${(analysisResults.ai_generated_probability * 100).toFixed(0)}% AI` :
                            `${(analysisResults.human_written_probability * 100).toFixed(0)}% Human`
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${analysisResults.ai_generated_probability * 100}%` }}
                          ></div>
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${analysisResults.human_written_probability * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>AI-Generated</span>
                        <span>Human-Written</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI model detection */}
                  {analysisResults.ai_model_detection && analysisResults.ai_model_detection.likely_models && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Brain className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Likely AI Model</span>
                      </div>
                      <div className="space-y-2">
                        {analysisResults.ai_model_detection.likely_models.map((model, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{model.name}</span>
                            <div className="flex items-center">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${model.probability * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{(model.probability * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Language metrics */}
                {analysisResults.language_metrics && (
                  <div>
                    <div className="flex items-center mb-3">
                      <BarChart className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Language Metrics</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Perplexity</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-800">{analysisResults.language_metrics.perplexity.toFixed(1)}</div>
                          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            {analysisResults.language_metrics.perplexity < 20 ? 'Low (AI-Like)' : 'High (Human-Like)'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Burstiness</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-800">{analysisResults.language_metrics.burstiness.toFixed(2)}</div>
                          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            {analysisResults.language_metrics.burstiness < 0.4 ? 'Low (AI-Like)' : 'High (Human-Like)'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Complexity</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 h-1.5 rounded-full mr-2">
                            <div 
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${analysisResults.language_metrics.complexity * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(analysisResults.language_metrics.complexity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Repetitiveness</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 h-1.5 rounded-full mr-2">
                            <div 
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${analysisResults.language_metrics.repetitiveness * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(analysisResults.language_metrics.repetitiveness * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Content analysis */}
                {analysisResults.content_analysis && (
                  <div>
                    <div className="flex items-center mb-3">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Content Statistics</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1 min-w-[120px]">
                        <div className="text-sm text-gray-500">Word Count</div>
                        <div className="text-lg font-medium text-gray-800">{analysisResults.content_analysis.word_count}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1 min-w-[120px]">
                        <div className="text-sm text-gray-500">Sentence Count</div>
                        <div className="text-lg font-medium text-gray-800">{analysisResults.content_analysis.sentence_count}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1 min-w-[120px]">
                        <div className="text-sm text-gray-500">Readability</div>
                        <div className="text-lg font-medium text-gray-800">{analysisResults.content_analysis.readability_score}</div>
                        <div className="text-xs text-gray-500">{analysisResults.content_analysis.grade_level}</div>
                      </div>
                    </div>
                    
                    {/* Sentiment */}
                    {analysisResults.content_analysis.sentiment && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Sentiment Analysis</div>
                        <div className="flex items-center h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${analysisResults.content_analysis.sentiment.positive * 100}%` }}
                          ></div>
                          <div 
                            className="h-full bg-gray-400" 
                            style={{ width: `${analysisResults.content_analysis.sentiment.neutral * 100}%` }}
                          ></div>
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${analysisResults.content_analysis.sentiment.negative * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className="text-green-600">
                            Positive: {(analysisResults.content_analysis.sentiment.positive * 100).toFixed(0)}%
                          </span>
                          <span className="text-gray-500">
                            Neutral: {(analysisResults.content_analysis.sentiment.neutral * 100).toFixed(0)}%
                          </span>
                          <span className="text-red-600">
                            Negative: {(analysisResults.content_analysis.sentiment.negative * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Key phrases */}
                {analysisResults.key_phrases && analysisResults.key_phrases.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">Key Phrases</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.key_phrases.map((phrase, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {phrase}
                        </span>
                      ))}
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

export default TextAnalysisContent;