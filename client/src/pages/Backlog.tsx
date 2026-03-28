import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LANE_DOT_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Archive, RotateCcw, MoreHorizontal,
  Pencil, Trash2, Copy, ChevronDown, ChevronRight,
  Calendar, FolderArchive,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function BacklogPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'monthly'>('monthly');
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [reviveTarget, setReviveTarget] = useState<any>(null);
  const [reviveData, setReviveData] = useState({ postCode: '', date: '' });

  const { data: items = [] } = trpc.backlog.list.useQuery();
  const { data: lanes = [] } = trpc.lanes.list.useQuery();
  const { data: archivedPosts = [] } = trpc.posts.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMut = trpc.backlog.delete.useMutation({
    onSuccess: () => { utils.backlog.list.invalidate(); toast.success("Deleted"); },
  });
  const updateMut = trpc.backlog.update.useMutation({
    onSuccess: () => { utils.backlog.list.invalidate(); toast.success("Updated"); setEditingItem(null); },
  });
  const reviveMut = trpc.backlog.revive.useMutation({
    onSuccess: () => { utils.backlog.list.invalidate(); utils.posts.list.invalidate(); toast.success("Revived to Planning Board!"); setReviveTarget(null); },
    onError: (e) => toast.error(e.message),
  });

  // Get archived posts (status = Archived or Published)
  const archived = useMemo(() => {
    return archivedPosts.filter((p: any) => p.status === 'Archived' || p.status === 'Published');
  }, [archivedPosts]);

  const filtered = useMemo(() => {
    return items.filter((i: any) => {
      if (search && !(i.topic?.toLowerCase().includes(search.toLowerCase()) || i.legacyCode?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [items, search]);

  // Group by month
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach((item: any) => {
      const date = item.createdAt ? new Date(item.createdAt) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const archivedMonthly = useMemo(() => {
    const groups: Record<string, any[]> = {};
    archived.forEach((post: any) => {
      const date = post.date ? new Date(post.date) : (post.updatedAt ? new Date(post.updatedAt) : new Date());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [archived]);

  const formatMonth = (key: string) => {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backlog & Archive</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} backlog items · {archived.length} archived posts</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add to Backlog
        </Button>
      </div>

      <Tabs defaultValue="backlog">
        <TabsList>
          <TabsTrigger value="backlog"><Archive className="h-3.5 w-3.5 mr-1" /> Backlog ({filtered.length})</TabsTrigger>
          <TabsTrigger value="archived"><FolderArchive className="h-3.5 w-3.5 mr-1" /> Archived Posts ({archived.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="backlog" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 h-9" placeholder="Search backlog..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <button className={`text-xs px-2.5 py-1 rounded ${viewMode === 'all' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('all')}>All</button>
              <button className={`text-xs px-2.5 py-1 rounded ${viewMode === 'monthly' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('monthly')}>By Month</button>
            </div>
          </div>

          {viewMode === 'monthly' ? (
            <div className="space-y-3">
              {monthlyGroups.map(([month, groupItems]) => (
                <MonthGroup key={month} month={formatMonth(month)} items={groupItems}
                  onRevive={(item: any) => { setReviveTarget(item); setReviveData({ postCode: item.proposedCode || item.legacyCode || '', date: '' }); }}
                  onEdit={setEditingItem} onDelete={(id: number) => deleteMut.mutate({ id })}
                  onCopy={(item: any) => { navigator.clipboard.writeText([item.topic, item.whyKeep, item.notes].filter(Boolean).join('\n\n')); toast.success("Copied"); }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item: any) => (
                <BacklogCard key={item.id} item={item}
                  onRevive={() => { setReviveTarget(item); setReviveData({ postCode: item.proposedCode || item.legacyCode || '', date: '' }); }}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => deleteMut.mutate({ id: item.id })}
                  onCopy={() => { navigator.clipboard.writeText([item.topic, item.whyKeep, item.notes].filter(Boolean).join('\n\n')); toast.success("Copied"); }} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Archive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No backlog items</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4 space-y-3">
          {archivedMonthly.length === 0 ? (
            <div className="text-center py-16">
              <FolderArchive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No archived posts yet. Archive posts from the Planning Board when they are done.</p>
            </div>
          ) : (
            archivedMonthly.map(([month, posts]) => (
              <Collapsible key={month} defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{formatMonth(month)}</span>
                  <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full">{posts.length}</span>
                  <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
                    {posts.map((post: any) => (
                      <Card key={post.id} className="border shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full" style={{ background: LANE_DOT_COLORS[post.laneCode || ''] || '#94a3b8' }} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{post.topic || post.postCode}</p>
                              <p className="text-xs text-muted-foreground">{post.postCode} · {post.date || ''}</p>
                            </div>
                            <StatusBadge value={post.status} type="status" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Revive Dialog */}
      <Dialog open={!!reviveTarget} onOpenChange={v => { if (!v) setReviveTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Revive to Planning Board</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Post Code *</label>
              <Input className="mt-1" value={reviveData.postCode} onChange={e => setReviveData({ ...reviveData, postCode: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input className="mt-1" type="date" value={reviveData.date} onChange={e => setReviveData({ ...reviveData, date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviveTarget(null)}>Cancel</Button>
            <Button onClick={() => { if (reviveTarget) reviveMut.mutate({ backlogId: reviveTarget.id, ...reviveData }); }}
              disabled={!reviveData.postCode || reviveMut.isPending}>Revive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={v => { if (!v) setEditingItem(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Backlog Item</DialogTitle></DialogHeader>
            <EditBacklogForm item={editingItem} lanes={lanes} onSave={(data: any) => updateMut.mutate({ id: editingItem.id, ...data })} />
          </DialogContent>
        </Dialog>
      )}

      <CreateBacklogDialog open={showCreate} onClose={() => setShowCreate(false)} lanes={lanes} />
    </div>
  );
}

function MonthGroup({ month, items, onRevive, onEdit, onDelete, onCopy }: {
  month: string; items: any[]; onRevive: (item: any) => void;
  onEdit: (item: any) => void; onDelete: (id: number) => void; onCopy: (item: any) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{month}</span>
        <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full">{items.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
          {items.map((item: any) => (
            <BacklogCard key={item.id} item={item} onRevive={() => onRevive(item)}
              onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onCopy={() => onCopy(item)} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function BacklogCard({ item, onRevive, onEdit, onDelete, onCopy }: {
  item: any; onRevive: () => void; onEdit: () => void; onDelete: () => void; onCopy: () => void;
}) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-10 rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[item.laneCode || ''] || '#94a3b8' }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.topic || item.legacyCode}</p>
              <p className="text-xs text-muted-foreground">{item.legacyCode} {item.proposedCode ? `→ ${item.proposedCode}` : ''}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onCopy}><Copy className="h-3.5 w-3.5 mr-2" /> Copy</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRevive} className="text-green-600"><RotateCcw className="h-3.5 w-3.5 mr-2" /> Revive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {item.laneCode && <StatusBadge value={item.laneCode} type="lane" />}
          {item.newStatus && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{item.newStatus}</span>}
          {item.difficulty && <span className="text-[10px] text-muted-foreground">Diff: {item.difficulty}</span>}
        </div>

        {item.whyKeep && (
          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2 line-clamp-2">{item.whyKeep}</p>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          <button onClick={onRevive} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors">
            <RotateCcw className="h-3 w-3" /> Revive
          </button>
          {item.suggestedWeek && <span className="text-[10px] text-muted-foreground ml-auto">Suggested: {item.suggestedWeek}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function EditBacklogForm({ item, lanes, onSave }: { item: any; lanes: any[]; onSave: (data: any) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ ...item });
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Legacy Code</label>
          <Input className="mt-1" value={form.legacyCode || ''} onChange={e => sf('legacyCode', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Proposed Code</label>
          <Input className="mt-1" value={form.proposedCode || ''} onChange={e => sf('proposedCode', e.target.value)} />
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
        <label className="text-xs font-medium text-muted-foreground">Why Keep</label>
        <Textarea className="mt-1" rows={2} value={form.whyKeep || ''} onChange={e => sf('whyKeep', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <Textarea className="mt-1" rows={2} value={form.notes || ''} onChange={e => sf('notes', e.target.value)} />
      </div>
      <Button onClick={() => { const { id, createdAt, updatedAt, ...data } = form; onSave(data); }} className="w-full">Save Changes</Button>
    </div>
  );
}

function CreateBacklogDialog({ open, onClose, lanes }: { open: boolean; onClose: () => void; lanes: any[] }) {
  const [form, setForm] = useState<Record<string, any>>({ newStatus: 'Backlog', difficulty: 2 });
  const utils = trpc.useUtils();
  const create = trpc.backlog.create.useMutation({
    onSuccess: () => { utils.backlog.list.invalidate(); toast.success("Added to backlog"); onClose(); setForm({ newStatus: 'Backlog', difficulty: 2 }); },
    onError: (e) => toast.error(e.message),
  });
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add to Backlog</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Legacy Code</label>
              <Input className="mt-1" value={form.legacyCode || ''} onChange={e => sf('legacyCode', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Proposed Code</label>
              <Input className="mt-1" value={form.proposedCode || ''} onChange={e => sf('proposedCode', e.target.value)} />
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
            <label className="text-xs font-medium text-muted-foreground">Why Keep</label>
            <Textarea className="mt-1" rows={2} value={form.whyKeep || ''} onChange={e => sf('whyKeep', e.target.value)} />
          </div>
          <Button onClick={() => create.mutate(form as any)} disabled={create.isPending} className="w-full">Add to Backlog</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
