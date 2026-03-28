import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANE_DOT_COLORS, LANE_NAMES } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, Eye, Heart, MessageCircle,
  Share2, Bookmark, MousePointer, Users, Link2,
  Plus, Pencil, Trash2, Search, Trophy, Target,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const METRIC_FIELDS = [
  { key: 'reach', label: 'Reach', icon: Eye, color: '#3b82f6' },
  { key: 'views', label: 'Views', icon: Eye, color: '#8b5cf6' },
  { key: 'reactions', label: 'Reactions', icon: Heart, color: '#ef4444' },
  { key: 'comments', label: 'Comments', icon: MessageCircle, color: '#f59e0b' },
  { key: 'shares', label: 'Shares', icon: Share2, color: '#10b981' },
  { key: 'saves', label: 'Saves', icon: Bookmark, color: '#6366f1' },
  { key: 'clicks', label: 'Clicks', icon: MousePointer, color: '#ec4899' },
  { key: 'leads', label: 'Leads', icon: Users, color: '#14b8a6' },
];

export default function Metrics() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data: metrics = [] } = trpc.metrics.list.useQuery();
  const { data: posts = [] } = trpc.posts.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.metrics.create.useMutation({
    onSuccess: () => { utils.metrics.list.invalidate(); toast.success("Metric added"); setShowAdd(false); },
  });
  const updateMut = trpc.metrics.update.useMutation({
    onSuccess: () => { utils.metrics.list.invalidate(); toast.success("Updated"); setEditingMetric(null); },
  });
  const deleteMut = trpc.metrics.delete.useMutation({
    onSuccess: () => { utils.metrics.list.invalidate(); toast.success("Deleted"); },
  });

  const calcEngagement = (m: any) => {
    if (!m.reach || m.reach === 0) return 0;
    return ((((m.reactions || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)) / m.reach) * 100);
  };

  const summary = useMemo(() => {
    const totals: Record<string, number> = {};
    METRIC_FIELDS.forEach(f => { totals[f.key] = 0; });
    let totalEngagement = 0, totalReach = 0;
    metrics.forEach((m: any) => {
      METRIC_FIELDS.forEach(f => { totals[f.key] += (m[f.key] || 0); });
      totalEngagement += (m.reactions || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
      totalReach += (m.reach || 0);
    });
    return { totals, avgEngRate: totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : '0', count: metrics.length };
  }, [metrics]);

  const topPosts = useMemo(() => {
    return [...metrics].map((m: any) => ({
      ...m, engagement: (m.reactions || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0),
      engRate: calcEngagement(m).toFixed(1),
    })).sort((a: any, b: any) => b.engagement - a.engagement).slice(0, 10);
  }, [metrics]);

  const leadsByLane = useMemo(() => {
    const map: Record<string, number> = {};
    metrics.forEach((m: any) => {
      const lane = m.postCode?.split('-')[0]?.replace(/W\d+/, '') || 'Other';
      map[lane] = (map[lane] || 0) + (m.leads || 0);
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({
      name: LANE_NAMES[name] || name, value, fill: LANE_DOT_COLORS[name] || '#94a3b8',
    }));
  }, [metrics]);

  const weeklyReach = useMemo(() => {
    const map: Record<string, number> = {};
    metrics.forEach((m: any) => { if (m.weekLabel) map[m.weekLabel] = (map[m.weekLabel] || 0) + (m.reach || 0); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([week, reach]) => ({ week, reach }));
  }, [metrics]);

  const filtered = useMemo(() => {
    return metrics.filter((m: any) => !search || m.postCode?.toLowerCase().includes(search.toLowerCase()) || m.topic?.toLowerCase().includes(search.toLowerCase()));
  }, [metrics, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metrics & Analytics</h1>
          <p className="text-sm text-muted-foreground">{metrics.length} tracked posts</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Metric
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground">Avg Eng. Rate</p>
                <p className="text-lg font-bold">{summary.avgEngRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {METRIC_FIELDS.slice(0, 4).map(f => (
          <Card key={f.key} className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded" style={{ background: `${f.color}20` }}>
                  <f.icon className="h-4 w-4" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total {f.label}</p>
                  <p className="text-lg font-bold">{(summary.totals[f.key] || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="data"><Target className="h-3.5 w-3.5 mr-1" /> Data ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-amber-500" /> Top Posts by Engagement</h3>
                {topPosts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topPosts.slice(0, 7)} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="postCode" width={60} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="engagement" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No data</div>}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-teal-500" /> Leads by Lane</h3>
                {leadsByLane.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={leadsByLane} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }: any) => `${name}: ${value}`}>
                        {leadsByLane.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No leads data</div>}
              </CardContent>
            </Card>

            <Card className="border shadow-sm col-span-full">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-blue-500" /> Weekly Reach Trend</h3>
                {weeklyReach.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyReach}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search by post code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="space-y-2">
            {filtered.map((m: any) => {
              const engRate = calcEngagement(m).toFixed(1);
              return (
                <Card key={m.id} className="border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{m.postCode}</span>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{engRate}% eng</span>
                          {m.topic && <span className="text-xs text-muted-foreground">· {m.topic}</span>}
                          {m.link && (
                            <a href={m.link} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                              <Link2 className="h-3 w-3" /> Source
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {METRIC_FIELDS.map(f => (
                            <div key={f.key} className="flex items-center gap-1">
                              <f.icon className="h-3 w-3" style={{ color: f.color }} />
                              <span className="text-xs">{(m[f.key] || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingMetric(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteMut.mutate({ id: m.id })}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No metrics data yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <MetricFormDialog open={showAdd} onClose={() => setShowAdd(false)} title="Add Metric" posts={posts}
        onSave={(data: any) => createMut.mutate(data)} />
      {editingMetric && (
        <MetricFormDialog open={!!editingMetric} onClose={() => setEditingMetric(null)} title="Edit Metric"
          initial={editingMetric} posts={posts}
          onSave={(data: any) => updateMut.mutate({ id: editingMetric.id, ...data })} />
      )}
    </div>
  );
}

function MetricFormDialog({ open, onClose, title, initial, posts, onSave }: {
  open: boolean; onClose: () => void; title: string; initial?: any; posts: any[];
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(initial || {});
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Post Code *</label>
            <Select value={form.postCode || 'custom'} onValueChange={v => sf('postCode', v === 'custom' ? '' : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select post..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom...</SelectItem>
                {posts.map((p: any) => <SelectItem key={p.id} value={p.postCode}>{p.postCode} - {p.topic}</SelectItem>)}
              </SelectContent>
            </Select>
            {(!form.postCode) && (
              <Input className="mt-1" value={form.postCode || ''} onChange={e => sf('postCode', e.target.value)} placeholder="Enter post code..." />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Posted</label>
              <Input className="mt-1" value={form.datePosted || ''} onChange={e => sf('datePosted', e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Week</label>
              <Input className="mt-1" value={form.weekLabel || ''} onChange={e => sf('weekLabel', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <Input className="mt-1" value={form.topic || ''} onChange={e => sf('topic', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Source URL
            </label>
            <Input className="mt-1" value={form.link || ''} onChange={e => sf('link', e.target.value)} placeholder="Paste post URL..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {METRIC_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <f.icon className="h-3 w-3" style={{ color: f.color }} /> {f.label}
                </label>
                <Input className="mt-1" type="number" value={form[f.key] || ''} onChange={e => sf(f.key, parseInt(e.target.value) || 0)} />
              </div>
            ))}
          </div>

          {form.reach > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Auto-calculated Engagement Rate</p>
                <p className="text-lg font-bold text-primary">
                  {(((form.reactions || 0) + (form.comments || 0) + (form.shares || 0) + (form.saves || 0)) / form.reach * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => { if (!form.postCode?.trim()) { toast.error("Post code required"); return; } onSave(form); }} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
