import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { PostDetailModal } from "@/components/PostDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUSES, LANE_DOT_COLORS, FORMATS, PRIORITIES, APPROVAL_LEVELS, FUNNEL_STAGES } from "@/lib/constants";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Columns3, CalendarDays, ListTodo,
  ChevronLeft, ChevronRight, MoreHorizontal, Send,
  CheckCircle2, Clock, Circle, X, Trash2, GripVertical,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Planning() {
  const [view, setView] = useState<'kanban' | 'calendar' | 'todos'>('kanban');
  const [search, setSearch] = useState('');
  const [filterLane, setFilterLane] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: posts = [] } = trpc.posts.list.useQuery();
  const { data: lanes = [] } = trpc.lanes.list.useQuery();
  const { data: pillars = [] } = trpc.pillars.list.useQuery();
  const { data: seriesList = [] } = trpc.series.list.useQuery();
  const { data: anglesList = [] } = trpc.angles.list.useQuery();
  const { data: calNotes = [] } = trpc.calendarNotes.list.useQuery();
  const { data: todos = [] } = trpc.todos.list.useQuery();

  const activePosts = useMemo(() => posts.filter((p: any) => !p.archived), [posts]);

  const filtered = useMemo(() => {
    return activePosts.filter((p: any) => {
      if (search && !(p.topic?.toLowerCase().includes(search.toLowerCase()) || p.postCode?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterLane !== 'all' && p.laneCode !== filterLane) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });
  }, [activePosts, search, filterLane, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planning Board</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} active posts</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Post
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterLane} onValueChange={setFilterLane}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Lanes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lanes</SelectItem>
            {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code} - {l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.filter(s => s !== 'Archived').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-lg overflow-hidden ml-auto">
          {([
            { key: 'kanban' as const, icon: Columns3, label: 'Kanban' },
            { key: 'calendar' as const, icon: CalendarDays, label: 'Calendar' },
            { key: 'todos' as const, icon: ListTodo, label: 'Todos' },
          ]).map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === v.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              <v.icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'kanban' && <KanbanView posts={filtered} onSelect={setSelectedPost} />}
      {view === 'calendar' && <CalendarView posts={filtered} onSelect={setSelectedPost} calNotes={calNotes} />}
      {view === 'todos' && <TodosView todos={todos} posts={activePosts} onSelectPost={setSelectedPost} />}

      <PostDetailModal
        post={selectedPost} open={!!selectedPost} onClose={() => setSelectedPost(null)}
        lanes={lanes} pillars={pillars} seriesList={seriesList} angles={anglesList}
      />
      <CreatePostDialog open={showCreate} onClose={() => setShowCreate(false)} lanes={lanes} pillars={pillars} seriesList={seriesList} />
    </div>
  );
}

/* ==================== KANBAN VIEW ==================== */
function KanbanView({ posts, onSelect }: { posts: any[]; onSelect: (p: any) => void }) {
  const columns = ['Idea', 'Planned', 'In Progress', 'Ready', 'Published'];
  const utils = trpc.useUtils();
  const updateStatus = trpc.posts.update.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await utils.posts.list.cancel();
      const previousPosts = utils.posts.list.getData();
      // Only merge defined fields to prevent cache corruption
      const cleanVars = Object.fromEntries(
        Object.entries(variables).filter(([_, v]: any) => v !== undefined)
      );
      // Optimistically update the cache
      utils.posts.list.setData(undefined, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.id === variables.id ? { ...p, ...cleanVars } : p);
      });
      return { previousPosts };
    },
    onError: (_err, _variables, context: any) => {
      // Rollback on error
      if (context?.previousPosts) {
        utils.posts.list.setData(undefined, context.previousPosts);
      }
    },
    onSettled: () => {
      utils.posts.list.invalidate();
    },
  });

  const columnStyles: Record<string, { icon: React.ReactNode; bg: string }> = {
    'Idea': { icon: <Circle className="h-3.5 w-3.5 text-gray-400" />, bg: 'border-t-gray-300' },
    'Planned': { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, bg: 'border-t-amber-400' },
    'In Progress': { icon: <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />, bg: 'border-t-blue-400' },
    'Ready': { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, bg: 'border-t-emerald-400' },
    'Published': { icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />, bg: 'border-t-green-500' },
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(col => {
        const colPosts = posts.filter(p => (p.status || 'Planned') === col);
        const style = columnStyles[col];
        return (
          <div key={col} className="min-w-[280px] w-[280px] shrink-0">
            <div className={`flex items-center gap-2 mb-3 px-2 py-2 bg-muted/40 rounded-t-lg border-t-2 ${style.bg}`}>
              {style.icon}
              <h3 className="text-sm font-semibold">{col}</h3>
              <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full ml-auto">{colPosts.length}</span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colPosts.map(post => (
                <Card key={post.id} className="border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onSelect(post)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: LANE_DOT_COLORS[post.laneCode || ''] || '#94a3b8' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.topic || post.postCode}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{post.date || 'No date'} · {post.seriesCode || ''}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {post.laneCode && <StatusBadge value={post.laneCode} type="lane" className="text-[10px] px-1.5 py-0" />}
                          {post.format && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{post.format}</span>}
                          {post.reviewStatus && post.reviewStatus !== 'Pending' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${post.reviewStatus === 'Approved' ? 'bg-green-100 text-green-700' : post.reviewStatus === 'Needs Changes' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {post.reviewStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Quick status buttons */}
                        {col !== 'Published' && (
                          <button onClick={e => { e.stopPropagation(); const nextIdx = columns.indexOf(col) + 1; if (nextIdx < columns.length) { updateStatus.mutate({ id: post.id, status: columns[nextIdx] }); toast.success(`→ ${columns[nextIdx]}`); } }}
                            className="p-1 hover:bg-accent rounded" title="Move forward">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {col !== 'Idea' && (
                          <button onClick={e => { e.stopPropagation(); const prevIdx = columns.indexOf(col) - 1; if (prevIdx >= 0) { updateStatus.mutate({ id: post.id, status: columns[prevIdx] }); toast.success(`← ${columns[prevIdx]}`); } }}
                            className="p-1 hover:bg-accent rounded" title="Move back">
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {col === 'Ready' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: post.id, status: 'Published' }); toast.success('Published!'); }}
                            className="p-1 hover:bg-green-100 rounded text-green-600" title="Quick Publish">
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colPosts.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">Drop posts here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==================== CALENDAR VIEW ==================== */
function CalendarView({ posts, onSelect, calNotes }: { posts: any[]; onSelect: (p: any) => void; calNotes: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteType, setNoteType] = useState('note');
  const utils = trpc.useUtils();

  const createNote = trpc.calendarNotes.create.useMutation({
    onSuccess: () => { utils.calendarNotes.list.invalidate(); setNoteTitle(''); toast.success('Note added'); },
  });
  const toggleNote = trpc.calendarNotes.toggle.useMutation({ onSuccess: () => utils.calendarNotes.list.invalidate() });
  const deleteNote = trpc.calendarNotes.delete.useMutation({ onSuccess: () => utils.calendarNotes.list.invalidate() });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const days = useMemo(() => {
    const result: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      result.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
    }
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? month + 2 - 12 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      result.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
    }
    return result;
  }, [year, month, firstDay, daysInMonth]);

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const selectedDayPosts = selectedDay ? posts.filter(p => p.date === selectedDay) : [];
  const selectedDayNotes = selectedDay ? calNotes.filter((n: any) => n.date === selectedDay) : [];

  return (
    <div className="flex gap-4">
      {/* Calendar Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 bg-muted/50 border-b">{d}</div>
          ))}
          {days.map((d, i) => {
            const dayPosts = posts.filter(p => p.date === d.date);
            const dayNotes = calNotes.filter((n: any) => n.date === d.date);
            const isToday = d.date === today;
            const isSelected = d.date === selectedDay;
            return (
              <div key={i} onClick={() => d.isCurrentMonth && setSelectedDay(d.date)}
                className={`min-h-[90px] border-b border-r p-1 cursor-pointer transition-colors
                  ${d.isCurrentMonth ? 'hover:bg-accent/30' : 'bg-muted/20 opacity-40'}
                  ${isSelected ? 'bg-primary/5 ring-1 ring-primary' : ''}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{d.day}</span>
                  {dayPosts.length > 0 && <span className="text-[9px] text-muted-foreground">{dayPosts.length}p</span>}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 2).map(p => (
                    <div key={p.id} onClick={e => { e.stopPropagation(); onSelect(p); }}
                      className="text-[10px] px-1 py-0.5 rounded truncate hover:bg-accent transition-colors"
                      style={{ borderLeft: `2px solid ${LANE_DOT_COLORS[p.laneCode || ''] || '#94a3b8'}` }}>
                      {p.topic || p.postCode}
                    </div>
                  ))}
                  {dayPosts.length > 2 && <span className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 2}</span>}
                  {dayNotes.slice(0, 1).map((n: any) => (
                    <div key={n.id} className="flex items-center gap-0.5 text-[9px] px-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.noteType === 'deadline' ? 'bg-red-500' : n.noteType === 'todo' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <span className="truncate">{n.title}</span>
                    </div>
                  ))}
                  {dayNotes.length > 1 && <span className="text-[9px] text-muted-foreground px-1">+{dayNotes.length - 1}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      <div className="w-[300px] shrink-0 border rounded-lg p-3 space-y-3 bg-muted/10">
        <h3 className="text-sm font-semibold">
          {selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a day'}
        </h3>

        {selectedDay && (
          <>
            {/* Posts for this day */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Posts ({selectedDayPosts.length})</p>
              {selectedDayPosts.length === 0 && <p className="text-xs text-muted-foreground">No posts scheduled</p>}
              {selectedDayPosts.map(p => (
                <button key={p.id} onClick={() => onSelect(p)}
                  className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors mb-1 border">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ background: LANE_DOT_COLORS[p.laneCode || ''] || '#94a3b8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{p.topic || p.postCode}</p>
                      <p className="text-[10px] text-muted-foreground">{p.status} · {p.laneCode}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Notes & Todos */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes & Todos</p>
              {selectedDayNotes.map((n: any) => (
                <div key={n.id} className="flex items-center gap-2 py-1 text-xs group">
                  {n.noteType === 'todo' ? (
                    <button onClick={() => toggleNote.mutate({ id: n.id })}>
                      {n.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  ) : (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${n.noteType === 'deadline' ? 'bg-red-500' : 'bg-blue-400'}`} />
                  )}
                  <span className={`flex-1 ${n.completed ? 'line-through text-muted-foreground' : ''}`}>{n.title}</span>
                  <button onClick={() => deleteNote.mutate({ id: n.id })} className="opacity-0 group-hover:opacity-100 shrink-0">
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add note form */}
            <div className="space-y-2 pt-2 border-t">
              <Input className="h-7 text-xs" placeholder="Add note, todo, or deadline..." value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && noteTitle && selectedDay) { createNote.mutate({ date: selectedDay, title: noteTitle, noteType }); } }} />
              <div className="flex gap-1">
                {['note', 'todo', 'deadline'].map(t => (
                  <button key={t} onClick={() => setNoteType(t)}
                    className={`text-[10px] px-2 py-0.5 rounded capitalize ${noteType === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>{t}</button>
                ))}
                <Button size="sm" variant="ghost" className="h-5 px-2 ml-auto text-[10px]"
                  disabled={!noteTitle} onClick={() => { if (noteTitle && selectedDay) createNote.mutate({ date: selectedDay, title: noteTitle, noteType }); }}>
                  Add
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==================== TODOS VIEW ==================== */
function TodosView({ todos, posts, onSelectPost }: { todos: any[]; posts: any[]; onSelectPost: (p: any) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newLinkedPostId, setNewLinkedPostId] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const utils = trpc.useUtils();

  const createTodo = trpc.todos.create.useMutation({
    onSuccess: () => { utils.todos.list.invalidate(); setNewTitle(''); setNewDueDate(''); setNewLinkedPostId(''); toast.success('Todo added'); },
  });
  const toggleTodo = trpc.todos.toggle.useMutation({ onSuccess: () => utils.todos.list.invalidate() });
  const deleteTodo = trpc.todos.delete.useMutation({ onSuccess: () => utils.todos.list.invalidate() });

  const filtered = todos.filter((t: any) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const pendingCount = todos.filter((t: any) => !t.completed).length;
  const doneCount = todos.filter((t: any) => t.completed).length;
  const progress = todos.length > 0 ? Math.round((doneCount / todos.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${progress * 1.76} 176`} className="text-primary transition-all" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{progress}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{pendingCount} pending · {doneCount} done</p>
          <p className="text-xs text-muted-foreground">{todos.length} total tasks</p>
        </div>
        <div className="flex gap-1 ml-auto">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Add Todo */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input placeholder="Add a new task..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newTitle) createTodo.mutate({ title: newTitle, dueDate: newDueDate || undefined, postId: newLinkedPostId ? Number(newLinkedPostId) : undefined }); }} />
        </div>
        <Input type="date" className="w-[140px]" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
        <Select value={newLinkedPostId || 'none'} onValueChange={v => setNewLinkedPostId(v === 'none' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Link to post..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked post</SelectItem>
            {posts.slice(0, 20).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.topic || p.postCode}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={!newTitle} onClick={() => createTodo.mutate({ title: newTitle, dueDate: newDueDate || undefined, postId: newLinkedPostId ? Number(newLinkedPostId) : undefined })}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Todo List */}
      <div className="space-y-1">
        {filtered.map((todo: any) => {
          const linkedPost = todo.linkedPostId ? posts.find((p: any) => p.id === todo.linkedPostId) : null;
          const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
          return (
            <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${todo.completed ? 'bg-muted/20' : isOverdue ? 'bg-red-50 border-red-200' : 'hover:bg-accent/30'}`}>
              <button onClick={() => toggleTodo.mutate({ id: todo.id })}>
                {todo.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{todo.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {todo.dueDate && <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>{todo.dueDate}</span>}
                  {linkedPost && (
                    <button onClick={() => onSelectPost(linkedPost)} className="text-[10px] text-primary hover:underline">
                      → {linkedPost.topic || linkedPost.postCode}
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => deleteTodo.mutate({ id: todo.id })} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== CREATE POST DIALOG ==================== */
function CreatePostDialog({ open, onClose, lanes, pillars, seriesList }: {
  open: boolean; onClose: () => void; lanes: any[]; pillars: any[]; seriesList: any[];
}) {
  const [form, setForm] = useState<Record<string, any>>({ status: 'Planned', priority: 'Core', slotType: 'Main' });
  const utils = trpc.useUtils();
  const create = trpc.posts.create.useMutation({
    onSuccess: () => { utils.posts.list.invalidate(); toast.success("Post created"); onClose(); setForm({ status: 'Planned', priority: 'Core', slotType: 'Main' }); },
    onError: (e: any) => toast.error(e.message),
  });
  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Post Code *</label>
              <Input className="mt-1" placeholder="e.g. W01-Mon-DG" value={form.postCode || ''} onChange={e => setField('postCode', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" className="mt-1" value={form.date || ''} onChange={e => setField('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <Input className="mt-1" placeholder="Post topic..." value={form.topic || ''} onChange={e => setField('topic', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Lane</label>
              <Select value={form.laneCode || 'none'} onValueChange={v => setField('laneCode', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {lanes.map((l: any) => <SelectItem key={l.code} value={l.code}>{l.code} - {l.name}</SelectItem>)}
                  <SelectItem value="__other__" className="text-primary font-medium">+ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pillar</label>
              <Select value={form.pillarCode || 'none'} onValueChange={v => setField('pillarCode', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {pillars.map((p: any) => <SelectItem key={p.code} value={p.code}>{p.code} - {p.name}</SelectItem>)}
                  <SelectItem value="__other__" className="text-primary font-medium">+ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Series</label>
              <Select value={form.seriesCode || 'none'} onValueChange={v => setField('seriesCode', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {seriesList.map((s: any) => <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>)}
                  <SelectItem value="__other__" className="text-primary font-medium">+ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <Select value={form.format || 'none'} onValueChange={v => setField('format', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  <SelectItem value="__other__" className="text-primary font-medium">+ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status || 'Planned'} onValueChange={v => setField('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={form.priority || 'Core'} onValueChange={v => setField('priority', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Objective</label>
            <Textarea className="mt-1" rows={2} value={form.objective || ''} onChange={e => setField('objective', e.target.value)} />
          </div>
          <Button onClick={() => { if (!form.postCode) { toast.error("Post code required"); return; } create.mutate(form as any); }} disabled={create.isPending} className="w-full">
            Create Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
