import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import AdminZip from "adm-zip";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes...
  // (keeping existing routes)

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // API to list files in a directory
  app.get("/api/files", async (req, res) => {
    console.log(`[API] Fetching directory: ${req.query.path || 'Root'}`);
    try {
      const targetPath = (req.query.path as string) || process.cwd();
      
      // Ensure specific paths exist to avoid errors
      if (targetPath.endsWith('Desktop')) {
        await fs.mkdir(targetPath, { recursive: true }).catch(() => {});
      }

      // Virtual "PC" view
      if (targetPath === "PC" || targetPath === "InternalHome") {
        return res.json({
          id: targetPath,
          name: targetPath === "PC" ? "PC" : "Home",
          type: "folder",
          isLoaded: true,
          isPCView: true,
          children: [
            { id: "C:", name: "Windows (C:)", type: "folder", size: "457.2 GB", totalSize: "905.1 GB", usage: 50, isDrive: true, modifiedAt: "2026-04-18" },
            { id: "/", name: "Root (/)", type: "folder", size: "200.5 GB", totalSize: "500.0 GB", usage: 40, isDrive: true, modifiedAt: "2026-04-18" }
          ]
        });
      }

      const stats = await fs.stat(targetPath);

      if (!stats.isDirectory()) {
        return res.status(400).json({ error: "Path is not a directory" });
      }

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      
      // Significantly reduced limit for initial response
      const limit = 300;
      const slicedEntries = entries.slice(0, limit);
      
      // SUPER FAST PASS: Don't wait for stats if we have many entries
      // Only do stats for small directories, otherwise lazy-load size/date
      const files = slicedEntries.map((entry) => {
        const fullPath = path.join(targetPath, entry.name);
        const isDirectory = entry.isDirectory();
        const type = isDirectory ? 'folder' : 
                     entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' :
                     entry.name.match(/\.(ts|tsx|js|jsx|json|css|html|md|txt)$/i) ? 'code' : 'document';
        
        return {
          id: fullPath,
          name: entry.name,
          type,
          size: "", // Lazy load
          modifiedAt: "----", // Lazy load
          children: isDirectory ? [] : undefined,
          isLoaded: false,
          hasChildren: isDirectory 
        };
      });

      res.json({
        id: targetPath,
        name: path.basename(targetPath) || targetPath,
        type: 'folder',
        isLoaded: true,
        children: files.filter(f => f !== null)
      });
    } catch (error: any) {
      console.error(`[API Error] /api/files: ${error.message}`);
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

      if (stats.size > 5 * 1024 * 1024) {
        return res.json({ content: `[FILE TOO LARGE] File size is ${formatBytes(stats.size)}. Deep preview restricted to < 5MB.` });
      }

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
      const { path: targetPath, paths } = req.body;
      const targets = paths || (targetPath ? [targetPath] : []);
      
      if (targets.length === 0) {
        return res.status(400).json({ error: "Path or paths are required" });
      }

      for (const p of targets) {
        await fs.rm(p, { recursive: true, force: true });
      }
      
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

  // API to extract ZIP
  app.post("/api/extract", async (req, res) => {
    try {
      const { path: zipPath } = req.body;
      if (!zipPath) return res.status(400).json({ error: "Path is required" });

      const parentDir = path.dirname(zipPath);
      const fileName = path.basename(zipPath, path.extname(zipPath));
      let extractPath = path.join(parentDir, fileName);

      // Handle exists conflict
      let counter = 1;
      while (await fileExists(extractPath)) {
        extractPath = path.join(parentDir, `${fileName} (${counter})`);
        counter++;
      }

      const zip = new AdminZip(zipPath);
      zip.extractAllTo(extractPath, true);
      
      res.json({ success: true, path: extractPath });
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

      // SPA Fallback for development
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api')) return next();
        
        try {
          let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          console.error(`[Vite Error] ${e.stack}`);
          res.status(500).end(e.stack);
        }
      });
    } catch (e) {
      console.error("Failed to load Vite:", e);
    }
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
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
