export type FileType = 'folder' | 'file' | 'image' | 'code' | 'document';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  totalSize?: string;
  modifiedAt: string;
  children?: FileNode[];
  content?: string;
  imageUrl?: string;
  isLoaded?: boolean;
  isDrive?: boolean;
  usage?: number;
  isPCView?: boolean;
}
