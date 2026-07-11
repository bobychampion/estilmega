import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return new Response(JSON.stringify({ success: false, message: "Missing url parameter" }), { status: 400 });
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return new Response(JSON.stringify({ success: false, message: "Invalid URL protocol" }), { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, message: "Failed to fetch remote asset" }), {
        status: response.status,
      });
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("Image proxy error for URL:", url, err);
    return new Response(JSON.stringify({ success: false, message: err?.message || "Failed to proxy asset" }), {
      status: 500,
    });
  }
};

export const config: Config = {
  path: "/api/proxy",
};
