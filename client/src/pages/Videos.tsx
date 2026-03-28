import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANE_DOT_COLORS, PRODUCTION_STAGES } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Video, MoreHorizontal, Pencil, Trash2,
  Copy, FileText, Play, Circle, CheckCircle2, Clock, Film,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const stageIcons: Record<string, React.ReactNode> = {
  'Concept': <Circle className="h-3.5 w-3.5 text-gray-400" />,
  'Script': <FileText className="h-3.5 w-3.5 text-purple-500" />,
  'Filming': <Film className="h-3.5 w-3.5 text-blue-500" />,
  'Editing': <Clock className="h-3.5 w-3.5 text-amber-500" />,
  'Ready': <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  'Published': <Play className="h-3.5 w-3.5 text-green-600" />,
};

export default function Videos() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const { data: videos = [] } = trpc.videos.list.useQuery();
  const { data: lanes = [] } = trpc.lanes.list.useQuery();
  const utils = trpc.useUtils();

  const updateMut = trpc.videos.update.useMutation({
    onSuccess: () => { utils.videos.list.invalidate(); toast.success("Updated"); },
  });
  const deleteMut = trpc.videos.delete.useMutation({
    onSuccess: () => { utils.videos.list.invalidate(); toast.success("Deleted"); setSelectedVideo(null); },
  });

  const filtered = useMemo(() => {
    return videos.filter((v: any) => {
      if (search && !(v.topic?.toLowerCase().includes(search.toLowerCase()) || v.videoId?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [videos, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Pipeline</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} videos in pipeline</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Video
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PRODUCTION_STAGES.map(stage => {
          const stagePosts = filtered.filter((v: any) => (v.productionStage || 'Concept') === stage);
          return (
            <div key={stage} className="min-w-[260px] w-[260px] shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                {stageIcons[stage]}
                <h3 className="text-sm font-semibold">{stage}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{stagePosts.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px] bg-muted/20 rounded-lg p-2">
                {stagePosts.map((video: any) => (
                  <Card key={video.id} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setSelectedVideo(video)}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[video.laneCode || ''] || '#94a3b8' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.topic || video.videoId}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{video.videoId} · {video.videoType || ''}</p>
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {video.laneCode && <StatusBadge value={video.laneCode} type="lane" />}
                            {video.duration && <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{video.duration}</span>}
                          </div>
                          {video.script && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600">
                              <FileText className="h-3 w-3" /> Script attached
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                            {PRODUCTION_STAGES.filter(s => s !== stage).map(s => (
                              <DropdownMenuItem key={s} onClick={() => updateMut.mutate({ id: video.id, productionStage: s })}>
                                Move to {s}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteMut.mutate({ id: video.id })} className="text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stagePosts.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">No videos</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoDetailModal video={selectedVideo} open={!!selectedVideo} onClose={() => setSelectedVideo(null)}
          lanes={lanes} onUpdate={(data: any) => { updateMut.mutate({ id: selectedVideo.id, ...data }); setSelectedVideo(null); }}
          onDelete={() => deleteMut.mutate({ id: selectedVideo.id })} />
      )}

      <CreateVideoDialog open={showCreate} onClose={() => setShowCreate(false)} lanes={lanes} />
    </div>
  );
}

function VideoDetailModal({ video, open, onClose, lanes, onUpdate, onDelete }: {
  video: any; open: boolean; onClose: () => void; lanes: any[];
  onUpdate: (data: any) => void; onDelete: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({ ...video });
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleCopy = () => {
    const text = [
      `Video: ${form.topic || form.videoId}`,
      form.hook ? `Hook: ${form.hook}` : '',
      form.script ? `\n--- SCRIPT ---\n${form.script}` : '',
      form.notes ? `\n--- NOTES ---\n${form.notes}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {video.topic || video.videoId}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Video ID</label>
                <Input className="mt-1" value={form.videoId || ''} onChange={e => sf('videoId', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Stage</label>
                <Select value={form.productionStage || 'Concept'} onValueChange={v => sf('productionStage', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCTION_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Topic</label>
              <Input className="mt-1" value={form.topic || ''} onChange={e => sf('topic', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hook</label>
              <Textarea className="mt-1" rows={2} value={form.hook || ''} onChange={e => sf('hook', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Lane</label>
                <Select value={form.laneCode || 'none'} onValueChange={v => sf('laneCode', v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Duration</label>
                <Input className="mt-1" value={form.duration || ''} onChange={e => sf('duration', e.target.value)} placeholder="e.g. 30s, 60s" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Video Type</label>
                <Input className="mt-1" value={form.videoType || ''} onChange={e => sf('videoType', e.target.value)} placeholder="Reel, Long-form..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Visual Style</label>
                <Input className="mt-1" value={form.visualStyle || ''} onChange={e => sf('visualStyle', e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="script" className="mt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Video Script</label>
              <Textarea className="font-mono text-sm" rows={15} value={form.script || ''} onChange={e => sf('script', e.target.value)}
                placeholder={"Write your video script here...\n\n[INTRO]\nHook: ...\n\n[BODY]\nPoint 1: ...\nPoint 2: ...\n\n[OUTRO]\nCTA: ..."} />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-3">
            <Textarea rows={10} value={form.notes || ''} onChange={e => sf('notes', e.target.value)} placeholder="Production notes, references, ideas..." />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-3 border-t mt-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy All
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { const { id, createdAt, updatedAt, ...data } = form; onUpdate(data); }}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateVideoDialog({ open, onClose, lanes }: { open: boolean; onClose: () => void; lanes: any[] }) {
  const [form, setForm] = useState<Record<string, any>>({ productionStage: 'Concept', existingOrNew: 'New' });
  const utils = trpc.useUtils();
  const create = trpc.videos.create.useMutation({
    onSuccess: () => { utils.videos.list.invalidate(); toast.success("Video created"); onClose(); setForm({ productionStage: 'Concept', existingOrNew: 'New' }); },
    onError: (e) => toast.error(e.message),
  });
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Video</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Video ID *</label>
              <Input className="mt-1" value={form.videoId || ''} onChange={e => sf('videoId', e.target.value)} placeholder="e.g. V01" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stage</label>
              <Select value={form.productionStage || 'Concept'} onValueChange={v => sf('productionStage', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTION_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <Input className="mt-1" value={form.topic || ''} onChange={e => sf('topic', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Lane</label>
            <Select value={form.laneCode || 'none'} onValueChange={v => sf('laneCode', v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">None</SelectItem>{lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hook</label>
            <Textarea className="mt-1" rows={2} value={form.hook || ''} onChange={e => sf('hook', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Script</label>
            <Textarea className="mt-1 font-mono" rows={5} value={form.script || ''} onChange={e => sf('script', e.target.value)} placeholder="Write script..." />
          </div>
          <Button onClick={() => { if (!form.videoId) { toast.error("Video ID required"); return; } create.mutate(form as any); }} disabled={create.isPending} className="w-full">
            Create Video
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
