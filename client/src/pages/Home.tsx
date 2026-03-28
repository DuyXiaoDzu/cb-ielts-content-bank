import { trpc } from "@/lib/trpc";
import { LANE_DOT_COLORS, LANE_NAMES, STATUS_COLORS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Zap, Video, TrendingUp, Calendar, ArrowRight,
  CheckCircle2, Clock, AlertCircle, BarChart3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: allPosts } = trpc.posts.list.useQuery();
  const { data: ideas } = trpc.ideas.list.useQuery();
  const { data: optionals } = trpc.optional.list.useQuery();
  const { data: vids } = trpc.videos.list.useQuery();

  const activePosts = useMemo(() => allPosts?.filter(p => !p.archived) || [], [allPosts]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activePosts.forEach(p => { counts[p.status || 'Planned'] = (counts[p.status || 'Planned'] || 0) + 1; });
    return counts;
  }, [activePosts]);

  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activePosts.forEach(p => { if (p.laneCode) counts[p.laneCode] = (counts[p.laneCode] || 0) + 1; });
    return Object.entries(counts).map(([code, count]) => ({
      name: LANE_NAMES[code] || code, code, value: count,
      color: LANE_DOT_COLORS[code] || '#94a3b8',
    }));
  }, [activePosts]);

  const publishedCount = statusCounts['Published'] || 0;
  const totalActive = activePosts.length;
  const progressPct = totalActive > 0 ? Math.round((publishedCount / totalActive) * 100) : 0;

  const upcomingPosts = useMemo(() =>
    activePosts
      .filter(p => p.status === 'Planned' || p.status === 'In Progress')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 8),
    [activePosts]
  );

  const recentPublished = useMemo(() =>
    activePosts
      .filter(p => p.status === 'Published')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5),
    [activePosts]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Content production overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<FileText className="h-5 w-5" />}
          label="Active Posts"
          value={totalActive}
          sub={`${publishedCount} published`}
          color="bg-blue-500"
          onClick={() => setLocation('/planning')}
        />
        <KpiCard
          icon={<Zap className="h-5 w-5" />}
          label="Ideas Ready"
          value={ideas?.filter(i => i.readinessStatus === 'Ready').length || 0}
          sub={`${ideas?.length || 0} total ideas`}
          color="bg-amber-500"
          onClick={() => setLocation('/ideas')}
        />
        <KpiCard
          icon={<Video className="h-5 w-5" />}
          label="Videos"
          value={vids?.length || 0}
          sub={`${vids?.filter(v => v.productionStage === 'Published').length || 0} published`}
          color="bg-purple-500"
          onClick={() => setLocation('/videos')}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Optional Pool"
          value={optionals?.length || 0}
          sub="backup posts"
          color="bg-emerald-500"
          onClick={() => setLocation('/optional')}
        />
      </div>

      {/* Progress Ring + Lane Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-primary"
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${progressPct * 3.14} ${314 - progressPct * 3.14}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{progressPct}%</span>
                <span className="text-xs text-muted-foreground">Complete</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              <MiniStat label="Planned" value={statusCounts['Planned'] || 0} color="text-amber-600" />
              <MiniStat label="In Progress" value={statusCounts['In Progress'] || 0} color="text-blue-600" />
              <MiniStat label="Published" value={publishedCount} color="text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Lane Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lane Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={laneCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {laneCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number, name: string) => [val, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {laneCounts.map(l => (
                <div key={l.code} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-muted-foreground">{l.code}</span>
                  <span className="font-medium">{l.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown Bar */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(statusCounts).map(([name, value]) => ({ name, value }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Posts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Upcoming Posts
            </CardTitle>
            <button onClick={() => setLocation('/planning')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming posts</p>
            ) : upcomingPosts.map(post => (
              <button
                key={post.id}
                onClick={() => setLocation('/planning')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-1 h-10 rounded-full" style={{ background: LANE_DOT_COLORS[post.laneCode || ''] || '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.topic || post.postCode}</p>
                  <p className="text-xs text-muted-foreground">{post.date || 'No date'} · {post.seriesName || post.seriesCode || ''}</p>
                </div>
                <StatusBadge value={post.status} type="status" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recently Published */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Recently Published
            </CardTitle>
            <button onClick={() => setLocation('/metrics')} className="text-xs text-primary hover:underline flex items-center gap-1">
              Metrics <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPublished.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No published posts yet</p>
            ) : recentPublished.map(post => (
              <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.topic || post.postCode}</p>
                  <p className="text-xs text-muted-foreground">{post.date || ''}</p>
                </div>
                {post.laneCode && <StatusBadge value={post.laneCode} type="lane" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'New Post', path: '/planning', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Browse Ideas', path: '/ideas', icon: Zap, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              { label: 'Whiteboard', path: '/whiteboard', icon: BarChart3, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { label: 'View Metrics', path: '/metrics', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => setLocation(action.path)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${action.color}`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string; onClick?: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${color} text-white flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
