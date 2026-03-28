import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LANE_DOT_COLORS, FORMATS, EXECUTION_SPEEDS } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Zap, Pencil, Trash2, Copy, ClipboardList, Sparkles,
  Save, ChevronLeft, ChevronRight,
} from "lucide-react";

export default function Optional() {
  const [search, setSearch] = useState('');
  const [filterLane, setFilterLane] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: optionals = [] } = trpc.optional.list.useQuery();
  const { data: lanes = [] } = trpc.lanes.list.useQuery();
  const { data: pillars = [] } = trpc.pillars.list.useQuery();
  const { data: seriesList = [] } = trpc.series.list.useQuery();
  const { data: angles = [] } = trpc.angles.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMut = trpc.optional.delete.useMutation({
    onSuccess: () => { utils.optional.list.invalidate(); toast.success("Deleted"); setSelected(null); },
  });
  const activateMut = trpc.optional.activate.useMutation({
    onSuccess: () => { utils.optional.list.invalidate(); utils.posts.list.invalidate(); toast.success("Activated to Planning Board!"); setSelected(null); },
  });
  const updateMut = trpc.optional.update.useMutation({
    onSuccess: () => { utils.optional.list.invalidate(); toast.success("Saved"); setIsEditing(false); },
  });
  const createMut = trpc.optional.create.useMutation({
    onSuccess: () => { utils.optional.list.invalidate(); toast.success("Created"); setShowCreate(false); setEditForm({}); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return optionals.filter((o: any) => {
      if (search) {
        const q = search.toLowerCase();
        const match = [o.topic, o.postCode, o.whyEasy, o.whenToUse, o.notes]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterLane !== 'all' && o.laneCode !== filterLane) return false;
      return true;
    });
  }, [optionals, search, filterLane]);

  const openDetail = (opt: any) => {
    setSelected(opt);
    setEditForm({ ...opt });
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    const { id, createdAt, updatedAt, ...data } = editForm;
    updateMut.mutate({ id: selected.id, ...data });
    setSelected({ ...selected, ...data });
  };

  const handleCopy = (opt: any) => {
    const text = [
      `Topic: ${opt.topic || ''}`,
      `Code: ${opt.postCode || ''}`,
      `Lane: ${opt.laneCode || ''} | Format: ${opt.format || ''}`,
      `Why Easy: ${opt.whyEasy || ''}`,
      `When to Use: ${opt.whenToUse || ''}`,
      `Notes: ${opt.notes || ''}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const currentIdx = selected ? filtered.findIndex((i: any) => i.id === selected.id) : -1;
  const goPrev = () => { if (currentIdx > 0) openDetail(filtered[currentIdx - 1]); };
  const goNext = () => { if (currentIdx < filtered.length - 1) openDetail(filtered[currentIdx + 1]); };
  const sf = (k: string, v: any) => setEditForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Optional Pool</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} quick-win backup posts</p>
        </div>
        <Button size="sm" onClick={() => { setEditForm({ executionSpeed: 'Fast' }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Optional
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterLane} onValueChange={setFilterLane}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="All Lanes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lanes</SelectItem>
            {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code} - {l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cards - click to open detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((opt: any) => (
          <Card key={opt.id}
            className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
            onClick={() => openDetail(opt)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[opt.laneCode || ''] || '#94a3b8' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{opt.topic || opt.postCode}</p>
                  <p className="text-xs text-muted-foreground">{opt.postCode} · {opt.seriesCode || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {opt.laneCode && <StatusBadge value={opt.laneCode} type="lane" />}
                {opt.format && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{opt.format}</span>}
                {opt.executionSpeed && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{opt.executionSpeed}</span>}
              </div>
              {opt.whyEasy && (
                <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md">
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Why Easy</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-0.5 line-clamp-2">{opt.whyEasy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No optional posts found</p>
        </div>
      )}

      {/* ═══ Detail Modal ═══ */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          {selected && (
            <>
              <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 rounded-full" style={{ background: LANE_DOT_COLORS[selected.laneCode || ''] || '#94a3b8' }} />
                  <div>
                    <h3 className="font-semibold text-base">{isEditing ? 'Edit Optional Post' : (selected.topic || selected.postCode)}</h3>
                    <p className="text-xs text-muted-foreground">{selected.postCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={goPrev} disabled={currentIdx <= 0} className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-xs text-muted-foreground">{currentIdx + 1}/{filtered.length}</span>
                  <button onClick={goNext} disabled={currentIdx >= filtered.length - 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              <ScrollArea className="max-h-[calc(90vh-180px)]">
                <div className="px-5 py-4 space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Topic</label>
                        <Input className="mt-1" value={editForm.topic || ''} onChange={e => sf('topic', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
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
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Format</label>
                          <Select value={editForm.format || '_none'} onValueChange={v => sf('format', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Execution Speed</label>
                          <Select value={editForm.executionSpeed || '_none'} onValueChange={v => sf('executionSpeed', v === '_none' ? '' : v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {EXECUTION_SPEEDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Why Easy</label>
                        <Textarea className="mt-1" rows={3} value={editForm.whyEasy || ''} onChange={e => sf('whyEasy', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">When to Use</label>
                        <Textarea className="mt-1" rows={2} value={editForm.whenToUse || ''} onChange={e => sf('whenToUse', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <Textarea className="mt-1" rows={2} value={editForm.notes || ''} onChange={e => sf('notes', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {selected.laneCode && <StatusBadge value={selected.laneCode} type="lane" />}
                        {selected.pillarCode && <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{selected.pillarCode}</span>}
                        {selected.seriesCode && <span className="text-xs bg-muted px-2 py-0.5 rounded">{selected.seriesCode}</span>}
                        {selected.angleCode && <span className="text-xs bg-muted px-2 py-0.5 rounded">{selected.angleCode}</span>}
                        {selected.format && <span className="text-xs bg-muted px-2 py-0.5 rounded">{selected.format}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <InfoRow label="Execution Speed" value={selected.executionSpeed} />
                        <InfoRow label="Difficulty" value={selected.difficultyScore} />
                        <InfoRow label="Approval" value={selected.approvalLevel} />
                        <InfoRow label="Source Bank" value={selected.sourceBank} />
                        <InfoRow label="Funnel Stage" value={selected.funnelStage} />
                        <InfoRow label="Week" value={selected.weekLabel} />
                      </div>

                      {selected.whyEasy && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1"><Sparkles className="h-3.5 w-3.5" /> Why Easy</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-300">{selected.whyEasy}</p>
                        </div>
                      )}

                      {selected.whenToUse && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">When to Use</p>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">{selected.whenToUse}</p>
                        </div>
                      )}

                      {selected.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">{selected.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="px-5 py-3 border-t bg-muted/20 flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateMut.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditForm({ ...selected }); }}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(selected)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => activateMut.mutate({ optionalId: selected.id, date: new Date().toISOString().slice(0, 10) })}
                      disabled={activateMut.isPending}>
                      <ClipboardList className="h-3.5 w-3.5 mr-1" /> Activate to Planning
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: selected.id }); }}>
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
          <DialogHeader><DialogTitle>New Optional Post</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Post Code *</label>
              <Input className="mt-1" value={editForm.postCode || ''} onChange={e => sf('postCode', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Topic</label>
              <Input className="mt-1" value={editForm.topic || ''} onChange={e => sf('topic', e.target.value)} />
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
                <label className="text-xs font-medium text-muted-foreground">Speed</label>
                <Select value={editForm.executionSpeed || 'Fast'} onValueChange={v => sf('executionSpeed', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXECUTION_SPEEDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Why Easy</label>
              <Textarea className="mt-1" rows={2} value={editForm.whyEasy || ''} onChange={e => sf('whyEasy', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">When to Use</label>
              <Textarea className="mt-1" rows={2} value={editForm.whenToUse || ''} onChange={e => sf('whenToUse', e.target.value)} />
            </div>
            <Button onClick={() => { if (!editForm.postCode) { toast.error("Post code required"); return; } createMut.mutate(editForm as any); }} disabled={createMut.isPending} className="w-full">
              Create
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
