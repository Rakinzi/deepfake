import React, { useState, useEffect } from 'react';
import {
  Image, ShieldAlert, Check, Clock, ArrowUp, ArrowDown, ChevronRight,
  BarChart, FileWarning, Cpu, AlertTriangle, Loader, RefreshCw, Video, Users
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
    } catch (err) {
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
    { name: 'Metadata Analysis', accuracy: 92, description: 'Examines EXIF data for inconsistencies' },
    { name: 'Noise Pattern Analysis', accuracy: 95, description: 'Analyzes noise patterns that differ in AI-generated images' },
    { name: 'Facial Inconsistency', accuracy: 97, description: 'Detects unnatural features in faces' },
    { name: 'Color Inconsistency', accuracy: 94, description: 'Identifies unusual color patterns and gradients' },
    { name: 'Temporal Consistency', accuracy: 94, description: 'Analyzes consistency between frames' },
    { name: 'Face Tracking Artifacts', accuracy: 96, description: 'Detects inconsistencies in facial landmarks' },
    { name: 'Compression Artifacts', accuracy: 91, description: 'Identifies inconsistent compression patterns' },
    { name: 'Lip Sync Evaluation', accuracy: 93, description: 'Detects misalignment between lip movements and speech' },
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

  const ResultBadge = ({ result, isReal }) => {
    const isAuthentic = result === 'Authentic' || isReal;
    return (
      <Badge variant={isAuthentic ? 'default' : 'destructive'} className="text-xs">
        {result ?? (isReal ? 'Authentic' : 'Fake')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Media Verification Dashboard</CardTitle>
              <CardDescription className="mt-1">Monitor and analyze potentially manipulated or AI-generated media.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
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

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Error loading dashboard data</p>
            <p className="text-xs mt-0.5">{error}</p>
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
              <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No analysis data yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Start analyzing images or videos to see your statistics</p>
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
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.isPositive ? 'text-foreground' : 'text-destructive'}`}>
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

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" onValueChange={(val) => { if (val === 'recent scans') { fetchRecentAnalyses(); fetchRecentVideos(); } }}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="methods">Detection Methods</TabsTrigger>
              <TabsTrigger value="recent scans">Recent Scans</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !chartData || (!chartData.authentic?.count && !chartData.ai_generated?.count) ? (
                <div className="text-center py-12">
                  <BarChart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No analysis data yet. Start by analyzing some images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="lg:col-span-2 bg-muted/30 rounded-lg p-6">
                    <p className="text-sm font-medium mb-1">Image Detection Results</p>
                    <p className="text-xs text-muted-foreground mb-6">Last 30 days</p>
                    <div className="flex items-end justify-around h-40 gap-8">
                      {[
                        { label: 'Authentic', count: chartData.authentic.count, pct: chartData.authentic.percent, barClass: 'bg-foreground', dotClass: 'bg-foreground' },
                        { label: 'AI Generated', count: chartData.ai_generated.count, pct: chartData.ai_generated.percent, barClass: 'bg-zinc-400', dotClass: 'bg-zinc-400' },
                      ].map(({ label, count, pct, barClass, dotClass }) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                          <span className="text-sm font-bold">{Math.round(pct)}%</span>
                          <div
                            className={`w-16 ${barClass} rounded-t-sm transition-all`}
                            style={{ height: `${Math.max(8, pct / 100 * 120)}px` }}
                          />
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
                            <span className="text-xs font-medium">{label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{count} images</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent detections */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Recent Detections</h3>
                    {recentDetections.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent detections</p>
                    ) : (
                      <div className="space-y-3">
                        {recentDetections.map((d, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.result === 'Authentic' ? 'bg-secondary' : 'bg-destructive/10'}`}>
                              {d.result === 'Authentic'
                                ? <Check className="w-4 h-4" />
                                : <AlertTriangle className="w-4 h-4 text-destructive" />
                              }
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
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Detection Methods Tab */}
            <TabsContent value="methods">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectionMethods.map((m) => (
                  <div key={m.name} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">{m.name}</h4>
                      <Badge variant="outline" className="text-xs">{m.accuracy}% accuracy</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recent Scans Tab */}
            <TabsContent value="recent scans">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Recently Analyzed Images</h3>
                  {recentAnalyses.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-xs h-7">View All</Button>
                  )}
                </div>
                {recentAnalyses.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No images analyzed yet</p>
                    <Button asChild size="sm" className="mt-3"><a href="/image-analysis">Analyze First Image</a></Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentAnalyses.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="h-32 bg-muted flex items-center justify-center relative">
                          <Image className="w-8 h-8 text-muted-foreground" />
                          <div className="absolute top-2 right-2">
                            <Badge variant={item.is_real ? 'default' : 'destructive'} className="text-xs">
                              {item.is_real ? 'Authentic' : 'Fake'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{item.original_filename}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                            <span className="text-xs font-medium">
                              {Math.round(item.is_real ? item.real_score * 100 : (1 - item.real_score) * 100)}% conf.
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-6" />

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Recently Analyzed Videos</h3>
                  {recentVideos.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-xs h-7">View All</Button>
                  )}
                </div>
                {recentVideos.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg">
                    <Video className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No videos analyzed yet</p>
                    <Button asChild size="sm" className="mt-3"><a href="/video-analysis">Analyze First Video</a></Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentVideos.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="h-32 bg-muted flex items-center justify-center relative">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          <div className="absolute top-2 right-2">
                            <Badge variant={item.is_real ? 'default' : 'destructive'} className="text-xs">
                              {item.is_real ? 'Authentic' : 'Fake'}
                            </Badge>
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <span className="bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                              {item.duration_formatted}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{item.original_filename}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                            <span className="text-xs font-medium">
                              {item.is_real ? `${(item.real_score * 100).toFixed(0)}% real` : `${(item.deepfake_probability * 100).toFixed(0)}% fake`}
                            </span>
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <a href="/image-analysis">
                <Image className="w-5 h-5" />
                <span className="text-xs">Analyze Image</span>
              </a>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <a href="/video-analysis">
                <Video className="w-5 h-5" />
                <span className="text-xs">Analyze Video</span>
              </a>
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile')} className="h-auto py-3 flex-col gap-1">
              <Users className="w-5 h-5" />
              <span className="text-xs">View History</span>
            </Button>
            <Button variant="outline" onClick={handleRefresh} className="h-auto py-3 flex-col gap-1">
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContent;
