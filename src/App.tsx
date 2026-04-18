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
  RefreshCw,
  MousePointer2,
  Download,
  Type,
  PanelRightClose,
  PanelRightOpen
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
}

const TreeItem = ({ node, level, selectedIds, expandedIds, onSelect, onToggle, onDoubleClick, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop, dragOverId, searchQuery, renamingId, renamingName, setRenamingName, onRenameSubmit, onRenameCancel }: TreeItemProps) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFolder = node.type === 'folder';
  
  // A folder has children to show if it is not yet loaded (assume it might have) 
  // OR if it has a non-empty children array.
  const hasChildren = isFolder && (
    node.children === undefined ? !node.isLoaded : node.children.length > 0
  );

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

  const columnWidths = "grid-cols-[1fr_140px_100px_80px]";

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
  const [renamingBookmarkId, setRenamingBookmarkId] = useState<string | null>(null);
  const [renamingBookmarkName, setRenamingBookmarkName] = useState('');
  
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
      const res = await fetchDirectory();
      if (res) {
        const data = { ...res, isLoaded: true };
        setRootNode(data);
        setViewNodeId(data.id);
        setExpandedIds(new Set([data.id]));
        setSelectedIds(new Set([data.id]));
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

  const handleDoubleClick = (node: FileNode) => {
    if (node.type === 'folder') {
      handleSetRoot(node);
      // Auto-expand in sidebar
      setExpandedIds(prev => new Set([...prev, node.id]));
    } else {
      setOpenedNode(node);
    }
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
    navigator.clipboard.writeText(node.id);
    setPathCopied(true);
    setTimeout(() => setPathCopied(false), 2000);
  };

  const handleRefresh = async () => {
    if (!rootNode) return;
    
    // We want to refresh the root node and all currently expanded folders to maintain the tree state
    const refreshNode = async (node: FileNode): Promise<FileNode> => {
      // Always refresh the node if it's the root or if it's expanded
      if (node.id === rootNode.id || expandedIds.has(node.id)) {
        const fresh = await fetchDirectory(node.id);
        if (fresh) {
          const nodeWithLoaded = { ...fresh, isLoaded: true };
          if (node.children && nodeWithLoaded.children) {
            // If we had children before, we need to preserve their expanded states
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

  const viewNode = useMemo(() => {
    if (!rootNode) return null;
    if (!viewNodeId) return rootNode;
    
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
    return findNode(rootNode, viewNodeId) || rootNode;
  }, [rootNode, viewNodeId]);

  const currentViewNodes = useMemo(() => {
    return getSortedChildren(viewNode?.children);
  }, [viewNode, sortConfig]);

  const breadcrumbs = useMemo(() => {
    const target = selectedNode || viewNode;
    if (!target) return [];
    return findPathToNode(target.id, rootNode) || [];
  }, [selectedNode, viewNode, rootNode]);

  const rootBreadcrumbs = useMemo(() => {
    if (!viewNode) return [];
    setManualPath(viewNode.id); // Update manual path when root changes
    return findPathToNode(viewNode.id, rootNode) || [];
  }, [viewNode, rootNode]);

  const handleSetRoot = async (node: FileNode) => {
    if (node.type !== 'folder') return;
    setLoading(true);

    // Update Recent Folders
    setRecentFolders(prev => {
      const filtered = prev.filter(f => f.id !== node.id);
      return [node, ...filtered].slice(0, 10);
    });

    // If the node is not in our tree, or we need fresh data
    const res = await fetchDirectory(node.id);
    if (res) {
      const data = { ...res, isLoaded: true };
      if (!rootNode || !node.id.startsWith(rootNode.id)) {
        // If we navigated outside the current tree, or it's initial load, reset tree
        const isWin = data.id.includes(':');
        const sep = isWin ? '\\' : '/';
        const parts = data.id.split(sep);
        
        // Try to get a slightly higher root to provide context in sidebar
        // e.g. if we are in C:\User\Downloads, let's try to load C:\User as sidebar root
        if (parts.length > 1) {
          const parentPath = parts.slice(0, -1).join(sep) || (isWin ? parts[0] + sep : '/');
          const parentData = await fetchDirectory(parentPath);
          if (parentData) {
            setRootNode(parentData);
          } else {
            setRootNode(data);
          }
        } else {
          setRootNode(data);
        }
      } else {
        // Merge into existing tree
        const updateTree = (n: FileNode): FileNode => {
          if (n.id === data.id) return { ...n, ...data };
          if (n.children) return { ...n, children: n.children.map(updateTree) };
          return n;
        };
        setRootNode(updateTree(rootNode));
      }
      setViewNodeId(data.id);
      
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

      // Highlight in sidebar
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
    setContextMenu({ x: e.clientX, y: e.clientY, node });
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
    if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: node.id })
      });
      if (res.ok) {
        handleRefresh();
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
        handleRefresh();
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
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ id: node.id, type: node.type }));
    // Create a ghost image if needed, but default is fine
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
          <div className="flex items-center gap-2 mr-2 border-r pr-4 font-mono">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FolderSearch className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight hidden lg:inline-block whitespace-nowrap">PULL-DOWN EXPLORER</span>
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
        </div>

        <div className="flex items-center gap-3">
           {showDebug && (
             <Badge variant="destructive" className="animate-pulse">Debug Mode</Badge>
           )}
           <Separator orientation="vertical" className="h-6" />
           <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 gap-2">
             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
             Refresh
           </Button>
        </div>
      </header>

      {/* Bookmarks & Path Bar */}
      <div className="flex flex-col bg-muted/5 border-b shrink-0">
        {/* Bookmarks Bar */}
        <div className="h-10 px-6 flex items-center gap-3 overflow-x-auto scrollbar-hide border-b bg-white group">
          <Star className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-50" />
          {bookmarks.length === 0 && <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">No bookmarks</span>}
          {bookmarks.map(b => (
            <div key={b.node.id} className="flex items-center gap-0.5 shrink-0">
              {renamingBookmarkId === b.node.id ? (
                <form 
                  onSubmit={(e) => { e.preventDefault(); updateBookmarkAlias(b.node.id, renamingBookmarkName); }}
                  className="flex items-center"
                >
                  <Input 
                    autoFocus
                    className="h-6 py-0 px-2 text-xs w-24 bg-background"
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
                    "h-7 px-2 text-xs gap-1.5 hover:bg-muted font-medium",
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

        {/* Address Bar */}
        <div className="h-12 px-4 flex items-center gap-4 bg-white">
          <div className="flex items-center gap-1 border-r pr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleSetRoot({ id: '', name: '', type: 'folder', modifiedAt: '' })} title="Go to Root">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={handleGoUp} title="Go Up One Level">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            {isEditingPath ? (
              <form onSubmit={handleManualPathSubmit} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  onBlur={() => setIsEditingPath(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsEditingPath(false)}
                  className="h-9 py-0 px-3 text-sm bg-muted/20 border rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </form>
            ) : (
              <div 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground overflow-hidden cursor-text group px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                onClick={() => setIsEditingPath(true)}
              >
                <div 
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleSetRoot({ id: '/', name: '', type: 'folder', modifiedAt: '' }); }}
                >
                  <HardDrive className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="shrink-0 font-bold text-foreground">Root</span>
                </div>
                {rootBreadcrumbs.map((node, i) => (
                  <div 
                    key={node.id} 
                    className={cn(
                      "flex items-center gap-2 shrink-0 px-2 py-1 rounded-md transition-colors",
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
                    <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
                    <Folder className="h-4 w-4 shrink-0 text-slate-400" />
                    <span 
                      className={cn(
                        "truncate max-w-[200px] cursor-pointer hover:text-foreground",
                        i === rootBreadcrumbs.length - 1 ? "text-foreground font-black border-b-2 border-primary pb-0.5" : "text-muted-foreground"
                      )}
                    >
                      {node.name || 'Root'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 uppercase font-black text-[10px] tracking-widest text-muted-foreground">
            <span className="mr-1">Sort:</span>
            <Button
              variant={sortConfig.key === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-[11px] px-3 font-bold bg-white border border-slate-200 shadow-sm"
              onClick={() => setSortConfig(s => ({ key: 'name', direction: s.key === 'name' && s.direction === 'asc' ? 'desc' : 'asc' }))}
            >
              Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortConfig.key === 'modifiedAt' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-[11px] px-3 font-bold bg-white border border-slate-200 shadow-sm"
              onClick={() => setSortConfig(s => ({ key: 'modifiedAt', direction: s.key === 'modifiedAt' && s.direction === 'asc' ? 'desc' : 'asc' }))}
            >
              Data
            </Button>
            <Button
              variant={sortConfig.key === 'size' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-[11px] px-3 font-bold bg-white border border-slate-200 shadow-sm"
              onClick={() => setSortConfig(s => ({ key: 'size', direction: s.key === 'size' && s.direction === 'asc' ? 'desc' : 'asc' }))}
            >
              Size
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", !showDetailPane && "text-primary bg-primary/10")}
              onClick={() => setShowDetailPane(prev => !prev)}
              title={showDetailPane ? "Hide Detail Pane (Ctrl+Alt+P)" : "Show Detail Pane (Ctrl+Alt+P)"}
            >
              {showDetailPane ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar Tree */}
        <aside 
          className="border-r flex flex-col bg-muted/5 min-h-0 overflow-hidden shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Recent Folders */}
          {recentFolders.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="px-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent
              </h3>
              {recentFolders.map(folder => (
                <button
                  key={`recent-${folder.id}`}
                  onClick={() => handleSetRoot(folder)}
                  onContextMenu={(e) => handleContextMenu(e, folder)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, folder)}
                  onDragOver={(e) => handleDragOver(e, folder)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all group",
                    viewNodeId === folder.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                  )}
                >
                  <Folder className="h-3.5 w-3.5 text-blue-500/70" />
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                </button>
              ))}
            </div>
          )}

          <div 
            className="flex-1 overflow-y-auto custom-scrollbar" 
            onMouseDown={handleMiddleMouseDown}
            onContextMenu={(e) => handleContextMenu(e, rootNode)}
          >
            {/* Sidebar Column Headers */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b grid grid-cols-[1fr_140px_100px_80px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 h-10 items-center px-4">
              <div>名前</div>
              <div className="px-3 border-l border-border/10 flex items-center gap-1">
                更新日時 <ChevronDown className="h-2 w-2" />
              </div>
              <div className="px-3 border-l border-border/10">種類</div>
              <div className="px-3 border-l border-border/10 text-right">サイズ</div>
            </div>

            <div className="p-2">
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
                      <MousePointer2 className="h-10 w-10 opacity-20" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/50">No Selection</h3>
                    <p className="text-sm max-w-[200px] mt-2">Select a file or folder in the sidebar to view details and metadata.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={openedNode?.id || selectedNode?.id}
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
                          <FileIcon type={(openedNode || selectedNode!).type} className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold truncate text-base">{(openedNode || selectedNode!).name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => addBookmark(openedNode || selectedNode!)} className="h-8 gap-2">
                           <Star className="h-3.5 w-3.5" />
                           Add Bookmark
                        </Button>
                        {openedNode && (
                          <Button variant="secondary" size="sm" onClick={() => setOpenedNode(null)} className="h-8">Close Preview</Button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                      <div className="flex flex-col lg:flex-row h-full">
                        {/* Visual Preview / Main Detail Component */}
                        <div className="flex-1 min-w-0 border-r flex flex-col items-start p-8">
                           <div className="w-full flex-1 flex flex-col min-h-0">
                             {(openedNode || selectedNode!).imageUrl ? (
                               <div className="flex-1 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden border">
                                 <img 
                                   src={(openedNode || selectedNode!).imageUrl} 
                                   alt={(openedNode || selectedNode!).name}
                                   className="max-w-full max-h-full object-contain shadow-2xl"
                                   referrerPolicy="no-referrer"
                                 />
                               </div>
                             ) : (openedNode || selectedNode!).content ? (
                               <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap bg-muted/5 flex-1 border rounded-xl">
                                  {(openedNode || selectedNode!).content}
                               </div>
                             ) : (
                               <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border border-dashed rounded-xl">
                                 <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center">
                                   <FileIcon type={(openedNode || selectedNode!).type} className="h-12 w-12 opacity-30" />
                                 </div>
                                 <div className="space-y-1">
                                   <p className="font-semibold text-foreground/60 caps tracking-widest text-[10px]">No Content Preview Available</p>
                                   <p className="text-xs">{(openedNode || selectedNode!).type.toUpperCase()} file</p>
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* Contextual Actions - Left Aligned Stack */}
                           <div className="mt-8 flex flex-col gap-3 w-48">
                              <Button className="gap-2 bg-black hover:bg-black/90 text-white rounded-lg h-10 w-full justify-start px-4">
                                <ExternalLink className="h-4 w-4" /> Open In System
                              </Button>
                              <Button 
                                variant="outline" 
                                className={cn(
                                  "gap-2 rounded-lg h-10 w-full justify-start px-4 transition-all",
                                  pathCopied && "border-green-500 text-green-600 bg-green-50"
                                )}
                                onClick={() => handleCopyPath(openedNode || selectedNode!)}
                              >
                                {pathCopied ? (
                                  <>
                                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    Path Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" /> Copy Path
                                  </>
                                )}
                              </Button>
                              <div className="flex items-center gap-4 mt-2 px-2">
                                 <Button variant="ghost" size="icon" title="Properties" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                 <Button variant="ghost" size="icon" title="Delete" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>

                        {/* Meta Sidebar (Technical Info) */}
                        <div className="w-full lg:w-[400px] shrink-0 flex flex-col bg-white border-l">
                          <div className="p-8 space-y-10">
                            {/* Technical Specs */}
                            <div className="space-y-5">
                              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
                                 Technical Specs
                              </h3>
                              <div className="space-y-4 text-xs font-medium">
                                <div className="flex justify-between items-center py-2 border-b border-dashed">
                                  <span className="text-muted-foreground uppercase tracking-tight text-[10px]">Type</span>
                                  <Badge variant="secondary" className="uppercase text-[9px] h-5 font-bold tracking-widest px-2">{(openedNode || selectedNode!).type}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed">
                                  <span className="text-muted-foreground uppercase tracking-tight text-[10px]">Size</span>
                                  <span className="font-mono font-bold text-foreground">{(openedNode || selectedNode!).size || '73 Bytes'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed">
                                  <span className="text-muted-foreground uppercase tracking-tight text-[10px]">Created</span>
                                  <span className="font-mono opacity-60">2024-03-24</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed">
                                  <span className="text-muted-foreground uppercase tracking-tight text-[10px]">Modified</span>
                                  <span className="font-mono opacity-60">{(openedNode || selectedNode!).modifiedAt || '2026-04-18'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Access Control */}
                            <div className="space-y-5">
                              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Access Control</h3>
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                  <div className="h-8 w-8 rounded-full bg-[#3b82f6] border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">JD</div>
                                  <div className="h-8 w-8 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">AS</div>
                                  <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-bold shadow-sm">+3</div>
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground">5 users with access</span>
                              </div>
                              <Button variant="outline" size="sm" className="w-full text-[10px] h-9 uppercase tracking-[0.1em] font-bold shadow-sm">Manage Access</Button>
                            </div>

                            {/* Full Path */}
                            <div className="space-y-5">
                              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Full Path</h3>
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono break-all leading-relaxed shadow-inner">
                                /app/applet/{(openedNode || selectedNode!).name}
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
                <p><span className="text-primary">view:</span> {viewNode?.id}</p>
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
