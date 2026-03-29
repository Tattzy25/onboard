import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API routes
  app.post("/api/mymodels", async (req, res) => {
    const { modelName, triggerWord, artistName } = req.body;
    
    console.log(`Starting backend build process for model: ${modelName}`);
    
    // This is where the "MCP call" or backend-to-backend process would happen.
    // Secrets like GEMINI_API_KEY or other credentials stay here on the server.
    
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
