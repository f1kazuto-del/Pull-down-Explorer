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
      const stats = await fs.stat(targetPath);

      if (!stats.isDirectory()) {
        return res.status(400).json({ error: "Path is not a directory" });
      }

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(targetPath, entry.name);
        try {
          const entryStats = await fs.stat(fullPath);
          const type = entry.isDirectory() ? 'folder' : 
                       entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' :
                       entry.name.match(/\.(ts|tsx|js|jsx|json|css|html|md|txt)$/i) ? 'code' : 'document';
          
          return {
            id: fullPath,
            name: entry.name,
            type,
            size: entry.isDirectory() ? "" : formatBytes(entryStats.size),
            modifiedAt: entryStats.mtime.toISOString().split('T')[0],
            children: entry.isDirectory() ? [] : undefined // Children will be fetched on demand
          };
        } catch (e) {
          return null;
        }
      }));

      res.json({
        id: targetPath,
        name: path.basename(targetPath) || targetPath,
        type: 'folder',
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
