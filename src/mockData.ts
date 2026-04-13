import { FileNode } from './types';

export const mockFileSystem: FileNode = {
  id: 'root',
  name: 'Root',
  type: 'folder',
  modifiedAt: '2024-03-20',
  children: [
    {
      id: 'documents',
      name: 'Documents',
      type: 'folder',
      modifiedAt: '2024-03-21',
      children: [
        {
          id: 'work',
          name: 'Work',
          type: 'folder',
          modifiedAt: '2024-03-22',
          children: [
            {
              id: 'project-a',
              name: 'Project Alpha.pdf',
              type: 'document',
              size: '2.4 MB',
              modifiedAt: '2024-03-22',
              content: 'This is the content of Project Alpha. A very important document about the future of the company.'
            },
            {
              id: 'budget',
              name: 'Budget_2024.xlsx',
              type: 'file',
              size: '1.1 MB',
              modifiedAt: '2024-03-23'
            }
          ]
        },
        {
          id: 'personal',
          name: 'Personal',
          type: 'folder',
          modifiedAt: '2024-03-20',
          children: [
            {
              id: 'notes',
              name: 'Notes.txt',
              type: 'file',
              size: '12 KB',
              modifiedAt: '2024-03-24',
              content: 'Buy milk\nWalk the dog\nFinish the file explorer app'
            }
          ]
        }
      ]
    },
    {
      id: 'photos',
      name: 'Photos',
      type: 'folder',
      modifiedAt: '2024-03-19',
      children: [
        {
          id: 'vacation',
          name: 'Vacation 2023',
          type: 'folder',
          modifiedAt: '2024-03-19',
          children: [
            {
              id: 'beach',
              name: 'Beach.jpg',
              type: 'image',
              size: '4.5 MB',
              modifiedAt: '2024-03-19',
              imageUrl: 'https://picsum.photos/seed/beach/800/600'
            },
            {
              id: 'mountain',
              name: 'Mountain.jpg',
              type: 'image',
              size: '3.8 MB',
              modifiedAt: '2024-03-19',
              imageUrl: 'https://picsum.photos/seed/mountain/800/600'
            }
          ]
        }
      ]
    },
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      modifiedAt: '2024-03-25',
      children: [
        {
          id: 'app-tsx',
          name: 'App.tsx',
          type: 'code',
          size: '4 KB',
          modifiedAt: '2024-03-25',
          content: 'import React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}'
        },
        {
          id: 'main-tsx',
          name: 'main.tsx',
          type: 'code',
          size: '1 KB',
          modifiedAt: '2024-03-25',
          content: 'import { createRoot } from "react-dom/client";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")).render(<App />);'
        }
      ]
    },
    {
      id: 'readme',
      name: 'README.md',
      type: 'code',
      size: '2 KB',
      modifiedAt: '2024-03-25',
      content: '# Column Explorer\n\nA professional file explorer built with React and Tailwind CSS.'
    }
  ]
};
