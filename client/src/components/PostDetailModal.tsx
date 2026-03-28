import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, FUNNEL_STAGES, APPROVAL_LEVELS, FORMATS, PRIORITIES, LANE_DOT_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Save, Archive, Clipboard, ExternalLink, Image, ChevronLeft, ChevronRight,
  Send, Eye, CheckCircle2, AlertCircle, Pencil, X, Link2
} from "lucide-react";

const STATUS_FLOW = ['Idea', 'Planned', 'In Progress', 'Ready', 'Published'];
const REVIEW_STATUSES = ['Pending', 'Approved', 'Needs Changes', 'Rejected'];

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
  const utils = trpc.useUtils();

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.posts.list.invalidate();
      // Update local post state so modal reflects changes immediately
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

  useEffect(() => {
    if (post) { setLocalPost(post); setForm({ ...post }); setEditing(false); setTab('overview'); }
  }, [post]);

  if (!post || !localPost) return null;

  // Use localPost for display so status changes are reflected immediately
  const displayPost = localPost;
  const currentIdx = STATUS_FLOW.indexOf(displayPost.status || 'Planned');
  const canGoBack = currentIdx > 0;
  const canGoForward = currentIdx < STATUS_FLOW.length - 1;
  const isPublished = displayPost.status === 'Published';

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

  const handleCopyContent = () => {
    const content = [
      displayPost.topic && `📌 ${displayPost.topic}`,
      displayPost.caption && `\n${displayPost.caption}`,
      displayPost.hashtags && `\n${displayPost.hashtags}`,
      displayPost.cta && `\n👉 ${displayPost.cta}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(content || displayPost.topic || '');
    toast.success("Copied to clipboard!");
  };

  const handleCopyAll = () => {
    const all = [
      `Post: ${displayPost.postCode}`,
      `Topic: ${displayPost.topic || ''}`,
      `Date: ${displayPost.date || ''}`,
      `Lane: ${displayPost.laneCode || ''} | Pillar: ${displayPost.pillarCode || ''} | Series: ${displayPost.seriesCode || ''}`,
      `Format: ${displayPost.format || ''} | Status: ${displayPost.status || ''}`,
      `---`,
      `Caption:\n${displayPost.caption || ''}`,
      `Hashtags: ${displayPost.hashtags || ''}`,
      `CTA: ${displayPost.cta || ''}`,
      `Notes: ${displayPost.notes || ''}`,
      displayPost.publishedLink ? `Link: ${displayPost.publishedLink}` : '',
      displayPost.sourceRef ? `Source: ${displayPost.sourceRef}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(all);
    toast.success("All info copied!");
  };

  const handleArchive = () => {
    const month = new Date().toISOString().slice(0, 7);
    archiveMut.mutate({ id: displayPost.id, month });
  };

  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header with status flow */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[displayPost.laneCode || ''] || '#94a3b8' }} />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg truncate">{displayPost.topic || displayPost.postCode}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{displayPost.postCode} · {displayPost.date || 'No date'} · {displayPost.laneCode || ''}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Process Navigation Bar */}
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

        <Tabs value={tab} onValueChange={setTab} className="mt-1">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-3">
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
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-4 mt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Caption</label>
              {editing ? <Textarea className="mt-1" rows={5} value={form.caption || ''} onChange={e => setField('caption', e.target.value)} placeholder="Write your post caption here..." />
                : <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{displayPost.caption || 'No caption yet'}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hashtags</label>
                {editing ? <Input className="mt-1" value={form.hashtags || ''} onChange={e => setField('hashtags', e.target.value)} placeholder="#ielts #english" />
                  : <p className="text-sm mt-1 text-blue-600">{displayPost.hashtags || '—'}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Call to Action</label>
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
          </TabsContent>

          {/* REVIEW TAB */}
          <TabsContent value="review" className="space-y-4 mt-3">
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" /> Review & Approval
              </h3>
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
                      {(displayPost.reviewStatus === 'Approved') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {(displayPost.reviewStatus === 'Needs Changes') && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      {(displayPost.reviewStatus === 'Rejected') && <X className="h-4 w-4 text-red-500" />}
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
                {editing ? <Textarea className="mt-1" rows={3} value={form.reviewNotes || ''} onChange={e => setField('reviewNotes', e.target.value)}
                  placeholder="Add review feedback, checklist items, or approval notes..." />
                  : <p className="text-sm mt-1 whitespace-pre-wrap">{displayPost.reviewNotes || 'No review notes'}</p>}
              </div>

              {/* Mockup Preview */}
              <div className="border rounded-lg p-3 bg-background">
                <p className="text-xs font-medium text-muted-foreground mb-2">Post Preview</p>
                <div className="border rounded-lg overflow-hidden">
                  {displayPost.imageUrl ? (
                    <img src={displayPost.imageUrl} alt="Preview" className="w-full max-h-40 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground">
                      <Image className="h-8 w-8" />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium">{displayPost.topic || 'Post title'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{displayPost.caption || 'Caption preview...'}</p>
                    {displayPost.hashtags && <p className="text-xs text-blue-500">{displayPost.hashtags}</p>}
                    {displayPost.cta && <p className="text-xs font-medium text-primary">{displayPost.cta}</p>}
                  </div>
                </div>
              </div>

              {/* Review Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Checklist</p>
                {[
                  { label: 'Caption written', check: !!displayPost.caption },
                  { label: 'Hashtags added', check: !!displayPost.hashtags },
                  { label: 'CTA included', check: !!displayPost.cta },
                  { label: 'Image attached', check: !!displayPost.imageUrl },
                  { label: 'Date scheduled', check: !!displayPost.date },
                  { label: 'Published link', check: !!displayPost.publishedLink },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.check ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}>
                      {item.check && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <span className={item.check ? '' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Funnel Stage" editing={editing}
                editEl={<Sel value={form.funnelStage} onChange={v => setField('funnelStage', v)} options={FUNNEL_STAGES} />}
                viewEl={<span className="text-sm">{displayPost.funnelStage || '—'}</span>} />
              <Field label="Slot Type" editing={editing}
                editEl={<Sel value={form.slotType} onChange={v => setField('slotType', v)} options={['Main', 'Optional', 'Bonus']} />}
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
          </TabsContent>
        </Tabs>

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
              <Button size="sm" variant="outline" onClick={handleCopyContent}>
                <Clipboard className="h-4 w-4 mr-1" /> Copy Post
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyAll}>
                <Clipboard className="h-4 w-4 mr-1" /> Copy All
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
