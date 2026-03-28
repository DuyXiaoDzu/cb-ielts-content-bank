import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Upload, Download, Check, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage taxonomy, import/export data</p>
      </div>

      <Tabs defaultValue="lanes" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="lanes">Lanes</TabsTrigger>
          <TabsTrigger value="pillars">Pillars</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="angles">Angles</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="log">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="lanes"><TaxonomySection type="lanes" /></TabsContent>
        <TabsContent value="pillars"><TaxonomySection type="pillars" /></TabsContent>
        <TabsContent value="series"><TaxonomySection type="series" /></TabsContent>
        <TabsContent value="angles"><TaxonomySection type="angles" /></TabsContent>
        <TabsContent value="import"><ImportSection /></TabsContent>
        <TabsContent value="export"><ExportSection /></TabsContent>
        <TabsContent value="log"><ActivityLogSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function TaxonomySection({ type }: { type: 'lanes' | 'pillars' | 'series' | 'angles' }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [newItem, setNewItem] = useState({ code: '', name: '', description: '' });

  const utils = trpc.useUtils();
  const router = (trpc as any)[type];
  const utilsRouter = (utils as any)[type];
  const { data: items = [] } = router.list.useQuery();
  const createMut = router.create.useMutation({
    onSuccess: () => { utilsRouter.list.invalidate(); setShowAdd(false); setNewItem({ code: '', name: '', description: '' }); toast.success("Created"); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMut = router.update.useMutation({
    onSuccess: () => { utilsRouter.list.invalidate(); setEditingId(null); toast.success("Updated"); },
  });
  const deleteMut = router.delete.useMutation({
    onSuccess: () => { utilsRouter.list.invalidate(); toast.success("Deleted"); },
  });

  const labels: Record<string, string> = { lanes: 'Lane', pillars: 'Pillar', series: 'Series', angles: 'Angle' };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{labels[type]}s ({items.length})</CardTitle>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" /> Add {labels[type]}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add {labels[type]}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Code *</Label><Input value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} className="h-8 text-sm" placeholder="e.g. AC" /></div>
              <div><Label className="text-xs">Name *</Label><Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} rows={2} className="text-sm" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => createMut.mutate(newItem as any)} disabled={!newItem.code || !newItem.name || createMut.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-24">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2">
                  {editingId === item.id ? (
                    <Input value={editData.code || ''} onChange={e => setEditData({...editData, code: e.target.value})} className="h-7 text-xs" />
                  ) : (
                    <span className="text-xs font-mono font-medium">{item.code}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === item.id ? (
                    <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="h-7 text-xs" />
                  ) : (
                    <span className="text-xs">{item.name}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === item.id ? (
                    <Input value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} className="h-7 text-xs" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{item.description || '—'}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editingId === item.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { if (editingId === null) return; updateMut.mutate({ id: editingId, ...editData }); }}><Check className="h-3 w-3 text-green-600" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingId(item.id); setEditData({ code: item.code, name: item.name, description: item.description }); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteMut.mutate({ id: item.id })}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">No {labels[type].toLowerCase()}s yet. Add one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ImportSection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const importMut = trpc.importExport.import.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Read and preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(',')[1];
        // Send to server for preview
        const res = await importMut.mutateAsync({ data: base64, mode: 'preview' });
        setPreview(res);
      } catch (err: any) {
        toast.error("Failed to parse file: " + err.message);
      }
    };
    reader.readAsDataURL(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = (ev.target?.result as string).split(',')[1];
          const res = await importMut.mutateAsync({ data: base64, mode: 'import' });
          setResult(res);
          setPreview(null);
          // Invalidate all queries
          utils.posts.list.invalidate();
          utils.ideas.list.invalidate();
          utils.optional.list.invalidate();
          utils.videos.list.invalidate();
          utils.backlog.list.invalidate();
          utils.lanes.list.invalidate();
          utils.pillars.list.invalidate();
          utils.series.list.invalidate();
          utils.angles.list.invalidate();
          toast.success("Import completed!");
        } catch (err: any) {
          toast.error("Import failed: " + err.message);
        } finally {
          setImporting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" /> Excel Import Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Upload your Excel file (.xlsx) to import data</p>
            <p className="text-xs text-muted-foreground mb-4">Supports: Code Guideline, Post Detail DB, Content Bank Menu, Optional Pool, Video Pipeline, Backlog sheets</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Select File
            </Button>
            {file && <p className="text-xs text-muted-foreground mt-2">Selected: {file.name}</p>}
          </div>

          {/* Preview */}
          {preview && (
            <Card className="border bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Import Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {preview.sheets && Object.entries(preview.sheets).map(([sheet, info]: [string, any]) => (
                    <div key={sheet} className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-xs font-medium">{sheet}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{info.total} rows</span>
                        {info.new > 0 && <span className="text-green-600">+{info.new} new</span>}
                        {info.duplicates > 0 && <span className="text-amber-600">{info.duplicates} duplicates</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setPreview(null); setFile(null); }}>Cancel</Button>
                  <Button size="sm" onClick={handleImport} disabled={importing}>
                    {importing ? 'Importing...' : 'Confirm Import'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card className="border bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Import Complete</span>
                </div>
                {result.sheets && Object.entries(result.sheets).map(([sheet, info]: [string, any]) => (
                  <div key={sheet} className="flex items-center justify-between p-1.5 text-xs">
                    <span className="font-medium">{sheet}</span>
                    <span className="text-green-700">{info.imported} imported, {info.skipped} skipped</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExportSection() {
  const [exporting, setExporting] = useState(false);
  const [csvExporting, setCsvExporting] = useState<string | null>(null);
  const exportMut = trpc.importExport.export.useMutation();
  const csvExportMut = trpc.importExport.exportCsv.useMutation();

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportMut.mutateAsync();
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ielts-content-bank-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel export downloaded!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleCsvExport = async (table: string) => {
    setCsvExporting(table);
    try {
      const result = await csvExportMut.mutateAsync({ table: table as any });
      if (!result.csv) { toast.error("No data to export"); return; }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`CSV export: ${result.filename}`);
    } catch (err: any) {
      toast.error("CSV export failed: " + err.message);
    } finally {
      setCsvExporting(null);
    }
  };

  const csvTables = [
    { key: 'posts', label: 'Posts' },
    { key: 'contentIdeas', label: 'Content Ideas' },
    { key: 'optionalPosts', label: 'Optional Posts' },
    { key: 'videos', label: 'Videos' },
    { key: 'backlog', label: 'Backlog' },
    { key: 'metrics', label: 'Metrics' },
    { key: 'lanes', label: 'Lanes' },
    { key: 'pillars', label: 'Pillars' },
    { key: 'series', label: 'Series' },
    { key: 'angles', label: 'Angles' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" /> Excel Export (All-in-One)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all your data to a single Excel file with 12 sheets, preserving all relationships and formatting.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Code Guideline', 'Post Detail DB', 'Content Bank Menu', 'Optional Pool', 'Video Pipeline', 'Backlog',
              'Lanes', 'Pillars', 'Series', 'Angles', 'Metrics', 'Activity Log'].map(sheet => (
              <div key={sheet} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                <span>{sheet}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Generating...' : 'Download Excel Export (.xlsx)'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" /> CSV Export (Per Table)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export individual tables as CSV files for easy import into spreadsheets or other tools.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {csvTables.map(t => (
              <Button key={t.key} variant="outline" size="sm" className="justify-start text-xs h-8"
                disabled={csvExporting === t.key}
                onClick={() => handleCsvExport(t.key)}>
                <Download className="h-3 w-3 mr-1.5" />
                {csvExporting === t.key ? 'Exporting...' : t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityLogSection() {
  const { data: logs = [] } = trpc.activity.list.useQuery();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`h-2 w-2 rounded-full mt-1.5 ${
                  log.action === 'create' ? 'bg-green-500' :
                  log.action === 'update' ? 'bg-blue-500' :
                  log.action === 'delete' ? 'bg-red-500' :
                  log.action === 'import' ? 'bg-purple-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium capitalize">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{log.entity}</span>
                    {log.entityId && <span className="text-xs text-muted-foreground font-mono">#{log.entityId}</span>}
                  </div>
                  {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
        )}
      </CardContent>
    </Card>
  );
}
