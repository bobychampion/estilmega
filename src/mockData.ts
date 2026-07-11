import { Album, Photo, Settings } from "./types";

export const mockSettings: Settings = {
  id: "1",
  studio_name: "ESTIL STUDIO",
  subtitle: "Fine Art & Event Photography",
  description: "Preserving light, raw emotions, and timeless moments. We believe photography is the art of authentic observation—finding pure beauty in the finest details of your special events.",
  contact_email: "info@estilmega.com",
  contact_phone: "+234 803 365 6440",
  contact_address: "Lagos, Nigeria",
  instagram_url: "https://instagram.com/estilstudio",
  footer_text: "© 2026 ESTIL STUDIO. All rights reserved.",
  theme: "light",
  watermark_enabled: true,
  watermark_image_url: "/src/assets/images/estil_logo_1783729987545.jpg",
  watermark_position: "bottom-right",
  watermark_opacity: 0.7,
  watermark_scale: 20,
  watermark_remove_white_bg: true
};

export const mockAlbums: Album[] = [];

export const mockPhotos: Photo[] = [];
