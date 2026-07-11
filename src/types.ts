export interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  location?: string;
  event_date?: string;
  is_private: boolean;
  password?: string;
  created_at: string;
  photo_count?: number;
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  thumbnail_url: string;
  filename: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  order: number;
  created_at: string;
}

export interface Settings {
  id: string;
  studio_name: string;
  subtitle: string;
  description: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  instagram_url?: string;
  footer_text?: string;
  theme: "light" | "dark" | "system";
  watermark_enabled?: boolean;
  watermark_image_url?: string;
  watermark_position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  watermark_opacity?: number;
  watermark_scale?: number; // percentage of image width, e.g. 15
  watermark_remove_white_bg?: boolean;
}

export interface PhotobookOrder {
  id: string;
  album_id: string;
  album_title: string;
  client_name: string;
  client_email: string;
  cover_title: string;
  cover_subtitle: string;
  layout_style: "editorial" | "noir" | "warm";
  book_size: string;
  photo_ids: string[];
  total_price: number;
  payment_method: "bank_transfer";
  payment_reference: string;
  payment_sender_name: string;
  payment_receipt_url?: string;
  status: "pending" | "verified" | "completed" | "cancelled";
  created_at: string;
  delivery_address?: string;
  delivery_phone?: string;
}

export type Category = "All" | "Wedding" | "Portrait" | "Landscape" | "Editorial" | "Commercial" | "Event";
