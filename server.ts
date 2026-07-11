import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";

// Load environment variables (project convention is .env.local, see .env.example)
dotenv.config({ path: [".env.local", ".env"] });

// Sanitize CLOUDINARY_URL to prevent library from throwing if it is invalid or empty
if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.startsWith("cloudinary://")) {
  console.warn("Invalid CLOUDINARY_URL protocol, deleting from process.env to prevent Cloudinary crash.");
  delete process.env.CLOUDINARY_URL;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cloudinaryInstance: any = null;

async function getCloudinary() {
  if (!cloudinaryInstance) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    cloudinaryInstance = cloudinary;
  }
  return cloudinaryInstance;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configure Multer memory storage
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });

  // Basic health check API endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Photography Gallery Server is healthy" });
  });

  // Media Proxy to avoid CORS issues when fetching images for ZIP compilation
  app.get("/api/proxy", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "Missing url parameter" });
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ success: false, message: "Invalid URL protocol" });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ success: false, message: "Failed to fetch remote asset" });
      }
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error("Image proxy error for URL:", url, err);
      return res.status(500).json({ success: false, message: err.message || "Failed to proxy asset" });
    }
  });

  // Cloudinary Upload API Endpoint
  app.post("/api/cloudinary/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const cloudinary = await getCloudinary();

      // Groups uploads by album (folder + tag) instead of dumping everything into one bucket
      const rawAlbumId = req.body?.albumId;
      const albumId = typeof rawAlbumId === "string" ? rawAlbumId.replace(/[^a-zA-Z0-9_-]/g, "") : "";
      const folder = albumId ? `estil_mega_studio/${albumId}` : "estil_mega_studio";

      // Upload the buffer to Cloudinary using upload_stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          tags: albumId ? [albumId] : undefined,
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            return res.status(500).json({ success: false, message: "Cloudinary upload failed", error });
          }
          return res.json({
            success: true,
            url: result?.secure_url,
            thumbnail_url: result?.secure_url?.replace("/upload/", "/upload/c_thumb,w_600/"), // smart crop thumbnail URL
            public_id: result?.public_id,
            width: result?.width,
            height: result?.height,
            format: result?.format,
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (err: any) {
      console.error("Internal server error during upload:", err);
      res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
    }
  });

  // Future secure APIs (Cloudinary signing, Supabase configuration, password-protected albums verification)
  app.post("/api/auth/verify-album", (req, res) => {
    const { password, expectedPassword } = req.body;
    if (password === expectedPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid album password" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // In Express v4, use app.get("*", ...) to handle SPA routing fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
