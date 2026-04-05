import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { put } from '@vercel/blob';

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

    let zipUrl = null;
    let coverUrl = null;

    try {
      if (zippedFolderFile) {
        const { url: uploadedZipUrl } = await put(`models/${model_name || 'model'}-${Date.now()}.zip`, Buffer.from(zippedFolderFile.buffer), {
          access: 'public',
          addRandomSuffix: true
        });
        zipUrl = uploadedZipUrl;
        console.log('ZIP uploaded:', zipUrl);
      }

      if (coverImageFile) {
        const { url: uploadedCoverUrl } = await put(`covers/${Date.now()}-${coverImageFile.originalname}`, Buffer.from(coverImageFile.buffer), {
          access: 'public',
          addRandomSuffix: true
        });
        coverUrl = uploadedCoverUrl;
        console.log('Cover uploaded:', coverUrl);
      }

      // Send to Dify or webhook
      const difyData = {
        name: model_name,
        description: description,
        cover_image_url: coverUrl,
        input_images: zipUrl,
        trigger_word: trigger_word,
        artist_name: artist_name,
        tags: JSON.parse(tags || '[]')
      };

      // Option 1: Dify workflow
      const workflowResponse = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: difyData,
          response_mode: "blocking",
          user: "user123"
        })
      });

      // Option 2: Webhook
      // await fetch('https://trigger.ai-plugin.io/triggers/webhook-debug/DroVv7RwOe5NYFan9yyOwCcn', {
      //   method: 'POST',
      //   headers: {'Content-Type': 'application/json'},
      //   body: JSON.stringify(difyData)
      // });

      const workflowResult = await workflowResponse.json();

      res.json({ 
        success: true, 
        message: "Files processed and workflow triggered",
        data: {
          blob_urls: { zipUrl, coverUrl },
          workflow: workflowResult
        }
      });
    } catch (error) {
      console.error('Processing failed:', error);
      res.status(500).json({ success: false, error: (error as Error).message || 'Unknown error' });

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
