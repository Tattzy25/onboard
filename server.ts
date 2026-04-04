import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

const ZIPLINE_URL = process.env.ZIPLINE_URL || "https://zipline-production-b596.up.railway.app";
const ZIPLINE_API_KEY = process.env.ZIPLINE_API_KEY || "";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API routes
  app.post("/api/build-model", async (req, res) => {
    const { modelName, triggerWord, artistName } = req.body;
    
    console.log(`Starting backend build process for model: ${modelName}`);
    
    // This is where the "MCP call" or backend-to-backend process would happen.    
    try {
      // Simulate backend processing time
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      res.json({ 
        success: true, 
        message: "Model built successfully on the backend.",
        modelId: `model_${Date.now()}`
      });
    } catch (error) {
      console.error("Backend build error:", error);
      res.status(500).json({ success: false, error: "Failed to build model on the backend." });
    }
  });

  // Upload a zip file to Zipline and return the shareable URL
  app.post("/api/upload-to-zipline", upload.single("file"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file provided." });
      return;
    }

    console.log(`Uploading file to Zipline: ${req.file.originalname} (${req.file.size} bytes)`);

    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);

      const headers: Record<string, string> = {};
      if (ZIPLINE_API_KEY) {
        headers["Authorization"] = ZIPLINE_API_KEY;
      }

      const ziplineResponse = await fetch(`${ZIPLINE_URL}/api/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!ziplineResponse.ok) {
        const errorText = await ziplineResponse.text();
        console.error("Zipline upload failed:", ziplineResponse.status, errorText);
        res.status(502).json({ success: false, error: `Zipline upload failed: ${ziplineResponse.statusText}` });
        return;
      }

      const ziplineData = await ziplineResponse.json() as Record<string, unknown>;
      console.log("Zipline response:", ziplineData);

      // Zipline returns { files: [url], ...} or { url: "..." } depending on version
      let fileUrl: string | null = null;
      if (Array.isArray(ziplineData.files) && ziplineData.files.length > 0) {
        fileUrl = ziplineData.files[0] as string;
      } else if (typeof ziplineData.url === "string") {
        fileUrl = ziplineData.url;
      }

      if (!fileUrl) {
        console.error("Could not extract URL from Zipline response:", ziplineData);
        res.status(502).json({ success: false, error: "Zipline did not return a file URL." });
        return;
      }

      res.json({ success: true, url: fileUrl });
    } catch (error) {
      console.error("Zipline upload error:", error);
      res.status(500).json({ success: false, error: "Failed to upload file to Zipline." });
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
