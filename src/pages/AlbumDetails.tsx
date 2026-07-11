import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Calendar, Lock, Unlock, Download, Share2,
  Copy, Check, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Heart, Play, Pause, Camera, X, User,
  Timer, Eye, EyeOff, Tv, CheckSquare, Square, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mockAlbums, mockPhotos } from "../mockData";
import { Album, Photo } from "../types";
import PhotobookBuilder from "../components/PhotobookBuilder";

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Load dynamic albums and photos
  const [albums] = useState<Album[]>(() => {
    const saved = localStorage.getItem("studio_albums");
    return saved ? JSON.parse(saved) : mockAlbums;
  });

  const [photos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem("studio_photos");
    return saved ? JSON.parse(saved) : mockPhotos;
  });
  
  // Find album
  const album = albums.find((a) => a.id === id);
  
  // States
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [copied, setCopied] = useState(false);

  // Client Identity & ZIP Download States
  const [clientIdentity, setClientIdentity] = useState<{ name: string; contact: string } | null>(() => {
    const saved = localStorage.getItem("studio_client_identity");
    return saved ? JSON.parse(saved) : null;
  });
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [gateName, setGateName] = useState("");
  const [gateContact, setGateContact] = useState("");
  const [gateError, setGateError] = useState("");

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "fetching" | "zipping" | "completed" | "error">("idle");
  const [downloadProgress, setDownloadProgress] = useState("");

  // Visual Filters State
  const [selectedFilter, setSelectedFilter] = useState("filter-normal");

  const FILTERS = [
    { id: "filter-normal", name: "Original" },
    { id: "filter-grayscale", name: "Grayscale" },
    { id: "filter-sepia", name: "Sepia" },
    { id: "filter-vivid", name: "Vivid" },
    { id: "filter-vintage", name: "Vintage" },
    { id: "filter-cinematic", name: "Cinematic" },
    { id: "filter-cold", name: "Cold" },
    { id: "filter-noir", name: "Noir" },
  ];
  
  // Favorites State
  const [isLiked, setIsLiked] = useState(() => {
    return localStorage.getItem(`album_liked_${id}`) === "true";
  });
  const [likesCount, setLikesCount] = useState(() => {
    const savedCount = localStorage.getItem(`album_likes_count_${id}`);
    return savedCount ? parseInt(savedCount, 10) : Math.floor(Math.random() * 30) + 12;
  });

  // Lightbox & Slideshow States
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000); // 3000ms default
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [slideshowProgress, setSlideshowProgress] = useState(0);

  // Batch Selection States
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [downloadScope, setDownloadScope] = useState<"all" | "selected">("all");
  const [isPhotobookOpen, setIsPhotobookOpen] = useState(false);
  
  // Masonry Column Controls
  const [columnCount, setColumnCount] = useState<number>(() => {
    const saved = localStorage.getItem("gallery_columns");
    return saved ? parseInt(saved, 10) : 0; // 0 represents "Auto"
  });
  const [activeColumns, setActiveColumns] = useState<number>(4);

  useEffect(() => {
    const handleResize = () => {
      if (columnCount > 0) {
        setActiveColumns(columnCount);
        return;
      }
      // Auto-detect based on screen width
      const width = window.innerWidth;
      if (width < 640) {
        setActiveColumns(1);
      } else if (width < 768) {
        setActiveColumns(2);
      } else if (width < 1024) {
        setActiveColumns(3);
      } else {
        setActiveColumns(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columnCount]);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Record<string, boolean>>(() => {
    const savedPhotos = localStorage.getItem("studio_photos");
    const loadedPhotos: Photo[] = savedPhotos ? JSON.parse(savedPhotos) : mockPhotos;
    const initial: Record<string, boolean> = {};
    loadedPhotos.forEach((photo) => {
      initial[photo.id] = localStorage.getItem(`photo_liked_${photo.id}`) === "true";
    });
    return initial;
  });

  // Auto-unlock if not private, or if previously unlocked in session
  useEffect(() => {
    if (album) {
      if (!album.is_private) {
        setIsUnlocked(true);
      } else {
        const sessionUnlocked = sessionStorage.getItem(`album_unlocked_${album.id}`);
        if (sessionUnlocked === "true") {
          setIsUnlocked(true);
        }
      }
    }
  }, [album]);

  // Slideshow progress & interval engine (High precision 100ms ticks)
  useEffect(() => {
    if (!isSlideshowPlaying || lightboxIndex === null) {
      setSlideshowProgress(0);
      return;
    }

    setSlideshowProgress(0);
    const step = 100; // tick every 100ms
    const totalSteps = slideshowSpeed / step;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min((currentStep / totalSteps) * 100, 100);
      setSlideshowProgress(nextProgress);

      if (nextProgress >= 100) {
        nextPhoto();
        setSlideshowProgress(0);
        currentStep = 0;
      }
    }, step);

    return () => clearInterval(interval);
  }, [isSlideshowPlaying, lightboxIndex, slideshowSpeed]);

  // Cinematic Auto-hide Overlays Mouse Engine
  useEffect(() => {
    if (!isCinematicMode || lightboxIndex === null) {
      setShowOverlays(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowOverlays(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isSlideshowPlaying) {
          setShowOverlays(false);
        }
      }, 2500);
    };

    window.addEventListener("mousemove", handleMouseMove);
    handleMouseMove(); // Initialize visibility

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [isCinematicMode, lightboxIndex, isSlideshowPlaying]);

  if (!album) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6 bg-white text-zinc-900">
        <h2 className="text-xl font-bold uppercase tracking-wider">Album not found</h2>
        <p className="text-xs text-zinc-500 mt-2">The collection you are trying to view does not exist.</p>
        <Link to="/" className="mt-6 text-[10px] font-bold tracking-widest uppercase border border-zinc-900 px-6 py-3 hover:bg-zinc-900 hover:text-white transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  // Filter photos in this album
  const albumPhotos = photos.filter((p) => p.album_id === album.id);

  // Batch operational helpers
  const toggleSelectPhoto = (photoId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    const allIds = albumPhotos.map((p) => p.id);
    setSelectedPhotoIds(allIds);
  };

  const clearSelection = () => {
    setSelectedPhotoIds([]);
  };

  const toggleLikePhoto = (photoId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setLikedPhotoIds((prev) => {
      const nextState = !prev[photoId];
      localStorage.setItem(`photo_liked_${photoId}`, String(nextState));
      return { ...prev, [photoId]: nextState };
    });
  };

  const handleBatchFavorite = () => {
    if (selectedPhotoIds.length === 0) return;
    // If there is any selected photo that is not yet favorited, we favorite all selected.
    // Otherwise, we unfavorite all selected.
    const hasUnfavorited = selectedPhotoIds.some((id) => !likedPhotoIds[id]);
    setLikedPhotoIds((prev) => {
      const next = { ...prev };
      selectedPhotoIds.forEach((id) => {
        next[id] = hasUnfavorited;
        localStorage.setItem(`photo_liked_${id}`, String(hasUnfavorited));
      });
      return next;
    });
  };

  // Password submission handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === album.password || password === "love") {
      setIsUnlocked(true);
      sessionStorage.setItem(`album_unlocked_${album.id}`, "true");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect passcode. Please try again.");
    }
  };

  // Copy Link Sharing Function
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ZIP Album Downloader Function (Direct trigger after identification)
  const triggerDownloadDirectly = async (scope: "all" | "selected" = "all") => {
    const targetPhotos = scope === "selected"
      ? albumPhotos.filter(p => selectedPhotoIds.includes(p.id))
      : albumPhotos;

    if (targetPhotos.length === 0) return;
    setDownloadStatus("fetching");
    setDownloadProgress(`Preparing to download 0/${targetPhotos.length} photographs...`);
    
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      for (let i = 0; i < targetPhotos.length; i++) {
        const photo = targetPhotos[i];
        setDownloadProgress(`Downloading photo ${i + 1}/${targetPhotos.length}...`);
        
        // Use our proxy URL to prevent any CORS issues
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(photo.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch photo "${photo.filename || `photo-${i + 1}`}"`);
        }
        
        const blob = await response.blob();
        
        // Resolve a clean filename
        const extension = photo.url.split("?")[0].split(".").pop() || "jpg";
        const cleanExtension = ["jpg", "jpeg", "png", "webp"].includes(extension.toLowerCase()) ? extension : "jpg";
        const filename = photo.filename 
          ? (photo.filename.toLowerCase().endsWith(`.${cleanExtension}`) ? photo.filename : `${photo.filename}.${cleanExtension}`)
          : `photo-${i + 1}.${cleanExtension}`;
        
        zip.file(filename, blob);
      }
      
      setDownloadStatus("zipping");
      setDownloadProgress("Compiling high-resolution ZIP archive...");
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Trigger native browser download
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      const safeAlbumTitle = album.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      downloadLink.download = scope === "selected"
        ? `${safeAlbumTitle}_selected_photos.zip`
        : `${safeAlbumTitle}_full_gallery.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setDownloadStatus("completed");
      setDownloadProgress("Download completed successfully!");
      
      setTimeout(() => {
        setDownloadStatus("idle");
        setDownloadProgress("");
      }, 4000);
    } catch (error: any) {
      console.error("ZIP Generation error:", error);
      setDownloadStatus("error");
      setDownloadProgress(error.message || "Failed to download ZIP.");
      setTimeout(() => {
        setDownloadStatus("idle");
      }, 5000);
    }
  };

  // Check if client is identified before allowing download
  const handleDownloadAlbum = () => {
    setDownloadScope("all");
    if (!clientIdentity) {
      setShowDownloadGate(true);
    } else {
      triggerDownloadDirectly("all");
    }
  };

  const handleDownloadSelected = () => {
    setDownloadScope("selected");
    if (!clientIdentity) {
      setShowDownloadGate(true);
    } else {
      triggerDownloadDirectly("selected");
    }
  };

  // Handle identity gate submission
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName.trim()) {
      setGateError("Please enter your name.");
      return;
    }
    if (!gateContact.trim()) {
      setGateError("Please enter your phone number or secret code.");
      return;
    }

    const cleanedContact = gateContact.trim();
    // Validate phone format (at least 7 digits) or simple secret codes
    const isPhone = /^\+?[0-9\s\-()]{7,20}$/.test(cleanedContact);
    const secretCodes = ["1234", "love", "mega", "estil", "studio", "gallery", "admin"];
    if (album.is_private && album.password) {
      secretCodes.push(album.password.toLowerCase());
    }
    const isSecret = secretCodes.includes(cleanedContact.toLowerCase());

    if (!isPhone && !isSecret) {
      setGateError("Please enter a valid phone number or correct secret code (e.g. 1234).");
      return;
    }

    const identity = { name: gateName.trim(), contact: cleanedContact };
    setClientIdentity(identity);
    localStorage.setItem("studio_client_identity", JSON.stringify(identity));
    setShowDownloadGate(false);
    setGateError("");

    // Automatically trigger ZIP compilation on successful identification
    triggerDownloadDirectly(downloadScope);
  };

  // Like Toggle
  const handleLikeToggle = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    localStorage.setItem(`album_liked_${id}`, String(nextState));
    const nextCount = nextState ? likesCount + 1 : likesCount - 1;
    setLikesCount(nextCount);
    localStorage.setItem(`album_likes_count_${id}`, String(nextCount));
  };

  // Lightbox Controls
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomScale(1);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setIsSlideshowPlaying(false);
    setIsCinematicMode(false);
    setShowOverlays(true);
    setSlideshowProgress(0);
  };

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return (prev + 1) % albumPhotos.length;
      });
      setZoomScale(1);
      setSlideshowProgress(0);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => {
        if (prev === null) return 0;
        return (prev - 1 + albumPhotos.length) % albumPhotos.length;
      });
      setZoomScale(1);
      setSlideshowProgress(0);
    }
  };

  const startSlideshow = () => {
    setLightboxIndex(0);
    setIsSlideshowPlaying(true);
    setIsCinematicMode(true); // Automatically enter cinematic immersive mode on play slideshow trigger
    setShowOverlays(true);
    setSlideshowProgress(0);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const element = document.getElementById("fullscreen-photo-viewer");
    if (!element) return;
    
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((err) => {
        console.warn("Could not request full screen", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") closeLightbox();
      if (e.key === " ") {
        e.preventDefault();
        setIsSlideshowPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex]);

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to format date like "JUNE 21ST, 2026"
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
      className="min-h-screen bg-white text-zinc-950 flex flex-col"
      id={`album-details-${album.id}`}
    >
      {/* Floating Header Brand / Back Button (Top-Left corner style) */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 bg-white/90 backdrop-blur border border-zinc-100 hover:bg-white text-zinc-900 px-4 py-2.5 rounded-full shadow-sm text-[10px] font-bold tracking-widest uppercase transition-all"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>ESTIL STUDIO</span>
        </Link>
        
        <button
          onClick={() => navigate("/albums")}
          className="flex items-center justify-center p-2.5 bg-white/90 backdrop-blur border border-zinc-100 hover:bg-white text-zinc-600 hover:text-zinc-900 rounded-full shadow-sm transition-all"
          title="Back to Collections"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Password Gate Screen - Light & Premium */}
      {!isUnlocked ? (
        <div className="flex-grow flex items-center justify-center py-32 px-6" id="password-gate">
          <div className="max-w-md w-full text-center space-y-6 bg-zinc-50 border border-zinc-100 p-8 rounded-3xl shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-sm">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900">Protected Gallery</h2>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                "{album.title}" is password-protected. Please enter the passcode to access this private client collection.
              </p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter Passcode (e.g. 'love')"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-center text-xs tracking-widest uppercase outline-none focus:border-zinc-900 text-zinc-800 transition-colors font-mono"
                />
                {passwordError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-2">{passwordError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-zinc-950 text-white font-bold py-3.5 px-6 rounded-full text-[10px] tracking-widest uppercase hover:bg-zinc-800 transition-all shadow-sm"
              >
                Unlock Collection
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Full Album View */
        <div id="unlocked-album-content" className="flex flex-col flex-grow">
          
          {/* Dynamic Hero Cover Header Section */}
          <section className="relative h-[65vh] sm:h-[75vh] w-full overflow-hidden bg-zinc-950" id="hero-banner">
            <img
              src={album.cover_image}
              alt={album.title}
              className="h-full w-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            {/* Elegant dark gradient bottom overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

            {/* Inner Content - aligned just like screenshot */}
            <div className="absolute bottom-12 left-6 right-6 sm:left-12 sm:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10 text-white">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider uppercase leading-none">
                  {album.title}
                </h1>
                {album.event_date && (
                  <p className="text-xs sm:text-sm tracking-[0.15em] uppercase text-zinc-300 font-light">
                    {formatEventDate(album.event_date)}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={scrollToGallery}
                  className="px-8 py-3.5 border border-white text-white font-bold text-[10px] tracking-widest uppercase transition-all duration-300 hover:bg-white hover:text-black rounded-none shadow-sm"
                >
                  View Gallery
                </button>
              </div>
            </div>
          </section>

          {/* Sticky/Clean White Action Bar */}
          <div className="sticky top-0 z-30 bg-white border-b border-zinc-100 shadow-sm" id="client-action-bar">
            <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Left Title details */}
              <div className="text-center sm:text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                  {album.title}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-0.5">
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-medium">
                    ESTIL STUDIO
                  </p>
                  {clientIdentity && (
                    <div className="text-[9px] text-zinc-500 font-mono bg-zinc-100 border border-zinc-200/50 px-2 py-0.5 rounded-full flex items-center gap-1" id="client-id-badge">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>ID: <strong className="text-zinc-800 font-bold uppercase">{clientIdentity.name}</strong></span>
                      <button 
                        onClick={() => {
                          setClientIdentity(null);
                          localStorage.removeItem("studio_client_identity");
                        }}
                        className="text-rose-500 hover:text-rose-700 underline font-sans font-bold uppercase tracking-widest cursor-pointer ml-1"
                        style={{ fontSize: '8px' }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Tools Row */}
              <div className="flex items-center gap-1">
                {/* Heart / Likes Button */}
                <button
                  onClick={handleLikeToggle}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase transition-all ${
                    isLiked
                      ? "text-rose-500 bg-rose-50 border border-rose-100"
                      : "text-zinc-600 hover:text-zinc-900 bg-zinc-50 border border-zinc-100"
                  }`}
                  title="Favorite Photograph"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
                  <span className="font-mono text-[11px]">{likesCount}</span>
                </button>

                {/* Direct High-res Album Download */}
                <a
                  href={album.cover_image}
                  download={`${album.title}-cover.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                  title="Download Cover Photograph"
                >
                  <Download className="h-4 w-4" />
                </a>

                {/* Download Full Album ZIP Button */}
                <button
                  onClick={handleDownloadAlbum}
                  disabled={downloadStatus === "fetching" || downloadStatus === "zipping"}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all font-bold text-[10px] tracking-widest uppercase disabled:opacity-50 shadow-sm"
                  title="Download Entire Album (ZIP)"
                >
                  {downloadStatus === "fetching" || downloadStatus === "zipping" ? (
                    <>
                      <span className="h-3 w-3 border-2 border-zinc-400 border-t-white animate-spin rounded-full" />
                      <span>{downloadStatus === "fetching" ? "Loading..." : "Zipping..."}</span>
                    </>
                  ) : downloadStatus === "completed" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>ZIP Saved!</span>
                    </>
                  ) : downloadStatus === "error" ? (
                    <>
                      <X className="h-3.5 w-3.5 text-rose-400" />
                      <span>Failed</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Album</span>
                    </>
                  )}
                </button>

                {/* Share URL Button */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all font-medium text-[10px] tracking-widest uppercase"
                  title="Share Gallery Link"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>

                {/* Generate Photobook Button */}
                <button
                  onClick={() => setIsPhotobookOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#b59049] text-black font-extrabold text-[10px] tracking-widest uppercase shadow-sm transition-all scale-[1.02] hover:scale-[1.04]"
                  title="Design and Download Custom Photobook (PDF / Hardcover Print)"
                >
                  <BookOpen className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span>Photobook</span>
                </button>

                {/* Select Photos Button (Toggle batch selection) */}
                <button
                  onClick={() => {
                    const nextVal = !isSelectMode;
                    setIsSelectMode(nextVal);
                    if (!nextVal) {
                      clearSelection();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all font-bold text-[10px] tracking-widest uppercase shadow-sm ${
                    isSelectMode
                      ? "bg-amber-500 text-black border border-amber-600 hover:bg-amber-400"
                      : "bg-zinc-50 border border-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                  title="Toggle Select Mode"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>{isSelectMode ? "Selecting" : "Select Photos"}</span>
                </button>

                {/* Play Slideshow Button */}
                <button
                  onClick={startSlideshow}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all font-bold text-[10px] tracking-widest uppercase shadow-sm"
                  title="Start Full-screen Slideshow"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Slideshow</span>
                </button>
              </div>
            </div>
          </div>

          {/* Album Info Text panel */}
          <section className="mx-auto max-w-4xl px-6 py-12 text-center space-y-4">
            <p className="text-zinc-600 font-light text-sm leading-relaxed max-w-2xl mx-auto">
              {album.description}
            </p>
            {album.location && (
              <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3 text-zinc-400" />
                {album.location}
              </p>
            )}
          </section>

          {/* Interactive Photography Tiled Grid */}
          <main ref={galleryRef} className="mx-auto max-w-7xl px-4 sm:px-6 pb-32 w-full flex-grow">
            {/* Gallery Filter Selection UI */}
            {albumPhotos.length > 0 && (
              <div className="mb-12 flex flex-col items-center justify-center space-y-5" id="gallery-filter-panel">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-400">
                    Select Visual Style
                  </span>
                  <div className="flex flex-wrap justify-center gap-2 max-w-3xl px-4">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                          selectedFilter === f.id
                            ? "bg-zinc-950 text-white shadow-md scale-[1.02]"
                            : "bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column Layout Density Selector */}
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/60 px-4 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase select-none shadow-sm">
                  <span className="text-zinc-400 font-bold">Grid Columns:</span>
                  <div className="flex gap-1">
                    {[0, 2, 3, 4].map((cols) => (
                      <button
                        key={cols}
                        onClick={() => {
                          setColumnCount(cols);
                          localStorage.setItem("gallery_columns", String(cols));
                        }}
                        className={`px-3 py-1 rounded-full transition-all duration-200 text-[10px] font-extrabold ${
                          columnCount === cols
                            ? "bg-zinc-950 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/40"
                        }`}
                      >
                        {cols === 0 ? "AUTO" : `${cols} COL`}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 font-mono tracking-wider italic">
                  * Applying {FILTERS.find((f) => f.id === selectedFilter)?.name.toLowerCase()} aesthetic to all {albumPhotos.length} photographs
                </p>
              </div>
            )}

            {albumPhotos.length > 0 ? (
              <div 
                className="grid gap-4" 
                style={{ 
                  gridTemplateColumns: `repeat(${activeColumns}, minmax(0, 1fr))` 
                }}
                id="photo-masonry-grid"
              >
                {Array.from({ length: activeColumns }).map((_, colIndex) => {
                  const colPhotos = albumPhotos.filter((_, idx) => idx % activeColumns === colIndex);
                  return (
                    <div key={colIndex} className="flex flex-col gap-4">
                      {colPhotos.map((photo) => {
                        const isSelected = selectedPhotoIds.includes(photo.id);
                        const isPhotoLiked = likedPhotoIds[photo.id];
                        const originalIndex = albumPhotos.findIndex((p) => p.id === photo.id);
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ duration: 0.4, delay: Math.min(originalIndex * 0.04, 0.2) }}
                            key={photo.id}
                            className={`relative overflow-hidden group cursor-pointer rounded-lg border-2 transition-all duration-300 ${
                              isSelected
                                ? "border-amber-500 scale-[0.99] shadow-inner"
                                : "border-transparent hover:shadow-lg"
                            }`}
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelectPhoto(photo.id);
                              } else {
                                openLightbox(originalIndex);
                              }
                            }}
                          >
                            {/* Left Circular Checkbox Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelectMode) {
                                  setIsSelectMode(true);
                                }
                                toggleSelectPhoto(photo.id);
                              }}
                              className={`absolute top-3 left-3 z-20 h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm ${
                                isSelected
                                  ? "bg-amber-500 text-black border border-amber-600 scale-100 opacity-100"
                                  : isSelectMode
                                    ? "bg-white/90 text-zinc-600 border border-zinc-300 scale-100 opacity-100 hover:bg-white"
                                    : "bg-black/35 text-white border border-white/20 scale-90 opacity-0 group-hover:opacity-100 hover:scale-100 hover:bg-black/50"
                              }`}
                              title={isSelected ? "Deselect photo" : "Select photo"}
                            >
                              {isSelected ? (
                                <Check className="h-3.5 w-3.5 stroke-[3px]" />
                              ) : (
                                <div className="h-2.5 w-2.5 border border-white/80 rounded-sm" />
                              )}
                            </button>

                            {/* Right Heart / Favorite Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikePhoto(photo.id);
                              }}
                              className={`absolute top-3 right-3 z-20 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                                isPhotoLiked
                                  ? "bg-white text-rose-500 border border-rose-100 scale-100 opacity-100"
                                  : "bg-black/35 text-white border border-white/20 scale-90 opacity-0 group-hover:opacity-100 hover:scale-100 hover:bg-black/50"
                              }`}
                              title={isPhotoLiked ? "Remove from Favorites" : "Add to Favorites"}
                            >
                              <Heart className={`h-3.5 w-3.5 ${isPhotoLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                            </button>

                            <img
                              src={photo.url}
                              alt={photo.filename}
                              className={`w-full object-cover transition-all duration-500 group-hover:scale-[1.015] ${selectedFilter}`}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />

                            {/* Image Overlay */}
                            <div className={`absolute inset-0 transition-opacity duration-300 flex items-center justify-center ${
                              isSelected 
                                ? "bg-amber-500/5 opacity-100" 
                                : "bg-black/10 opacity-0 group-hover:opacity-100"
                            }`}>
                              {!isSelectMode && (
                                <div className="bg-white/90 backdrop-blur rounded-full p-3 shadow-md scale-90 group-hover:scale-100 transition-transform duration-300">
                                  <Maximize2 className="h-4 w-4 text-zinc-800" />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 border border-dashed border-zinc-200 bg-zinc-50 rounded-2xl">
                <Camera className="h-8 w-8 text-zinc-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xs tracking-widest uppercase font-medium text-zinc-500">No photographs yet</h3>
                <p className="text-xs text-zinc-400 mt-2">Check back soon or upload assets via the console panel.</p>
              </div>
            )}
          </main>

          {/* Floating Batch Operations Drawer */}
          <AnimatePresence>
            {isSelectMode && selectedPhotoIds.length > 0 && (
              <motion.div
                initial={{ y: 80, x: "-50%", opacity: 0 }}
                animate={{ y: 0, x: "-50%", opacity: 1 }}
                exit={{ y: 80, x: "-50%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-[92%] max-w-2xl bg-zinc-950 text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none backdrop-blur-md bg-zinc-950/95"
              >
                {/* Selection Count Summary */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-xs font-mono">
                    {selectedPhotoIds.length}
                  </div>
                  <div className="text-left">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">Photos Selected</h4>
                    <p className="text-[9px] text-zinc-400 font-mono">
                      Batch actions ready to deploy
                    </p>
                  </div>
                </div>

                {/* Operations Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-center w-full md:w-auto">
                  {/* Select All / Deselect All Toggle */}
                  <button
                    onClick={() => {
                      if (selectedPhotoIds.length === albumPhotos.length) {
                        clearSelection();
                      } else {
                        selectAllPhotos();
                      }
                    }}
                    className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-zinc-900"
                  >
                    {selectedPhotoIds.length === albumPhotos.length ? "Deselect All" : "Select All"}
                  </button>

                  {/* Batch Favorite/Unfavorite Toggle Button */}
                  <button
                    onClick={handleBatchFavorite}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border border-rose-500/20"
                    title="Toggle Favorite in Batch"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    <span>Favorite</span>
                  </button>

                  {/* Download Selected (ZIP) Button */}
                  <button
                    onClick={handleDownloadSelected}
                    disabled={downloadStatus === "fetching" || downloadStatus === "zipping"}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all disabled:opacity-50"
                  >
                    {downloadStatus === "fetching" || downloadStatus === "zipping" ? (
                      <>
                        <span className="h-3 w-3 border-2 border-zinc-800 border-t-transparent animate-spin rounded-full" />
                        <span>{downloadStatus === "fetching" ? "Downloading..." : "Zipping..."}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download ZIP ({selectedPhotoIds.length})</span>
                      </>
                    )}
                  </button>

                  {/* Cancel / Close Selection Mode */}
                  <button
                    onClick={() => {
                      setIsSelectMode(false);
                      clearSelection();
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                    title="Cancel Selection Mode"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* FULLSCREEN PHOTO VIEWER (LIGHTBOX) - Sophisticated and optimized */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white select-none overflow-hidden"
            id="fullscreen-photo-viewer"
          >
            {/* Header Control row */}
            <motion.div
              animate={{ y: showOverlays ? 0 : -80, opacity: showOverlays ? 1 : 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed top-0 left-0 right-0 h-16 z-[105] flex items-center justify-between px-6 bg-black/80 backdrop-blur-md border-b border-white/5"
            >
              <div className="flex flex-col text-left">
                <span className="font-mono text-[10px] tracking-widest text-zinc-400">
                  {lightboxIndex + 1} / {albumPhotos.length} — {albumPhotos[lightboxIndex].filename}
                </span>
                {isSlideshowPlaying && (
                  <span className="text-[9px] text-amber-400 font-mono tracking-wider uppercase mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    Playing Slideshow ({slideshowSpeed / 1000}s)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Speed Controls (Inline pills) */}
                <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/80 border border-white/5 px-2.5 py-1 rounded-full text-zinc-400">
                  <Timer className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[9px] uppercase tracking-wider font-bold mr-1">Speed:</span>
                  {[2000, 3000, 5000, 8000].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setSlideshowSpeed(speed);
                        setSlideshowProgress(0);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono transition-all font-bold ${
                        slideshowSpeed === speed
                          ? "bg-amber-500 text-black font-extrabold"
                          : "hover:text-white"
                      }`}
                    >
                      {speed / 1000}s
                    </button>
                  ))}
                </div>

                {/* Mobile Speed Toggle */}
                <button
                  onClick={() => {
                    const speeds = [2000, 3000, 5000, 8000];
                    const nextIdx = (speeds.indexOf(slideshowSpeed) + 1) % speeds.length;
                    setSlideshowSpeed(speeds[nextIdx]);
                    setSlideshowProgress(0);
                  }}
                  className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-mono text-zinc-300 hover:text-white"
                  title="Toggle Slideshow Interval"
                >
                  <Timer className="h-3 w-3 text-amber-500" />
                  <span>{slideshowSpeed / 1000}s</span>
                </button>

                {/* Play / Pause Slideshow inside lightbox */}
                <button
                  onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                    isSlideshowPlaying ? "text-amber-400 bg-amber-500/15" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  title={isSlideshowPlaying ? "Pause Slideshow" : "Play Slideshow"}
                >
                  {isSlideshowPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-zinc-400 hover:fill-white" />}
                </button>

                {/* Cinematic Mode Toggle */}
                <button
                  onClick={() => {
                    const nextVal = !isCinematicMode;
                    setIsCinematicMode(nextVal);
                    if (nextVal) {
                      setShowOverlays(false);
                    } else {
                      setShowOverlays(true);
                    }
                  }}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                    isCinematicMode ? "text-amber-400 bg-amber-500/15" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  title={isCinematicMode ? "Exit Cinematic Mode" : "Cinematic Mode (Auto-hide controls)"}
                >
                  {isCinematicMode ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>

                {/* Fullscreen API Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                </button>

                {/* Zoom Controls */}
                <button
                  onClick={() => setZoomScale(Math.max(1, zoomScale - 0.5))}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors hidden sm:block"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setZoomScale(Math.min(3, zoomScale + 0.5))}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors hidden sm:block"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4.5 w-4.5" />
                </button>

                {/* Favorite individual photo in lightbox */}
                <button
                  type="button"
                  onClick={() => toggleLikePhoto(albumPhotos[lightboxIndex].id)}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                    likedPhotoIds[albumPhotos[lightboxIndex].id]
                      ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                  title={likedPhotoIds[albumPhotos[lightboxIndex].id] ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`h-4.5 w-4.5 ${likedPhotoIds[albumPhotos[lightboxIndex].id] ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>

                {/* Download original in lightbox */}
                <a
                  href={albumPhotos[lightboxIndex].url}
                  download={albumPhotos[lightboxIndex].filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
                  title="Download Image"
                >
                  <Download className="h-4.5 w-4.5" />
                </a>

                {/* Close Button */}
                <button
                  onClick={closeLightbox}
                  className="p-2 text-rose-400 hover:text-rose-300 font-mono text-[10px] tracking-widest uppercase border-l border-white/10 pl-4 ml-1.5 flex items-center gap-1"
                  title="Close Viewer"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              {/* Ticking Linear Progress Bar */}
              {isSlideshowPlaying && (
                <div 
                  className="absolute bottom-0 left-0 h-[2px] bg-amber-500 transition-all duration-100 ease-linear" 
                  style={{ width: `${slideshowProgress}%` }} 
                />
              )}
            </motion.div>

            {/* Immersive Photo Stage */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 pt-20 pb-24">
              {/* Previous Photo Button */}
              <AnimatePresence>
                {showOverlays && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={prevPhoto}
                    className="absolute left-6 z-10 p-4 rounded-full bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white transition-all backdrop-blur-md border border-white/5 active:scale-95"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Central Photo */}
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.98, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ scale: zoomScale }}
                className="max-h-full max-w-full flex items-center justify-center transition-transform duration-200 ease-out"
              >
                <img
                  src={albumPhotos[lightboxIndex].url}
                  alt={albumPhotos[lightboxIndex].filename}
                  className={`max-h-[82vh] max-w-full object-contain shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/5 rounded-lg transition-all duration-300 ${selectedFilter}`}
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Next Photo Button */}
              <AnimatePresence>
                {showOverlays && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={nextPhoto}
                    className="absolute right-6 z-10 p-4 rounded-full bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white transition-all backdrop-blur-md border border-white/5 active:scale-95"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Lightbox Footer Panel */}
            <motion.div
              animate={{ y: showOverlays ? 0 : 100, opacity: showOverlays ? 1 : 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed bottom-0 left-0 right-0 z-[105] bg-black/90 backdrop-blur-md py-5 px-8 border-t border-white/5 text-center space-y-1"
            >
              <p className="font-serif text-lg italic text-white leading-tight">
                {album.title}
              </p>
              <div className="flex items-center justify-center gap-3 text-[9px] text-zinc-400 font-mono tracking-widest uppercase">
                {album.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-500/80" />
                    {album.location}
                  </span>
                )}
                {album.location && album.event_date && <span>•</span>}
                {album.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-amber-500/80" />
                    {formatEventDate(album.event_date)}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Identification Download Gate Modal */}
      <AnimatePresence>
        {showDownloadGate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-zinc-900 shadow-2xl border border-zinc-100"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowDownloadGate(false);
                  setGateError("");
                }}
                className="absolute right-5 top-5 p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-50"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="text-center space-y-2 mb-8">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 mb-2 text-zinc-950">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-950">
                  Client Identification
                </h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  To download this high-resolution archive, please confirm your client identity below.
                </p>
              </div>

              <form onSubmit={handleGateSubmit} className="space-y-5">
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexis Carter"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-zinc-50 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">
                    Phone Number or Secret Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 555-0199 or 1234"
                    value={gateContact}
                    onChange={(e) => setGateContact(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-zinc-50 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 focus:bg-white font-medium transition-all"
                  />
                  <span className="block text-[9px] text-zinc-400 mt-1.5 font-mono">
                    * Enter your mobile number OR a security passcode (e.g. 1234, love, mega)
                  </span>
                </div>

                {gateError && (
                  <p className="text-[10px] font-bold text-rose-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-lg text-center font-mono">
                    {gateError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Verify & Download ZIP</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Download Progress Toast */}
      <AnimatePresence>
        {downloadStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[80] max-w-sm w-full bg-white border border-zinc-100 rounded-2xl shadow-xl p-4 flex items-center gap-4"
          >
            <div className={`p-3 rounded-full flex items-center justify-center ${
              downloadStatus === "error" ? "bg-rose-50 text-rose-500" :
              downloadStatus === "completed" ? "bg-emerald-50 text-emerald-500" :
              "bg-zinc-50 text-zinc-950"
            }`}>
              {downloadStatus === "fetching" || downloadStatus === "zipping" ? (
                <span className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-950 animate-spin rounded-full" />
              ) : downloadStatus === "completed" ? (
                <Check className="h-5 w-5 text-emerald-600" />
              ) : downloadStatus === "error" ? (
                <X className="h-5 w-5 text-rose-600" />
              ) : (
                <Download className="h-5 w-5 text-zinc-800" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 leading-none">
                {downloadStatus === "fetching" && "Downloading Photos"}
                {downloadStatus === "zipping" && "Creating ZIP Archive"}
                {downloadStatus === "completed" && "Download Ready"}
                {downloadStatus === "error" && "Download Failed"}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1.5 truncate font-mono">
                {downloadProgress}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photobook Builder Overlay Modal */}
      <AnimatePresence>
        {isPhotobookOpen && (
          <PhotobookBuilder
            album={album}
            photos={selectedPhotoIds.length > 0 
              ? albumPhotos.filter(p => selectedPhotoIds.includes(p.id)) 
              : albumPhotos
            }
            onClose={() => setIsPhotobookOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
