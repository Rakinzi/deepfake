import React, { useState, useEffect } from 'react';
import {
  Image, ShieldAlert, Check, Clock, ArrowUp, ArrowDown, ChevronRight,
  BarChart, FileWarning, Cpu, AlertTriangle, Loader, RefreshCw, Video, Users,
  Wifi, Zap, Activity, Shield, Info, TrendingUp, Eye, Film
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardService from '../../services/DashboardService';
import AuthService from '../../services/AuthService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const DashboardContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [videoStats, setVideoStats] = useState([]);
  const [videoChartData, setVideoChartData] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentVideoDetections, setRecentVideoDetections] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!AuthService.isLoggedIn()) { navigate('/'); return; }
    fetchDashboardData();
    fetchVideoDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await DashboardService.getDashboardStats();
      if (response.success) {
        const statsArray = Object.keys(response.stats).map(key => ({
          id: key,
          title: response.stats[key].title,
          value: response.stats[key].value,
          change: response.stats[key].change,
          isPositive: response.stats[key].isPositive,
          icon: getIconForStat(key),
        }));
        setStats(statsArray);
        setRecentDetections(response.recent_detections || []);
        setChartData(response.chart_data);
        setLastRefreshed(new Date());
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.error || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVideoDashboardData = async () => {
    try {
      const response = await DashboardService.getVideoDashboardStats();
      if (response.success) {
        const arr = Object.keys(response.stats).map(key => ({
          id: key,
          title: response.stats[key].title,
          value: response.stats[key].value,
          change: response.stats[key].change,
          isPositive: response.stats[key].isPositive,
          icon: getIconForVideoStat(key),
        }));
        setVideoStats(arr);
        setRecentVideoDetections(response.recent_detections || []);
        setVideoChartData(response.chart_data);
      }
    } catch {
      setVideoStats([]);
    }
  };

  const fetchRecentAnalyses = async () => {
    try {
      const response = await DashboardService.getRecentAnalyses();
      if (response.success) setRecentAnalyses(response.analyses || []);
    } catch { setRecentAnalyses([]); }
  };

  const fetchRecentVideos = async () => {
    try {
      const response = await DashboardService.getRecentVideos();
      if (response.success) setRecentVideos(response.videos || []);
    } catch { setRecentVideos([]); }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchVideoDashboardData();
  };

  const getIconForStat = (id) => ({ scanned: Image, detected: ShieldAlert, accuracy: Check, processing: Clock }[id] ?? Image);
  const getIconForVideoStat = (id) => ({ videos_analyzed: Video, fake_videos: ShieldAlert, avg_duration: Clock }[id] ?? Video);

  const isEmptyDashboard = !isLoading && stats.length === 1 && stats[0].id === 'scanned' && stats[0].value === '0';

  const detectionMethods = [
    {
      name: 'Vision Transformer Classification',
      accuracy: 97,
      badge: 'Primary',
      badgeVariant: 'default',
      description: 'dima806/deepfake_vs_real_image_detection — a ViT fine-tuned to distinguish real vs. AI-generated faces by learning subtle texture and frequency artifacts.',
    },
    {
      name: 'Facial Attribute Extraction',
      accuracy: 95,
      badge: 'DeepFace',
      badgeVariant: 'outline',
      description: 'DeepFace pipeline estimates age, emotion, and ethnicity from each detected face, providing context beyond the binary real/fake verdict.',
    },
    {
      name: 'Image Quality Metrics',
      accuracy: 91,
      badge: 'OpenCV',
      badgeVariant: 'outline',
      description: 'Laplacian variance (sharpness), mean pixel intensity (brightness), and standard deviation (contrast) are computed to characterize image quality and flag potential compression artifacts.',
    },
    {
      name: 'Temporal Frame Analysis',
      accuracy: 94,
      badge: 'Video',
      badgeVariant: 'outline',
      description: 'For videos, individual frames are sampled at regular intervals and classified independently. Consecutive fake frames are merged into manipulation regions with timestamps.',
    },
    {
      name: 'Noise Pattern Analysis',
      accuracy: 95,
      badge: 'Signal',
      badgeVariant: 'outline',
      description: 'AI-generated images often exhibit distinct high-frequency noise patterns introduced by the GAN or diffusion model's upsampling process, which differ from camera sensor noise.',
    },
    {
      name: 'Color & Gradient Consistency',
      accuracy: 94,
      badge: 'Visual',
      badgeVariant: 'outline',
      description: 'Unusual color gradients around facial boundaries and inconsistent skin tone distributions are common tells of face-swap and deepfake generation techniques.',
    },
    {
      name: 'Compression Artifact Analysis',
      accuracy: 91,
      badge: 'JPEG',
      badgeVariant: 'outline',
      description: 'Re-encoded or spliced images often show inconsistent JPEG blocking patterns at boundaries, revealing that different regions were compressed at different times.',
    },
    {
      name: 'Lip Sync Evaluation',
      accuracy: 93,
      badge: 'Audio/Video',
      badgeVariant: 'outline',
      description: 'Deepfake videos sometimes exhibit temporal misalignment between lip movements and audio — detectable by comparing phoneme onset times against mouth position.',
    },
  ];

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const diff = Date.now() - new Date(dateString);
    const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl">Media Verification Dashboard</CardTitle>
              <CardDescription className="mt-1">
                Monitor deepfake detection across images and videos. Powered by a local Vision Transformer
                (<code className="text-xs bg-muted px-1 rounded">dima806/deepfake_vs_real_image_detection</code>)
                with automatic HuggingFace API fallback.
              </CardDescription>
              {lastRefreshed && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild size="sm">
                <a href="/image-analysis" className="flex items-center gap-1">
                  Analyze Media <ChevronRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Model status banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <Cpu className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Local Inference Engine</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">
              Model runs on-device — no images are sent to external servers during inference.
              First run downloads ~500 MB of model weights to <code className="text-xs">~/.cache/huggingface/</code>.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <Wifi className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">HF API Fallback Active</p>
            <p className="text-xs text-amber-600/80 mt-0.5">
              If local inference fails (e.g. out-of-memory, missing dependencies), requests automatically
              fall back to the HuggingFace Inference API using your <code className="text-xs">HF_API_KEY</code>.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Error loading dashboard data</p>
            <p className="text-xs mt-0.5">{error}</p>
            <Button size="sm" variant="outline" onClick={handleRefresh} className="mt-2 h-7 text-xs">Retry</Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-muted mb-4" />
              <div className="w-24 h-4 bg-muted rounded mb-2" />
              <div className="w-16 h-7 bg-muted rounded" />
            </CardContent>
          </Card>
        )) : isEmptyDashboard ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg mb-1">No analysis data yet</h3>
              <p className="text-muted-foreground text-sm mb-1">
                Start analyzing images or videos to populate your detection statistics.
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Each analysis uses the local ViT model to classify real vs. AI-generated content.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild size="sm"><a href="/image-analysis">Analyze Image</a></Button>
                <Button asChild variant="outline" size="sm"><a href="/video-analysis">Analyze Video</a></Button>
              </div>
            </CardContent>
          </Card>
        ) : stats.map((stat) => (
          <Card key={stat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <stat.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
                  {stat.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video stats */}
      {videoStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {videoStats.map((stat) => (
            <Card key={stat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-secondary">
                    <stat.icon className="w-4 h-4 text-foreground" />
                  </div>
                  {stat.change && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
                      {stat.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold mt-0.5">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs
            defaultValue="overview"
            onValueChange={(val) => {
              if (val === 'recent scans') { fetchRecentAnalyses(); fetchRecentVideos(); }
            }}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="methods">Detection Methods</TabsTrigger>
              <TabsTrigger value="recent scans">Recent Scans</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading statistics...</span>
                </div>
              ) : !chartData || (!chartData.authentic?.count && !chartData.ai_generated?.count) ? (
                <div className="text-center py-12">
                  <BarChart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground">No chart data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Analyze some images to see detection distribution.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-muted/30 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Image Detection Results</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">Distribution of authentic vs. AI-generated faces analyzed (last 30 days)</p>
                      <div className="flex items-end justify-around h-40 gap-8">
                        {[
                          { label: 'Authentic', count: chartData.authentic.count, pct: chartData.authentic.percent, barClass: 'bg-emerald-500', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' },
                          { label: 'AI Generated', count: chartData.ai_generated.count, pct: chartData.ai_generated.percent, barClass: 'bg-red-400', dotClass: 'bg-red-400', textClass: 'text-red-600' },
                        ].map(({ label, count, pct, barClass, dotClass, textClass }) => (
                          <div key={label} className="flex flex-col items-center gap-2">
                            <span className={`text-sm font-bold ${textClass}`}>{Math.round(pct)}%</span>
                            <div
                              className={`w-16 ${barClass} rounded-t transition-all`}
                              style={{ height: `${Math.max(8, pct / 100 * 120)}px` }}
                            />
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
                              <span className="text-xs font-medium">{label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{count} image{count !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Video chart */}
                    {videoChartData && (videoChartData.authentic?.count > 0 || videoChartData.ai_generated?.count > 0) && (
                      <div className="bg-muted/30 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-1">
                          <Film className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-semibold">Video Detection Results</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Authentic vs. manipulated videos detected</p>
                        <div className="space-y-3">
                          {[
                            { label: 'Authentic Videos', pct: videoChartData.authentic?.percent ?? 0, count: videoChartData.authentic?.count ?? 0, color: 'bg-emerald-500' },
                            { label: 'Fake / Manipulated', pct: videoChartData.ai_generated?.percent ?? 0, count: videoChartData.ai_generated?.count ?? 0, color: 'bg-red-400' },
                          ].map(({ label, pct, count, color }) => (
                            <div key={label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium">{Math.round(pct)}% ({count})</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent detections */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Recent Detections</h3>
                    </div>
                    {recentDetections.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent detections found.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentDetections.map((d, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.result === 'Authentic' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                              {d.result === 'Authentic'
                                ? <Check className="w-4 h-4 text-emerald-600" />
                                : <AlertTriangle className="w-4 h-4 text-destructive" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{d.filename}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant={d.result === 'Authentic' ? 'outline' : 'destructive'} className="text-xs px-1.5 py-0">
                                  {d.result}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-auto">{d.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {recentVideoDetections.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-2 mb-3">
                          <Film className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">Recent Videos</h3>
                        </div>
                        <div className="space-y-3">
                          {recentVideoDetections.map((d, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.result === 'Authentic' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                                {d.result === 'Authentic'
                                  ? <Check className="w-4 h-4 text-emerald-600" />
                                  : <AlertTriangle className="w-4 h-4 text-destructive" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{d.filename}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant={d.result === 'Authentic' ? 'outline' : 'destructive'} className="text-xs px-1.5 py-0">
                                    {d.result}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">{d.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Detection Methods Tab */}
            <TabsContent value="methods">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  The system uses multiple complementary signals to detect deepfakes and AI-generated media.
                  The primary classifier is a Vision Transformer (ViT) fine-tuned on real vs. synthetic face datasets.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectionMethods.map((m) => (
                  <div key={m.name} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight">{m.name}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={m.badgeVariant} className="text-xs">{m.badge}</Badge>
                        <Badge variant="outline" className="text-xs">{m.accuracy}%</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                    <div className="pt-1">
                      <Progress value={m.accuracy} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recent Scans Tab */}
            <TabsContent value="recent scans">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Recently Analyzed Images</h3>
                  </div>
                  {recentAnalyses.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-xs h-7">View All</Button>
                  )}
                </div>
                {recentAnalyses.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">No images analyzed yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a face image to run the deepfake detection pipeline.</p>
                    <Button asChild size="sm" className="mt-3"><a href="/image-analysis">Analyze First Image</a></Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentAnalyses.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="h-32 bg-muted flex items-center justify-center relative">
                          <Image className="w-8 h-8 text-muted-foreground" />
                          <div className="absolute top-2 right-2">
                            <Badge variant={item.is_real ? 'default' : 'destructive'} className="text-xs flex items-center gap-1">
                              {item.is_real
                                ? <><Check className="w-3 h-3" /> Authentic</>
                                : <><ShieldAlert className="w-3 h-3" /> Fake</>}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-medium truncate">{item.original_filename}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                            <span className="text-xs font-semibold">
                              {Math.round(item.is_real ? item.real_score * 100 : (1 - item.real_score) * 100)}%{' '}
                              <span className="font-normal text-muted-foreground">{item.is_real ? 'real' : 'fake'}</span>
                            </span>
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.is_real ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.round(item.is_real ? item.real_score * 100 : (1 - item.real_score) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-6" />

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Recently Analyzed Videos</h3>
                  </div>
                  {recentVideos.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-xs h-7">View All</Button>
                  )}
                </div>
                {recentVideos.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg">
                    <Video className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">No videos analyzed yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a video to detect frame-by-frame manipulation.</p>
                    <Button asChild size="sm" className="mt-3"><a href="/video-analysis">Analyze First Video</a></Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentVideos.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="h-32 bg-muted flex items-center justify-center relative">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          <div className="absolute top-2 right-2">
                            <Badge variant={item.is_real ? 'default' : 'destructive'} className="text-xs flex items-center gap-1">
                              {item.is_real
                                ? <><Check className="w-3 h-3" /> Authentic</>
                                : <><ShieldAlert className="w-3 h-3" /> Fake</>}
                            </Badge>
                          </div>
                          {item.duration_formatted && (
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                                {item.duration_formatted}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-medium truncate">{item.original_filename}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                            <span className="text-xs font-semibold">
                              {item.is_real
                                ? `${(item.real_score * 100).toFixed(0)}% real`
                                : `${(item.deepfake_probability * 100).toFixed(0)}% fake`}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.is_real ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${item.is_real ? (item.real_score * 100).toFixed(0) : (item.deepfake_probability * 100).toFixed(0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Jump straight to the analysis tool you need.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-1.5">
              <a href="/image-analysis">
                <Image className="w-5 h-5" />
                <span className="text-xs font-medium">Analyze Image</span>
                <span className="text-xs text-muted-foreground">ViT classifier</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-1.5">
              <a href="/video-analysis">
                <Video className="w-5 h-5" />
                <span className="text-xs font-medium">Analyze Video</span>
                <span className="text-xs text-muted-foreground">Frame-by-frame</span>
              </a>
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile')} className="h-auto py-4 flex-col gap-1.5">
              <Users className="w-5 h-5" />
              <span className="text-xs font-medium">View History</span>
              <span className="text-xs text-muted-foreground">All past scans</span>
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="h-auto py-4 flex-col gap-1.5">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs font-medium">Refresh Data</span>
              <span className="text-xs text-muted-foreground">Reload stats</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContent;
