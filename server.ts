import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/build-model", upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'zipped_folder', maxCount: 1 }
  ]), async (req, res) => {
    console.log("🔥 /api/build-model HIT!");
    
    const { model_name, trigger_word, artist_name, description, tags } = req.body;
    console.log("Body:", { model_name, trigger_word, artist_name, description, tags });
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageFile = files.cover_image?.[0];
    const zippedFolderFile = files.zipped_folder?.[0];

    const formData = new FormData();
    formData.append('user_id', 'owner123');
    formData.append('model_name', model_name);
    formData.append('trigger_word', trigger_word);
    formData.append('artist_name', artist_name);
    formData.append('description', description);
    formData.append('tags', tags);
    
    if (coverImageFile) {
      formData.append('cover_image', new Blob([new Uint8Array(coverImageFile.buffer)], { type: coverImageFile.mimetype }), coverImageFile.originalname);
    }
    
    if (zippedFolderFile) {
      formData.append('zipped_folder', new Blob([new Uint8Array(zippedFolderFile.buffer)], { type: zippedFolderFile.mimetype }), zippedFolderFile.originalname);
    }

      // Forward to Dify endpoint
      const difyResponse = await fetch('http://dify-bridge.railway.internal:8080/train', {
        method: 'POST',
        body: formData
      });
    const difyResponse = await fetch('https://dify-bridge-production.up.railway.app/train', {
      method: 'POST',
      body: formData
    });

    console.log("✅ Got response from Dify bridge, status:", difyResponse.status);
    const difyResult = await difyResponse.json();
    console.log("✅ Dify Result:", difyResult);

    res.json({ 
      success: true, 
      message: "Model training initiated successfully",
      data: difyResult
    });
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