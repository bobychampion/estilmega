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

export const mockAlbums: Album[] = [
  {
    id: "album-esther",
    title: "ESTHER MUMMY'S PORTRAITS",
    description: "An elegant portrait session showcasing traditional style, grace, and rich celebratory details.",
    cover_image: "https://images.unsplash.com/photo-1619380061814-58f03707f082?auto=format&fit=crop&q=80&w=1200",
    category: "Portrait",
    location: "Lagos, Nigeria",
    event_date: "2026-07-06",
    is_private: false,
    created_at: "2026-07-06T10:00:00Z",
    photo_count: 6
  },
  {
    id: "album-tbc2026",
    title: "TBC2026",
    description: "Capturing the vibrant energy, live music, and professional keynote delivery at the TBC Convener conference.",
    cover_image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=1200",
    category: "Event",
    location: "Civic Centre, Lagos",
    event_date: "2026-07-04",
    is_private: false,
    created_at: "2026-07-04T12:00:00Z",
    photo_count: 5
  },
  {
    id: "album-50th",
    title: "50TH BIRTHDAY PARTY",
    description: "Golden jubilee milestone celebration filled with laughter, exquisite details, and joyous reunions.",
    cover_image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=1200",
    category: "Event",
    location: "The Landmark, Victoria Island",
    event_date: "2026-06-21",
    is_private: false,
    created_at: "2026-06-21T18:00:00Z",
    photo_count: 6
  },
  {
    id: "album-family",
    title: "FAMILY PORTRAITS",
    description: "Warm and candid studio moments full of laughter, deep connection, and beautiful family bonds.",
    cover_image: "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=1200",
    category: "Portrait",
    location: "Studio Session, Lagos",
    event_date: "2026-06-15",
    is_private: false,
    created_at: "2026-06-15T09:00:00Z",
    photo_count: 5
  },
  {
    id: "album-bw-couple",
    title: "B&W COUPLE",
    description: "An intimate, black-and-white editorial session focusing on high contrast, soft lighting, and romance.",
    cover_image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200",
    category: "Editorial",
    location: "Lekki Conservation Centre",
    event_date: "2026-06-10",
    is_private: false,
    created_at: "2026-06-10T14:00:00Z",
    photo_count: 5
  },
  {
    id: "album-lawyer",
    title: "LEGAL PORTRAIT",
    description: "Polished corporate and professional headshots highlighting poise and confidence.",
    cover_image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200",
    category: "Portrait",
    location: "High Court Chambers, Lagos",
    event_date: "2026-06-05",
    is_private: false,
    created_at: "2026-06-05T11:00:00Z",
    photo_count: 5
  }
];

export const mockPhotos: Photo[] = [
  // Album: ESTHER MUMMY'S PORTRAITS
  {
    id: "photo-esther-1",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1619380061814-58f03707f082?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1619380061814-58f03707f082?auto=format&fit=crop&q=80&w=600",
    filename: "esther-traditional-crown.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-07-06T10:05:00Z"
  },
  {
    id: "photo-esther-2",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    filename: "esther-side-profile.jpg",
    width: 1600,
    height: 2000,
    aspect_ratio: 0.8,
    order: 1,
    created_at: "2026-07-06T10:10:00Z"
  },
  {
    id: "photo-esther-3",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=600",
    filename: "esther-smile.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-07-06T10:15:00Z"
  },
  {
    id: "photo-esther-4",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    filename: "esther-guest-portrait.jpg",
    width: 1600,
    height: 2000,
    aspect_ratio: 0.8,
    order: 3,
    created_at: "2026-07-06T10:20:00Z"
  },
  {
    id: "photo-esther-5",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
    filename: "esther-guest-portrait-2.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-07-06T10:25:00Z"
  },
  {
    id: "photo-esther-6",
    album_id: "album-esther",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    filename: "esther-guest-portrait-3.jpg",
    width: 1600,
    height: 2000,
    aspect_ratio: 0.8,
    order: 5,
    created_at: "2026-07-06T10:30:00Z"
  },

  // Album: TBC2026
  {
    id: "photo-tbc-1",
    album_id: "album-tbc2026",
    url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=600",
    filename: "tbc-presenter.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-07-04T12:05:00Z"
  },
  {
    id: "photo-tbc-2",
    album_id: "album-tbc2026",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
    filename: "tbc-crowd.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 1,
    created_at: "2026-07-04T12:10:00Z"
  },
  {
    id: "photo-tbc-3",
    album_id: "album-tbc2026",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
    filename: "tbc-stage.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-07-04T12:15:00Z"
  },
  {
    id: "photo-tbc-4",
    album_id: "album-tbc2026",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
    filename: "tbc-lights.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 3,
    created_at: "2026-07-04T12:20:00Z"
  },
  {
    id: "photo-tbc-5",
    album_id: "album-tbc2026",
    url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600",
    filename: "tbc-smiles.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-07-04T12:25:00Z"
  },

  // Album: 50TH BIRTHDAY PARTY
  {
    id: "photo-50th-1",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=600",
    filename: "50th-gorgeous-close-up.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-06-21T18:05:00Z"
  },
  {
    id: "photo-50th-2",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
    filename: "50th-ribbon-cutting.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 1,
    created_at: "2026-06-21T18:10:00Z"
  },
  {
    id: "photo-50th-3",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
    filename: "50th-outdoor-celebrants.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-06-21T18:15:00Z"
  },
  {
    id: "photo-50th-4",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    filename: "50th-banquet.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 3,
    created_at: "2026-06-21T18:20:00Z"
  },
  {
    id: "photo-50th-5",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=600",
    filename: "50th-toasts.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-06-21T18:25:00Z"
  },
  {
    id: "photo-50th-6",
    album_id: "album-50th",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
    filename: "50th-joy.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 5,
    created_at: "2026-06-21T18:30:00Z"
  },

  // Album: FAMILY PORTRAITS
  {
    id: "photo-family-1",
    album_id: "album-family",
    url: "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=600",
    filename: "family-studio-1.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-06-15T09:05:00Z"
  },
  {
    id: "photo-family-2",
    album_id: "album-family",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
    filename: "family-outdoor-2.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 1,
    created_at: "2026-06-15T09:10:00Z"
  },
  {
    id: "photo-family-3",
    album_id: "album-family",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
    filename: "family-celebration-3.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-06-15T09:15:00Z"
  },
  {
    id: "photo-family-4",
    album_id: "album-family",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    filename: "family-portraits-4.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 3,
    created_at: "2026-06-15T09:20:00Z"
  },
  {
    id: "photo-family-5",
    album_id: "album-family",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
    filename: "family-moments-5.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-06-15T09:25:00Z"
  },

  // Album: B&W COUPLE
  {
    id: "photo-bw-1",
    album_id: "album-bw-couple",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600",
    filename: "couple-bw-1.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-06-10T14:05:00Z"
  },
  {
    id: "photo-bw-2",
    album_id: "album-bw-couple",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600",
    filename: "couple-bw-2.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 1,
    created_at: "2026-06-10T14:10:00Z"
  },
  {
    id: "photo-bw-3",
    album_id: "album-bw-couple",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
    filename: "couple-bw-3.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-06-10T14:15:00Z"
  },
  {
    id: "photo-bw-4",
    album_id: "album-bw-couple",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
    filename: "couple-bw-4.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 3,
    created_at: "2026-06-10T14:20:00Z"
  },
  {
    id: "photo-bw-5",
    album_id: "album-bw-couple",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    filename: "couple-bw-5.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-06-10T14:25:00Z"
  },

  // Album: LEGAL PORTRAIT
  {
    id: "photo-lawyer-1",
    album_id: "album-lawyer",
    url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
    filename: "lawyer-headshot.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 0,
    created_at: "2026-06-05T11:05:00Z"
  },
  {
    id: "photo-lawyer-2",
    album_id: "album-lawyer",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600",
    filename: "lawyer-office.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 1,
    created_at: "2026-06-05T11:10:00Z"
  },
  {
    id: "photo-lawyer-3",
    album_id: "album-lawyer",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
    filename: "lawyer-outdoor.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 2,
    created_at: "2026-06-05T11:15:00Z"
  },
  {
    id: "photo-lawyer-4",
    album_id: "album-lawyer",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
    filename: "lawyer-celebration.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 3,
    created_at: "2026-06-05T11:20:00Z"
  },
  {
    id: "photo-lawyer-5",
    album_id: "album-lawyer",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    filename: "lawyer-details.jpg",
    width: 1600,
    height: 1066,
    aspect_ratio: 1.5,
    order: 4,
    created_at: "2026-06-05T11:25:00Z"
  }
];
