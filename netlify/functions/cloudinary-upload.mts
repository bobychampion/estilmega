import type { Config } from "@netlify/functions";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ success: false, message: "No file uploaded" }), { status: 400 });
    }

    // Groups uploads by album (folder + tag) instead of dumping everything into one bucket
    const rawAlbumId = formData.get("albumId");
    const albumId = typeof rawAlbumId === "string" ? rawAlbumId.replace(/[^a-zA-Z0-9_-]/g, "") : "";
    const folder = albumId ? `estil_mega_studio/${albumId}` : "estil_mega_studio";

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto", tags: albumId ? [albumId] : undefined },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      uploadStream.end(buffer);
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: result?.secure_url,
        thumbnail_url: result?.secure_url?.replace("/upload/", "/upload/c_thumb,w_600/"),
        public_id: result?.public_id,
        width: result?.width,
        height: result?.height,
        format: result?.format,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    return new Response(
      JSON.stringify({ success: false, message: err?.message || "Cloudinary upload failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/cloudinary/upload",
};
