import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Image, MapPin, Calendar, Camera } from "lucide-react";
import { motion } from "motion/react";
import { mockAlbums } from "../mockData";
import { Category, Album } from "../types";

export default function Albums() {
  const [albums] = useState<Album[]>(() => {
    const saved = localStorage.getItem("studio_albums");
    return saved ? JSON.parse(saved) : mockAlbums;
  });

  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const categories: Category[] = ["All", "Portrait", "Landscape", "Editorial", "Wedding", "Event"];

  const filteredAlbums = albums.filter((album) => {
    return selectedCategory === "All" || album.category === selectedCategory;
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
      className="min-h-screen bg-white py-20 text-zinc-900"
      id="albums-page"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Page Header */}
        <div className="border-b border-zinc-100 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-400">
              The Archives
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-1 uppercase">
              Galleries Index
            </h1>
          </div>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5" id="category-tabs-albums">
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
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16" id="albums-list">
            {filteredAlbums.map((album, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                key={album.id}
                className="group flex flex-col"
              >
                <Link to={`/albums/${album.id}`} className="block relative aspect-[16/10] overflow-hidden bg-zinc-100">
                  <img
                    src={album.cover_image}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Password Protection Badge */}
                  {album.is_private && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-full p-2 text-zinc-800 shadow-sm flex items-center gap-1.5 px-3 py-1.5">
                      <Lock className="h-3 w-3 text-zinc-600" />
                      <span className="text-[9px] tracking-widest uppercase font-bold">Private</span>
                    </div>
                  )}

                  {/* Photo count badge */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-zinc-800 text-[9px] font-bold tracking-widest uppercase">
                    <Image className="h-3.5 w-3.5 text-zinc-600" />
                    <span>{album.photo_count} Photos</span>
                  </div>
                </Link>

                {/* Info block under image */}
                <div className="mt-5 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <span className="text-[9px] tracking-widest uppercase font-bold text-zinc-400 block">
                      {album.category}
                    </span>
                    <Link to={`/albums/${album.id}`}>
                      <h2 className="text-lg font-bold tracking-wider uppercase text-zinc-900 group-hover:text-zinc-600 transition-colors">
                        {album.title}
                      </h2>
                    </Link>
                    <p className="text-xs font-light leading-relaxed text-zinc-500 line-clamp-2">
                      {album.description}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 text-[10px] text-zinc-400 tracking-wider font-light shrink-0">
                    {album.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-300" />
                        {album.location}
                      </span>
                    )}
                    {album.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-300" />
                        <span>{formatEventDate(album.event_date)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-zinc-200 bg-zinc-50 rounded-2xl" id="no-albums">
            <Camera className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-xs tracking-widest uppercase font-medium text-zinc-600">No collections found</h3>
            <p className="text-xs text-zinc-400 mt-2">Try adjusting your category selection.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
