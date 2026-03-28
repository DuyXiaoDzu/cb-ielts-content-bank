import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, FUNNEL_STAGES, APPROVAL_LEVELS, FORMATS, PRIORITIES, LANE_DOT_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Save, Archive, Clipboard, ExternalLink, Image, ChevronLeft, ChevronRight,
  Send, Eye, CheckCircle2, AlertCircle, Pencil, X, Link2, Sparkles,
  ThumbsUp, MessageCircle, Share2, Bookmark, Video, LayoutGrid,
  Loader2, Copy, Check,
} from "lucide-react";

const STATUS_FLOW = ['Idea', 'Planned', 'In Progress', 'Ready', 'Published'];
const REVIEW_STATUSES = ['Pending', 'Approved', 'Needs Changes', 'Rejected'];

// Priority tab colors: red (critical) → orange → blue → green (least)
const TAB_STYLES: Record<string, { active: string; inactive: string; label: string }> = {
  overview: {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'border-red-300 text-red-600 hover:bg-red-50',
    label: '① Overview',
  },
  content: {
    active: 'bg-orange-500 text-white border-orange-500',
    inactive: 'border-orange-300 text-orange-600 hover:bg-orange-50',
    label: '② Content',
  },
  review: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'border-blue-300 text-blue-600 hover:bg-blue-50',
    label: '③ Review',
  },
  details: {
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'border-green-300 text-green-600 hover:bg-green-50',
    label: '④ Details',
  },
};

type Post = {
  id: number; postCode: string | null; topic?: string | null; objective?: string | null;
  status?: string | null; laneCode?: string | null; pillarCode?: string | null;
  seriesCode?: string | null; seriesName?: string | null; angleCode?: string | null;
  angleName?: string | null; date?: string | null; day?: string | null;
  weekLabel?: string | null; monthLabel?: string | null; funnelStage?: string | null;
  format?: string | null; priority?: string | null; approvalLevel?: string | null;
  difficultyScore?: number | null; sourceBank?: string | null; sourceRef?: string | null;
  sourceFile?: string | null; notes?: string | null; publishedLink?: string | null;
  caption?: string | null; hashtags?: string | null; cta?: string | null;
  postingTime?: string | null; slotType?: string | null;
  imageUrl?: string | null; reviewStatus?: string | null; reviewNotes?: string | null;
  hook?: string | null; body?: string | null;
  [key: string]: any;
};

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  lanes: any[];
  pillars: any[];
  seriesList: any[];
  angles: any[];
}

export function PostDetailModal({ post, open, onClose, lanes, pillars, seriesList, angles }: PostDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [tab, setTab] = useState('overview');
  const [localPost, setLocalPost] = useState<Post | null>(post);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  // AI Parse state
  const [showAIParse, setShowAIParse] = useState(false);
  const [rawText, setRawText] = useState('');
  const utils = trpc.useUtils();

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.posts.list.invalidate();
      setLocalPost(prev => prev ? { ...prev, ...variables } : prev);
      setForm(prev => ({ ...prev, ...variables }));
      toast.success("Post updated");
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const archiveMut = trpc.archive.archive.useMutation({
    onSuccess: () => { utils.posts.list.invalidate(); toast.success("Post archived"); onClose(); },
  });
  const aiParseMut = trpc.ai.parsePost.useMutation({
    onSuccess: (data) => {
      setForm(prev => ({
        ...prev,
        topic: data.topic || prev.topic,
        caption: data.caption || prev.caption,
        hashtags: data.hashtags || prev.hashtags,
        cta: data.cta || prev.cta,
        hook: data.hook || prev.hook,
        body: data.body || prev.body,
      }));
      setShowAIParse(false);
      setRawText('');
      setEditing(true);
      setTab('content');
      toast.success("AI parsed! Review the extracted content below.");
    },
    onError: (e: any) => toast.error("AI parse failed: " + e.message),
  });

  useEffect(() => {
    if (post) {
      setLocalPost(post);
      setForm({ ...post });
      setEditing(false);
      setTab('overview');
      setShowAIParse(false);
      setRawText('');
      // Init checklist from post data
      setChecklist({
        caption: !!post.caption,
        hashtags: !!post.hashtags,
        cta: !!post.cta,
        image: !!post.imageUrl,
        date: !!post.date,
        link: !!post.publishedLink,
      });
    }
  }, [post]);

  if (!post || !localPost) return null;

  const displayPost = localPost;
  const currentIdx = STATUS_FLOW.indexOf(displayPost.status || 'Planned');
  const canGoBack = currentIdx > 0;
  const canGoForward = currentIdx < STATUS_FLOW.length - 1;
  const isPublished = displayPost.status === 'Published';
  const isVideo = displayPost.slotType === 'Video';

  const handleSave = () => {
    const { id, createdAt, updatedAt, archived, archivedMonth, ...data } = form;
    updatePost.mutate({ id: displayPost.id, ...data });
  };

  const handleStatusChange = (direction: 'back' | 'forward') => {
    const newIdx = direction === 'forward' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx >= 0 && newIdx < STATUS_FLOW.length) {
      const newStatus = STATUS_FLOW[newIdx];
      updatePost.mutate({ id: displayPost.id, status: newStatus });
    }
  };

  const handleQuickPublish = () => {
    updatePost.mutate({ id: displayPost.id, status: 'Published' });
  };

  const handleCopyAll = () => {
    const p = displayPost;
    const all = [
      `═══════════════════════════`,
      `📋 POST: ${p.postCode || ''}`,
      `═══════════════════════════`,
      `📌 Topic: ${p.topic || ''}`,
      `📅 Date: ${p.date || ''} (${p.weekLabel || ''})`,
      `🏷️ Lane: ${p.laneCode || ''} | Pillar: ${p.pillarCode || ''} | Series: ${p.seriesCode || ''}`,
      `📊 Status: ${p.status || ''} | Priority: ${p.priority || ''} | Format: ${p.format || ''}`,
      `🎯 Funnel: ${p.funnelStage || ''} | Approval: ${p.approvalLevel || ''}`,
      ``,
      `🎣 Hook:`,
      p.hook || '(not set)',
      ``,
      `📝 Body:`,
      p.body || '(not set)',
      ``,
      `📱 Caption:`,
      p.caption || '(not set)',
      ``,
      `#️⃣ Hashtags: ${p.hashtags || ''}`,
      `👉 CTA: ${p.cta || ''}`,
      ``,
      p.objective ? `🎯 Objective: ${p.objective}` : '',
      p.notes ? `📎 Notes: ${p.notes}` : '',
      p.sourceRef ? `🔗 Source: ${p.sourceRef}` : '',
      p.publishedLink ? `🌐 Published: ${p.publishedLink}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Full post info copied!");
  };

  const handleArchive = () => {
    const month = new Date().toISOString().slice(0, 7);
    archiveMut.mutate({ id: displayPost.id, month });
  };

  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleChecklist = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistItems = [
    { key: 'caption', label: 'Caption written', auto: !!displayPost.caption },
    { key: 'hashtags', label: 'Hashtags added', auto: !!displayPost.hashtags },
    { key: 'cta', label: 'CTA included', auto: !!displayPost.cta },
    { key: 'image', label: 'Image/visual attached', auto: !!displayPost.imageUrl },
    { key: 'date', label: 'Date scheduled', auto: !!displayPost.date },
    { key: 'link', label: 'Published link added', auto: !!displayPost.publishedLink },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[displayPost.laneCode || ''] || '#94a3b8' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg truncate">{displayPost.topic || displayPost.postCode}</DialogTitle>
                {isVideo && (
                  <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-600 flex items-center gap-1 shrink-0">
                    <Video className="h-3 w-3" /> Video
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{displayPost.postCode} · {displayPost.date || 'No date'} · {displayPost.laneCode || ''}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Status Flow Bar */}
        <div className="flex items-center gap-1 py-2 px-1 bg-muted/30 rounded-lg mt-1">
          <Button size="sm" variant="ghost" disabled={!canGoBack || updatePost.isPending}
            onClick={() => handleStatusChange('back')} className="h-7 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center gap-0.5">
            {STATUS_FLOW.map((s, i) => {
              const isCurrent = s === (displayPost.status || 'Planned');
              const isPast = i < currentIdx;
              return (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className={`w-full h-1.5 rounded-full transition-colors ${isPast ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                  <span className={`text-[9px] mt-0.5 ${isCurrent ? 'font-bold text-primary' : isPast ? 'text-green-600' : 'text-muted-foreground'}`}>{s}</span>
                </div>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" disabled={!canGoForward || updatePost.isPending}
            onClick={() => handleStatusChange('forward')} className="h-7 px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isPublished && (
            <Button size="sm" variant="default" onClick={handleQuickPublish}
              disabled={updatePost.isPending} className="h-7 ml-1 bg-green-600 hover:bg-green-700 text-white">
              <Send className="h-3 w-3 mr-1" /> Publish
            </Button>
          )}
        </div>

        {/* AI Parse Panel */}
        {showAIParse && (
          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-800">AI Parse — Paste bài viết hoàn chỉnh</p>
              <button onClick={() => { setShowAIParse(false); setRawText(''); }} className="ml-auto text-purple-400 hover:text-purple-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Textarea
              rows={6}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste toàn bộ bài viết vào đây (bao gồm hook, body, hashtag, CTA)... AI sẽ tự phân tích và điền vào các trường tương ứng."
              className="text-sm bg-white border-purple-200"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => aiParseMut.mutate({ rawText })}
                disabled={!rawText.trim() || aiParseMut.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white">
                {aiParseMut.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Đang phân tích...</> : <><Sparkles className="h-3 w-3 mr-1" /> Phân tích</>}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAIParse(false); setRawText(''); }}>Huỷ</Button>
            </div>
          </div>
        )}

        {/* Priority-colored Tabs */}
        <div className="mt-1">
          <div className="flex gap-1 border-b pb-0">
            {(['overview', 'content', 'review', 'details'] as const).map(t => {
              const style = TAB_STYLES[t];
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-md border transition-colors ${isActive ? style.active : style.inactive}`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-4 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status" editing={editing}
                  editEl={<Sel value={form.status} onChange={v => setField('status', v)} options={STATUSES} />}
                  viewEl={<StatusBadge value={displayPost.status} type="status" />} />
                <Field label="Priority" editing={editing}
                  editEl={<Sel value={form.priority} onChange={v => setField('priority', v)} options={PRIORITIES} />}
                  viewEl={<span className="text-sm">{displayPost.priority || '—'}</span>} />
                <Field label="Date" editing={editing}
                  editEl={<Input type="date" className="h-8" value={form.date || ''} onChange={e => setField('date', e.target.value)} />}
                  viewEl={<span className="text-sm">{displayPost.date || '—'}</span>} />
                <Field label="Week" editing={false}
                  editEl={null}
                  viewEl={<span className="text-sm">{displayPost.weekLabel || '—'}</span>} />
                <Field label="Lane" editing={editing}
                  editEl={<Sel value={form.laneCode} onChange={v => setField('laneCode', v)} options={lanes.map((l: any) => l.code)} labels={lanes.reduce((a: any, l: any) => ({ ...a, [l.code]: `${l.code} - ${l.name}` }), {})} allowOther />}
                  viewEl={<StatusBadge value={displayPost.laneCode} type="lane" />} />
                <Field label="Pillar" editing={editing}
                  editEl={<Sel value={form.pillarCode} onChange={v => setField('pillarCode', v)} options={pillars.map((p: any) => p.code)} labels={pillars.reduce((a: any, p: any) => ({ ...a, [p.code]: `${p.code} - ${p.name}` }), {})} allowOther />}
                  viewEl={<span className="text-sm">{displayPost.pillarCode || '—'}</span>} />
                <Field label="Series" editing={editing}
                  editEl={<Sel value={form.seriesCode} onChange={v => setField('seriesCode', v)} options={seriesList.map((s: any) => s.code)} labels={seriesList.reduce((a: any, s: any) => ({ ...a, [s.code]: `${s.code} - ${s.name}` }), {})} allowOther />}
                  viewEl={<span className="text-sm">{displayPost.seriesName || displayPost.seriesCode || '—'}</span>} />
                <Field label="Format" editing={editing}
                  editEl={<Sel value={form.format} onChange={v => setField('format', v)} options={FORMATS} allowOther />}
                  viewEl={<span className="text-sm">{displayPost.format || '—'}</span>} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Topic</label>
                {editing ? <Input className="mt-1" value={form.topic || ''} onChange={e => setField('topic', e.target.value)} />
                  : <p className="text-sm mt-1">{displayPost.topic || '—'}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Objective</label>
                {editing ? <Textarea className="mt-1" rows={2} value={form.objective || ''} onChange={e => setField('objective', e.target.value)} />
                  : <p className="text-sm mt-1">{displayPost.objective || '—'}</p>}
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {tab === 'content' && (
            <div className="space-y-4 mt-3">
              {/* Hook */}
              <div>
                <label className="text-xs font-medium text-orange-600 flex items-center gap-1">
                  🎣 Hook <span className="text-muted-foreground font-normal">(câu mở đầu thu hút)</span>
                </label>
                {editing ? <Textarea className="mt-1 border-orange-200" rows={2} value={form.hook || ''} onChange={e => setField('hook', e.target.value)} placeholder="Câu hook thu hút người đọc..." />
                  : <p className="text-sm mt-1 bg-orange-50 border border-orange-100 p-2 rounded-lg whitespace-pre-wrap">{displayPost.hook || '—'}</p>}
              </div>
              {/* Body */}
              <div>
                <label className="text-xs font-medium text-orange-600 flex items-center gap-1">
                  📝 Body <span className="text-muted-foreground font-normal">(nội dung chính)</span>
                </label>
                {editing ? <Textarea className="mt-1 border-orange-200" rows={5} value={form.body || ''} onChange={e => setField('body', e.target.value)} placeholder="Nội dung chính của bài viết..." />
                  : <p className="text-sm mt-1 bg-orange-50 border border-orange-100 p-2 rounded-lg whitespace-pre-wrap">{displayPost.body || '—'}</p>}
              </div>
              {/* Caption */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">📱 Caption (full)</label>
                {editing ? <Textarea className="mt-1" rows={4} value={form.caption || ''} onChange={e => setField('caption', e.target.value)} placeholder="Caption đầy đủ cho bài đăng..." />
                  : <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{displayPost.caption || 'No caption yet'}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">#️⃣ Hashtags</label>
                  {editing ? <Input className="mt-1" value={form.hashtags || ''} onChange={e => setField('hashtags', e.target.value)} placeholder="#ielts #english" />
                    : <p className="text-sm mt-1 text-blue-600">{displayPost.hashtags || '—'}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">👉 Call to Action</label>
                  {editing ? <Input className="mt-1" value={form.cta || ''} onChange={e => setField('cta', e.target.value)} placeholder="Comment below!" />
                    : <p className="text-sm mt-1">{displayPost.cta || '—'}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Post Image URL</label>
                {editing ? (
                  <div className="mt-1 space-y-2">
                    <Input value={form.imageUrl || ''} onChange={e => setField('imageUrl', e.target.value)} placeholder="https://... paste image URL" />
                    {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="max-h-48 rounded-lg border object-cover" />}
                  </div>
                ) : displayPost.imageUrl ? (
                  <img src={displayPost.imageUrl} alt="Post" className="mt-1 max-h-48 rounded-lg border object-cover" />
                ) : <p className="text-sm mt-1 text-muted-foreground">No image</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                {editing ? <Textarea className="mt-1" rows={2} value={form.notes || ''} onChange={e => setField('notes', e.target.value)} />
                  : <p className="text-sm mt-1">{displayPost.notes || '—'}</p>}
              </div>
            </div>
          )}

          {/* REVIEW TAB — Facebook Post Mockup */}
          {tab === 'review' && (
            <div className="space-y-4 mt-3">
              {/* Review Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Review Status</label>
                  {editing ? (
                    <Select value={form.reviewStatus || 'Pending'} onValueChange={v => setField('reviewStatus', v)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{REVIEW_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5">
                      {displayPost.reviewStatus === 'Approved' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {displayPost.reviewStatus === 'Needs Changes' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      {displayPost.reviewStatus === 'Rejected' && <X className="h-4 w-4 text-red-500" />}
                      {(!displayPost.reviewStatus || displayPost.reviewStatus === 'Pending') && <Eye className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{displayPost.reviewStatus || 'Pending'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Approval Level</label>
                  {editing ? (
                    <Sel value={form.approvalLevel} onChange={v => setField('approvalLevel', v)} options={APPROVAL_LEVELS} />
                  ) : <StatusBadge value={displayPost.approvalLevel} type="approval" />}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Review Notes / Feedback</label>
                {editing ? <Textarea className="mt-1" rows={2} value={form.reviewNotes || ''} onChange={e => setField('reviewNotes', e.target.value)}
                  placeholder="Add review feedback..." />
                  : <p className="text-sm mt-1 whitespace-pre-wrap">{displayPost.reviewNotes || '—'}</p>}
              </div>

              {/* Facebook Post Mockup */}
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                  <LayoutGrid className="h-3.5 w-3.5" /> Facebook Post Preview
                </p>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm max-w-sm mx-auto">
                  {/* FB Header */}
                  <div className="flex items-center gap-2 p-3 border-b">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">CB</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">CB IELTS</p>
                      <p className="text-[10px] text-gray-500">{displayPost.date || 'Scheduled'} · 🌐</p>
                    </div>
                    <div className="text-gray-400 text-lg">···</div>
                  </div>

                  {/* Post Image */}
                  {displayPost.imageUrl ? (
                    <img src={displayPost.imageUrl} alt="Post visual" className="w-full object-cover max-h-56" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-2">
                      <Image className="h-8 w-8 text-blue-300" />
                      <p className="text-xs text-blue-400">Visual / Image chưa có</p>
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-3 space-y-2">
                    {/* Hook */}
                    {displayPost.hook && (
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{displayPost.hook}</p>
                    )}
                    {/* Body */}
                    {displayPost.body && (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">{displayPost.body}</p>
                    )}
                    {/* Caption fallback if no hook/body */}
                    {!displayPost.hook && !displayPost.body && displayPost.caption && (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">{displayPost.caption}</p>
                    )}
                    {/* CTA */}
                    {displayPost.cta && (
                      <p className="text-sm font-medium text-blue-600">👉 {displayPost.cta}</p>
                    )}
                    {/* Hashtags */}
                    {displayPost.hashtags && (
                      <p className="text-xs text-blue-500 leading-relaxed">{displayPost.hashtags}</p>
                    )}
                    {/* Empty state */}
                    {!displayPost.hook && !displayPost.body && !displayPost.caption && !displayPost.cta && (
                      <p className="text-sm text-gray-400 italic">Chưa có nội dung. Điền thông tin ở tab ② Content.</p>
                    )}
                  </div>

                  {/* FB Reactions Bar */}
                  <div className="px-3 py-1.5 border-t flex items-center justify-between text-gray-500">
                    <div className="flex items-center gap-0.5 text-[10px]">
                      <span>👍</span><span>❤️</span><span>😮</span>
                      <span className="ml-1 text-gray-400">128</span>
                    </div>
                    <div className="text-[10px] text-gray-400">24 bình luận · 12 lượt chia sẻ</div>
                  </div>
                  <div className="px-3 py-1.5 border-t grid grid-cols-3 gap-1">
                    {[
                      { icon: ThumbsUp, label: 'Thích' },
                      { icon: MessageCircle, label: 'Bình luận' },
                      { icon: Share2, label: 'Chia sẻ' },
                    ].map(({ icon: Icon, label }) => (
                      <button key={label} className="flex items-center justify-center gap-1 py-1 rounded hover:bg-gray-50 text-gray-500">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">✅ Quick Checklist</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {checklistItems.map(item => {
                    const isChecked = checklist[item.key] ?? item.auto;
                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleChecklist(item.key)}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg border transition-colors text-left ${isChecked ? 'bg-green-50 border-green-200 text-green-800' : 'bg-muted/30 border-muted text-muted-foreground hover:border-muted-foreground'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}>
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {Object.values(checklist).filter(Boolean).length}/{checklistItems.length} items completed
                  {' · '}Tích thủ công để đánh dấu tiến độ
                </p>
              </div>
            </div>
          )}

          {/* DETAILS TAB */}
          {tab === 'details' && (
            <div className="space-y-4 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Funnel Stage" editing={editing}
                  editEl={<Sel value={form.funnelStage} onChange={v => setField('funnelStage', v)} options={FUNNEL_STAGES} />}
                  viewEl={<span className="text-sm">{displayPost.funnelStage || '—'}</span>} />
                <Field label="Slot Type" editing={editing}
                  editEl={<Sel value={form.slotType} onChange={v => setField('slotType', v)} options={['Main', 'Video', 'Optional', 'Bonus']} />}
                  viewEl={<span className="text-sm">{displayPost.slotType || '—'}</span>} />
                <Field label="Difficulty" editing={editing}
                  editEl={<Input type="number" className="h-8" min={1} max={5} value={form.difficultyScore ?? ''} onChange={e => setField('difficultyScore', e.target.value ? Number(e.target.value) : null)} />}
                  viewEl={<span className="text-sm">{displayPost.difficultyScore ?? '—'}</span>} />
                <Field label="Posting Time" editing={editing}
                  editEl={<Input className="h-8" value={form.postingTime || ''} onChange={e => setField('postingTime', e.target.value)} placeholder="e.g. 18:00" />}
                  viewEl={<span className="text-sm">{displayPost.postingTime || '—'}</span>} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> Source / Reference</label>
                {editing ? <Textarea className="mt-1" rows={2} value={form.sourceRef || ''} onChange={e => setField('sourceRef', e.target.value)} placeholder="Add reference links, source materials..." />
                  : <p className="text-sm mt-1">{displayPost.sourceRef || '—'}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Source Bank</label>
                {editing ? <Input className="mt-1" value={form.sourceBank || ''} onChange={e => setField('sourceBank', e.target.value)} />
                  : <p className="text-sm mt-1">{displayPost.sourceBank || '—'}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Published Link</label>
                {editing ? <Input className="mt-1" value={form.publishedLink || ''} onChange={e => setField('publishedLink', e.target.value)} placeholder="https://..." />
                  : displayPost.publishedLink ? (
                    <a href={displayPost.publishedLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                      {displayPost.publishedLink} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : <p className="text-sm mt-1 text-muted-foreground">—</p>}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updatePost.isPending}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ ...displayPost }); }}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyAll}>
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAIParse(v => !v); }}
                className="border-purple-300 text-purple-600 hover:bg-purple-50">
                <Sparkles className="h-4 w-4 mr-1" /> AI Parse
              </Button>
              <Button size="sm" variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-1" /> Archive
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Reusable field wrapper */
function Field({ label, editing, editEl, viewEl }: { label: string; editing: boolean; editEl: React.ReactNode; viewEl: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {editing ? editEl : viewEl}
    </div>
  );
}

/* Reusable select with "Other" option */
function Sel({ value, onChange, options, labels, allowOther }: {
  value: any; onChange: (v: string) => void; options: string[];
  labels?: Record<string, string>; allowOther?: boolean;
}) {
  const [customMode, setCustomMode] = useState(false);
  const isCustom = value && !options.includes(value) && value !== 'none';

  if (customMode || (allowOther && isCustom)) {
    return (
      <div className="flex gap-1 mt-1">
        <Input className="h-8 flex-1" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Type custom value..." autoFocus />
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setCustomMode(false); onChange(''); }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value || 'none'} onValueChange={v => {
      if (v === '__other__') { setCustomMode(true); return; }
      onChange(v === 'none' ? '' : v);
    }}>
      <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {options.map(o => <SelectItem key={o} value={o}>{labels?.[o] || o}</SelectItem>)}
        {allowOther && <SelectItem value="__other__" className="text-primary font-medium">+ Other...</SelectItem>}
      </SelectContent>
    </Select>
  );
}
