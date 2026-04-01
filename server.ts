import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || "";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API routes
  app.post("/api/build-model", upload.single("dataset"), async (req, res) => {
    const { modelName, triggerWord, description, coverImageUrl } = req.body;

    console.log(`Starting backend build process for model: ${modelName}`);

    try {
      const timestamp = Date.now();
      const safeModelName = (modelName || "model")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const baseKey = `datasets/${safeModelName}-${timestamp}`;
      const datasetKey = `${baseKey}.zip`;
      const metadataKey = `${baseKey}.json`;

      // Upload ZIP dataset to S3
      if (req.file) {
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: datasetKey,
            Body: req.file.buffer,
            ContentType: "application/zip",
          })
        );
        console.log(`Uploaded dataset ZIP to s3://${S3_BUCKET}/${datasetKey}`);
      }

      // Build and upload metadata JSON to S3
      const metadata = {
        modelName,
        triggerWord,
        description,
        coverImageUrl,
        datasetKey,
        createdAt: new Date().toISOString(),
      };

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: metadataKey,
          Body: JSON.stringify(metadata, null, 2),
          ContentType: "application/json",
        })
      );
      console.log(`Uploaded metadata JSON to s3://${S3_BUCKET}/${metadataKey}`);

      res.json({
        success: true,
        message: "Dataset and metadata uploaded successfully.",
        modelId: `model_${timestamp}`,
        datasetKey,
        metadataKey,
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
