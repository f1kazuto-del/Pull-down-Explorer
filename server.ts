import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes...
  // (keeping existing routes)

  // API to list files in a directory
  app.get("/api/files", async (req, res) => {
    try {
      const targetPath = (req.query.path as string) || process.cwd();
      
      // Ensure specific paths exist to avoid errors
      if (targetPath.endsWith('Desktop')) {
        await fs.mkdir(targetPath, { recursive: true }).catch(() => {});
      }

      // Virtual "PC" view
      if (targetPath === "PC") {
        return res.json({
          id: "PC",
          name: "PC",
          type: "folder",
          isLoaded: true,
          isPCView: true,
          children: [
            { id: "C:", name: "Windows (C:)", type: "folder", size: "457.2 GB", totalSize: "905.1 GB", usage: 50, isDrive: true, modifiedAt: "2026-04-18" },
            { id: "D:", name: "Data (D:)", type: "folder", size: "762.4 GB", totalSize: "1.81 TB", usage: 58, isDrive: true, modifiedAt: "2026-04-18" },
            { id: "E:", name: "DVD Drive (E:)", type: "folder", size: "0 B", totalSize: "5.16 GB", usage: 0, isDrive: true, modifiedAt: "2026-04-18" },
            { id: "F:", name: "Backup (F:)", type: "folder", size: "755.1 MB", totalSize: "1.35 GB", usage: 55, isDrive: true, modifiedAt: "2026-04-18" },
            { id: "/", name: "Root (/)", type: "folder", size: "200.5 GB", totalSize: "500.0 GB", usage: 40, isDrive: true, modifiedAt: "2026-04-18" }
          ]
        });
      }

      const stats = await fs.stat(targetPath);

      if (!stats.isDirectory()) {
        return res.status(400).json({ error: "Path is not a directory" });
      }

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(targetPath, entry.name);
        try {
          const entryStats = await fs.stat(fullPath);
          const isDirectory = entry.isDirectory();
          const type = isDirectory ? 'folder' : 
                       entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' :
                       entry.name.match(/\.(ts|tsx|js|jsx|json|css|html|md|txt)$/i) ? 'code' : 'document';
          
          let hasChildren = false;
          if (isDirectory) {
            try {
              const subEntries = await fs.readdir(fullPath);
              hasChildren = subEntries.length > 0;
            } catch (e) {
              // Permission denied or other error, assume empty or inaccessible
            }
          }

          return {
            id: fullPath,
            name: entry.name,
            type,
            size: isDirectory ? "" : formatBytes(entryStats.size),
            modifiedAt: entryStats.mtime.toISOString().split('T')[0],
            children: isDirectory ? [] : undefined,
            isLoaded: false,
            hasChildren
          };
        } catch (e) {
          return null;
        }
      }));

      res.json({
        id: targetPath,
        name: path.basename(targetPath) || targetPath,
        type: 'folder',
        isLoaded: true,
        children: files.filter(f => f !== null)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to get file content
  app.get("/api/file-content", async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: "Path is required" });

      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) return res.status(400).json({ error: "Path is a directory" });

      // If it's an image, we might want to serve it differently, but for now let's handle text
      const isImage = filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      if (isImage) {
        // In a real app, you'd serve the file or a base64
        // For this demo, we'll just return the path so the frontend can use it if accessible
        return res.json({ imageUrl: `/api/raw?path=${encodeURIComponent(filePath)}` });
      }

      const content = await fs.readFile(filePath, "utf-8");
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to copy file/folder
  app.post("/api/copy", async (req, res) => {
    try {
      const { source, destination } = req.body;
      if (!source || !destination) return res.status(400).json({ error: "Source and destination are required" });
      
      const sourceName = path.basename(source);
      let targetPath = path.join(destination, sourceName);
      
      // Handle file name conflict
      let counter = 1;
      const ext = path.extname(sourceName);
      const base = path.basename(sourceName, ext);
      while (await fileExists(targetPath)) {
        targetPath = path.join(destination, `${base} (${counter})${ext}`);
        counter++;
      }

      await fs.cp(source, targetPath, { recursive: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to move file/folder
  app.post("/api/move", async (req, res) => {
    try {
      const { source, destination } = req.body;
      if (!source || !destination) return res.status(400).json({ error: "Source and destination are required" });
      
      const sourceName = path.basename(source);
      let targetPath = path.join(destination, sourceName);
      
      // Handle name conflict for move too
      let counter = 1;
      const ext = path.extname(sourceName);
      const base = path.basename(sourceName, ext);
      while (await fileExists(targetPath)) {
        targetPath = path.join(destination, `${base} (${counter})${ext}`);
        counter++;
      }

      await fs.rename(source, targetPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to rename file/folder
  app.post("/api/rename", async (req, res) => {
    try {
      const { path: targetPath, newName } = req.body;
      if (!targetPath || !newName) return res.status(400).json({ error: "Path and new name are required" });
      
      const parentDir = path.dirname(targetPath);
      const newPath = path.join(parentDir, newName);
      
      if (await fileExists(newPath)) {
        return res.status(400).json({ error: "A file or folder with that name already exists" });
      }

      await fs.rename(targetPath, newPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to delete file/folder
  app.post("/api/delete", async (req, res) => {
    try {
      const { path: targetPath } = req.body;
      if (!targetPath) return res.status(400).json({ error: "Path is required" });
      await fs.rm(targetPath, { recursive: true, force: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to create a new folder
  app.post("/api/new-folder", async (req, res) => {
    try {
      const { parentPath } = req.body;
      if (!parentPath) return res.status(400).json({ error: "Parent path is required" });
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
      
      let folderName = dateStr;
      let targetPath = path.join(parentPath, folderName);
      
      let counter = 1;
      while (await fileExists(targetPath)) {
        folderName = `${dateStr} (${counter})`;
        targetPath = path.join(parentPath, folderName);
        counter++;
      }

      await fs.mkdir(targetPath);
      res.json({ success: true, name: folderName, path: targetPath });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Raw file serving (for images)
  app.get("/api/raw", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).send("Path required");
    res.sendFile(filePath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

startServer();
