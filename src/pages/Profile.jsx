import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import { User, Lock, Mail, Clock, Edit, X, Check, Image as ImageIcon, Shield, AlertCircle, History, Video, Info } from 'lucide-react';
import AuthService from '../services/AuthService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { document.title = 'Profile'; }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AuthService.getUserProfile();
        if (response.success) {
          setUser(response.user);
          setFormData((f) => ({ ...f, username: response.user.username, email: response.user.email }));
        }
      } catch { setError('Failed to load profile data'); }
      finally { setLoading(false); }
    };
    fetchUserData();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await AuthService.getUserHistory();
      if (response.success) setHistory(response.history);
    } catch { } finally { setLoading(false); }
  };

  const loadVideoHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/video/history', { headers: { Authorization: `Bearer ${AuthService.getToken()}` } });
      if (response.ok) { const data = await response.json(); if (data.success) setVideoHistory(data.history); }
    } catch { } finally { setLoading(false); }
  };

  const handleTabChange = (val) => {
    if (val === 'history') { loadHistory(); loadVideoHistory(); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleProfileSubmit = (e) => { e.preventDefault(); setIsEditing(false); };
  const handlePasswordSubmit = (e) => { e.preventDefault(); alert('Password change functionality would be implemented here'); };

  const formatDate = (d) => new Date(d).toLocaleString();
  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (loading && !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">User Profile</CardTitle>
            <CardDescription>Manage your account and view analysis history</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="profile" onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Personal Information</h2>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1 h-8">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" value={formData.username} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                      <Button type="submit" size="sm" className="gap-1">
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-muted/40 rounded-lg p-4 space-y-4 max-w-md">
                    {[
                      { icon: User, label: 'Username', value: user?.username },
                      { icon: Mail, label: 'Email', value: user?.email },
                      { icon: Clock, label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="mb-6">
                  <h2 className="font-semibold mb-1">Change Password</h2>
                  <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  {[
                    { id: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                    { id: 'newPassword', label: 'New Password', placeholder: 'Enter new password' },
                    { id: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Confirm new password' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} name={id} type="password" value={formData[id]} onChange={handleChange} placeholder={placeholder} />
                    </div>
                  ))}
                  <Button type="submit" size="sm">Update Password</Button>
                </form>

                <Separator className="my-6" />

                <div className="bg-muted/40 border border-border rounded-lg p-4 flex items-start gap-3 max-w-md">
                  <Shield className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Your account is secure</p>
                    <p className="text-xs text-muted-foreground mt-1">Use a strong, unique password and keep it private.</p>
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <div className="mb-4">
                  <h2 className="font-semibold">Image Analysis History</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">All your previous image analysis results</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg border border-border">
                    <History className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No image analysis history found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                        <div className="sm:w-36 h-28 bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-medium text-sm">{item.original_filename}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Analyzed {formatDate(item.created_at)}</p>
                            </div>
                            <Badge variant={item.is_real ? 'outline' : 'destructive'} className="shrink-0">
                              {item.is_real ? 'Authentic' : 'Fake'}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span><span className="font-medium text-foreground">Confidence:</span> {(item.real_score * 100).toFixed(1)}%</span>
                            {item.spoofing_type && <span><span className="font-medium text-foreground">Type:</span> {item.spoofing_type}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-6" />

                <div className="mb-4">
                  <h2 className="font-semibold">Video Analysis History</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">All your previous video analysis results</p>
                </div>

                {videoHistory.length === 0 ? (
                  <div className="text-center p-10 bg-muted/30 rounded-lg border border-border">
                    <Video className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No video analysis history found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videoHistory.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden flex flex-col sm:flex-row">
                        <div className="sm:w-36 h-28 bg-muted flex items-center justify-center relative shrink-0">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          {item.duration && (
                            <div className="absolute bottom-2 left-2 bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                              {formatDuration(item.duration)}
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-medium text-sm">{item.original_filename}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Analyzed {formatDate(item.created_at)}</p>
                            </div>
                            <Badge variant={item.is_real ? 'outline' : 'destructive'} className="shrink-0">
                              {item.is_real ? 'Authentic' : (item.manipulation_type || 'Manipulated')}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              <span className="font-medium text-foreground">Confidence:</span>{' '}
                              {(item.is_real ? item.real_score * 100 : item.deepfake_probability * 100).toFixed(1)}%
                            </span>
                            {item.resolution && <span><span className="font-medium text-foreground">Resolution:</span> {item.resolution}</span>}
                            {item.detected_frames && item.total_frames && (
                              <span>
                                <span className="font-medium text-foreground">Affected:</span>{' '}
                                {item.detected_frames}/{item.total_frames} ({Math.round(item.detected_frames / item.total_frames * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
