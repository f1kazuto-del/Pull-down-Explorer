/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  File, 
  Image as ImageIcon, 
  FileCode, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Search, 
  Clock, 
  HardDrive,
  LayoutGrid,
  List,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Star,
  MoreVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  Scissors,
  ExternalLink,
  Plus,
  FolderSearch,
  FolderOpen,
  LayoutTemplate,
  Monitor,
  RefreshCw,
  MousePointer2,
  Download,
  Type,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  X,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { mockFileSystem } from './mockData';
import { FileNode, FileType } from './types';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    electron?: {
      startDrag: (fileName: string, filePath: string) => void;
      openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      selectProgram: () => Promise<{ success: boolean; path?: string }>;
      openWithProgram: (filePath: string, programPath: string) => Promise<{ success: boolean; error?: string }>;
      copyToClipboard: (text: string) => void;
    };
  }
}

const FileIcon = ({ type, className }: { type: FileType; className?: string }) => {
  switch (type) {
    case 'folder': return <Folder className={cn("text-blue-500 fill-blue-500/20", className)} />;
    case 'image': return <ImageIcon className={cn("text-purple-500", className)} />;
    case 'code': return <FileCode className={cn("text-orange-500", className)} />;
    case 'document': return <FileText className={cn("text-green-500", className)} />;
    default: return <File className={cn("text-gray-500", className)} />;
  }
};

const DriveIcon = ({ className }: { className?: string }) => {
  return <HardDrive className={cn("text-slate-400", className)} />;
};

const FileSoftwareView = ({ node, onClose }: { node: FileNode; onClose: () => void }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12",
        !isMaximized && "bg-black/80 backdrop-blur-sm",
        isMaximized && "p-0"
      )}
      onClick={onClose}
    >
      <motion.div
        layout
        className={cn(
          "bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50",
          !isMaximized && "w-full max-w-6xl h-full max-h-[90vh]",
          isMaximized && "w-full h-full rounded-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* App Header */}
        <div className="h-14 border-b bg-muted/20 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileIcon type={node.type} className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[300px] leading-tight">{node.name}</span>
              <span className="text-[10px] text-muted-foreground opacity-60 uppercase tracking-widest font-black">
                {node.type} Viewer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted" onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground hover:bg-red-500 hover:text-white transition-colors" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-[#0a0a0a] flex items-center justify-center">
          {node.imageUrl ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full h-full flex items-center justify-center p-8"
            >
              <img 
                src={node.imageUrl} 
                alt={node.name}
                className="max-w-full max-h-full object-contain shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-sm"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ) : node.content ? (
            <div className="w-full h-full bg-white p-8 overflow-auto font-mono text-sm leading-relaxed custom-scrollbar">
              <div className="max-w-4xl mx-auto py-12">
                <div className="mb-10 pb-6 border-b">
                  <h1 className="text-3xl font-bold mb-2 text-foreground">{node.name}</h1>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                    <span>Type: {node.type}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Size: {node.size || 'Unknown'}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Path: {node.id}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-[#333] selection:bg-primary/20">{node.content}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-8 text-muted-foreground max-w-sm text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-[2.5rem] bg-muted/10 flex items-center justify-center">
                  <FileIcon type={node.type} className="h-14 w-14 opacity-20" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg">
                  <X className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-black text-foreground tracking-[0.3em] uppercase text-[10px]">No Viewer Available</h3>
                <p className="text-xs leading-relaxed opacity-60">The "PULL-DOWN EXPLORER" standard viewer does not support this specific file format yet.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-3 px-8 h-12 rounded-full font-black uppercase tracking-widest text-[10px] border-border transform active:scale-95 transition-transform" onClick={onClose}>
                Return to Workspace
              </Button>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-10 border-t bg-muted/20 px-6 flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="opacity-40">SIZE:</span>
              <span>{node.size || '--'}</span>
            </span>
            <Separator orientation="vertical" className="h-3" />
            <span className="flex items-center gap-2">
              <span className="opacity-40">LAST MOD:</span>
              <span>{node.modifiedAt || '2024-04-18'}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Viewing Mode</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <span className="opacity-40">v1.2.4</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface TreeItemProps {
  key?: string;
  node: FileNode;
  level: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onSelect: (node: FileNode, multi?: boolean, range?: boolean) => void;
  onToggle: (id: string, recursive?: boolean) => void;
  onDoubleClick: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onDragStart: (e: React.DragEvent, node: FileNode) => void;
  onDragOver: (e: React.DragEvent, node: FileNode) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, node: FileNode) => void;
  dragOverId: string | null;
  searchQuery: string;
  renamingId: string | null;
  renamingName: string;
  setRenamingName: (name: string) => void;
  onRenameSubmit: (path: string, newName: string) => void;
  onRenameCancel: () => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' };
}

const TreeItem = ({ node, level, selectedIds, expandedIds, onSelect, onToggle, onDoubleClick, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop, dragOverId, searchQuery, renamingId, renamingName, setRenamingName, onRenameSubmit, onRenameCancel, sortConfig }: TreeItemProps) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFolder = node.type === 'folder';
  
  // A folder has children to show if it is not yet loaded (assume it might have) 
  // OR if it has a non-empty children array.
  // User requested to hide arrow if definitively empty.
  const hasChildren = isFolder && (
    node.hasChildren !== undefined ? node.hasChildren : 
    (node.children === undefined ? !node.isLoaded : node.children.length > 0)
  );

  const parseSizeLocal = (sizeStr: string) => {
    const units: Record<string, number> = { 'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4 };
    const match = sizeStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return value * (units[unit] || 1);
  };

  // Filter and SORT children
  const visibleChildren = useMemo(() => {
    let base = node.children || [];
    if (searchQuery) {
      base = base.filter(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (child.type === 'folder' && child.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    return [...base].sort((a, b) => {
      // Folders always first for Name/Type sorting
      if (sortConfig.key === 'name' || sortConfig.key === 'type') {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
      }

      let valA: any = a[sortConfig.key as keyof FileNode] || '';
      let valB: any = b[sortConfig.key as keyof FileNode] || '';

      if (sortConfig.key === 'size') {
        valA = parseSizeLocal(a.size || '0');
        valB = parseSizeLocal(b.size || '0');
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [node.children, searchQuery, sortConfig]);

  if (node.isPCView) {
    return (
      <div className="p-6 h-full overflow-y-auto bg-slate-50/30">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.1em]">デバイスとドライブ</h3>
            <p className="text-[10px] font-bold text-muted-foreground opacity-60">Connected storage devices and network locations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {visibleChildren.map(child => (
            <div 
              key={child.id}
              className={cn(
                "flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all group relative bg-white shadow-sm border-slate-200/60",
                selectedIds.has(child.id) && "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
              )}
              onClick={(e) => onSelect(child, e.ctrlKey || e.metaKey, e.shiftKey)}
              onDoubleClick={() => onDoubleClick(child)}
              onContextMenu={(e) => onContextMenu(e, child)}
            >
              <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                <HardDrive className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="font-bold text-sm text-foreground truncate mb-1.5" title={child.name}>{child.name}</div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className={cn(
                      "h-full transition-all duration-700",
                      (child.usage || 0) > 85 ? "bg-red-500" : "bg-primary"
                    )} 
                    style={{ width: `${child.usage || 0}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/70 tabular-nums">
                  <span>{child.size} / {child.totalSize}</span>
                  <span className={cn((child.usage || 0) > 85 && "text-red-500")}>{child.usage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If searching and this folder has no matching children and doesn't match itself, hide it
  if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && visibleChildren.length === 0) {
    return null;
  }

  const columnWidths = "grid-cols-[1fr_140px_100px_80px]";

  return (
    <div className="flex flex-col">
      <button
        onClick={(e) => {
          onSelect(node, e.ctrlKey || e.metaKey, e.shiftKey);
        }}
        onDoubleClick={() => onDoubleClick(node)}
        onContextMenu={(e) => onContextMenu(e, node)}
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node)}
        className={cn(
          "group grid items-center rounded-full text-sm transition-all duration-75 relative select-none mx-1 w-[calc(100%-8px)]",
          columnWidths,
          isSelected 
            ? "bg-[#1a1a1a] text-white shadow-lg" 
            : "hover:bg-muted/50 text-foreground/80 hover:text-foreground",
          dragOverId === node.id && "bg-primary/20 ring-2 ring-primary/50"
        )}
      >
        <div 
          className="flex items-center gap-2 min-w-0 flex-1 py-1.5"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Connecting Line */}
          {level > 0 && (
            <div 
              className="absolute h-full w-[1px] bg-border/20 top-0" 
              style={{ left: `${(level - 1) * 16 + 20}px` }}
            />
          )}

          <div 
            className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10 rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (isFolder && hasChildren) onToggle(node.id, e.shiftKey);
            }}
          >
            {isFolder && hasChildren && (
              isExpanded ? <ChevronDown className="h-3 w-3 opacity-50" /> : <ChevronRight className="h-3 w-3 opacity-50" />
            )}
          </div>
          <FileIcon type={node.type} className={cn("h-4 w-4 shrink-0", isSelected && node.type === 'folder' && "text-blue-400")} />
          {renamingId === node.id ? (
            <Input
              autoFocus
              className="h-6 py-0 px-1 text-xs bg-muted border-primary"
              value={renamingName}
              onChange={(e) => setRenamingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit(node.id, renamingName);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onBlur={() => onRenameSubmit(node.id, renamingName)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate font-medium">{node.name}</span>
          )}
        </div>

        {/* Metadata Columns */}
        <div className={cn(
          "px-3 text-[11px] truncate opacity-60 font-mono flex items-center h-full border-l border-border/10",
          isSelected && "opacity-90 border-white/10"
        )}>
          {node.modifiedAt || '2024-04-18'}
        </div>
        <div className={cn(
          "px-3 text-[11px] truncate opacity-60 flex items-center h-full border-l border-border/10 lowercase",
          isSelected && "opacity-90 border-white/10 text-blue-200"
        )}>
          {node.type}
        </div>
        <div className={cn(
          "px-3 text-[11px] truncate opacity-60 flex items-center h-full border-l border-border/10 justify-end font-mono",
          isSelected && "opacity-90 border-white/10"
        )}>
          {node.size || '--'}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isFolder && (isExpanded || searchQuery) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {visibleChildren.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                level={level + 1}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
                onDoubleClick={onDoubleClick}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                dragOverId={dragOverId}
                searchQuery={searchQuery}
                renamingId={renamingId}
                renamingName={renamingName}
                setRenamingName={setRenamingName}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
                sortConfig={sortConfig}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [navRoot, setNavRoot] = useState<FileNode | null>(null);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [viewNodeId, setViewNodeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [manualPath, setManualPath] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [bookmarks, setBookmarks] = useState<{ node: FileNode; alias?: string }[]>([]);
  const [recentFolders, setRecentFolders] = useState<FileNode[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [openedNode, setOpenedNode] = useState<FileNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [showDetailPane, setShowDetailPane] = useState(true);
  const [pathCopied, setPathCopied] = useState(false);
  const [renamingName, setRenamingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renamingBookmarkId, setRenamingBookmarkId] = useState<string | null>(null);
  const [renamingBookmarkName, setRenamingBookmarkName] = useState('');
  const [isSoftwareOpen, setIsSoftwareOpen] = useState(false);

  // Custom Default Programs Map: Record<Extension, ExecutablePath>
  const [appAssociations, setAppAssociations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('explorer-app-associations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });
  
  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: FileNode | null } | null>(null);
  const [clipboard, setClipboard] = useState<{ node: FileNode; action: 'copy' | 'cut' } | null>(null);

  // Auto-scroll state
  const [autoScroll, setAutoScroll] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const [autoScrollVelocity, setAutoScrollVelocity] = useState({ x: 0, y: 0 });
  const autoScrollTargetRef = useRef<HTMLElement | null>(null);

  const parseSize = (sizeStr: string) => {
    const units: Record<string, number> = { 'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4 };
    const match = sizeStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return value * (units[unit] || 1);
  };

  const getSortedChildren = (children: FileNode[] | undefined) => {
    if (!children) return [];
    return [...children].sort((a, b) => {
      // Folders always first for Name/Type sorting
      if (sortConfig.key === 'name' || sortConfig.key === 'type') {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
      }

      let valA: any = a[sortConfig.key as keyof FileNode] || '';
      let valB: any = b[sortConfig.key as keyof FileNode] || '';

      if (sortConfig.key === 'size') {
        valA = parseSize(a.size || '0');
        valB = parseSize(b.size || '0');
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  useEffect(() => {
    if (!autoScroll.active) return;

    let animationFrame: number;
    const scroll = () => {
      if (autoScrollTargetRef.current) {
        const viewport = autoScrollTargetRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport) {
          viewport.scrollTop += autoScrollVelocity.y / 10;
        } else {
          autoScrollTargetRef.current.scrollTop += autoScrollVelocity.y / 10;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };
    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [autoScroll.active, autoScrollVelocity]);

  const handleMiddleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle button
      e.preventDefault();
      setAutoScroll({ active: true, x: e.clientX, y: e.clientY });
      autoScrollTargetRef.current = e.currentTarget as HTMLElement;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (autoScroll.active) {
        const dy = e.clientY - autoScroll.y;
        const threshold = 15;
        const vy = Math.abs(dy) > threshold ? dy : 0;
        setAutoScrollVelocity({ x: 0, y: vy });
      }
      if (isResizing) {
        const newWidth = Math.max(160, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setAutoScroll({ active: false, x: 0, y: 0 });
      setAutoScrollVelocity({ x: 0, y: 0 });
      setIsResizing(false);
    };
    const handleClickOutside = () => setContextMenu(null);

    // Persistence for bookmarks
    const savedBookmarks = localStorage.getItem('explorer-bookmarks-v2');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      }
    }

    // Persistence for recent folders
    const savedRecent = localStorage.getItem('explorer-recent-folders');
    if (savedRecent) {
      try {
        setRecentFolders(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Failed to load recent folders', e);
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('contextmenu', handleClickOutside);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [autoScroll.active, autoScroll.y, isResizing]);

  useEffect(() => {
    localStorage.setItem('explorer-bookmarks-v2', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('explorer-recent-folders', JSON.stringify(recentFolders));
  }, [recentFolders]);

  useEffect(() => {
    localStorage.setItem('explorer-app-associations', JSON.stringify(appAssociations));
  }, [appAssociations]);

  // Fetch directory structure
  const fetchDirectory = async (path?: string): Promise<FileNode | null> => {
    try {
      const url = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch directory');
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      console.log("[Explorer] Starting initialization...");
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDirectory();
        if (res) {
          console.log("[Explorer] Root directory loaded successfully:", res.id);
          const data = { ...res, isLoaded: true };
          setRootNode(data);
          setNavRoot(data);
          setViewNodeId(data.id);
          setExpandedIds(new Set([data.id]));
          setSelectedIds(new Set([data.id]));
        } else {
          console.error("[Explorer] fetchDirectory returned null");
          setError("Failed to load initial directory. Please check permissions.");
        }
      } catch (err: any) {
        console.error("[Explorer] Initialization error:", err);
        setError(err.message || "An unexpected error occurred during startup.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleExpand = async (id: string, recursive: boolean = false) => {
    const next = new Set(expandedIds);
    const isExpanding = !next.has(id);

    if (isExpanding) {
      next.add(id);
      if (rootNode) {
        const findAndFetch = async (node: FileNode, shouldExpandAll: boolean): Promise<FileNode> => {
          if (node.id === id || shouldExpandAll) {
            const fresh = await fetchDirectory(node.id);
            if (fresh) {
              const nodeWithLoaded = { ...fresh, isLoaded: true };
              next.add(node.id);
              if (recursive && nodeWithLoaded.children) {
                nodeWithLoaded.children = await Promise.all(
                  nodeWithLoaded.children.map(async (c) => {
                    if (c.type === 'folder') return findAndFetch(c, true);
                    return c;
                  })
                );
              }
              return nodeWithLoaded;
            }
            return node;
          }
          if (node.children) {
            return {
              ...node,
              children: await Promise.all(node.children.map(c => findAndFetch(c, false)))
            };
          }
          return node;
        };
        const newRoot = await findAndFetch(rootNode, false);
        setRootNode(newRoot);
      }
    } else {
      if (recursive) {
        // Simple recursive collapse: remove all IDs that start with this path
        // (This assumes IDs are full paths)
        const toRemove = Array.from(next).filter((expandedId: string) => expandedId.startsWith(id));
        toRemove.forEach(expandedId => next.delete(expandedId));
      } else {
        next.delete(id);
      }
    }
    setExpandedIds(next);
  };

  const handleSelect = async (node: FileNode, multi: boolean = false, range: boolean = false) => {
    const next = new Set(selectedIds);

    if (range && lastSelectedId) {
      // Get all visible nodes in the current view (main area)
      if (currentViewNodes.length > 0) {
        const currentIndex = currentViewNodes.findIndex(n => n.id === node.id);
        const lastIndex = currentViewNodes.findIndex(n => n.id === lastSelectedId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          for (let i = start; i <= end; i++) {
            next.add(currentViewNodes[i].id);
          }
        } else {
          next.add(node.id);
        }
      } else {
        next.add(node.id);
      }
    } else if (multi) {
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
    } else {
      next.clear();
      next.add(node.id);
    }

    setSelectedIds(next);
    setLastSelectedId(node.id);

    // If software view is open and we click a document/image, update it to the new selection
    if (isSoftwareOpen && node.type !== 'folder') {
      handleOpenNode(node);
      return; // handleOpenNode handles the content fetching
    }

    // Fetch file content if it's a file and not already loaded
    if (node.type !== 'folder' && !node.content && !node.imageUrl) {
      try {
        const res = await fetch(`/api/file-content?path=${encodeURIComponent(node.id)}`);
        const data = await res.json();
        
        // Update the node in the tree with content
        if (rootNode) {
          const updateNode = (n: FileNode): FileNode => {
            if (n.id === node.id) return { ...n, ...data };
            if (n.children) return { ...n, children: n.children.map(updateNode) };
            return n;
          };
          setRootNode(updateNode(rootNode));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectedNode = useMemo(() => {
    if (selectedIds.size !== 1 || !rootNode) return null;
    const id = Array.from(selectedIds)[0] as string;
    const findNode = (node: FileNode, targetId: string): FileNode | null => {
      if (node.id === targetId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(rootNode, id);
  }, [selectedIds, rootNode]);

  const handleOpenNode = async (node: FileNode) => {
    if (node.type === 'folder') {
      await handleSetRoot(node);
      // Auto-expand in sidebar
      setExpandedIds(prev => new Set([...prev, node.id]));
    } else {
      setLoading(true);
      try {
        const res = await fetch(`/api/file-content?path=${encodeURIComponent(node.id)}`);
        if (res.ok) {
          const data = await res.json();
          setOpenedNode({ ...node, ...data });
        } else {
          setOpenedNode(node);
        }
      } catch (err) {
        console.error(err);
        setOpenedNode(node);
      } finally {
        setLoading(false);
      }
      setIsSoftwareOpen(true);
    }
  };

  const handleExtract = async (node: FileNode) => {
    setLoading(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: node.id })
      });
      if (res.ok) {
        await handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    setContextMenu(null);
  };

  const handleDoubleClick = async (node: FileNode) => {
    if (node.type === 'folder') {
      await handleOpenNode(node);
    } else {
      if (window.electron) {
        // Check if we have a custom association for this extension
        const extMatch = node.name.match(/\.([^.]+)$/);
        if (extMatch) {
          const extension = extMatch[1].toLowerCase();
          const customApp = appAssociations[extension];
          if (customApp) {
            const result = await window.electron.openWithProgram(node.id, customApp);
            if (!result.success) {
               console.error("Failed to open with custom program:", result.error);
               // Fallback to system OS setting if our custom program no longer exists
               await handleOpenInSystem(node);
            }
            return;
          }
        }
        await handleOpenInSystem(node);
      } else {
        await handleOpenNode(node);
      }
    }
  };

  const handleChooseProgram = async (node: FileNode) => {
    if (window.electron) {
      const result = await window.electron.selectProgram();
      if (result.success && result.path) {
        // Link this extension to the chosen program
        const extMatch = node.name.match(/\.([^.]+)$/);
        if (extMatch) {
          const extension = extMatch[1].toLowerCase();
          setAppAssociations(prev => ({ ...prev, [extension]: result.path! }));
          
          // Open immediately with newly chosen program
          await window.electron.openWithProgram(node.id, result.path!);
        } else {
          // If no extension, just open it once
          await window.electron.openWithProgram(node.id, result.path!);
        }
      }
    }
    setContextMenu(null);
  };

  const addBookmark = (node: FileNode) => {
    if (bookmarks.some(b => b.node.id === node.id)) return;
    setBookmarks(prev => [...prev, { node }]);
  };

  const updateBookmarkAlias = (id: string, alias: string) => {
    setBookmarks(prev => prev.map(b => b.node.id === id ? { ...b, alias: alias || undefined } : b));
    setRenamingBookmarkId(null);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.node.id !== id));
  };

  const handleCopyPath = (node: FileNode) => {
    if (window.electron && window.electron.copyToClipboard) {
      window.electron.copyToClipboard(node.id);
      setPathCopied(true);
      setTimeout(() => setPathCopied(false), 2000);
      return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(node.id).then(() => {
        setPathCopied(true);
        setTimeout(() => setPathCopied(false), 2000);
      }).catch(err => console.error("Clipboard copy failed:", err));
    } else {
      // Fallback for iframe/insecure contexts
      const textArea = document.createElement("textarea");
      textArea.value = node.id;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setPathCopied(true);
        setTimeout(() => setPathCopied(false), 2000);
      } catch (err) {
        console.error("Fallback clipboard copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleRefresh = async () => {
    if (!rootNode) return;
    
    setLoading(true);
    try {
      if (rootNode.id === 'PC') {
        const fresh = await fetchDirectory('PC');
        if (fresh) setRootNode({ ...fresh, isLoaded: true });
      } else {
        const refreshNode = async (node: FileNode): Promise<FileNode> => {
          if (node.id === rootNode.id || expandedIds.has(node.id)) {
            const fresh = await fetchDirectory(node.id);
            if (fresh) {
              const nodeWithLoaded = { ...fresh, isLoaded: true };
              if (node.children && nodeWithLoaded.children) {
                nodeWithLoaded.children = await Promise.all(
                  nodeWithLoaded.children.map(async (child) => {
                    if (child.type === 'folder' && expandedIds.has(child.id)) {
                      return refreshNode(child);
                    }
                    return child;
                  })
                );
              }
              return nodeWithLoaded;
            }
          }
          return node;
        };
        const newRoot = await refreshNode(rootNode);
        setRootNode(newRoot);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      // Small delay for psychological feedback and ensuring state batches
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug mode toggle Ctrl+Alt+D
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        setShowDebug(prev => !prev);
        return;
      }

      // Preview pane toggle Ctrl+Alt+P
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        setShowDetailPane(prev => !prev);
        return;
      }

      // F2 Rename
      if (e.key === 'F2') {
        if (selectedNode) {
          setRenamingId(selectedNode.id);
          setRenamingName(selectedNode.name);
        }
        return;
      }

      // F5 Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
        return;
      }

      // Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        if (selectedNode) {
          handleCopy(selectedNode);
        }
        return;
      }

      // Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        if (selectedNode) {
          handleCut(selectedNode);
        }
        return;
      }

      // Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v') {
        if (clipboard) {
          handlePaste(null);
        }
        return;
      }

      if (!selectedNode) return;

      if (e.key === 'ArrowRight') {
        if (selectedNode.type === 'folder' && !expandedIds.has(selectedNode.id)) {
          toggleExpand(selectedNode.id, e.shiftKey);
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedNode.type === 'folder' && expandedIds.has(selectedNode.id)) {
          toggleExpand(selectedNode.id, e.shiftKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, expandedIds]);

  // Helper to find parent node and path to a node
  const findPathToNode = (id: string, current: FileNode | null, currentPath: FileNode[] = []): FileNode[] | null => {
    if (!current) return null;
    if (current.id === id) return [...currentPath, current];
    if (current.children) {
      for (const child of current.children) {
        const found = findPathToNode(id, child, [...currentPath, current]);
        if (found) return found;
      }
    }
    return null;
  };

  const currentViewNodes = useMemo(() => {
    return getSortedChildren(rootNode?.children);
  }, [rootNode, sortConfig]);

  const breadcrumbs = useMemo(() => {
    const target = selectedNode || rootNode;
    if (!target || !navRoot) return [];
    return findPathToNode(target.id, navRoot) || [];
  }, [selectedNode, navRoot, rootNode]);

  const rootBreadcrumbs = useMemo(() => {
    if (!rootNode || !navRoot) return [];
    setManualPath(rootNode.id); // Update manual path when root changes
    return findPathToNode(rootNode.id, navRoot) || [];
  }, [rootNode, navRoot]);

  const handleSetRoot = async (node: FileNode) => {
    if (node.type !== 'folder') return;
    setLoading(true);

    // Update Recent Folders
    setRecentFolders(prev => {
      const filtered = prev.filter(f => f.id !== node.id);
      return [node, ...filtered].slice(0, 10);
    });

    const res = await fetchDirectory(node.id);
    if (res) {
      const data = { ...res, isLoaded: true };
      setRootNode(data);
      setViewNodeId(data.id);

      // Initialize navRoot if not set
      if (!navRoot) {
        let rootPath = data.id.includes(':') ? data.id.split('\\')[0] + '\\' : '/';
        if (data.id === 'PC' || data.id === 'Desktop') rootPath = data.id;
        const rootRes = await fetchDirectory(rootPath);
        if (rootRes) setNavRoot({ ...rootRes, isLoaded: true });
        else setNavRoot(data);
      }
      
      // Auto-expand parents in sidebar
      const isWin = data.id.includes(':');
      const sep = isWin ? '\\' : '/';
      const parts = data.id.split(sep);
      setExpandedIds(prev => {
        const next = new Set(prev);
        let current = '';
        parts.forEach((p, i) => {
          if (i === 0 && !isWin) current = '/';
          else current += (current && current !== '/' ? sep : '') + p;
          if (current) next.add(current);
        });
        return next;
      });

      setSelectedIds(new Set([data.id]));
    }
    setLoading(false);
  };

  const handleGoUp = () => {
    if (!rootNode || !rootNode.id) return;
    // Simple path manipulation for "Up"
    const parts = rootNode.id.split(/[/\\]/).filter(Boolean);
    if (parts.length === 0) return;
    
    // Handle root cases
    const isWindows = rootNode.id.includes(':');
    let parentPath = '';
    
    if (parts.length === 1) {
      parentPath = isWindows ? `${parts[0]}\\` : '/';
    } else {
      parts.pop();
      parentPath = (isWindows ? '' : '/') + parts.join(isWindows ? '\\' : '/');
    }
    
    handleSetRoot({ id: parentPath, name: '', type: 'folder', modifiedAt: '' });
  };

  const handleManualPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPath.trim()) {
      handleSetRoot({ id: manualPath.trim(), name: '', type: 'folder', modifiedAt: '' });
      setIsEditingPath(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicked node is not selected, select it (standard behavior)
    if (!selectedIds.has(node.id)) {
      handleSelect(node);
    }

    const menuWidth = 200;
    const menuHeight = 450;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = Math.max(10, window.innerWidth - menuWidth - 10);
    }
    if (y + menuHeight > window.innerHeight) {
      y = Math.max(10, window.innerHeight - menuHeight - 10);
    }

    setContextMenu({ x, y, node });
  };

  const handleCopy = (node: FileNode) => {
    setClipboard({ node, action: 'copy' });
    setContextMenu(null);
  };

  const handleCut = (node: FileNode) => {
    setClipboard({ node, action: 'cut' });
    setContextMenu(null);
  };

  const handlePaste = async (destinationNode: FileNode | null) => {
    const target = destinationNode || selectedNode || rootNode;
    if (!clipboard || !target || target.type !== 'folder') return;
    
    const url = clipboard.action === 'copy' ? '/api/copy' : '/api/move';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: clipboard.node.id, destination: target.id })
      });
      
      if (res.ok) {
        if (clipboard.action === 'cut') setClipboard(null);
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
    setContextMenu(null);
  };

  const handleDelete = async (node: FileNode) => {
    const isSelected = selectedIds.has(node.id);
    const targets = isSelected ? Array.from(selectedIds) : [node.id];
    const targetNames = isSelected 
      ? `${selectedIds.size} items` 
      : node.name;

    if (!confirm(`Are you sure you want to delete ${targetNames}?`)) return;
    
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: targets })
      });
      
      if (res.ok) {
        // Clear selection or remove deleted items from selection
        const next = new Set(selectedIds);
        targets.forEach(id => {
          next.delete(id);
          if (openedNode?.id === id) {
            setOpenedNode(null);
          }
        });
        setSelectedIds(next);
        await handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
    setContextMenu(null);
  };

  const handleCreateFolder = async (parentPath: string) => {
    try {
      const res = await fetch('/api/new-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPath })
      });
      if (res.ok) {
        const data = await res.json();
        // Ensure Desktop exists if we just navigated to it
        // Auto expand parent
        setExpandedIds(prev => new Set([...prev, parentPath]));
        await handleRefresh();
        // Focus new folder
        if (data.path) {
          setSelectedIds(new Set([data.path]));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = async (path: string, newName: string) => {
    if (!newName.trim() || newName === path.split(/[/\\]/).pop()) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, newName })
      });
      if (res.ok) {
        handleRefresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to rename");
      }
    } catch (err) {
      console.error(err);
    }
    setRenamingId(null);
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    setDraggedNode(node); // Always track internally 
    
    // Setup for internal web app movement
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/json', JSON.stringify({ id: node.id, type: node.type }));

    if (window.electron) {
      // Concurrently trigger native drag (do NOT preventDefault, or internal drag breaks!)
      window.electron.startDrag(node.name, node.id);
    }
  };

  const handleDragOver = (e: React.DragEvent, node: FileNode) => {
    if (!draggedNode || !rootNode) return;
    const isWin = rootNode.id.includes(':');
    const sep = isWin ? '\\' : '/';
    
    // Only allow dropping on folders, and not on the folder being dragged or its descendants
    if (node.type === 'folder' && node.id !== draggedNode.id && !node.id.startsWith(draggedNode.id + sep)) {
      e.preventDefault();
      setDragOverId(node.id);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetNode: FileNode) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedNode || targetNode.type !== 'folder' || draggedNode.id === targetNode.id) return;

    try {
      const res = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: draggedNode.id, destination: targetNode.id })
      });
      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
    setDraggedNode(null);
  };

  const handleOpenInSystem = async (node: FileNode) => {
    if (window.electron) {
      const result = await window.electron.openPath(node.id);
      if (!result.success) {
        console.error('Failed to open path in system:', result.error);
        alert(`Failed to open: ${result.error}`);
      }
    } else {
      alert("【デスクトップ版専用機能】\nブラウザ上では、OSのプログラム（フォトアプリ等）を直接起動することはできません。\nこの機能を使うには、アプリをビルドしてWindows上で起動してください。");
    }
    setContextMenu(null);
  };

  if (loading && !rootNode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <FolderSearch className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-lg tracking-tight">System Booting...</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pull-down Explorer is scanning your local file system. This may take a moment depending on directory size.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !rootNode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-xl tracking-tight text-red-600">Startup Failed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-4">
            <Button className="w-full h-11 rounded-xl font-bold" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-bold opacity-60" onClick={() => handleSetRoot({ id: 'InternalHome', name: 'Home', type: 'folder', modifiedAt: '' })}>
              Start in Safe Mode (Virtual Home)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!rootNode) return null;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Unified Compact Header */}
      <header className="h-14 border-b flex items-center justify-between px-3 bg-white shadow-sm z-20 shrink-0 gap-3">
        {/* Nav & Root Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-1">
            <FolderSearch className="h-4 w-4 text-primary" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleSetRoot({ id: 'Root', name: 'Root', type: 'folder', modifiedAt: '' })} title="Go to Home">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={handleGoUp} title="Go Up One Level">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button variant="ghost" size="sm" className={cn("h-8 px-2 gap-1.5 text-[11px]", viewNodeId === 'PC' && "bg-primary/10 text-primary")} onClick={() => handleSetRoot({ id: 'PC', name: 'PC', type: 'folder', modifiedAt: '' })}>
            <Monitor className="h-3.5 w-3.5" /> <span className="font-bold hidden sm:inline">PC</span>
          </Button>
          <Button variant="ghost" size="sm" className={cn("h-8 px-2 gap-1.5 text-[11px]", viewNodeId === 'Desktop' && "bg-primary/10 text-primary")} onClick={() => handleSetRoot({ id: 'Desktop', name: 'Desktop', type: 'folder', modifiedAt: '' })}>
            <LayoutTemplate className="h-3.5 w-3.5" /> <span className="font-bold hidden md:inline">Desktop</span>
          </Button>
        </div>

        {/* Address Bar / Breadcrumbs */}
        <div className="flex-1 min-w-0 flex items-center h-8 bg-muted/30 border rounded-md px-2 overflow-hidden hover:border-primary/40 transition-colors group">
            {isEditingPath ? (
              <form onSubmit={handleManualPathSubmit} className="flex-1 w-full h-full flex items-center">
                <Input
                  autoFocus
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  onBlur={() => setIsEditingPath(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsEditingPath(false)}
                  className="h-full py-0 px-1 text-[11px] bg-transparent border-none rounded-none focus-visible:ring-0 shadow-none w-full"
                />
              </form>
            ) : (
              <div 
                className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground overflow-hidden cursor-text w-full h-full"
                onClick={() => setIsEditingPath(true)}
              >
                <div 
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleSetRoot({ id: '.', name: 'Root', type: 'folder', modifiedAt: '' }); }}
                >
                  <HardDrive className="h-3 w-3 text-slate-400" />
                  <span className="font-bold text-foreground">Root</span>
                </div>
                {rootBreadcrumbs.map((node, i) => (
                  <div 
                    key={node.id} 
                    className={cn(
                      "flex items-center gap-1 shrink-0 px-1 py-0.5 rounded transition-colors",
                      dragOverId === node.id && "bg-primary/20 ring-1 ring-primary/30"
                    )}
                    onDragOver={(e) => handleDragOver(e, node)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetRoot(node);
                    }}
                  >
                    <ChevronRight className="h-3 w-3 opacity-30 shrink-0 mx-0.5" />
                    <Folder className="h-3 w-3 shrink-0 text-slate-400" />
                    <span 
                      className={cn(
                        "truncate max-w-[100px] cursor-pointer hover:text-foreground",
                        i === rootBreadcrumbs.length - 1 ? "text-foreground font-bold" : "text-muted-foreground"
                      )}
                    >
                      {node.name || 'Root'}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Search & Setup */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sort Selector (visible in grid mode) */}
          {viewMode === 'grid' && (
            <div className="hidden md:flex items-center gap-1 mr-1">
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Sort:</span>
              <select 
                className="bg-transparent border-none text-[10px] font-bold text-foreground outline-none cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                onChange={(e) => setSortConfig(s => ({ key: e.target.value as any, direction: s.direction }))}
                value={sortConfig.key}
              >
                <option value="name">Name</option>
                <option value="modifiedAt">Date</option>
                <option value="size">Size</option>
              </select>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSortConfig(s => ({ key: s.key, direction: s.direction === 'asc' ? 'desc' : 'asc' }))}>
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          )}

          <div className="relative w-32 md:w-40 lg:w-48 group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search..." 
              className="pl-8 h-8 text-[11px] bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-muted/20 border rounded-md p-0.5 ml-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-sm" onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} title="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", !showDetailPane && "text-primary bg-primary/10")}
            onClick={() => setShowDetailPane(prev => !prev)}
            title="Toggle Detail Pane"
          >
            {showDetailPane ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Bookmarks Bar - Interactive Hover Area */}
      <div className="relative z-10 w-full group shrink-0 h-0">
        <div className="absolute top-0 w-full h-8 px-4 flex items-center gap-3 bg-white border-b shadow-sm transition-transform duration-200 transform -translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 overflow-x-auto scrollbar-hide">
          <Star className="h-3 w-3 text-yellow-500 shrink-0" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest shrink-0">Bookmarks</span>
          <Separator orientation="vertical" className="h-4 mx-1" />
          {bookmarks.length === 0 && <span className="text-[10px] text-muted-foreground opacity-60">No bookmarks saved</span>}
          {bookmarks.map(b => (
            <div key={b.node.id} className="flex items-center gap-0.5 shrink-0">
              {renamingBookmarkId === b.node.id ? (
                <form 
                  onSubmit={(e) => { e.preventDefault(); updateBookmarkAlias(b.node.id, renamingBookmarkName); }}
                  className="flex items-center"
                >
                  <Input 
                    autoFocus
                    className="h-6 py-0 px-2 text-[10px] w-24 bg-muted/20"
                    value={renamingBookmarkName}
                    onChange={(e) => setRenamingBookmarkName(e.target.value)}
                    onBlur={() => updateBookmarkAlias(b.node.id, renamingBookmarkName)}
                  />
                </form>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-6 px-2 text-[10px] gap-1.5 hover:bg-muted font-medium",
                    viewNodeId === b.node.id && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handleSetRoot(b.node)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, node: b.node });
                  }}
                >
                  <Folder className="h-3 w-3 opacity-70" />
                  {b.alias || b.node.name}
                </Button>
              )}
            </div>
          ))}
        </div>
        {/* Invisible trigger area just below header */}
        <div className="absolute top-0 w-full h-3 bg-transparent z-20 cursor-row-resize" title="Hover to view Bookmarks" />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Main Area (Center) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
          {/* Main List Column Headers */}
          {!rootNode?.isPCView && (
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b grid grid-cols-[1fr_140px_100px_80px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 h-10 items-center px-4">
              <div 
                className="cursor-pointer hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={() => setSortConfig(s => ({ key: 'name', direction: s.key === 'name' && s.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                名前 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </div>
              <div 
                className="px-3 border-l border-border/10 flex items-center gap-1 cursor-pointer hover:text-foreground h-full transition-colors"
                onClick={() => setSortConfig(s => ({ key: 'modifiedAt', direction: s.key === 'modifiedAt' && s.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                更新日時 {sortConfig.key === 'modifiedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </div>
              <div 
                className="px-3 border-l border-border/10 cursor-pointer hover:text-foreground h-full flex items-center transition-colors"
                onClick={() => setSortConfig(s => ({ key: 'type', direction: s.key === 'type' && s.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                種類 {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </div>
              <div 
                className="px-3 border-l border-border/10 text-right cursor-pointer hover:text-foreground h-full flex items-center justify-end transition-colors"
                onClick={() => setSortConfig(s => ({ key: 'size', direction: s.key === 'size' && s.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                サイズ {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </div>
            </div>
          )}

          <div 
            className="flex-1 overflow-y-auto custom-scrollbar"
            onMouseDown={handleMiddleMouseDown}
            onContextMenu={(e) => handleContextMenu(e, rootNode)}
          >
            <div className={cn(rootNode?.isPCView ? "h-full" : "p-2")}>
              {rootNode && (
                <TreeItem
                  node={rootNode}
                  level={0}
                  selectedIds={selectedIds}
                  expandedIds={expandedIds}
                  onSelect={handleSelect}
                  onToggle={toggleExpand}
                  onDoubleClick={handleDoubleClick}
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  dragOverId={dragOverId}
                  searchQuery={searchQuery}
                  renamingId={renamingId}
                  renamingName={renamingName}
                  setRenamingName={setRenamingName}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={() => setRenamingId(null)}
                  sortConfig={sortConfig}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area / Preview (Details Pane Style) */}
        <AnimatePresence>
          {showDetailPane && (
            <motion.main 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="flex-1 overflow-hidden bg-background min-h-0 flex flex-col border-l relative"
            >
              <AnimatePresence mode="wait">
                {!selectedNode && !openedNode ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      {selectedIds.size > 1 ? (
                        <Trash2 className="h-10 w-10 opacity-20 text-red-500" />
                      ) : (
                        <MousePointer2 className="h-10 w-10 opacity-20" />
                      )}
                    </div>
                    {selectedIds.size > 1 ? (
                      <>
                        <h3 className="text-lg font-semibold text-foreground/50">{selectedIds.size} items selected</h3>
                        <p className="text-sm max-w-[200px] mt-2 mb-6">Bulk actions can be performed on the current selection.</p>
                        <Button 
                          variant="destructive" 
                          className="gap-2"
                          onClick={() => {
                            const firstId = Array.from(selectedIds)[0] as string;
                            handleDelete({ id: firstId, name: `${selectedIds.size} items`, type: 'folder', modifiedAt: '' });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Selection
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-foreground/50">No Selection</h3>
                        <p className="text-sm max-w-[200px] mt-2">Select a file or folder in the main view to view details and metadata.</p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedNode?.id || openedNode?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col overflow-hidden"
                  >
                    {/* Details Header */}
                    <div className="h-14 border-b flex items-center px-6 bg-muted/10 gap-4 shrink-0 justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileIcon type={(selectedNode || openedNode)?.type || 'document'} className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold truncate text-base">{(selectedNode || openedNode)?.name || 'Loading...'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => (selectedNode || openedNode) && addBookmark(selectedNode || openedNode!)} className="h-8 gap-2">
                           <Star className="h-3.5 w-3.5" />
                           Add Bookmark
                        </Button>
                        {openedNode && (
                          <Button variant="secondary" size="sm" onClick={() => setOpenedNode(null)} className="h-8">Close Preview</Button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                      <div className="flex flex-col h-full">
                        {/* Visual Preview / Main Detail Component */}
                        <div className="flex-1 min-h-[50%] border-b flex flex-col items-start p-6 bg-slate-50/50">
                           <div className="w-full flex-1 flex flex-col min-h-0">
                             {(selectedNode || openedNode!).imageUrl ? (
                               <div className="flex-1 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden shadow-inner p-2">
                                 <img 
                                   src={(selectedNode || openedNode!).imageUrl} 
                                   alt={(selectedNode || openedNode!).name}
                                   className="max-w-full max-h-full object-contain rounded"
                                   referrerPolicy="no-referrer"
                                 />
                               </div>
                             ) : (selectedNode || openedNode!).content ? (
                               <div className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap flex-1 border shadow-sm rounded-xl bg-white text-foreground/80">
                                  {(selectedNode || openedNode!).content}
                               </div>
                             ) : (
                               <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-3 border border-dashed rounded-xl bg-white/50">
                                 <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                                   <FileIcon type={(selectedNode || openedNode!).type} className="h-8 w-8 opacity-40" />
                                 </div>
                                 <div className="space-y-0.5">
                                   <p className="font-semibold text-foreground/60 uppercase tracking-widest text-[9px]">No Preview Available</p>
                                   <p className="text-[10px]">{(selectedNode || openedNode!).type.toUpperCase()} file</p>
                                 </div>
                               </div>
                             )}
                           </div>
                        </div>

                        {/* Meta Sidebar (Technical Info & Actions) */}
                        <div className="w-full shrink-0 flex flex-col bg-white">
                          <div className="p-6 space-y-6">
                            
                            {/* Actions Component */}
                            <div className="flex gap-2">
                               <Button className="flex-1 gap-1.5 bg-black hover:bg-black/90 text-white rounded-lg h-9 text-xs font-semibold" onClick={() => {
                                 const n = openedNode || selectedNode!;
                                 if (n.type === 'folder') handleOpenNode(n); else handleOpenInSystem(n);
                               }}>
                                 <ExternalLink className="h-3.5 w-3.5" /> Open
                               </Button>
                               <Button 
                                 variant={pathCopied ? "default" : "outline"}
                                 className={cn("flex-1 gap-1.5 rounded-lg h-9 text-xs transition-all font-semibold", pathCopied && "bg-green-500 hover:bg-green-600 text-white border-green-500")}
                                 onClick={() => handleCopyPath(openedNode || selectedNode!)}
                               >
                                 <Copy className="h-3.5 w-3.5" /> 
                                 {pathCopied ? "Copied!" : "Copy Path"}
                               </Button>
                               <Button 
                                 variant="outline" 
                                 size="icon" 
                                 className="h-9 w-9 text-red-500 hover:bg-red-50"
                                 onClick={() => (selectedNode || openedNode) && handleDelete((selectedNode || openedNode)!)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                               <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Technical Specs */}
                              <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2 border-b pb-2">
                                   Technical Specs
                                </h3>
                                <div className="space-y-2 text-[11px] font-medium">
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold rounded-sm h-5 px-1.5 bg-muted/50">
                                      {(selectedNode || openedNode!).type}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-t border-dotted border-border/60">
                                    <span className="text-muted-foreground">Size</span>
                                    <span className="font-mono">{(selectedNode || openedNode!).size || '---'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-t border-dotted border-border/60">
                                    <span className="text-muted-foreground">Modified</span>
                                    <span className="font-mono">{(selectedNode || openedNode!).modifiedAt || '----'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2 border-b pb-2">
                                   Details
                                </h3>
                                <div className="space-y-2 flex flex-col">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Full Path</p>
                                  <div className="p-2.5 rounded-md bg-muted/20 border border-border/50 font-mono text-[10px] text-foreground break-all leading-relaxed shadow-inner">
                                    {(selectedNode || openedNode!).id}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t bg-muted/30 flex items-center justify-between px-4 text-[11px] font-medium text-muted-foreground z-10">
        <div className="flex items-center gap-4">
          {selectedIds.size > 0 ? (
            <span>{selectedIds.size} items selected</span>
          ) : (
            <span>{rootNode.children?.length || 0} items</span>
          )}
          <Separator orientation="vertical" className="h-3" />
          <span>245.8 GB available</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Last synced: Just now</span>
          </div>
          <Badge variant="outline" className="h-4 text-[9px] px-1 uppercase tracking-tighter">Local</Badge>
        </div>
      </footer>

      {/* Debug Overlay */}
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-12 right-6 z-50 w-72 max-h-[400px] bg-card/95 backdrop-blur border rounded-xl shadow-2xl overflow-hidden flex flex-col border-primary/20"
          >
            <div className="bg-primary/10 px-4 py-2 border-b flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">System Debug</span>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowDebug(false)}>
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto text-[10px] font-mono space-y-3 custom-scrollbar">
              <div className="space-y-1">
                <p className="text-muted-foreground"># VIEW STATE</p>
                <p><span className="text-primary">root:</span> {rootNode.id}</p>
                <p><span className="text-primary">view:</span> {rootNode?.id}</p>
                <p><span className="text-primary">opened:</span> {openedNode?.id || 'null'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground"># SELECTION</p>
                <p><span className="text-primary">count:</span> {selectedIds.size}</p>
                <p><span className="text-primary">ids:</span> {Array.from(selectedIds).join(', ')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground"># CLIPBOARD</p>
                <p><span className="text-primary">node:</span> {clipboard?.node.id || 'null'}</p>
                <p><span className="text-primary">action:</span> {clipboard?.action || 'null'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground"># BOOKMARKS</p>
                {bookmarks.map(b => (
                  <p key={b.node.id}>- {b.alias || b.node.name} ({b.node.id})</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Software View / Application Modal */}
      <AnimatePresence>
        {isSoftwareOpen && openedNode && (
          <FileSoftwareView 
            node={openedNode} 
            onClose={() => setIsSoftwareOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] min-w-[160px] bg-card border rounded-lg shadow-xl py-1 overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) {
                  handleOpenNode(contextMenu.node);
                }
                setContextMenu(null);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in App</span>
            </button>

            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left font-semibold text-primary"
              onClick={() => {
                if (contextMenu.node) handleOpenInSystem(contextMenu.node);
              }}
            >
              <Monitor className="h-4 w-4" />
              <span>Open with System Default</span>
            </button>

            {window.electron && contextMenu.node && contextMenu.node.type !== 'folder' && (
              <button 
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-muted text-left text-muted-foreground pl-8"
                onClick={() => handleChooseProgram(contextMenu.node!)}
              >
                <span>Choose Program...</span>
              </button>
            )}

            {contextMenu.node?.name.toLowerCase().endsWith('.zip') && (
              <button 
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
                onClick={() => handleExtract(contextMenu.node!)}
              >
                <Archive className="h-4 w-4" />
                <span>Extract Here</span>
              </button>
            )}

            <Separator className="my-1" />
            
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) addBookmark(contextMenu.node);
                setContextMenu(null);
              }}
            >
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
              <span>Add to Bookmarks</span>
            </button>
            <Separator className="my-1" />

            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) handleCopy(contextMenu.node);
              }}
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
              <span className="ml-auto text-[10px] text-muted-foreground mr-1">Ctrl+C</span>
            </button>
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) handleCut(contextMenu.node);
              }}
            >
              <Scissors className="h-4 w-4" />
              <span>Cut</span>
              <span className="ml-auto text-[10px] text-muted-foreground mr-1">Ctrl+X</span>
            </button>
            <button 
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left",
                (!clipboard || (contextMenu.node && contextMenu.node.type !== 'folder')) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!clipboard || (contextMenu.node && contextMenu.node.type !== 'folder')}
              onClick={() => {
                handlePaste(contextMenu.node);
                setContextMenu(null);
              }}
            >
              <Plus className="h-4 w-4 rotate-45" />
              <span>Paste</span>
              <span className="ml-auto text-[10px] text-muted-foreground mr-1">Ctrl+V</span>
            </button>
            <Separator className="my-1" />

            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                const target = contextMenu.node && contextMenu.node.type === 'folder' ? contextMenu.node.id : (selectedNode?.id || rootNode.id);
                handleCreateFolder(target);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>New Folder</span>
            </button>
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) {
                  setRenamingId(contextMenu.node.id);
                  setRenamingName(contextMenu.node.name);
                }
                setContextMenu(null);
              }}
            >
              <FileText className="h-4 w-4" />
              <span>Rename</span>
              <span className="ml-auto text-[10px] text-muted-foreground mr-1">F2</span>
            </button>
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-500/10 text-red-500 text-left"
              onClick={() => {
                if (contextMenu.node) handleDelete(contextMenu.node);
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
            <Separator className="my-1" />
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) {
                  setRenamingBookmarkId(contextMenu.node.id);
                  setRenamingBookmarkName(bookmarks.find(b => b.node.id === contextMenu.node?.id)?.alias || contextMenu.node.name);
                }
                setContextMenu(null);
              }}
            >
              <Type className="h-4 w-4" />
              <span>Edit Bookmark Name</span>
            </button>
            <Separator className="my-1" />
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-500/10 text-red-500 text-left"
              onClick={() => {
                if (contextMenu.node) removeBookmark(contextMenu.node.id);
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove Bookmark</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
