import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { put } from '@vercel/blob';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
if (fs.existsSync('.env.local')) {
  config({ path: '.env.local' });
} else {
  config();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  
  // Use disk storage instead of memory buffering to prevent Out Of Memory crashes on large zip files!
  const upload = multer({ dest: 'uploads/' });

  app.post("/api/submit-model", upload.fields([{ name: 'zip', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const zipFile = files?.zip?.[0];
      const coverFile = files?.cover?.[0];
      
      const { userId, modelName, triggerWord, artistName, description, tags } = req.body;
      const tagsArray = tags ? JSON.parse(tags) : [];
      
      if (!zipFile) {
        return res.status(400).json({ error: "No zip file provided" });
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
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let suffix = "";
        for (let i = 0; i < 3; i++) {
          suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `TaT${suffix}`;
      }

      // Validate ZIP
      const allowedZip = ["zip"];
      const rawZipExt = zipFile.originalname.split(".").pop()?.toLowerCase();
      if (!rawZipExt || !allowedZip.includes(rawZipExt)) {
        fs.unlinkSync(zipFile.path);
        if (coverFile) fs.unlinkSync(coverFile.path);
        return res.status(400).json({ error: "Invalid dataset file type. Only zip files are permitted." });
      }

      // Validate Cover if exists
      if (coverFile) {
        const allowedImage = ["jpg", "jpeg", "png", "webp"];
        const rawCoverExt = coverFile.originalname.split(".").pop()?.toLowerCase();
        if (!rawCoverExt || !allowedImage.includes(rawCoverExt)) {
          fs.unlinkSync(zipFile.path);
          fs.unlinkSync(coverFile.path);
          return res.status(400).json({ error: "Invalid cover file type. Only .jpg, .jpeg, .png, or .webp are permitted." });
        }
      }

      const slug = modelName ? slugify(modelName) : slugify(zipFile.originalname.replace(/\.[^/.]+$/, ""));
      const sku = generateShortSku();
      
      // 1. Upload ZIP
      const zipPathname = `training/${slug}-${sku}-dataset.zip`;
      const zipBlob = await put(zipPathname, fs.createReadStream(zipFile.path), {
        access: "public",
        addRandomSuffix: false,
        multipart: true,
      });

      // 2. Upload Cover
      let coverUrl = '';
      if (coverFile) {
        const coverExt = `.${coverFile.originalname.split(".").pop()?.toLowerCase()}`;
        const coverPathname = `training/${slug}-${sku}-cover${coverExt}`;
        const coverBlob = await put(coverPathname, fs.createReadStream(coverFile.path), {
          access: "public",
          addRandomSuffix: false,
          multipart: false,
        });
        coverUrl = coverBlob.url;
      }

      // 3. Call Dify API from Server
      const difyPayload = {
        inputs: {
          name: modelName,
          description: description,
          cover_image_url: coverUrl,
          input_images: zipBlob.url,
          trigger_word: triggerWord,
          artist_name: artistName,
          artist_tags: tagsArray.join(", ")
        },
        response_mode: "blocking",
        user: userId || "owner123"
      };

      const difyResponse = await fetch("https://api.dify.ai/v1/workflows/run", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify(difyPayload)
      });
      
      if (!difyResponse.ok) {
        const errText = await difyResponse.text().catch(() => "No error body");
        throw new Error(`Dify API Failed: Status ${difyResponse.status} - ${errText}`);
      }

      // Cleanup temp files
      try { fs.unlinkSync(zipFile.path); } catch (e) {}
      if (coverFile) {
        try { fs.unlinkSync(coverFile.path); } catch (e) {}
      }

      res.json({ success: true });
    } catch (error) {
      // Cleanup on error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files?.zip?.[0] && fs.existsSync(files.zip[0].path)) {
        try { fs.unlinkSync(files.zip[0].path); } catch (e) {}
      }
      if (files?.cover?.[0] && fs.existsSync(files.cover[0].path)) {
        try { fs.unlinkSync(files.cover[0].path); } catch (e) {}
      }
      
      console.error("Upload/Webhook error:", error);
      const message = error instanceof Error ? error.message : String(error);
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
