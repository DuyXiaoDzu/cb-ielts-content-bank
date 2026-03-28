import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Pencil, Type, Square, Circle, ArrowRight,
  Eraser, Download, Undo2, Minus, Save, MousePointer2,
  StickyNote, MoreHorizontal, Move,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Tool = 'select' | 'pen' | 'eraser' | 'text' | 'rect' | 'circle' | 'arrow' | 'sticky';
type DrawElement = {
  id: string;
  type: Exclude<Tool, 'select' | 'eraser'> | 'eraser';
  points?: { x: number; y: number }[];
  x?: number; y?: number; w?: number; h?: number;
  text?: string; color?: string; size?: number;
};

let _idCounter = 0;
const newId = () => `el_${Date.now()}_${++_idCounter}`;

export default function Whiteboard() {
  const [activeBoard, setActiveBoard] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState<any>(null);

  const { data: boardList = [] } = trpc.whiteboards.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.whiteboards.create.useMutation({
    onSuccess: () => { utils.whiteboards.list.invalidate(); setShowCreate(false); setNewName(''); toast.success("Board created"); },
  });
  const updateMut = trpc.whiteboards.update.useMutation({
    onSuccess: () => { utils.whiteboards.list.invalidate(); toast.success("Saved"); },
  });
  const deleteMut = trpc.whiteboards.delete.useMutation({
    onSuccess: () => { utils.whiteboards.list.invalidate(); if (activeBoard) setActiveBoard(null); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Whiteboard</h1>
          <p className="text-sm text-muted-foreground">Brainstorm and plan visually</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Board
        </Button>
      </div>

      {!activeBoard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boardList.map((board: any) => (
            <Card key={board.id} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setActiveBoard(board)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold truncate">{board.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => setEditName(board)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMut.mutate({ id: board.id })} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 h-24 bg-muted/50 rounded-md flex items-center justify-center">
                  <StickyNote className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {board.updatedAt ? new Date(board.updatedAt).toLocaleDateString() : 'New'}
                </p>
              </CardContent>
            </Card>
          ))}
          {boardList.length === 0 && (
            <div className="col-span-full text-center py-16">
              <StickyNote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No whiteboards yet. Create one to start brainstorming!</p>
            </div>
          )}
        </div>
      ) : (
        <WhiteboardCanvas board={activeBoard} onBack={() => setActiveBoard(null)}
          onSave={(data: string) => updateMut.mutate({ id: activeBoard.id, data })} />
      )}

      <Dialog open={showCreate} onOpenChange={v => { if (!v) setShowCreate(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Whiteboard</DialogTitle></DialogHeader>
          <Input placeholder="Board name..." value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) createMut.mutate({ title: newName.trim() }); }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { if (!newName.trim()) { toast.error("Name required"); return; } createMut.mutate({ title: newName.trim() }); }} disabled={createMut.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editName && (
        <RenameDialog board={editName} onClose={() => setEditName(null)}
          onSave={(name: string) => { updateMut.mutate({ id: editName.id, title: name }); setEditName(null); }} />
      )}
    </div>
  );
}

function RenameDialog({ board, onClose, onSave }: { board: any; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(board.title || '');
  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rename Board</DialogTitle></DialogHeader>
        <Input value={name} onChange={e => setName(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(name)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WhiteboardCanvas({ board, onBack, onSave }: {
  board: any; onBack: () => void; onSave: (data: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [stickyText, setStickyText] = useState('');
  const [showStickyInput, setShowStickyInput] = useState(false);
  const [stickyPos, setStickyPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // Load saved data
  useEffect(() => {
    if (board.data) {
      try {
        const parsed = JSON.parse(board.data);
        if (Array.isArray(parsed)) setElements(parsed.map((el: any) => ({ ...el, id: el.id || newId() })));
      } catch {}
    }
  }, [board.data]);

  // Get bounding box for an element
  const getBounds = (el: DrawElement): { x: number; y: number; w: number; h: number } | null => {
    if (el.type === 'pen' && el.points?.length) {
      const xs = el.points.map(p => p.x);
      const ys = el.points.map(p => p.y);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
    }
    if (el.type === 'sticky') return { x: el.x || 0, y: el.y || 0, w: 150, h: 100 };
    if (el.type === 'text') return { x: el.x || 0, y: (el.y || 0) - (el.size || 16), w: (el.text?.length || 1) * (el.size || 16) * 0.6, h: (el.size || 16) * 1.2 };
    if (el.x != null) {
      const x = Math.min(el.x, el.x + (el.w || 0));
      const y = Math.min(el.y!, el.y! + (el.h || 0));
      return { x, y, w: Math.abs(el.w || 0), h: Math.abs(el.h || 0) };
    }
    return null;
  };

  // Hit test
  const hitTest = (pos: { x: number; y: number }): DrawElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getBounds(el);
      if (bounds && pos.x >= bounds.x - 5 && pos.x <= bounds.x + bounds.w + 5 &&
          pos.y >= bounds.y - 5 && pos.y <= bounds.y + bounds.h + 5) {
        return el;
      }
    }
    return null;
  };

  // Move an element by dx, dy
  const moveElement = (id: string, dx: number, dy: number) => {
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;
      if (el.points?.length) {
        return { ...el, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
      }
      return { ...el, x: (el.x || 0) + dx, y: (el.y || 0) + dy };
    }));
  };

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    [...elements, currentElement].filter(Boolean).forEach((el: any) => {
      ctx.strokeStyle = el.color || '#000';
      ctx.fillStyle = el.color || '#000';
      ctx.lineWidth = el.size || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'pen' && el.points?.length) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.forEach((p: any) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (el.type === 'eraser' && el.points?.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.forEach((p: any) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
      } else if (el.type === 'rect' && el.x != null) {
        ctx.strokeRect(el.x, el.y!, el.w || 0, el.h || 0);
      } else if (el.type === 'circle' && el.x != null) {
        const rx = Math.abs(el.w || 0) / 2;
        const ry = Math.abs(el.h || 0) / 2;
        ctx.beginPath();
        ctx.ellipse(el.x + (el.w || 0) / 2, el.y! + (el.h || 0) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.x != null) {
        const ex = el.x + (el.w || 0);
        const ey = el.y! + (el.h || 0);
        ctx.beginPath();
        ctx.moveTo(el.x, el.y!);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        const angle = Math.atan2(el.h || 0, el.w || 0);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 15 * Math.cos(angle - 0.4), ey - 15 * Math.sin(angle - 0.4));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 15 * Math.cos(angle + 0.4), ey - 15 * Math.sin(angle + 0.4));
        ctx.stroke();
      } else if (el.type === 'text' && el.text) {
        ctx.font = `${el.size || 16}px Inter, sans-serif`;
        ctx.fillText(el.text, el.x || 0, el.y || 0);
      } else if (el.type === 'sticky' && el.text) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(el.x || 0, el.y || 0, 150, 100);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(el.x || 0, el.y || 0, 150, 100);
        ctx.fillStyle = '#78350f';
        ctx.font = '12px Inter, sans-serif';
        const words = (el.text || '').split(' ');
        let line = '';
        let ly = (el.y || 0) + 20;
        words.forEach((word: string) => {
          const test = line + word + ' ';
          if (ctx.measureText(test).width > 140) { ctx.fillText(line, (el.x || 0) + 5, ly); ly += 16; line = word + ' '; }
          else line = test;
        });
        ctx.fillText(line, (el.x || 0) + 5, ly);
      }

      // Draw selection box
      if (selectedId && el.id === selectedId) {
        const bounds = getBounds(el);
        if (bounds) {
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    });
  }, [elements, currentElement, selectedId]);

  useEffect(() => { redraw(); }, [redraw]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; redraw(); };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);

    // SELECT TOOL - click to select, drag to move
    if (tool === 'select') {
      const hit = hitTest(pos);
      if (hit) {
        setSelectedId(hit.id);
        const bounds = getBounds(hit);
        if (bounds) {
          setDragOffset({ x: pos.x - bounds.x, y: pos.y - bounds.y });
        }
        setIsDrawing(true); // reuse for dragging
      } else {
        setSelectedId(null);
        setDragOffset(null);
      }
      return;
    }

    if (tool === 'text') {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }
    if (tool === 'sticky') {
      setStickyPos(pos);
      setShowStickyInput(true);
      return;
    }
    setIsDrawing(true);
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentElement({ id: newId(), type: tool, points: [pos], color, size: brushSize });
    } else {
      setCurrentElement({ id: newId(), type: tool, x: pos.x, y: pos.y, w: 0, h: 0, color, size: brushSize });
    }
  };

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);

    // Dragging selected element
    if (tool === 'select' && isDrawing && selectedId && dragOffset) {
      if (lastPosRef.current) {
        const dx = pos.x - lastPosRef.current.x;
        const dy = pos.y - lastPosRef.current.y;
        moveElement(selectedId, dx, dy);
      }
      lastPosRef.current = pos;
      return;
    }

    if (!isDrawing || !currentElement) return;
    if (currentElement.type === 'pen' || currentElement.type === 'eraser') {
      setCurrentElement(prev => prev ? { ...prev, points: [...(prev.points || []), pos] } : null);
    } else {
      setCurrentElement(prev => prev ? { ...prev, w: pos.x - (prev.x || 0), h: pos.y - (prev.y || 0) } : null);
    }
  };

  const handleMouseUp = () => {
    if (tool === 'select') {
      setIsDrawing(false);
      setDragOffset(null);
      lastPosRef.current = null;
      return;
    }
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => setElements(prev => prev.slice(0, -1));
  const handleClear = () => { if (confirm('Clear all?')) { setElements([]); setSelectedId(null); } };
  const handleSave = () => { onSave(JSON.stringify(elements)); };
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${board.title || 'whiteboard'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };
  const handleDeleteSelected = () => {
    if (selectedId) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const tools: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select & Move' },
    { key: 'pen', icon: <Pencil className="h-4 w-4" />, label: 'Pen' },
    { key: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
    { key: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
    { key: 'rect', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
    { key: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
    { key: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' },
    { key: 'sticky', icon: <StickyNote className="h-4 w-4" />, label: 'Sticky Note' },
  ];

  const cursorStyle = tool === 'select' ? (isDrawing && selectedId ? 'cursor-grabbing' : 'cursor-default') :
    tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
          <h2 className="text-lg font-semibold">{board.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Button>
          {selectedId && <Button variant="outline" size="sm" onClick={handleDeleteSelected} title="Delete selected"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>}
          <Button variant="outline" size="sm" onClick={handleClear} title="Clear all"><Trash2 className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="sm" onClick={handleExport} title="Export PNG"><Download className="h-3.5 w-3.5" /></Button>
          <Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg flex-wrap">
        {tools.map(t => (
          <button key={t.key} onClick={() => { setTool(t.key); if (t.key !== 'select') setSelectedId(null); }} title={t.label}
            className={`p-2 rounded-md transition-colors ${tool === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
            {t.icon}
          </button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" title="Color" />
        <div className="flex items-center gap-1">
          <Minus className="h-3 w-3 text-muted-foreground" />
          <input type="range" min={1} max={20} value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))}
            className="w-20 h-1 accent-primary" />
          <span className="text-xs text-muted-foreground w-4">{brushSize}</span>
        </div>
        {selectedId && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" /> Drag to move · <kbd className="text-[10px] bg-muted px-1 rounded">Del</kbd> to delete
            </span>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="relative border rounded-lg overflow-hidden bg-white" style={{ height: 'calc(100vh - 280px)' }}
        onKeyDown={e => { if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) handleDeleteSelected(); }}
        tabIndex={0}>
        <canvas ref={canvasRef} className={cursorStyle}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
      </div>

      {/* Text Input Dialog */}
      <Dialog open={showTextInput} onOpenChange={v => { if (!v) { setShowTextInput(false); setTextInput(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Text</DialogTitle></DialogHeader>
          <Input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Enter text..."
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && textInput.trim()) {
                setElements(prev => [...prev, { id: newId(), type: 'text', x: textPos.x, y: textPos.y, text: textInput.trim(), color, size: Math.max(12, brushSize * 4) }]);
                setTextInput('');
                setShowTextInput(false);
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTextInput(false); setTextInput(''); }}>Cancel</Button>
            <Button onClick={() => {
              if (textInput.trim()) {
                setElements(prev => [...prev, { id: newId(), type: 'text', x: textPos.x, y: textPos.y, text: textInput.trim(), color, size: Math.max(12, brushSize * 4) }]);
                setTextInput('');
                setShowTextInput(false);
              }
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Note Input */}
      <Dialog open={showStickyInput} onOpenChange={v => { if (!v) setShowStickyInput(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Sticky Note</DialogTitle></DialogHeader>
          <Textarea value={stickyText} onChange={e => setStickyText(e.target.value)} rows={3} placeholder="Write your note..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStickyInput(false)}>Cancel</Button>
            <Button onClick={() => {
              if (stickyText.trim()) {
                setElements(prev => [...prev, { id: newId(), type: 'sticky', x: stickyPos.x, y: stickyPos.y, text: stickyText, color }]);
                setStickyText('');
              }
              setShowStickyInput(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
