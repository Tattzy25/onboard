import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store files in memory so we can stream them directly to S3
const upload = multer({ storage: multer.memoryStorage() });

function createS3Client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing required S3 environment variables: AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    );
  }

  return new S3Client({
    endpoint,
    region: process.env.AWS_REGION ?? "auto",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API routes
  app.post("/api/build-model", upload.single("dataset"), async (req, res) => {
    const { modelName, triggerWord, artistName } = req.body;

    console.log(`Starting backend build process for model: ${modelName}`);

    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No dataset file uploaded. Please attach a ZIP archive." });
        return;
      }

      const bucketName = process.env.BUCKET_NAME;
      if (!bucketName) {
        res.status(500).json({ success: false, error: "Server misconfiguration: BUCKET_NAME environment variable is not set." });
        return;
      }

      // Build a unique, human-readable S3 key
      const safeName = (modelName ?? "model").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const s3Key = `datasets/${safeName}-${Date.now()}.zip`;

      const s3 = createS3Client();

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/zip",
        ContentLength: req.file.size,
        Metadata: {
          modelName: modelName ?? "",
          triggerWord: triggerWord ?? "",
          artistName: artistName ?? "",
        },
      });

      await s3.send(putCommand);

      console.log(`Dataset uploaded to s3://${bucketName}/${s3Key} (${req.file.size} bytes)`);

      res.json({
        success: true,
        message: "Dataset uploaded successfully. Model training queued.",
        modelId: `model_${Date.now()}`,
        s3Key,
      });
    } catch (error) {
      console.error("Backend build error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: `Failed to process model build: ${message}` });
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
