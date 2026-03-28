import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { READINESS_STATUSES, LANE_DOT_COLORS, FORMATS } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Lightbulb, ArrowRight, ClipboardList, Zap,
  Pencil, Trash2, Copy, X, Save, ChevronLeft, ChevronRight,
} from "lucide-react";

export default function Ideas() {
  const [search, setSearch] = useState('');
  const [filterReadiness, setFilterReadiness] = useState('all');
  const [filterLane, setFilterLane] = useState('all');
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: ideas = [] } = trpc.ideas.list.useQuery();
  const { data: lanes = [] } = trpc.lanes.list.useQuery();
  const { data: pillars = [] } = trpc.pillars.list.useQuery();
  const { data: seriesList = [] } = trpc.series.list.useQuery();
  const { data: angles = [] } = trpc.angles.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMut = trpc.ideas.delete.useMutation({
    onSuccess: () => { utils.ideas.list.invalidate(); toast.success("Deleted"); setSelectedIdea(null); },
  });
  const promoteMut = trpc.ideas.promote.useMutation({
    onSuccess: () => { utils.ideas.list.invalidate(); utils.posts.list.invalidate(); toast.success("Promoted to Planning Board!"); setSelectedIdea(null); },
  });
  const promoteOptMut = trpc.optional.create.useMutation({
    onSuccess: () => { utils.optional.list.invalidate(); utils.ideas.list.invalidate(); toast.success("Sent to Optional Pool!"); setSelectedIdea(null); },
  });
  const updateMut = trpc.ideas.update.useMutation({
    onSuccess: () => { utils.ideas.list.invalidate(); toast.success("Saved"); setIsEditing(false); },
  });
  const createMut = trpc.ideas.create.useMutation({
    onSuccess: () => { utils.ideas.list.invalidate(); toast.success("Idea created"); setShowCreate(false); setEditForm({}); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return ideas.filter((idea: any) => {
      if (search) {
        const q = search.toLowerCase();
        const match = [idea.ideaTitle, idea.topic, idea.menuId, idea.description, idea.notes]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterReadiness !== 'all' && idea.readinessStatus !== filterReadiness) return false;
      if (filterLane !== 'all' && idea.laneCode !== filterLane) return false;
      return true;
    });
  }, [ideas, search, filterReadiness, filterLane]);

  const readinessCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ideas.forEach((i: any) => { counts[i.readinessStatus || 'New'] = (counts[i.readinessStatus || 'New'] || 0) + 1; });
    return counts;
  }, [ideas]);

  const handlePromotePlanning = (idea: any) => {
    promoteMut.mutate({ ideaId: idea.id, postCode: `IDEA-${idea.id}`, date: new Date().toISOString().slice(0, 10) });
  };

  const handlePromoteOptional = (idea: any) => {
    promoteOptMut.mutate({
      postCode: `OPT-IDEA-${idea.id}`,
      topic: idea.ideaTitle || idea.topic || '',
      laneCode: idea.laneCode || undefined,
      pillarCode: idea.pillarCode || undefined,
      format: idea.suggestedFormat || undefined,
    });
  };

  const handleCopy = (idea: any) => {
    const text = [
      `Title: ${idea.ideaTitle || ''}`,
      `Lane: ${idea.laneCode || ''} | Pillar: ${idea.pillarCode || ''} | Series: ${idea.seriesCode || ''}`,
      `Format: ${idea.suggestedFormat || ''} | Difficulty: ${idea.difficultyScore || ''}`,
      `Description: ${idea.description || ''}`,
      `Notes: ${idea.notes || ''}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const openDetail = (idea: any) => {
    setSelectedIdea(idea);
    setEditForm({ ...idea });
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedIdea) return;
    const { id, createdAt, updatedAt, ...data } = editForm;
    updateMut.mutate({ id: selectedIdea.id, ...data });
    setSelectedIdea({ ...selectedIdea, ...data });
  };

  // Navigate between ideas
  const currentIdx = selectedIdea ? filtered.findIndex((i: any) => i.id === selectedIdea.id) : -1;
  const goPrev = () => { if (currentIdx > 0) openDetail(filtered[currentIdx - 1]); };
  const goNext = () => { if (currentIdx < filtered.length - 1) openDetail(filtered[currentIdx + 1]); };

  const sf = (k: string, v: any) => setEditForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Idea Bank</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {ideas.length} ideas</p>
        </div>
        <Button size="sm" onClick={() => { setEditForm({ readinessStatus: 'New' }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Idea
        </Button>
      </div>

      {/* Readiness filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilterReadiness('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterReadiness === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
          All ({ideas.length})
        </button>
        {READINESS_STATUSES.map(s => (
          <button key={s} onClick={() => setFilterReadiness(filterReadiness === s ? 'all' : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterReadiness === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
            {s} ({readinessCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search + Lane filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search ideas..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterLane} onValueChange={setFilterLane}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="All Lanes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lanes</SelectItem>
            {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code} - {l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cards grid - click to open detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((idea: any) => (
          <Card key={idea.id}
            className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
            onClick={() => openDetail(idea)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[idea.laneCode || ''] || '#94a3b8' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{idea.ideaTitle || idea.topic || idea.menuId}</p>
                  <p className="text-xs text-muted-foreground">{idea.menuId} · {idea.seriesCode || ''} · {idea.pillarCode || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <StatusBadge value={idea.readinessStatus} type="readiness" />
                {idea.laneCode && <StatusBadge value={idea.laneCode} type="lane" />}
                {idea.suggestedFormat && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{idea.suggestedFormat}</span>}
                {idea.difficultyScore && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">D:{idea.difficultyScore}</span>}
              </div>
              {idea.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{idea.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No ideas found</p>
        </div>
      )}

      {/* ═══ Detail Modal ═══ */}
      <Dialog open={!!selectedIdea} onOpenChange={v => { if (!v) { setSelectedIdea(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          {selectedIdea && (
            <>
              {/* Header with nav */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 rounded-full" style={{ background: LANE_DOT_COLORS[selectedIdea.laneCode || ''] || '#94a3b8' }} />
                  <div>
                    <h3 className="font-semibold text-base">{isEditing ? 'Edit Idea' : (selectedIdea.ideaTitle || selectedIdea.menuId)}</h3>
                    <p className="text-xs text-muted-foreground">{selectedIdea.menuId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={goPrev} disabled={currentIdx <= 0} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">{currentIdx + 1}/{filtered.length}</span>
                  <button onClick={goNext} disabled={currentIdx >= filtered.length - 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ScrollArea className="max-h-[calc(90vh-180px)]">
                <div className="px-5 py-4 space-y-4">
                  {isEditing ? (
                    /* ── Edit Mode ── */
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Idea Title</label>
                        <Input className="mt-1" value={editForm.ideaTitle || ''} onChange={e => sf('ideaTitle', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Readiness</label>
                          <Select value={editForm.readinessStatus || 'New'} onValueChange={v => sf('readinessStatus', v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{READINESS_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Lane</label>
                          <Select value={editForm.laneCode || '_none'} onValueChange={v => sf('laneCode', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code}</SelectItem>)}
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Pillar</label>
                          <Select value={editForm.pillarCode || '_none'} onValueChange={v => sf('pillarCode', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {pillars.map((p: any) => <SelectItem key={p.code} value={p.code}>{p.code}</SelectItem>)}
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Series</label>
                          <Select value={editForm.seriesCode || '_none'} onValueChange={v => sf('seriesCode', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {seriesList.map((s: any) => <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>)}
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Angle</label>
                          <Select value={editForm.angleCode || '_none'} onValueChange={v => sf('angleCode', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {angles.map((a: any) => <SelectItem key={a.code} value={a.code}>{a.code}</SelectItem>)}
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Format</label>
                          <Select value={editForm.suggestedFormat || '_none'} onValueChange={v => sf('suggestedFormat', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Difficulty (1-5)</label>
                          <Input type="number" min={1} max={5} className="mt-1" value={editForm.difficultyScore || ''} onChange={e => sf('difficultyScore', Number(e.target.value) || null)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Topic Type</label>
                          <Input className="mt-1" value={editForm.topicType || ''} onChange={e => sf('topicType', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Textarea className="mt-1" rows={3} value={editForm.description || ''} onChange={e => sf('description', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Source File</label>
                          <Input className="mt-1" value={editForm.sourceFile || ''} onChange={e => sf('sourceFile', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Source Ref</label>
                          <Input className="mt-1" value={editForm.sourceRef || ''} onChange={e => sf('sourceRef', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <Textarea className="mt-1" rows={2} value={editForm.notes || ''} onChange={e => sf('notes', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    /* ── View Mode ── */
                    <div className="space-y-4">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge value={selectedIdea.readinessStatus} type="readiness" />
                        {selectedIdea.laneCode && <StatusBadge value={selectedIdea.laneCode} type="lane" />}
                        {selectedIdea.pillarCode && <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{selectedIdea.pillarCode}</span>}
                        {selectedIdea.seriesCode && <span className="text-xs bg-muted px-2 py-0.5 rounded">{selectedIdea.seriesCode}</span>}
                        {selectedIdea.angleCode && <span className="text-xs bg-muted px-2 py-0.5 rounded">{selectedIdea.angleCode}</span>}
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <InfoRow label="Format" value={selectedIdea.suggestedFormat} />
                        <InfoRow label="Difficulty" value={selectedIdea.difficultyScore} />
                        <InfoRow label="Topic Type" value={selectedIdea.topicType} />
                        <InfoRow label="Ease" value={selectedIdea.easeLabel} />
                        <InfoRow label="Speed" value={selectedIdea.executionSpeed} />
                        <InfoRow label="Reusability" value={selectedIdea.reusability} />
                        <InfoRow label="Approval" value={selectedIdea.approvalLevel} />
                        <InfoRow label="Source Bank" value={selectedIdea.sourceBank} />
                        <InfoRow label="Source File" value={selectedIdea.sourceFile} />
                        <InfoRow label="Source Ref" value={selectedIdea.sourceRef} />
                      </div>

                      {/* Description */}
                      {selectedIdea.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedIdea.description}</p>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedIdea.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedIdea.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer actions */}
              <div className="px-5 py-3 border-t bg-muted/20 flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateMut.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditForm({ ...selectedIdea }); }}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(selectedIdea)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handlePromotePlanning(selectedIdea)} disabled={promoteMut.isPending}>
                      <ClipboardList className="h-3.5 w-3.5 mr-1" /> To Planning
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handlePromoteOptional(selectedIdea)} disabled={promoteOptMut.isPending}>
                      <Zap className="h-3.5 w-3.5 mr-1" /> To Optional
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this idea?')) deleteMut.mutate({ id: selectedIdea.id }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Create Modal ═══ */}
      <Dialog open={showCreate} onOpenChange={v => { if (!v) setShowCreate(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Idea</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Menu ID *</label>
                <Input className="mt-1" value={editForm.menuId || ''} onChange={e => sf('menuId', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Readiness</label>
                <Select value={editForm.readinessStatus || 'New'} onValueChange={v => sf('readinessStatus', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{READINESS_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Idea Title</label>
              <Input className="mt-1" value={editForm.ideaTitle || ''} onChange={e => sf('ideaTitle', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Lane</label>
                <Select value={editForm.laneCode || '_none'} onValueChange={v => sf('laneCode', v === '_none' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code}</SelectItem>)}
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Format</label>
                <Select value={editForm.suggestedFormat || '_none'} onValueChange={v => sf('suggestedFormat', v === '_none' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea className="mt-1" rows={2} value={editForm.description || ''} onChange={e => sf('description', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea className="mt-1" rows={2} value={editForm.notes || ''} onChange={e => sf('notes', e.target.value)} />
            </div>
            <Button onClick={() => { if (!editForm.menuId) { toast.error("Menu ID required"); return; } createMut.mutate(editForm as any); }} disabled={createMut.isPending} className="w-full">
              Create Idea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
