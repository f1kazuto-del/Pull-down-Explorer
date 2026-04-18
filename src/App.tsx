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
  Trash2,
  Copy,
  Scissors,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { mockFileSystem } from './mockData';
import { FileNode, FileType } from './types';
import { cn } from '@/lib/utils';

const FileIcon = ({ type, className }: { type: FileType; className?: string }) => {
  switch (type) {
    case 'folder': return <Folder className={cn("text-blue-500 fill-blue-500/20", className)} />;
    case 'image': return <ImageIcon className={cn("text-purple-500", className)} />;
    case 'code': return <FileCode className={cn("text-orange-500", className)} />;
    case 'document': return <FileText className={cn("text-green-500", className)} />;
    default: return <File className={cn("text-gray-500", className)} />;
  }
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
  searchQuery: string;
}

const TreeItem = ({ node, level, selectedIds, expandedIds, onSelect, onToggle, onDoubleClick, onContextMenu, searchQuery }: TreeItemProps) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFolder = node.type === 'folder';

  // Filter children if there's a search query
  const visibleChildren = useMemo(() => {
    if (!searchQuery) return node.children || [];
    return (node.children || []).filter(child => 
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (child.type === 'folder' && child.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [node.children, searchQuery]);

  // If searching and this folder has no matching children and doesn't match itself, hide it
  if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && visibleChildren.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={(e) => {
          onSelect(node, e.ctrlKey || e.metaKey, e.shiftKey);
        }}
        onDoubleClick={() => {
          if (isFolder) onDoubleClick(node);
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-75 relative select-none",
          isSelected 
            ? "bg-[#1a1a1a] text-white" 
            : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Connecting Line */}
        {level > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-[1px] bg-border/50" 
            style={{ left: `${(level - 1) * 16 + 16}px` }}
          />
        )}
        
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div 
            className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/10 rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (isFolder) onToggle(node.id, e.shiftKey);
            }}
          >
            {isFolder && (
              isExpanded ? <ChevronDown className="h-3 w-3 opacity-50" /> : <ChevronRight className="h-3 w-3 opacity-50" />
            )}
          </div>
          <FileIcon type={node.type} className={cn("h-4 w-4 shrink-0", isSelected && node.type === 'folder' && "text-blue-400")} />
          <span className="truncate font-medium">{node.name}</span>
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
                searchQuery={searchQuery}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [manualPath, setManualPath] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [bookmarks, setBookmarks] = useState<FileNode[]>([]);
  
  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: FileNode | null } | null>(null);

  // Auto-scroll state
  const [autoScroll, setAutoScroll] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const [autoScrollVelocity, setAutoScrollVelocity] = useState({ x: 0, y: 0 });
  const autoScrollTargetRef = useRef<HTMLElement | null>(null);

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
      const data = await fetchDirectory();
      if (data) {
        setRootNode(data);
        setExpandedIds(new Set([data.id]));
      }
      setLoading(false);
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
              next.add(node.id);
              if (recursive && fresh.children) {
                fresh.children = await Promise.all(
                  fresh.children
                    .filter(c => c.type === 'folder')
                    .map(c => findAndFetch(c, true))
                );
              }
              return fresh;
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
      const currentViewNodes = (selectedNode?.type === 'folder' ? selectedNode.children : rootNode?.children) || [];
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

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const breadcrumbs = useMemo(() => {
    const target = selectedNode || rootNode;
    if (!target) return [];
    return findPathToNode(target.id, rootNode) || [];
  }, [selectedNode, rootNode]);

  const rootBreadcrumbs = useMemo(() => {
    if (!rootNode) return [];
    setManualPath(rootNode.id); // Update manual path when root changes
    // For local files, we might want to show the full path from the actual system root
    // But for now let's just show the path from where we started
    return findPathToNode(rootNode.id, rootNode) || [];
  }, [rootNode]);

  const handleSetRoot = async (node: FileNode) => {
    setLoading(true);
    const data = await fetchDirectory(node.id);
    if (data) {
      setRootNode(data);
      setExpandedIds(new Set([data.id]));
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
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const addBookmark = (node: FileNode) => {
    if (!bookmarks.some(b => b.id === node.id)) {
      setBookmarks([...bookmarks, node]);
    }
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  if (loading && !rootNode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading local files...</p>
        </div>
      </div>
    );
  }

  if (!rootNode) return null;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetRoot({ id: '', name: '', type: 'folder', modifiedAt: '' })} title="Go to Root">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleGoUp} title="Go Up One Level">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 max-w-xl">
            {isEditingPath ? (
              <form onSubmit={handleManualPathSubmit} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  onBlur={() => setIsEditingPath(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsEditingPath(false)}
                  className="h-8 py-0 px-2 text-sm bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </form>
            ) : (
              <div 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground overflow-hidden cursor-text group px-2 py-1 rounded hover:bg-muted/30 transition-colors"
                onClick={() => setIsEditingPath(true)}
              >
                <HardDrive className="h-4 w-4 shrink-0" />
                <span className="shrink-0">System Root</span>
                {rootBreadcrumbs.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="h-3 w-3 opacity-50" />
                    <span 
                      className={cn(
                        "truncate max-w-[200px]",
                        i === rootBreadcrumbs.length - 1 ? "text-foreground" : ""
                      )}
                    >
                      {node.name || 'Root'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search files..." 
              className="pl-9 h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar Tree */}
        <aside 
          className="border-r flex flex-col bg-muted/5 min-h-0 overflow-hidden shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Favorites/Bookmarks */}
          {bookmarks.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="px-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Favorites</h3>
              {bookmarks.map(bookmark => (
                <button
                  key={bookmark.id}
                  onClick={() => handleSetRoot(bookmark)}
                  onContextMenu={(e) => handleContextMenu(e, bookmark)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/50 text-foreground/80 hover:text-foreground group"
                >
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="truncate flex-1 text-left">{bookmark.name}</span>
                </button>
              ))}
            </div>
          )}

          <div 
            className="flex-1 overflow-y-auto custom-scrollbar" 
            onMouseDown={handleMiddleMouseDown}
          >
            <div className="p-2">
              <TreeItem
                node={rootNode}
                level={0}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onSelect={handleSelect}
                onToggle={toggleExpand}
                onDoubleClick={handleSetRoot}
                onContextMenu={handleContextMenu}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        </aside>

        {/* Resizer Handle */}
        <div 
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary/30 transition-colors",
            isResizing && "bg-primary/50"
          )}
          style={{ left: `${sidebarWidth - 2}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />

        {/* Main Content Area / Preview */}
        <main className="flex-1 overflow-hidden bg-card/30 min-h-0">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar" 
                  onMouseDown={handleMiddleMouseDown}
                >
                  <div className="max-w-4xl mx-auto p-8">
                    {selectedNode.type === 'folder' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Folder className="h-10 w-10 text-blue-500 fill-blue-500/20" />
                          </div>
                          <div className="flex-1">
                            <h1 className="text-2xl font-bold">{selectedNode.name}</h1>
                            <p className="text-sm text-muted-foreground">Folder — {selectedNode.children?.length || 0} items</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => addBookmark(selectedNode)}>
                            <Star className="h-4 w-4 mr-2" />
                            Favorite
                          </Button>
                        </div>
                        <Separator />
                        
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {selectedNode.children?.map(child => (
                              <button
                                key={child.id}
                                onClick={(e) => handleSelect(child, e.ctrlKey || e.metaKey, e.shiftKey)}
                                onDoubleClick={() => child.type === 'folder' && handleSetRoot(child)}
                                onContextMenu={(e) => handleContextMenu(e, child)}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-all group relative",
                                  selectedIds.has(child.id) ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"
                                )}
                              >
                                <FileIcon type={child.type} className="h-12 w-12 transition-transform group-hover:scale-110" />
                                <span className="text-xs font-medium text-center truncate w-full px-1">{child.name}</span>
                                {selectedIds.has(child.id) && (
                                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b mb-2">
                              <div className="col-span-6">Name</div>
                              <div className="col-span-3">Date Modified</div>
                              <div className="col-span-2 text-right">Size</div>
                              <div className="col-span-1"></div>
                            </div>
                            {selectedNode.children?.map(child => (
                              <button
                                key={child.id}
                                onClick={(e) => handleSelect(child, e.ctrlKey || e.metaKey, e.shiftKey)}
                                onDoubleClick={() => child.type === 'folder' && handleSetRoot(child)}
                                onContextMenu={(e) => handleContextMenu(e, child)}
                                className={cn(
                                  "w-full grid grid-cols-12 gap-4 items-center px-4 py-2 rounded-lg text-sm group transition-colors",
                                  selectedIds.has(child.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                                )}
                              >
                                <div className="col-span-6 flex items-center gap-3 min-w-0">
                                  <FileIcon type={child.type} className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{child.name}</span>
                                </div>
                                <div className="col-span-3 text-xs text-muted-foreground truncate">
                                  {child.modifiedAt}
                                </div>
                                <div className="col-span-2 text-xs text-muted-foreground text-right tabular-nums">
                                  {child.size || '--'}
                                </div>
                                <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col items-center text-center gap-6">
                          <div className="w-32 h-32 rounded-2xl bg-card shadow-sm border flex items-center justify-center">
                            <FileIcon type={selectedNode.type} className="h-16 w-16" />
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-3xl font-bold tracking-tight">{selectedNode.name}</h2>
                            <p className="text-sm text-muted-foreground">{selectedNode.type.toUpperCase()} — {selectedNode.size}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="lg" className="px-8">Open File</Button>
                            <Button size="lg" variant="outline">Share</Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2 space-y-6">
                            {selectedNode.imageUrl && (
                              <div className="rounded-2xl overflow-hidden border bg-card shadow-lg">
                                <img 
                                  src={selectedNode.imageUrl} 
                                  alt={selectedNode.name} 
                                  className="w-full h-auto object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {selectedNode.content && (
                              <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Content Preview</h3>
                                <div className="p-6 rounded-2xl bg-card border font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-sm">
                                  {selectedNode.content}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-muted/30 border space-y-4">
                              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Information</h3>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Kind</span>
                                  <span className="font-medium">{selectedNode.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Size</span>
                                  <span className="font-medium">{selectedNode.size || '--'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Modified</span>
                                  <span className="font-medium">{selectedNode.modifiedAt}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created</span>
                                  <span className="font-medium">2024-03-15</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={rootNode.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col"
              >
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar" 
                  onMouseDown={handleMiddleMouseDown}
                >
                  <div className="max-w-4xl mx-auto p-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Folder className="h-10 w-10 text-blue-500 fill-blue-500/20" />
                          </div>
                          <div className="flex-1">
                            <h1 className="text-2xl font-bold">{rootNode.name}</h1>
                            <p className="text-sm text-muted-foreground">Folder — {rootNode.children?.length || 0} items</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => addBookmark(rootNode)}>
                            <Star className="h-4 w-4 mr-2" />
                            Favorite
                          </Button>
                        </div>
                        <Separator />
                        
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {rootNode.children?.map(child => (
                              <button
                                key={child.id}
                                onClick={(e) => handleSelect(child, e.ctrlKey || e.metaKey, e.shiftKey)}
                                onDoubleClick={() => child.type === 'folder' && handleSetRoot(child)}
                                onContextMenu={(e) => handleContextMenu(e, child)}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-all group relative",
                                  selectedIds.has(child.id) ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"
                                )}
                              >
                                <FileIcon type={child.type} className="h-12 w-12 transition-transform group-hover:scale-110" />
                                <span className="text-xs font-medium text-center truncate w-full px-1">{child.name}</span>
                                {selectedIds.has(child.id) && (
                                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b mb-2">
                              <div className="col-span-6">Name</div>
                              <div className="col-span-3">Date Modified</div>
                              <div className="col-span-2 text-right">Size</div>
                              <div className="col-span-1"></div>
                            </div>
                            {rootNode.children?.map(child => (
                              <button
                                key={child.id}
                                onClick={(e) => handleSelect(child, e.ctrlKey || e.metaKey, e.shiftKey)}
                                onDoubleClick={() => child.type === 'folder' && handleSetRoot(child)}
                                onContextMenu={(e) => handleContextMenu(e, child)}
                                className={cn(
                                  "w-full grid grid-cols-12 gap-4 items-center px-4 py-2 rounded-lg text-sm group transition-colors",
                                  selectedIds.has(child.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                                )}
                              >
                                <div className="col-span-6 flex items-center gap-3 min-w-0">
                                  <FileIcon type={child.type} className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{child.name}</span>
                                </div>
                                <div className="col-span-3 text-xs text-muted-foreground truncate">
                                  {child.modifiedAt}
                                </div>
                                <div className="col-span-2 text-xs text-muted-foreground text-right tabular-nums">
                                  {child.size || '--'}
                                </div>
                                <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100">
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t bg-muted/30 flex items-center justify-between px-4 text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{selectedNode?.children?.length || 0} items</span>
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
            <div className="px-3 py-1.5 border-b mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">{contextMenu.node?.name}</p>
            </div>
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) addBookmark(contextMenu.node);
                setContextMenu(null);
              }}
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Add to Bookmarks</span>
            </button>
            <button 
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              onClick={() => {
                if (contextMenu.node) handleSetRoot(contextMenu.node);
                setContextMenu(null);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Folder</span>
            </button>
            <Separator className="my-1" />
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left opacity-50 cursor-not-allowed">
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left opacity-50 cursor-not-allowed">
              <Scissors className="h-4 w-4" />
              <span>Cut</span>
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
