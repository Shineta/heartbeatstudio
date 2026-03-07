import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  ArrowLeft, Video, Plus, Loader2, RefreshCw, Play,
  Download, Eye, Clock, CheckCircle, XCircle, Film,
  Globe, Users, Megaphone, Sparkles, ExternalLink,
  Shield
} from 'lucide-react';
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook, SiLinkedin } from 'react-icons/si';

interface CreatifyVideo {
  id: string;
  link: string;
  status: string;
  failed_reason: string | null;
  video_output: string | null;
  video_thumbnail: string | null;
  preview: string | null;
  previews: Array<{
    url: string;
    visual_style: string;
    aspect_ratio: string;
    duration: number;
  }>;
  editor_url: string | null;
  name: string | null;
  target_platform: string | null;
  target_audience: string | null;
  language: string;
  video_length: number;
  aspect_ratio: string;
  credits_used: number;
  duration: number;
  progress: string;
}

const VISUAL_STYLES = [
  { value: 'AvatarBubbleTemplate', label: 'Avatar Bubble' },
  { value: 'FullScreenTemplate', label: 'Full Screen' },
  { value: 'FullScreenV2Template', label: 'Full Screen V2' },
  { value: 'SideBySideTemplate', label: 'Side by Side' },
  { value: 'VanillaTemplate', label: 'Vanilla' },
  { value: 'EnhancedVanillaTemplate', label: 'Dynamic Vanilla' },
  { value: 'DramaticTemplate', label: 'Dramatic' },
  { value: 'FeatureHighlightTemplate', label: 'Feature Highlight' },
  { value: 'MotionCardsTemplate', label: 'Motion Cards' },
  { value: 'SmartAdsTemplate', label: 'Smart Ads' },
  { value: 'StandardAdsTemplate', label: 'Standard Ads' },
  { value: 'VlogTemplate', label: 'Vlog' },
  { value: 'ScribbleTemplate', label: 'Scribble' },
  { value: 'QuickTransitionTemplate', label: 'Quick Transition' },
  { value: 'DynamicProductTemplate', label: 'Product' },
  { value: 'SimpleAvatarOverlayTemplate', label: 'Product Presenter' },
  { value: 'GreenScreenEffectTemplate', label: 'Green Screen Effect' },
];

const SCRIPT_STYLES = [
  { value: 'BenefitsV2', label: 'Benefits' },
  { value: 'ProblemSolutionV2', label: 'Problem & Solution' },
  { value: 'StoryTimeWriter', label: 'Storytelling' },
  { value: 'HowToV2', label: 'How-To' },
  { value: 'EmotionalWriter', label: 'Emotional' },
  { value: 'BrandStoryV2', label: 'Brand Story' },
  { value: 'CallToActionV2', label: 'Call to Action' },
  { value: 'DiscoveryWriter', label: 'Discovery' },
  { value: 'ProductHighlightsV2', label: 'Product Highlights' },
  { value: 'SpecialOffersV2', label: 'Special Offers' },
  { value: 'ThreeReasonsWriter', label: '3 Reasons Why' },
  { value: 'GenzWriter', label: 'Gen Z' },
  { value: 'MotivationalWriter', label: 'Motivational' },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: SiInstagram },
  { value: 'tiktok', label: 'TikTok', icon: SiTiktok },
  { value: 'youtube', label: 'YouTube', icon: SiYoutube },
  { value: 'facebook', label: 'Facebook', icon: SiFacebook },
  { value: 'linkedin', label: 'LinkedIn', icon: SiLinkedin },
];

const ASPECT_RATIOS = [
  { value: '9x16', label: '9:16 (Vertical / Stories)' },
  { value: '16x9', label: '16:9 (Landscape / YouTube)' },
  { value: '1x1', label: '1:1 (Square / Feed)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
];

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'completed':
      return 'default';
    case 'pending':
    case 'processing':
    case 'in_progress':
      return 'secondary';
    case 'failed':
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
}

const TEXT_TO_VIDEO_MODELS = [
  { value: 'kling-video/v3/pro/text-to-video', label: 'Kling V3 Pro' },
  { value: 'kling-video/v3/standard/text-to-video', label: 'Kling V3 Standard' },
  { value: 'veo3.1', label: 'Veo 3.1' },
  { value: 'veo3.1/fast', label: 'Veo 3.1 Fast' },
  { value: 'sora-2/text-to-video', label: 'Sora 2' },
  { value: 'sora-2/text-to-video/pro', label: 'Sora 2 Pro' },
];

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'completed':
      return <CheckCircle className="w-3 h-3" />;
    case 'pending':
    case 'processing':
    case 'in_progress':
      return <Clock className="w-3 h-3" />;
    case 'failed':
    case 'error':
      return <XCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

function getPlatformIcon(platform: string | null) {
  if (!platform) return <Globe className="w-4 h-4" />;
  const found = PLATFORMS.find(p => p.value === platform);
  if (found) {
    const Icon = found.icon;
    return <Icon className="w-4 h-4" />;
  }
  return <Globe className="w-4 h-4" />;
}

export default function AdminSocialMediaPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('instagram');
  const [targetAudience, setTargetAudience] = useState('');
  const [language, setLanguage] = useState('en');
  const [videoLength, setVideoLength] = useState('30');
  const [aspectRatio, setAspectRatio] = useState('9x16');
  const [scriptStyle, setScriptStyle] = useState('BenefitsV2');
  const [visualStyle, setVisualStyle] = useState('AvatarBubbleTemplate');
  const [overrideScript, setOverrideScript] = useState('');
  const [noBackgroundMusic, setNoBackgroundMusic] = useState(false);
  const [noCaptions, setNoCaptions] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMode, setCreateMode] = useState<'link' | 'text'>('text');
  const [pollingId, setPollingId] = useState<string | null>(null);

  const [ttv_prompt, setTtvPrompt] = useState('');
  const [ttv_model, setTtvModel] = useState('kling-video/v3/pro/text-to-video');
  const [ttv_duration, setTtvDuration] = useState('5');
  const [ttv_aspectRatio, setTtvAspectRatio] = useState('16:9');
  const [ttv_negativePrompt, setTtvNegativePrompt] = useState('');
  const [assetPollingIds, setAssetPollingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user?.isAdmin) {
      setLocation('/dashboard');
    }
  }, [authLoading, user?.isAdmin, setLocation]);

  interface AssetTaskDB {
    id: string;
    userId: string;
    modelName: string;
    status: string;
    prompt: string;
    inputParams: Record<string, any>;
    assets: any[];
    failedReason: string | null;
    createdAt: string;
    updatedAt: string;
  }

  const { data: assetTasksData = [] } = useQuery<AssetTaskDB[]>({
    queryKey: ['/api/admin/creatify/asset-tasks'],
    enabled: !!user?.isAdmin,
  });

  const assetTasks = assetTasksData.map(t => ({
    id: t.id,
    status: t.status,
    model: t.modelName,
    prompt: t.prompt || '',
    assets: (t.assets as any[]) || [],
    failed_reason: t.failedReason || undefined,
  }));

  useEffect(() => {
    const pendingIds = assetTasksData
      .filter(t => t.status === 'pending' || t.status === 'generating')
      .map(t => t.id);
    if (pendingIds.length > 0) {
      setAssetPollingIds(prev => {
        const next = new Set(prev);
        pendingIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [assetTasksData]);

  const { data: videos, isLoading: videosLoading, refetch: refetchVideos } = useQuery<CreatifyVideo[]>({
    queryKey: ['/api/admin/creatify/videos'],
    enabled: !!user?.isAdmin,
    refetchInterval: pollingId ? 5000 : false,
  });

  useEffect(() => {
    if (pollingId && videos) {
      const video = videos.find(v => v.id === pollingId);
      if (video && (video.status === 'done' || video.status === 'completed' || video.status === 'failed')) {
        setPollingId(null);
        if (video.status === 'done' || video.status === 'completed') {
          toast({ title: "Video ready!", description: "Your social media video has been generated." });
        } else {
          toast({ title: "Video failed", description: video.failed_reason || "Generation failed. Try again.", variant: "destructive" });
        }
      }
    }
  }, [pollingId, videos, toast]);

  useEffect(() => {
    if (assetPollingIds.size === 0) return;
    const interval = setInterval(async () => {
      const idsToRemove: string[] = [];
      for (const taskId of assetPollingIds) {
        try {
          const res = await fetch(`/api/admin/creatify/asset-generator/${taskId}`, { credentials: 'include' });
          if (!res.ok) continue;
          const task = await res.json();
          if (task.status === 'done' || task.status === 'completed') {
            idsToRemove.push(taskId);
            toast({ title: "Video generated!", description: "Your text-to-video is ready to view and download." });
          } else if (task.status === 'failed' || task.status === 'error') {
            idsToRemove.push(taskId);
            toast({ title: "Generation failed", description: task.failed_reason || "Something went wrong.", variant: "destructive" });
          }
        } catch (e) {}
      }
      if (idsToRemove.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/creatify/asset-tasks'] });
        setAssetPollingIds(prev => {
          const next = new Set(prev);
          idsToRemove.forEach(id => next.delete(id));
          return next;
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/creatify/asset-tasks'] });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [assetPollingIds, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/creatify/create', data);
      return res.json();
    },
    onSuccess: (data: CreatifyVideo) => {
      toast({ title: "Video creation started", description: `Video "${data.name || 'Untitled'}" is being generated.` });
      setPollingId(data.id);
      setShowCreateForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creatify/videos'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create video", variant: "destructive" });
    },
  });

  const renderMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest('POST', `/api/admin/creatify/videos/${videoId}/render`);
      return res.json();
    },
    onSuccess: (data: CreatifyVideo) => {
      toast({ title: "Rendering started", description: "Final video is being rendered." });
      setPollingId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creatify/videos'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to render video", variant: "destructive" });
    },
  });

  const ttvMutation = useMutation({
    mutationFn: async (data: { model_name: string; input_params: Record<string, any> }) => {
      const res = await apiRequest('POST', '/api/admin/creatify/asset-generator', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Video generation started", description: `Using ${ttv_model.split('/').slice(0, 2).join(' ')} — this may take a few minutes.` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creatify/asset-tasks'] });
      setAssetPollingIds(prev => new Set([...prev, data.id]));
      setShowCreateForm(false);
      setTtvPrompt('');
      setTtvNegativePrompt('');
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create video", variant: "destructive" });
    },
  });

  function handleCreateTextToVideo() {
    if (!ttv_prompt.trim()) {
      toast({ title: "Description required", description: "Describe what you want to see in the video.", variant: "destructive" });
      return;
    }
    const inputParams: Record<string, any> = {
      prompt: ttv_prompt.trim(),
      aspect_ratio: ttv_aspectRatio,
    };
    if (ttv_model.startsWith('kling')) {
      inputParams.duration = ttv_duration;
    } else if (ttv_model.startsWith('veo')) {
      inputParams.duration = parseInt(ttv_duration);
      inputParams.enhance_prompt = true;
    } else if (ttv_model.startsWith('sora')) {
      inputParams.duration = parseInt(ttv_duration);
    }
    if (ttv_negativePrompt.trim()) {
      inputParams.negative_prompt = ttv_negativePrompt.trim();
    }
    ttvMutation.mutate({ model_name: ttv_model, input_params: inputParams });
  }

  function resetForm() {
    setLink('');
    setName('');
    setTargetPlatform('instagram');
    setTargetAudience('');
    setLanguage('en');
    setVideoLength('30');
    setAspectRatio('9x16');
    setScriptStyle('BenefitsV2');
    setVisualStyle('AvatarBubbleTemplate');
    setOverrideScript('');
    setNoBackgroundMusic(false);
    setNoCaptions(false);
  }

  function sanitizeUrl(url: string): string {
    return url
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, '')
      .trim();
  }

  function handleCreate() {
    const cleanLink = sanitizeUrl(link);
    if (!cleanLink) {
      toast({ title: "Link required", description: "Enter a URL to create a video from.", variant: "destructive" });
      return;
    }

    try {
      new URL(cleanLink);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid URL starting with https://", variant: "destructive" });
      return;
    }

    const payload: Record<string, any> = {
      link: cleanLink,
      target_platform: targetPlatform,
      language,
      video_length: parseInt(videoLength),
      aspect_ratio: aspectRatio,
      script_style: scriptStyle,
      visual_style: visualStyle,
      no_background_music: noBackgroundMusic,
      no_caption: noCaptions,
    };

    if (name.trim()) payload.name = name.trim();
    if (targetAudience.trim()) payload.target_audience = targetAudience.trim();

    const scriptText = overrideScript.trim();
    if (scriptText) {
      if (scriptText.length < 20) {
        toast({ title: "Script too short", description: `Your custom script is ${scriptText.length} characters. It must be at least 20 characters, or leave the field empty for auto-generation.`, variant: "destructive" });
        return;
      }
      payload.override_script = scriptText;
    }

    createMutation.mutate(payload);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-admin-social">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const videoProcessing = videos?.filter(v => v.status === 'pending' || v.status === 'processing' || v.status === 'in_progress').length || 0;
  const videoCompleted = videos?.filter(v => v.status === 'done' || v.status === 'completed').length || 0;
  const videoFailed = videos?.filter(v => v.status === 'failed' || v.status === 'error').length || 0;
  const assetProcessing = assetTasks.filter(t => t.status === 'pending' || t.status === 'generating' || t.status === 'processing').length;
  const assetCompleted = assetTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const assetFailed = assetTasks.filter(t => t.status === 'failed' || t.status === 'error').length;
  const processingCount = videoProcessing + assetProcessing;
  const completedCount = videoCompleted + assetCompleted;
  const failedCount = videoFailed + assetFailed;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/admin')} data-testid="button-back-admin">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-admin-social-title">Social Media Studio</h1>
              <p className="text-sm text-muted-foreground">Create promotional videos with Creatify</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => refetchVideos()} data-testid="button-refresh-videos">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} data-testid="button-new-video">
              <Plus className="w-4 h-4 mr-2" />
              New Video
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card data-testid="card-stat-processing">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-processing-count">{processingCount}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-completed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-completed-count">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-failed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-failed-count">{failedCount}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm && (
          <Card data-testid="card-create-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Create Video
              </CardTitle>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant={createMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateMode('text')}
                  data-testid="button-mode-text"
                >
                  <Film className="w-4 h-4 mr-1" />
                  Text to Video
                </Button>
                <Button
                  variant={createMode === 'link' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateMode('link')}
                  data-testid="button-mode-link"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Link to Video
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {createMode === 'text' ? (
                <>
                  <p className="text-sm text-muted-foreground">Describe a scene and generate a short video clip using models like Kling, Veo, or Sora.</p>

                  <div className="space-y-2">
                    <Label htmlFor="ttv-prompt">Video Description *</Label>
                    <Textarea
                      id="ttv-prompt"
                      value={ttv_prompt}
                      onChange={(e) => setTtvPrompt(e.target.value)}
                      placeholder="A joyful family opening birthday presents in a cozy living room, warm golden lighting, cinematic style..."
                      rows={4}
                      data-testid="input-ttv-prompt"
                    />
                    <p className="text-xs text-muted-foreground">Be specific — describe setting, mood, camera movement, and style for best results.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select value={ttv_model} onValueChange={setTtvModel}>
                        <SelectTrigger data-testid="select-ttv-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_TO_VIDEO_MODELS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <Select value={ttv_duration} onValueChange={setTtvDuration}>
                        <SelectTrigger data-testid="select-ttv-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 seconds</SelectItem>
                          <SelectItem value="4">4 seconds</SelectItem>
                          <SelectItem value="5">5 seconds (recommended)</SelectItem>
                          <SelectItem value="6">6 seconds</SelectItem>
                          <SelectItem value="7">7 seconds</SelectItem>
                          <SelectItem value="8">8 seconds</SelectItem>
                          <SelectItem value="9">9 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Shorter durations (5s) are most reliable. Longer durations may fail silently with some models.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={ttv_aspectRatio} onValueChange={setTtvAspectRatio}>
                        <SelectTrigger data-testid="select-ttv-aspect">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ttv-negative">Negative Prompt (optional)</Label>
                    <Input
                      id="ttv-negative"
                      value={ttv_negativePrompt}
                      onChange={(e) => setTtvNegativePrompt(e.target.value)}
                      placeholder="blurry, low quality, distorted faces, text overlays..."
                      data-testid="input-ttv-negative"
                    />
                    <p className="text-xs text-muted-foreground">Describe what you don't want to see in the video.</p>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={handleCreateTextToVideo}
                      disabled={ttvMutation.isPending || !ttv_prompt.trim()}
                      data-testid="button-generate-ttv"
                    >
                      {ttvMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Generate Video</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }} data-testid="button-cancel-ttv">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Enter a URL from your site and Creatify will generate a promotional video with an AI avatar presenter.</p>

                  <div className="space-y-2">
                    <Label htmlFor="link">Page URL *</Label>
                    <Input
                      id="link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://heartbeatstudio.replit.app/features"
                      data-testid="input-video-link"
                    />
                    <p className="text-xs text-muted-foreground">The URL Creatify will use to generate video content from</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Video Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Holiday Promo - Instagram Reel"
                        data-testid="input-video-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target Platform</Label>
                      <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audience">Video Description</Label>
                    <Textarea
                      id="audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Describe what you want to see in the video. For example: Showcase how easy it is to create personalized birthday songs. Highlight the emotional reaction of receiving a custom song. Target young couples and parents looking for unique gift ideas. Use upbeat, warm energy."
                      rows={3}
                      data-testid="input-video-description"
                    />
                    <p className="text-xs text-muted-foreground">Describe your vision for the video — the audience, tone, key messages, and what you want to highlight.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Video Length (seconds)</Label>
                      <Select value={videoLength} onValueChange={setVideoLength}>
                        <SelectTrigger data-testid="select-video-length">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="45">45 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger data-testid="select-aspect-ratio">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Script Style</Label>
                      <Select value={scriptStyle} onValueChange={setScriptStyle}>
                        <SelectTrigger data-testid="select-script-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCRIPT_STYLES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Visual Style</Label>
                    <Select value={visualStyle} onValueChange={setVisualStyle}>
                      <SelectTrigger data-testid="select-visual-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLES.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-script">Custom Script (optional)</Label>
                    <Textarea
                      id="override-script"
                      value={overrideScript}
                      onChange={(e) => setOverrideScript(e.target.value)}
                      placeholder="Write your own script for the video. Leave empty to let Creatify auto-generate one from the URL content."
                      rows={4}
                      data-testid="input-override-script"
                    />
                    <p className="text-xs text-muted-foreground">
                      {overrideScript.trim().length > 0 && overrideScript.trim().length < 20
                        ? `Script must be at least 20 characters (currently ${overrideScript.trim().length}). Otherwise leave empty for auto-generation.`
                        : 'Leave empty to auto-generate from URL content. If provided, must be at least 20 characters.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="no-music"
                        checked={noBackgroundMusic}
                        onCheckedChange={setNoBackgroundMusic}
                        data-testid="switch-no-music"
                      />
                      <Label htmlFor="no-music" className="cursor-pointer">No background music</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="no-captions"
                        checked={noCaptions}
                        onCheckedChange={setNoCaptions}
                        data-testid="switch-no-captions"
                      />
                      <Label htmlFor="no-captions" className="cursor-pointer">No captions</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={handleCreate}
                      disabled={createMutation.isPending || !link.trim()}
                      data-testid="button-create-video"
                    >
                      {createMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                      ) : (
                        <><Video className="w-4 h-4 mr-2" />Create Video</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }} data-testid="button-cancel-create">
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {assetTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-ttv-history-title">
              <Sparkles className="w-5 h-5" />
              Text-to-Video Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assetTasks.map((task) => (
                <Card key={task.id} data-testid={`card-ttv-task-${task.id}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" data-testid={`text-ttv-model-${task.id}`}>
                        {TEXT_TO_VIDEO_MODELS.find(m => m.value === task.model)?.label || task.model}
                      </span>
                      <Badge variant={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">{task.status}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-ttv-prompt-${task.id}`}>{task.prompt}</p>
                    {task.status === 'pending' || task.status === 'processing' || task.status === 'in_progress' ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating video...
                      </div>
                    ) : null}
                    {task.failed_reason && (
                      <p className="text-xs text-destructive" data-testid={`text-ttv-error-${task.id}`}>{task.failed_reason}</p>
                    )}
                    {task.assets && task.assets.length > 0 && task.assets.map((asset: any) => (
                      <div key={asset.id || asset.url} className="space-y-2">
                        {asset.type === 'video' && asset.url && (
                          <video controls className="w-full rounded-md" data-testid={`video-ttv-${task.id}`}>
                            <source src={asset.url} type="video/mp4" />
                          </video>
                        )}
                        {asset.url && (
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            data-testid={`link-ttv-download-${task.id}`}
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Film className="w-5 h-5" />
            Video History
            {videosLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </h2>

          {!videosLoading && (!videos || videos.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No videos yet. Create your first social media video to get started.</p>
                <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-first-video">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Video
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos?.map((video) => (
              <Card key={video.id} data-testid={`card-video-${video.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                    {video.video_thumbnail ? (
                      <img src={video.video_thumbnail} alt={video.name || 'Video'} className="w-full h-full object-cover" />
                    ) : video.preview ? (
                      <video src={video.preview} className="w-full h-full object-cover" muted />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {(video.status === 'pending' || video.status === 'processing' || video.status === 'in_progress') ? (
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">{video.progress || 'Processing...'}</p>
                          </div>
                        ) : (
                          <Film className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={getStatusColor(video.status)} className="flex items-center gap-1">
                        {getStatusIcon(video.status)}
                        {video.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium truncate" data-testid={`text-video-name-${video.id}`}>
                      {video.name || 'Untitled Video'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                      {getPlatformIcon(video.target_platform)}
                      <span>{video.target_platform || 'No platform'}</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{video.aspect_ratio}</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{video.video_length}s</span>
                    </div>
                  </div>

                  {video.failed_reason && (
                    <p className="text-xs text-destructive">{video.failed_reason}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {video.video_output && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.video_output!, '_blank')}
                          data-testid={`button-play-${video.id}`}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = video.video_output!;
                            a.download = `${video.name || 'video'}.mp4`;
                            a.target = '_blank';
                            a.click();
                          }}
                          data-testid={`button-download-${video.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    {video.preview && !video.video_output && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.preview!, '_blank')}
                        data-testid={`button-preview-${video.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    {video.preview && !video.video_output && (video.status === 'done' || video.status === 'completed') && (
                      <Button
                        size="sm"
                        onClick={() => renderMutation.mutate(video.id)}
                        disabled={renderMutation.isPending}
                        data-testid={`button-render-${video.id}`}
                      >
                        {renderMutation.isPending ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        Render Final
                      </Button>
                    )}
                    {video.editor_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.editor_url!, '_blank')}
                        data-testid={`button-editor-${video.id}`}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
