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

  // Weekly Progress calculation
  const weeklyProgress = useMemo(() => {
    const weeks: Record<string, { total: number; published: number; planned: number; inProgress: number; ready: number }> = {};
    activePosts.forEach(p => {
      const week = p.weekLabel || 'No Week';
      if (!weeks[week]) weeks[week] = { total: 0, published: 0, planned: 0, inProgress: 0, ready: 0 };
      weeks[week].total++;
      if (p.status === 'Published') weeks[week].published++;
      else if (p.status === 'Planned') weeks[week].planned++;
      else if (p.status === 'In Progress') weeks[week].inProgress++;
      else if (p.status === 'Ready') weeks[week].ready++;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => {
        // Sort weeks: W1 Apr, W2 Apr, W3 Apr, W4 Apr, W1 May, etc.
        const parseWeek = (w: string) => {
          const match = w.match(/W(\d+)\s+(\w+)/);
          if (!match) return [0, 0];
          const monthOrder: Record<string, number> = { 'Apr': 1, 'May': 2, 'Jun': 3 };
          return [monthOrder[match[2]] || 0, parseInt(match[1]) || 0];
        };
        const [aMonth, aWeek] = parseWeek(a);
        const [bMonth, bWeek] = parseWeek(b);
        if (aMonth !== bMonth) return aMonth - bMonth;
        return aWeek - bWeek;
      })
      .map(([week, stats]) => ({
        week,
        ...stats,
        progress: stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0,
      }));
  }, [activePosts]);

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

      {/* Weekly Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No weeks scheduled</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyProgress.map(w => (
                <div key={w.week} className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-foreground">{w.week}</span>
                    <span className="text-xs font-semibold text-primary">{w.progress}%</span>
                  </div>
                  <Progress value={w.progress} className="h-2 mb-2" />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>📋 {w.planned}</span>
                    <span>⏳ {w.inProgress}</span>
                    <span>✅ {w.ready}</span>
                    <span>🎉 {w.published}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{w.published}/{w.total} published</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <Zap className="h-4 w-4" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction label="New Post" icon="📝" onClick={() => setLocation('/planning')} />
          <QuickAction label="Browse Ideas" icon="💡" onClick={() => setLocation('/ideas')} />
          <QuickAction label="Optional Pool" icon="🎯" onClick={() => setLocation('/optional')} />
          <QuickAction label="Settings" icon="⚙️" onClick={() => setLocation('/settings')} />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, onClick }: any) {
  return (
    <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`${color} p-2 rounded-lg text-white`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent/50 transition-colors text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}
