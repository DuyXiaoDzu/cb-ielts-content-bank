import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Plus, Search, Copy, FileText, Pencil, Trash2,
  MoreHorizontal, Sparkles, ClipboardCopy, Eye,
  BookOpen, Hash, MessageSquare,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TEMPLATE_TYPES = ['Hook', 'Caption', 'CTA', 'Full Post', 'Carousel Slide', 'Story', 'Custom'];

export default function Copywriting() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('templates');

  const { data: templates = [] } = trpc.copyTemplates.list.useQuery();
  const { data: posts = [] } = trpc.posts.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.copyTemplates.create.useMutation({
    onSuccess: () => { utils.copyTemplates.list.invalidate(); toast.success("Template created"); setShowCreate(false); },
  });
  const updateMut = trpc.copyTemplates.update.useMutation({
    onSuccess: () => { utils.copyTemplates.list.invalidate(); toast.success("Updated"); setEditingTemplate(null); },
  });
  const deleteMut = trpc.copyTemplates.delete.useMutation({
    onSuccess: () => { utils.copyTemplates.list.invalidate(); toast.success("Deleted"); },
  });

  const filtered = useMemo(() => {
    return templates.filter((t: any) => {
      if (search && !(t.name?.toLowerCase().includes(search.toLowerCase()) || t.type?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [templates, search]);

  // Posts that have copywriting data
  const postsWithCopy = useMemo(() => {
    return posts.filter((p: any) => p.caption || p.hashtags || p.cta);
  }, [posts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Copywriting</h1>
          <p className="text-sm text-muted-foreground">Templates & post copy builder</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates"><FileText className="h-3.5 w-3.5 mr-1" /> Templates ({filtered.length})</TabsTrigger>
          <TabsTrigger value="posts"><BookOpen className="h-3.5 w-3.5 mr-1" /> Post Copy ({postsWithCopy.length})</TabsTrigger>
          <TabsTrigger value="builder"><Sparkles className="h-3.5 w-3.5 mr-1" /> Quick Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((tpl: any) => (
              <Card key={tpl.id} className="border shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">{tpl.type || 'Custom'}</span>
                        <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{tpl.content}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewTemplate(tpl)}><Eye className="h-3.5 w-3.5 mr-2" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(tpl.content || ''); toast.success("Copied!"); }}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingTemplate(tpl)}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteMut.mutate({ id: tpl.id })} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                    <button onClick={() => { navigator.clipboard.writeText(tpl.content || ''); toast.success("Copied!"); }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                      <ClipboardCopy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No templates yet. Create one to get started!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {postsWithCopy.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No posts with copywriting data yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add caption, hashtags, or CTA to posts in the Planning Board.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {postsWithCopy.map((post: any) => (
                <Card key={post.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{post.postCode}</span>
                          <h3 className="text-sm font-semibold truncate">{post.topic}</h3>
                        </div>
                        {post.caption && (
                          <div className="mt-2">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Caption</p>
                            <p className="text-sm mt-0.5 whitespace-pre-wrap">{post.caption}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {post.hashtags && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> Hashtags</p>
                              <p className="text-xs text-blue-600 mt-0.5">{post.hashtags}</p>
                            </div>
                          )}
                          {post.cta && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground">CTA</p>
                              <p className="text-xs mt-0.5">{post.cta}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        const text = [post.caption, post.hashtags ? `\n${post.hashtags}` : '', post.cta ? `\n${post.cta}` : ''].filter(Boolean).join('\n');
                        navigator.clipboard.writeText(text);
                        toast.success("Post copy copied!");
                      }}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder" className="mt-4">
          <QuickBuilder posts={posts} />
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <TemplateFormDialog open={showCreate} onClose={() => setShowCreate(false)} title="New Template"
        onSave={(data: any) => createMut.mutate(data)} />

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <TemplateFormDialog open={!!editingTemplate} onClose={() => setEditingTemplate(null)} title="Edit Template"
          initial={editingTemplate} onSave={(data: any) => updateMut.mutate({ id: editingTemplate.id, ...data })} />
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={v => { if (!v) setPreviewTemplate(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{previewTemplate.type}</span>
                {previewTemplate.name}
              </DialogTitle>
            </DialogHeader>
            <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap text-sm">{previewTemplate.content}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(previewTemplate.content || ''); toast.success("Copied!"); }}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TemplateFormDialog({ open, onClose, title, initial, onSave }: {
  open: boolean; onClose: () => void; title: string; initial?: any;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(initial || { type: 'Caption' });
  const sf = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input className="mt-1" value={form.name || ''} onChange={e => sf('name', e.target.value)} placeholder="Template name..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={form.type || 'Caption'} onValueChange={v => sf('type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPLATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Content *</label>
            <Textarea className="mt-1 font-mono text-sm" rows={10} value={form.content || ''} onChange={e => sf('content', e.target.value)}
              placeholder={"Use {{topic}} {{lane}} {{pillar}} as placeholders...\n\nExample:\n🎯 {{topic}}\n\nHere's what you need to know about...\n\n#IELTS #{{lane}}"} />
          </div>
          <Button onClick={() => { if (!form.name?.trim()) { toast.error("Name required"); return; } onSave(form); }} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickBuilder({ posts }: { posts: any[] }) {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [cta, setCta] = useState('');
  const utils = trpc.useUtils();

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => { utils.posts.list.invalidate(); toast.success("Post copy saved!"); },
  });

  const handleSelectPost = (post: any) => {
    setSelectedPost(post);
    setCaption(post.caption || '');
    setHashtags(post.hashtags || '');
    setCta(post.cta || '');
  };

  const handleSave = () => {
    if (!selectedPost) return;
    updatePost.mutate({ id: selectedPost.id, caption, hashtags, cta });
  };

  const handleCopyAll = () => {
    const text = [caption, hashtags ? `\n${hashtags}` : '', cta ? `\n${cta}` : ''].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const activePosts = posts.filter((p: any) => p.status !== 'Archived' && p.status !== 'Published');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Post Selector */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Select a Post</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {activePosts.map((post: any) => (
            <button key={post.id} onClick={() => handleSelectPost(post)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPost?.id === post.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
              <p className="text-sm font-medium truncate">{post.topic || post.postCode}</p>
              <p className="text-xs text-muted-foreground">{post.postCode} · {post.laneCode} · {post.status}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Copy Builder */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          {selectedPost ? `Copy for: ${selectedPost.postCode}` : 'Select a post to start'}
        </h3>
        {selectedPost ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Caption
              </label>
              <Textarea className="mt-1" rows={6} value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Write your post caption..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Hashtags
              </label>
              <Textarea className="mt-1" rows={2} value={hashtags} onChange={e => setHashtags(e.target.value)}
                placeholder="#IELTS #English #StudyTips" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">CTA (Call to Action)</label>
              <Input className="mt-1" value={cta} onChange={e => setCta(e.target.value)} placeholder="e.g. Save this post for later!" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={updatePost.isPending} className="flex-1">Save to Post</Button>
              <Button variant="outline" onClick={handleCopyAll}><Copy className="h-3.5 w-3.5 mr-1" /> Copy All</Button>
            </div>

            {/* Preview */}
            <Card className="border-dashed">
              <CardContent className="p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase mb-2">Preview</p>
                <div className="text-sm whitespace-pre-wrap">{caption || '(No caption)'}</div>
                {hashtags && <div className="text-xs text-blue-600 mt-2">{hashtags}</div>}
                {cta && <div className="text-xs font-medium mt-2 text-primary">{cta}</div>}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Select a post from the left to build its copy</p>
          </div>
        )}
      </div>
    </div>
  );
}
