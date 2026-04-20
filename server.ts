import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
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

      const workerUploadForm = new FormData();
      const zipBuffer = fs.readFileSync(zipFile.path);
      workerUploadForm.append(
        "zip",
        new Blob([zipBuffer], { type: zipFile.mimetype || "application/zip" }),
        zipFile.originalname
      );
      if (coverFile) {
        const coverBuffer = fs.readFileSync(coverFile.path);
        workerUploadForm.append(
          "cover",
          new Blob([coverBuffer], { type: coverFile.mimetype || "application/octet-stream" }),
          coverFile.originalname
        );
      }

      const workerPrefix = `users/${userId}/`;
      const workerBaseUrl = process.env.WORKER_UPLOAD_URL;

      if (!workerBaseUrl) {
        throw new Error("WORKER_UPLOAD_URL is not set");
      }

      const workerUploadResponse = await fetch(
        `${workerBaseUrl}/upload-training?prefix=${encodeURIComponent(workerPrefix)}`,
        {
          method: "POST",
          body: workerUploadForm,
        }
      );

      if (!workerUploadResponse.ok) {
        const workerErrorText = await workerUploadResponse.text();
        throw new Error(`Worker upload failed: Status ${workerUploadResponse.status} - ${workerErrorText}`);
      }

      const workerUploadResult = await workerUploadResponse.json() as {
        zipUrl: string;
        coverUrl?: string;
        zipKey: string;
        coverKey?: string;
      };

      if (!workerUploadResult.zipUrl) {
        throw new Error("Worker upload failed: missing zipUrl in response.");
      }
      if (coverFile && !workerUploadResult.coverUrl) {
        throw new Error("Worker upload failed: cover file was uploaded but coverUrl is missing in response.");
      }

      // 3. Call Dify API from Server
      const difyPayload = {
        inputs: {
          name: modelName,
          description: description,
          cover_image_url: coverFile ? workerUploadResult.coverUrl! : "",
          input_images: workerUploadResult.zipUrl,
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
      try {
        fs.unlinkSync(zipFile.path);
      } catch (cleanupError) {
        console.warn("Failed to remove temp zip file:", cleanupError);
      }
      if (coverFile) {
        try {
          fs.unlinkSync(coverFile.path);
        } catch (cleanupError) {
          console.warn("Failed to remove temp cover file:", cleanupError);
        }
      }

      res.json({ success: true });
    } catch (error) {
      // Cleanup on error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files?.zip?.[0] && fs.existsSync(files.zip[0].path)) {
        try {
          fs.unlinkSync(files.zip[0].path);
        } catch (cleanupError) {
          console.warn("Failed to remove temp zip file after error:", cleanupError);
        }
      }
      if (files?.cover?.[0] && fs.existsSync(files.cover[0].path)) {
        try {
          fs.unlinkSync(files.cover[0].path);
        } catch (cleanupError) {
          console.warn("Failed to remove temp cover file after error:", cleanupError);
        }
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
