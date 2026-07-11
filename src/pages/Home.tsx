import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Calendar, Camera, Lock, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { mockAlbums, mockSettings } from "../mockData";
import { Category, Album, Settings } from "../types";

export default function Home() {
  const [albums] = useState<Album[]>(() => {
    const saved = localStorage.getItem("studio_albums");
    return saved ? JSON.parse(saved) : mockAlbums;
  });

  const [settings] = useState<Settings>(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const categories: Category[] = ["All", "Portrait", "Landscape", "Editorial", "Wedding", "Event"];

  // Filter albums based on search and category
  const filteredAlbums = albums.filter((album) => {
    const matchesSearch =
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (album.location && album.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || album.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Helper to format date like "JULY 6TH, 2026"
  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const day = date.getDate();
    let suffix = "TH";
    if (day === 1 || day === 21 || day === 31) suffix = "ST";
    else if (day === 2 || day === 22) suffix = "ND";
    else if (day === 3 || day === 23) suffix = "RD";

    return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white text-zinc-900 pb-24"
      id="home-page"
    >
      {/* Pixieset Centered Minimalist Header with logo background */}
      <header 
        className="relative pt-24 pb-16 px-6 flex flex-col items-center border-b border-zinc-100 overflow-hidden bg-white" 
        style={{ 
          backgroundImage: settings.watermark_image_url ? `url(${settings.watermark_image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        id="estil-header"
      >
        {/* Semi-transparent elegant overlay to blend white logo background and keep layout extremely clean */}
        <div className="absolute inset-0 bg-white/92 backdrop-blur-[2px]" />

        <Link to="/" className="text-center group mb-6 relative z-10">
          <h1 className="text-2xl sm:text-3.5xl font-bold tracking-[0.25em] text-zinc-900 uppercase transition-colors group-hover:text-zinc-600">
            {settings.studio_name || "ESTIL STUDIO"}
          </h1>
        </Link>

        {/* Centered Contact Detail list */}
        <div className="flex flex-col items-center gap-3 text-[11px] sm:text-xs font-light text-zinc-600 tracking-wider relative z-10">
          {settings.contact_phone && (
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex items-center gap-2 hover:text-zinc-900 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              <span>{settings.contact_phone}</span>
            </a>
          )}
          {settings.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center gap-2 hover:text-zinc-900 transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span>{settings.contact_email}</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Discover & Grid section */}
      <main className="mx-auto max-w-7xl px-6 sm:px-8 mt-12">
        
        {/* Subtle controls: Categories and search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 border-b border-zinc-50 pb-6">
          {/* Centered Category list */}
          <div className="flex flex-wrap justify-center gap-1.5" id="category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-[10px] tracking-widest uppercase transition-all duration-200 rounded-full font-medium ${
                  selectedCategory === category
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Elegant minimalist search bar */}
          <div className="relative w-full sm:w-64" id="search-container">
            <input
              type="text"
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-b border-zinc-200 bg-transparent py-2 pl-3 pr-10 text-[10px] tracking-widest uppercase outline-none focus:border-zinc-900 text-zinc-800 transition-colors placeholder-zinc-400"
            />
            <Search className="absolute right-2 top-2 h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Albums Grid - Beautiful clean 3 columns */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12" id="albums-grid">
            {filteredAlbums.map((album, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
                key={album.id}
                className="group flex flex-col"
              >
                {/* Rectangular Image Cover */}
                <Link
                  to={`/albums/${album.id}`}
                  className="block overflow-hidden bg-zinc-100 aspect-[4/3] relative"
                >
                  <img
                    src={album.cover_image}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  
                  {/* Subtle Dark Layer on Hover only */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Private Lock Indicator */}
                  {album.is_private && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full p-2 text-zinc-800 shadow-sm">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </Link>

                {/* Centered Album Metadata below Cover */}
                <div className="mt-4 text-center">
                  <Link to={`/albums/${album.id}`} className="inline-block">
                    <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-900 group-hover:text-zinc-600 transition-colors">
                      {album.title}
                    </h3>
                  </Link>
                  {album.event_date && (
                    <p className="text-[9px] tracking-[0.15em] uppercase text-zinc-400 mt-1.5 font-medium">
                      {formatEventDate(album.event_date)}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-zinc-200 bg-zinc-50 rounded-2xl" id="no-albums">
            <Camera className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-xs tracking-widest uppercase font-medium text-zinc-600">No collections found</h3>
            <p className="text-xs text-zinc-400 mt-2">Try adjusting your keyword filter or browse categories.</p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
