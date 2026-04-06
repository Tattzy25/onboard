import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { put } from '@vercel/blob';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables so the Blob SDK can find the token locally
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  
  // Use disk storage instead of memory buffering to prevent Out Of Memory crashes on large zip files!
  const upload = multer({ dest: 'uploads/' });

  app.post("/api/upload-blob", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const title = req.body.title;

      if (!file) {
        return res.status(400).json({ error: "No file provided in the request" });
      }

      function slugify(text: string): string {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 30);
      }

      function generateShortSku(): string {
        // Generate a 6-character SKU starting with "TaT" + 3 random chars
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let suffix = "";
        for (let i = 0; i < 3; i++) {
          suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `TaT${suffix}`;
      }

      function getExtension(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (
          ext &&
          ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "zip"].includes(ext)
        ) {
          return `.${ext}`;
        }
        return ".png";
      }

      const ext = getExtension(file.originalname);
      const slug = title
        ? slugify(title)
        : slugify(file.originalname.replace(/\.[^/.]+$/, ""));
      const sku = generateShortSku();
      const pathname = `training/${slug}-${sku}${ext}`;

      // For large ZIP files, we must use multipart: true to avoid the 4.5MB limit
      // We stream from disk to avoid crashing the Node process memory
      const isZip = ext === ".zip";
      const fileStream = fs.createReadStream(file.path);
      
      console.log(`[VERCEL BLOB] Starting put() for: ${pathname} (Multipart: ${isZip})`);

      const blob = await put(pathname, fileStream, {
        access: "public",
        addRandomSuffix: false,
        multipart: isZip,
      });

      console.log(`[VERCEL BLOB] SUCCESS [200 OK] - File accepted by Vercel.`);
      console.log(`[VERCEL BLOB] File URL: ${blob.url}`);

      // Cleanup temp file from disk
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupErr) {
        console.error("[VERCEL BLOB] Temp file cleanup error (ignored):", cleanupErr);
      }

      res.json({
        url: blob.url,
        pathname: blob.pathname,
        sku,
      });
    } catch (error) {
      console.error("[VERCEL BLOB] ERROR: Upload completely failed:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
