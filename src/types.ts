export type FileType = 'folder' | 'file' | 'image' | 'code' | 'document';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  modifiedAt: string;
  children?: FileNode[];
  content?: string;
  imageUrl?: string;
}
