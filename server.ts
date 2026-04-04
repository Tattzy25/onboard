import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  
  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // API routes
  app.post("/api/build-model", upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'zipped_folder', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { user_id, model_name, trigger_word, artist_name, description, tags } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      const coverImageFile = files?.cover_image?.[0];
      const zippedFolderFile = files?.zipped_folder?.[0];

      // Build FormData to send to Dify - pass everything as-is
      const formData = new FormData();
      formData.append('artist_name', artist_name);
      formData.append('model_name', model_name);
      formData.append('trigger_word', trigger_word);
      formData.append('tags', tags);
      
      if (description) {
        formData.append('description', description);
      }
      
      // Append files
      if (coverImageFile) {
        formData.append('cover_image', new Blob([coverImageFile.buffer], { type: coverImageFile.mimetype }), coverImageFile.originalname);
      }
      
      if (zippedFolderFile) {
        formData.append('zipped_folder', new Blob([zippedFolderFile.buffer], { type: zippedFolderFile.mimetype }), zippedFolderFile.originalname);
      }

      // Forward to Dify endpoint
      const difyResponse = await fetch('https://dify-bridge.railway.app/train', {
        method: 'POST',
        body: formData
      });

      const difyResult = await difyResponse.json();

      if (difyResponse.ok) {
        res.json({ 
          success: true, 
          message: "Model training initiated successfully",
          data: difyResult
        });
      } else {
        res.status(difyResponse.status).json({ 
          success: false, 
          error: difyResult.error || "Failed to initiate training on Dify" 
        });
      }
    } catch (error) {
      console.error("Training request error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process training request" 
      });
    }
  });

  // Vite middleware for development
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
