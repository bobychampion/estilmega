import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit3, Settings as SettingsIcon, Image as ImageIcon, UploadCloud, Lock, Unlock, LogOut, Check, ArrowRight, Library, Layout, Sparkles, FolderPlus, Loader2, AlertCircle, BookOpen, CreditCard, CheckCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mockAlbums, mockSettings, mockPhotos } from "../mockData";
import { Album, Settings, Photo, PhotobookOrder } from "../types";
import { supabase } from "../supabase";
import {
  saveAlbumToCloud,
  deleteAlbumFromCloud,
  savePhotoToCloud,
  deletePhotoFromCloud,
  saveSettingsToCloud,
  saveOrderToCloud,
  deleteOrderFromCloud
} from "../dbSync";

export default function AdminDashboard() {
  // Authentication State (backed by Supabase Auth, not a hardcoded passcode)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setAuthChecked(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<"albums" | "upload" | "orders" | "settings">("albums");

  // Mock Database State (Sync with mockData or client state)
  const [albums, setAlbums] = useState<Album[]>(() => {
    const saved = localStorage.getItem("studio_albums");
    return saved ? JSON.parse(saved) : mockAlbums;
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });
  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem("studio_photos");
    return saved ? JSON.parse(saved) : mockPhotos;
  });

  // Photobook Orders State
  const [orders, setOrders] = useState<PhotobookOrder[]>(() => {
    const saved = localStorage.getItem("studio_photobook_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Custom confirmation modal state to avoid blocked browser confirm dialogs inside iframes
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: "album" | "order_cancel" | "order_delete";
    id: string;
    title: string;
  } | null>(null);

  // Modal / Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Form Fields for Album
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Portrait");
  const [newLocation, setNewLocation] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newCover, setNewCover] = useState("");
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Cloudinary drag-and-drop & upload state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUploadAlbumId, setSelectedUploadAlbumId] = useState<string>(() => {
    const saved = localStorage.getItem("studio_albums");
    const loadedAlbums = saved ? JSON.parse(saved) : mockAlbums;
    return loadedAlbums[0]?.id || "";
  });
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string; status: string; error?: string; url?: string }[]>([]);

  // Surfaces cloud (Supabase) write/delete failures instead of letting them fail silently
  const [cloudError, setCloudError] = useState<string | null>(null);
  const reportCloudError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    setCloudError(message);
    console.error(message);
  };

  // Authenticate Admin against Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoggingIn(false);
    if (error) {
      setLoginError("Invalid admin credentials.");
      return;
    }
    setPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Create Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      cover_image: newCover,
      category: newCategory,
      location: newLocation || undefined,
      event_date: newEventDate || undefined,
      is_private: newIsPrivate,
      password: newIsPrivate ? newPassword : undefined,
      created_at: new Date().toISOString(),
      photo_count: 0
    };

    const updated = [newAlbum, ...albums];
    setAlbums(updated);
    localStorage.setItem("studio_albums", JSON.stringify(updated));
    try {
      await saveAlbumToCloud(newAlbum);
    } catch (err) {
      reportCloudError(err);
    }
    resetForm();
    setIsCreateModalOpen(false);
  };

  // Edit Album Details
  const handleEditAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;

    const updatedAlbum = {
      ...editingAlbum,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      location: newLocation || undefined,
      event_date: newEventDate || undefined,
      cover_image: newCover,
      is_private: newIsPrivate,
      password: newIsPrivate ? newPassword : undefined
    };

    const updated = albums.map((alb) => {
      if (alb.id === editingAlbum.id) {
        return updatedAlbum;
      }
      return alb;
    });

    setAlbums(updated);
    localStorage.setItem("studio_albums", JSON.stringify(updated));
    try {
      await saveAlbumToCloud(updatedAlbum);
    } catch (err) {
      reportCloudError(err);
    }
    resetForm();
    setEditingAlbum(null);
  };

  // Delete Album via Custom confirmation modal (avoid browser confirm blocks inside iframes)
  const handleDeleteAlbum = (id: string) => {
    const album = albums.find((alb) => alb.id === id);
    if (album) {
      setDeleteConfirmTarget({
        type: "album",
        id: album.id,
        title: album.title
      });
    }
  };

  const executeConfirmedAction = async () => {
    if (!deleteConfirmTarget) return;

    const { type, id } = deleteConfirmTarget;

    if (type === "album") {
      const updated = albums.filter((alb) => alb.id !== id);
      setAlbums(updated);
      localStorage.setItem("studio_albums", JSON.stringify(updated));

      // Clean up photos associated with this deleted album
      const albumPhotos = photos.filter((p) => p.album_id === id);
      const remainingPhotos = photos.filter((p) => p.album_id !== id);
      setPhotos(remainingPhotos);
      localStorage.setItem("studio_photos", JSON.stringify(remainingPhotos));

      try {
        await Promise.all(albumPhotos.map((photo) => deletePhotoFromCloud(photo.id)));
        await deleteAlbumFromCloud(id);
      } catch (err) {
        reportCloudError(err);
      }
    } else if (type === "order_cancel") {
      const updated = orders.map((o) => o.id === id ? { ...o, status: "cancelled" as const } : o);
      setOrders(updated);
      localStorage.setItem("studio_photobook_orders", JSON.stringify(updated));
      const updatedOrder = updated.find((o) => o.id === id);
      if (updatedOrder) {
        saveOrderToCloud(updatedOrder);
      }
    } else if (type === "order_delete") {
      const updated = orders.filter((o) => o.id !== id);
      setOrders(updated);
      localStorage.setItem("studio_photobook_orders", JSON.stringify(updated));
      deleteOrderFromCloud(id);
    }

    setDeleteConfirmTarget(null);
  };

  const startEdit = (album: Album) => {
    setEditingAlbum(album);
    setNewTitle(album.title);
    setNewDesc(album.description);
    setNewCategory(album.category);
    setNewLocation(album.location || "");
    setNewEventDate(album.event_date || "");
    setNewCover(album.cover_image);
    setNewIsPrivate(album.is_private);
    setNewPassword(album.password || "");
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDesc("");
    setNewCategory("Portrait");
    setNewLocation("");
    setNewEventDate("");
    setNewCover("");
    setNewIsPrivate(false);
    setNewPassword("");
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("studio_settings", JSON.stringify(settings));
    try {
      await saveSettingsToCloud(settings);
      alert("Studio settings saved successfully!");
    } catch (err) {
      reportCloudError(err);
    }
  };

  const applyWatermark = (file: File, currentSettings: Settings): Promise<File> => {
    return new Promise((resolve) => {
      if (!currentSettings.watermark_enabled) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Load watermark
        const watermarkImg = new Image();
        watermarkImg.src = currentSettings.watermark_image_url || "/src/assets/images/estil_logo_1783729987545.jpg";
        watermarkImg.crossOrigin = "anonymous";

        watermarkImg.onload = () => {
          let watermarkSource: CanvasImageSource = watermarkImg;
          let watermarkWidth = watermarkImg.naturalWidth;
          let watermarkHeight = watermarkImg.naturalHeight;

          // Perform white background removal if checked
          if (currentSettings.watermark_remove_white_bg) {
            const wmCanvas = document.createElement("canvas");
            wmCanvas.width = watermarkWidth;
            wmCanvas.height = watermarkHeight;
            const wmCtx = wmCanvas.getContext("2d");
            if (wmCtx) {
              wmCtx.drawImage(watermarkImg, 0, 0);
              const wmImgData = wmCtx.getImageData(0, 0, watermarkWidth, watermarkHeight);
              const data = wmImgData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // Make white or nearly white pixels transparent (R, G, B > 230)
                if (r > 230 && g > 230 && b > 230) {
                  data[i+3] = 0; // Alpha
                }
              }
              wmCtx.putImageData(wmImgData, 0, 0);
              watermarkSource = wmCanvas;
            }
          }

          // Calculate watermark dimensions relative to background image
          const scale = (currentSettings.watermark_scale || 20) / 100;
          const targetW = canvas.width * scale;
          const targetH = targetW * (watermarkHeight / watermarkWidth);

          // Padding is 3% of image width
          const padding = canvas.width * 0.03;
          let x = 0;
          let y = 0;

          const position = currentSettings.watermark_position || "bottom-right";
          switch (position) {
            case "top-left":
              x = padding;
              y = padding;
              break;
            case "top-right":
              x = canvas.width - targetW - padding;
              y = padding;
              break;
            case "bottom-left":
              x = padding;
              y = canvas.height - targetH - padding;
              break;
            case "bottom-right":
              x = canvas.width - targetW - padding;
              y = canvas.height - targetH - padding;
              break;
            case "center":
              x = (canvas.width - targetW) / 2;
              y = (canvas.height - targetH) / 2;
              break;
          }

          // Apply opacity
          ctx.save();
          ctx.globalAlpha = currentSettings.watermark_opacity !== undefined ? currentSettings.watermark_opacity : 0.7;
          
          // Draw the watermark
          ctx.drawImage(watermarkSource, x, y, targetW, targetH);
          ctx.restore();

          // Convert to Blob and then to File
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: file.type || "image/jpeg",
                  lastModified: Date.now()
                });
                resolve(processedFile);
              } else {
                resolve(file);
              }
            },
            file.type || "image/jpeg",
            0.92
          );
        };

        watermarkImg.onerror = () => {
          console.warn("Watermark image failed to load, uploading original.");
          resolve(file);
        };
      };

      img.onerror = () => {
        console.warn("Source image failed to load in Canvas, uploading original.");
        resolve(file);
      };
    });
  };

  // Upload file directly to Cloudinary via server API
  const uploadFileToCloudinary = async (file: File) => {
    if (!selectedUploadAlbumId) {
      alert("Please select or create an album before uploading!");
      return;
    }

    const queueId = `${file.name}-${Date.now()}-${Math.random()}`;
    const newQueueItem = {
      id: queueId,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      status: "uploading"
    };
    setUploadedFiles(prev => [newQueueItem, ...prev]);

    try {
      // Process watermark if enabled
      const processedFile = await applyWatermark(file, settings);

      const formData = new FormData();
      formData.append("file", processedFile);
      // Groups the upload under this album in Cloudinary (folder + tag), so
      // media isn't just a flat, unlabeled asset dump.
      formData.append("albumId", selectedUploadAlbumId);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(`Upload server error: ${data?.message || response.statusText || response.status}`);
      }

      if (!data) {
        throw new Error("Upload server error: invalid response");
      }
      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }

      // Create new Photo record
      const newPhotoObj: Photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        album_id: selectedUploadAlbumId,
        url: data.url,
        thumbnail_url: data.thumbnail_url || data.url,
        filename: file.name,
        width: data.width || 1200,
        height: data.height || 800,
        aspect_ratio: data.width && data.height ? data.width / data.height : 1.5,
        order: Date.now(),
        created_at: new Date().toISOString()
      };

      // Photo is on Cloudinary now — persist the DB row before declaring success,
      // so a failed cloud save is visible instead of silently vanishing on reload.
      await savePhotoToCloud(newPhotoObj);

      const savedPhotosStr = localStorage.getItem("studio_photos");
      const currentPhotos = savedPhotosStr ? JSON.parse(savedPhotosStr) : mockPhotos;
      const updatedPhotos = [newPhotoObj, ...currentPhotos];
      localStorage.setItem("studio_photos", JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);

      setUploadedFiles(prev => prev.map(item => {
        if (item.id === queueId) {
          return { ...item, status: "success", url: data.url };
        }
        return item;
      }));

      // Increment album count, and auto-fill the cover image the first time
      // an album gets a real photo (instead of leaving the create-time placeholder).
      const targetAlbum = albums.find(alb => alb.id === selectedUploadAlbumId);
      if (targetAlbum) {
        const updatedAlb: Album = {
          ...targetAlbum,
          photo_count: (targetAlbum.photo_count || 0) + 1,
          cover_image: targetAlbum.cover_image ? targetAlbum.cover_image : newPhotoObj.url
        };
        const updatedAlbums = albums.map(alb => alb.id === selectedUploadAlbumId ? updatedAlb : alb);
        setAlbums(updatedAlbums);
        localStorage.setItem("studio_albums", JSON.stringify(updatedAlbums));
        try {
          await saveAlbumToCloud(updatedAlb);
        } catch (err) {
          // Non-fatal: the photo itself saved fine, just note the album metadata didn't sync.
          reportCloudError(err);
        }
      }
    } catch (err: any) {
      console.error("Cloudinary Upload error:", err);
      setUploadedFiles(prev => prev.map(item => {
        if (item.id === queueId) {
          return { ...item, status: "error", error: err.message || "Failed to upload" };
        }
        return item;
      }));
    }
  };

  // Drag & drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      files.forEach(file => {
        uploadFileToCloudinary(file);
      });
    }
  };

  // Lets the admin pick which uploaded photo is used as the album's hero/thumbnail image
  const handleSetAlbumCover = async (albumId: string, photoUrl: string) => {
    const targetAlbum = albums.find(alb => alb.id === albumId);
    if (!targetAlbum) return;

    const updatedAlb: Album = { ...targetAlbum, cover_image: photoUrl };
    const updatedAlbums = albums.map(alb => alb.id === albumId ? updatedAlb : alb);
    setAlbums(updatedAlbums);
    localStorage.setItem("studio_albums", JSON.stringify(updatedAlbums));
    try {
      await saveAlbumToCloud(updatedAlb);
    } catch (err) {
      reportCloudError(err);
    }
  };

  // Removes a single photo from an album (photo stays on Cloudinary, only the DB record is removed)
  const handleDeletePhoto = async (photo: Photo) => {
    const remainingPhotos = photos.filter(p => p.id !== photo.id);
    setPhotos(remainingPhotos);
    localStorage.setItem("studio_photos", JSON.stringify(remainingPhotos));
    try {
      await deletePhotoFromCloud(photo.id);
    } catch (err) {
      reportCloudError(err);
    }

    const targetAlbum = albums.find(alb => alb.id === photo.album_id);
    if (targetAlbum) {
      const updatedAlb: Album = {
        ...targetAlbum,
        photo_count: Math.max(0, (targetAlbum.photo_count || 1) - 1),
        cover_image: targetAlbum.cover_image === photo.url ? "" : targetAlbum.cover_image
      };
      const updatedAlbums = albums.map(alb => alb.id === photo.album_id ? updatedAlb : alb);
      setAlbums(updatedAlbums);
      localStorage.setItem("studio_albums", JSON.stringify(updatedAlbums));
      try {
        await saveAlbumToCloud(updatedAlb);
      } catch (err) {
        reportCloudError(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900" id="admin-dashboard-page">
      <AnimatePresence mode="wait">
        {!authChecked ? (
          <div className="flex min-h-[90vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : !isLoggedIn ? (
          <motion.div
            key="login-gate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-[90vh] items-center justify-center px-6"
          >
            <div className="w-full max-w-md bg-zinc-50 border border-zinc-100 p-8 sm:p-10 rounded-3xl shadow-md">
              <div className="text-center space-y-4 mb-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
                  <Layout className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold tracking-wider uppercase text-zinc-900">Studio Admin Auth</h1>
                <p className="text-xs text-zinc-500 font-light leading-relaxed">
                  Only the chief photographer has administrative access. Sign in with your admin account to open the dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-center text-xs tracking-widest outline-none focus:border-zinc-950 text-zinc-800 transition-colors font-mono shadow-sm"
                    autoComplete="username"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-center text-xs tracking-widest outline-none focus:border-zinc-950 text-zinc-800 transition-colors font-mono shadow-sm"
                    autoComplete="current-password"
                    required
                  />
                  {loginError && (
                    <p className="text-[11px] text-rose-500 font-medium text-center mt-2">{loginError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-zinc-950 text-white hover:bg-zinc-800 py-3.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoggingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Verify Credentials <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* MAIN ADMIN BOARD PANEL */
          <motion.div
            key="dashboard-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-7xl px-6 py-12 lg:px-8"
          >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-8 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-zinc-400" />
                  <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-400">
                    Console Portal
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-wider uppercase text-zinc-900">
                  {settings.studio_name} Admin
                </h1>
              </div>

              {/* Navigation Tabs and Logout */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab("albums")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                    activeTab === "albums"
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-955"
                  }`}
                >
                  <Library className="h-4 w-4" />
                  Collections
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                    activeTab === "upload"
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-955"
                  }`}
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                    activeTab === "orders"
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-955"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Photobooks
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                    activeTab === "settings"
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-955"
                  }`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-955 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            {/* Cloud sync error banner: surfaces Supabase write/delete failures instead of silently losing data */}
            {cloudError && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs leading-relaxed">
                  <p className="font-semibold uppercase tracking-wider text-[10px] mb-1">Cloud sync failed</p>
                  <p>{cloudError}</p>
                </div>
                <button
                  onClick={() => setCloudError(null)}
                  className="text-rose-400 hover:text-rose-600"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* TAB CONTENT AREAS */}
            <div className="py-10">
              <AnimatePresence mode="wait">
                {/* 1. ALBUMS TAB */}
                {activeTab === "albums" && (
                  <motion.div
                    key="tab-albums"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-serif text-white">
                        Photography Collections ({albums.length})
                      </h2>
                      <button
                        onClick={() => {
                          resetForm();
                          setIsCreateModalOpen(true);
                        }}
                        className="bg-[#C5A059] text-black px-5 py-2.5 rounded-full text-[10px] font-semibold tracking-widest uppercase hover:bg-[#b08d4b] transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Album
                      </button>
                    </div>

                    {/* Albums Control Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {albums.map((alb) => (
                        <div
                          key={alb.id}
                          className="glass-card p-5 space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 relative border border-white/5">
                              {alb.cover_image ? (
                                <img
                                  src={alb.cover_image}
                                  alt={alb.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-zinc-600">
                                  <ImageIcon className="h-8 w-8" />
                                  <span className="text-[9px] font-mono tracking-widest uppercase">No cover yet</span>
                                </div>
                              )}
                              {alb.is_private && (
                                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-white text-[9px] font-mono tracking-wider flex items-center gap-1.5">
                                  <Lock className="h-3 w-3 text-[#C5A059]" />
                                  Private
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] tracking-widest uppercase font-semibold text-[#C5A059]">
                                {alb.category}
                              </span>
                              <h3 className="font-serif text-lg tracking-tight font-semibold text-white">
                                {alb.title}
                              </h3>
                              <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                                {alb.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {alb.photo_count || 0} items
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(alb)}
                                className="p-2 text-zinc-400 hover:text-[#C5A059] hover:bg-white/5 transition-colors border border-white/10 rounded-lg"
                                title="Edit album meta"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAlbum(alb.id)}
                                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors border border-white/10 rounded-lg"
                                title="Delete album"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CREATE/EDIT ALBUM MODAL SHEET */}
                    {(isCreateModalOpen || editingAlbum) && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 overflow-y-auto">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-w-xl glass-card p-8 rounded-2xl space-y-6"
                        >
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="font-serif text-xl font-semibold text-white">
                              {editingAlbum ? "Edit Collection" : "Create New Collection"}
                            </h3>
                            <button
                              onClick={() => {
                                setIsCreateModalOpen(false);
                                setEditingAlbum(null);
                                resetForm();
                              }}
                              className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 hover:text-white"
                            >
                              Close
                            </button>
                          </div>

                          <form onSubmit={editingAlbum ? handleEditAlbum : handleCreateAlbum} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Album Title *</label>
                                <input
                                  type="text"
                                  required
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Category</label>
                                <select
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value)}
                                  className="w-full rounded-full border border-white/10 bg-zinc-950 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] cursor-pointer"
                                >
                                  <option value="Portrait" className="bg-zinc-950 text-white">Portrait</option>
                                  <option value="Landscape" className="bg-zinc-950 text-white">Landscape</option>
                                  <option value="Editorial" className="bg-zinc-950 text-white">Editorial</option>
                                  <option value="Wedding" className="bg-zinc-950 text-white">Wedding</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Description</label>
                              <textarea
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                rows={3}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] resize-none leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Location</label>
                                <input
                                  type="text"
                                  value={newLocation}
                                  onChange={(e) => setNewLocation(e.target.value)}
                                  placeholder="e.g. Valencia, Spain"
                                  className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Event Date</label>
                                <input
                                  type="date"
                                  value={newEventDate}
                                  onChange={(e) => setNewEventDate(e.target.value)}
                                  className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] cursor-pointer"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Cover Image URL (optional)</label>
                              <input
                                type="url"
                                value={newCover}
                                onChange={(e) => setNewCover(e.target.value)}
                                placeholder="Leave blank to auto-use the first photo you upload"
                                className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] font-mono text-[10px]"
                              />
                            </div>

                            <div className="flex items-center gap-4 py-2 border-y border-white/5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newIsPrivate}
                                  onChange={(e) => setNewIsPrivate(e.target.checked)}
                                  className="h-4 w-4 rounded bg-transparent border-white/20 checked:bg-[#C5A059]"
                                />
                                <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-300">Set Private (Password Protection)</span>
                              </label>
                            </div>

                            {newIsPrivate && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-2"
                              >
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059]">Album Password passcode</label>
                                <input
                                  type="text"
                                  required={newIsPrivate}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="e.g. ClientName2026"
                                  className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] font-mono"
                                />
                              </motion.div>
                            )}

                            <button
                              type="submit"
                              className="w-full bg-[#C5A059] text-black py-3.5 rounded-full text-[10px] font-semibold tracking-widest uppercase hover:bg-[#b08d4b] transition-all mt-4"
                            >
                              {editingAlbum ? "Save Album Details" : "Create Album"}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. UPLOAD PHOTOS TAB */}
                {activeTab === "upload" && (
                  <motion.div
                    key="tab-upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl mx-auto space-y-8"
                  >
                    <div className="space-y-2 text-center md:text-left">
                      <h2 className="text-xl font-serif text-white">
                        Upload Photos to Cloud Storage
                      </h2>
                      <p className="text-xs text-zinc-400 font-light leading-relaxed">
                        Securely upload your photographs directly to your Cloudinary storage repository. They will be auto-optimized and registered to the chosen portfolio album in real time.
                      </p>
                    </div>

                    {/* Album Selection Dropdown */}
                    <div className="space-y-4 bg-black/40 border border-white/5 p-6 rounded-2xl">
                      <label className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold">
                        Target Portfolio Album / Collection
                      </label>
                      <select
                        value={selectedUploadAlbumId}
                        onChange={(e) => setSelectedUploadAlbumId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white outline-none focus:border-[#C5A059] cursor-pointer"
                      >
                        <option value="" disabled>-- Select Album --</option>
                        {albums.map((album) => (
                          <option key={album.id} value={album.id}>
                            {album.title} ({album.category})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-500 font-light italic">
                        Selected album will receive these photo uploads instantly.
                      </p>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
                        isDragging
                          ? "border-[#C5A059] bg-[#C5A059]/5 scale-[0.99]"
                          : "border-white/10 bg-black/40"
                      }`}
                    >
                      <UploadCloud className="h-12 w-12 text-[#C5A059] mx-auto mb-4" />
                      <h3 className="text-xs tracking-widest uppercase font-mono font-semibold text-white">Drag & Drop Media Files</h3>
                      <p className="text-[10px] text-zinc-500 mt-1 font-light uppercase tracking-wider">Supporting JPEG, PNG, HEIC up to 50MB per photo.</p>
                      
                      <div className="mt-6">
                        <label className="px-6 py-2.5 bg-white/5 hover:bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-full text-[10px] font-semibold tracking-widest uppercase cursor-pointer transition-all duration-200">
                          Select Manually
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []) as File[];
                              if (files.length > 0) {
                                files.forEach(file => {
                                  uploadFileToCloudinary(file);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* List of Cloudinary Uploads */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3 pt-4 glass-card p-6 rounded-2xl">
                        <h3 className="text-[10px] font-mono tracking-widest uppercase text-[#C5A059] font-semibold mb-4">Cloudinary Upload Queue ({uploadedFiles.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {uploadedFiles.map((f, i) => (
                            <div key={f.id || i} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-white/5">
                              <div className="space-y-0.5 max-w-[65%]">
                                <p className="text-xs font-medium truncate text-white">{f.name}</p>
                                <p className="text-[10px] font-mono text-zinc-500">{f.size}</p>
                                {f.error && (
                                  <p className="text-[10px] text-rose-400 font-sans mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    {f.error}
                                  </p>
                                )}
                              </div>
                              
                              {f.status === "uploading" && (
                                <span className="text-[9px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider animate-pulse">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Uploading
                                </span>
                              )}

                              {f.status === "success" && (
                                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider">
                                  <Check className="h-3 w-3" />
                                  Completed
                                </span>
                              )}

                              {f.status === "error" && (
                                <span className="text-[9px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono uppercase tracking-wider">
                                  <AlertCircle className="h-3 w-3" />
                                  Failed
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos already in the selected album — manage cover image / remove */}
                    {selectedUploadAlbumId && (
                      <div className="space-y-3 pt-4 glass-card p-6 rounded-2xl">
                        {(() => {
                          const albumPhotos = photos.filter(p => p.album_id === selectedUploadAlbumId);
                          const currentAlbum = albums.find(a => a.id === selectedUploadAlbumId);
                          return (
                            <>
                              <h3 className="text-[10px] font-mono tracking-widest uppercase text-[#C5A059] font-semibold">
                                Photos in this Album ({albumPhotos.length})
                              </h3>
                              {albumPhotos.length === 0 ? (
                                <p className="text-[11px] text-zinc-500 font-light italic">No photos uploaded to this album yet.</p>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {albumPhotos.map((photo) => {
                                    const isCover = currentAlbum?.cover_image === photo.url;
                                    return (
                                      <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
                                        <img
                                          src={photo.thumbnail_url || photo.url}
                                          alt={photo.filename}
                                          className="h-full w-full object-cover"
                                        />
                                        {isCover && (
                                          <span className="absolute top-1.5 left-1.5 bg-[#C5A059] text-black text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            Cover
                                          </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                          {!isCover && (
                                            <button
                                              type="button"
                                              onClick={() => handleSetAlbumCover(selectedUploadAlbumId, photo.url)}
                                              className="w-full text-[8px] font-bold uppercase tracking-wider bg-white/10 hover:bg-[#C5A059] hover:text-black text-white px-2 py-1.5 rounded-full transition-colors"
                                            >
                                              Set as Cover
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeletePhoto(photo)}
                                            className="w-full text-[8px] font-bold uppercase tracking-wider bg-white/10 hover:bg-rose-600 text-white px-2 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. SETTINGS TAB */}
                {activeTab === "settings" && (
                  <motion.div
                    key="tab-settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl mx-auto"
                  >
                    <form onSubmit={handleUpdateSettings} className="glass-card p-8 rounded-2xl space-y-6">
                      <div className="space-y-1 border-b border-white/5 pb-4">
                        <h2 className="text-xl font-serif text-white">Studio Profile Settings</h2>
                        <p className="text-xs text-zinc-400 font-light">Modify core metadata, contact listings, and other global configurations.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Studio Name</label>
                          <input
                            type="text"
                            value={settings.studio_name}
                            onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Tagline Subtitle</label>
                          <input
                            type="text"
                            value={settings.subtitle}
                            onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Studio Description</label>
                        <textarea
                          value={settings.description}
                          onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                          rows={4}
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] resize-none leading-relaxed"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div>
                          <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Inquiry Email</label>
                          <input
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Inquiry Phone</label>
                          <input
                            type="text"
                            value={settings.contact_phone}
                            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-semibold">Instagram URL</label>
                        <input
                          type="url"
                          value={settings.instagram_url}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                          className="w-full rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] font-mono text-[10px]"
                        />
                      </div>

                      {/* Automated Watermarking Section */}
                      <div className="pt-6 border-t border-white/5 space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Automated Watermarking</h3>
                          <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                            Automatically overlay your studio logo on all client album uploads.
                          </p>
                        </div>

                        {/* Enable Checkbox */}
                        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-xl">
                          <label className="flex items-center gap-3 cursor-pointer w-full select-none">
                            <input
                              type="checkbox"
                              checked={settings.watermark_enabled ?? false}
                              onChange={(e) => setSettings({ ...settings, watermark_enabled: e.target.checked })}
                              className="h-4.5 w-4.5 rounded bg-transparent border-white/20 checked:bg-[#C5A059]"
                            />
                            <div>
                              <span className="text-xs font-semibold tracking-wider text-zinc-100 block">Enable Automated Watermark Overlay</span>
                              <span className="text-[10px] text-zinc-500 font-light block">Applies overlay instantly to any new uploads</span>
                            </div>
                          </label>
                        </div>

                        {settings.watermark_enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-5 bg-black/20 p-5 rounded-2xl border border-white/5"
                          >
                            {/* Watermark Logo URL & Background Removal Option */}
                            <div className="space-y-3">
                              <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold">Watermark Logo Source (URL)</label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={settings.watermark_image_url || ""}
                                  onChange={(e) => setSettings({ ...settings, watermark_image_url: e.target.value })}
                                  placeholder="e.g. /src/assets/images/estil_logo_1783729987545.jpg"
                                  className="flex-1 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs outline-none text-white focus:border-[#C5A059] font-mono text-[10px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSettings({ 
                                    ...settings, 
                                    watermark_image_url: "/src/assets/images/estil_logo_1783729987545.jpg" 
                                  })}
                                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-full text-[9px] tracking-wider uppercase font-bold transition-all whitespace-nowrap"
                                >
                                  Reset Default ESTIL Logo
                                </button>
                              </div>
                              
                              {/* Background removal toggle */}
                              <label className="flex items-center gap-2.5 cursor-pointer pt-1 select-none">
                                <input
                                  type="checkbox"
                                  checked={settings.watermark_remove_white_bg ?? false}
                                  onChange={(e) => setSettings({ ...settings, watermark_remove_white_bg: e.target.checked })}
                                  className="h-4 w-4 rounded bg-transparent border-white/20 checked:bg-[#C5A059]"
                                />
                                <span className="text-[10px] font-medium tracking-wide text-zinc-300">
                                  Smart Background Removal (Removes solid white backgrounds programmatically using Canvas scanning)
                                </span>
                              </label>
                            </div>

                            {/* Position, Opacity, and Scale */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold mb-2">Watermark Position</label>
                                <select
                                  value={settings.watermark_position || "bottom-right"}
                                  onChange={(e) => setSettings({ ...settings, watermark_position: e.target.value as any })}
                                  className="w-full bg-zinc-950 border border-white/10 rounded-full px-5 py-3 text-xs text-white outline-none focus:border-[#C5A059] cursor-pointer"
                                >
                                  <option value="top-left">Top Left</option>
                                  <option value="top-right">Top Right</option>
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="bottom-right">Bottom Right</option>
                                  <option value="center">Center</option>
                                </select>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold">Opacity</label>
                                    <span className="text-[10px] font-mono text-zinc-400">{Math.round((settings.watermark_opacity ?? 0.7) * 100)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={settings.watermark_opacity ?? 0.7}
                                    onChange={(e) => setSettings({ ...settings, watermark_opacity: parseFloat(e.target.value) })}
                                    className="w-full accent-[#C5A059] cursor-ew-resize bg-zinc-800 h-1.5 rounded-lg"
                                  />
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold">Size Scale</label>
                                    <span className="text-[10px] font-mono text-zinc-400">{settings.watermark_scale ?? 20}% of width</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="1"
                                    value={settings.watermark_scale ?? 20}
                                    onChange={(e) => setSettings({ ...settings, watermark_scale: parseInt(e.target.value) })}
                                    className="w-full accent-[#C5A059] cursor-ew-resize bg-zinc-800 h-1.5 rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Live Interactive Watermark Placement Mock */}
                            <div className="pt-2">
                              <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059] font-bold mb-2">Live Alignment Preview</label>
                              <div className="relative aspect-video rounded-xl bg-zinc-950/60 border border-white/10 flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-mono text-zinc-600 select-none uppercase tracking-widest">Active Canvas Preview</span>
                                
                                {/* Simulated Watermark Badge placement */}
                                <div
                                  className={`absolute m-3 px-2 py-1 rounded bg-black/40 border border-white/10 flex items-center gap-1.5 transition-all duration-300 pointer-events-none`}
                                  style={{
                                    opacity: settings.watermark_opacity ?? 0.7,
                                    transform: `scale(${(settings.watermark_scale ?? 20) / 20})`,
                                    ...(() => {
                                      const pos = settings.watermark_position || "bottom-right";
                                      switch (pos) {
                                        case "top-left": return { top: 0, left: 0 };
                                        case "top-right": return { top: 0, right: 0 };
                                        case "bottom-left": return { bottom: 0, left: 0 };
                                        case "bottom-right": return { bottom: 0, right: 0 };
                                        case "center": return { top: "50%", left: "50%", transform: `translate(-50%, -50%) scale(${(settings.watermark_scale ?? 20) / 20})` };
                                      }
                                    })()
                                  }}
                                >
                                  <div className="h-3.5 w-3.5 rounded-full border border-red-500 bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                  </div>
                                  <span className="text-[8px] font-mono tracking-wider font-bold text-zinc-100 uppercase">ESTIL LOGO WATERMARK</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#C5A059] text-black py-3.5 rounded-full text-[10px] font-semibold tracking-widest uppercase hover:bg-[#b08d4b] transition-all mt-4"
                      >
                        Save Studio Config
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 3. PHOTOBOOK ORDERS TAB */}
                {activeTab === "orders" && (
                  <motion.div
                    key="tab-orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#C5A059]" />
                          Photobook Verification Desk
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">
                          Approve, manage, and verify client bank transfer receipts for premium book compilations
                        </p>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-mono font-bold uppercase">
                        {orders.length} TOTAL RECORDS
                      </span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-20 bg-zinc-50 border border-zinc-100 rounded-3xl space-y-4 max-w-xl mx-auto">
                        <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto border border-zinc-200">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-800">No Orders logged</h4>
                          <p className="text-[11px] text-zinc-400 font-light">
                            When client portfolios request custom hardcovers or watermark-free HD digital books, their transfer requests will show up here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map((order) => (
                          <div 
                            key={order.id}
                            className={`border rounded-3xl p-6 bg-white shadow-sm flex flex-col lg:flex-row gap-6 justify-between transition-all ${
                              order.status === "pending" 
                                ? "border-amber-400 bg-amber-500/[0.01]" 
                                : order.status === "verified" 
                                  ? "border-emerald-500/40 bg-emerald-500/[0.005]" 
                                  : "border-zinc-200"
                            }`}
                          >
                            {/* Left part: Details */}
                            <div className="flex-grow space-y-4">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="px-3 py-1 bg-zinc-900 text-white rounded-full text-[9px] font-mono font-black uppercase">
                                  {order.id}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-wider font-mono ${
                                  order.status === "pending" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : order.status === "verified" 
                                      ? "bg-emerald-100 text-emerald-800" 
                                      : order.status === "completed" 
                                        ? "bg-blue-100 text-blue-800" 
                                        : "bg-zinc-100 text-zinc-500"
                                }`}>
                                  {order.status === "pending" && "Pending Bank Verification"}
                                  {order.status === "verified" && "Verified & Unlocked"}
                                  {order.status === "completed" && "Completed & Emailed"}
                                  {order.status === "cancelled" && "Cancelled"}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                {/* Client card */}
                                <div className="space-y-1">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">Client Identity</span>
                                  <div className="text-xs space-y-0.5">
                                    <strong className="text-zinc-900 font-bold uppercase">{order.client_name}</strong>
                                    <p className="text-zinc-500 font-mono font-light">{order.client_email}</p>
                                    {order.delivery_phone && <p className="text-zinc-500 font-mono">{order.delivery_phone}</p>}
                                  </div>
                                </div>

                                {/* Customization detail card */}
                                <div className="space-y-1">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">Photobook Configuration</span>
                                  <div className="text-xs space-y-0.5">
                                    <p className="text-zinc-900 font-bold uppercase">"{order.cover_title}"</p>
                                    <p className="text-zinc-500 font-light">{order.cover_subtitle}</p>
                                    <p className="text-zinc-500 font-bold uppercase text-[9px]">
                                      {order.layout_style} Style ({order.book_size}) • {order.photo_ids.length} Photos
                                    </p>
                                  </div>
                                </div>

                                {/* Payment card */}
                                <div className="space-y-1">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">Bank Invoice Transfer</span>
                                  <div className="text-xs space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <CreditCard className="h-3 w-3 text-[#C5A059]" />
                                      <strong className="text-zinc-900 text-[13px] font-black">
                                        {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(order.total_price)}
                                      </strong>
                                    </div>
                                    <p className="text-zinc-600 font-medium">Sender: <span className="font-bold uppercase text-zinc-800">{order.payment_sender_name}</span></p>
                                    <p className="text-zinc-500 font-mono uppercase text-[9px]">REF: <strong>{order.payment_reference}</strong></p>
                                  </div>
                                </div>
                              </div>

                              {order.delivery_address && (
                                <div className="p-3 bg-zinc-50 rounded-xl text-xs space-y-1 border border-zinc-100">
                                  <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">Mailing / Delivery Address</span>
                                  <p className="text-zinc-800 font-medium">{order.delivery_address}</p>
                                </div>
                              )}
                            </div>

                            {/* Right part: Receipt / screenshot & Actions */}
                            <div className="w-full lg:w-48 shrink-0 flex flex-col justify-between items-stretch border-t lg:border-t-0 lg:border-l border-zinc-100 pt-4 lg:pt-0 lg:pl-6 gap-4">
                              {/* Thumbnail preview */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">Transfer Receipt Attachment</span>
                                {order.payment_receipt_url ? (
                                  <div 
                                    onClick={() => setViewingReceiptUrl(order.payment_receipt_url || null)}
                                    className="relative aspect-video rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 cursor-zoom-in group shadow-sm hover:border-[#C5A059]"
                                  >
                                    <img src={order.payment_receipt_url} alt="Receipt" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold uppercase tracking-wider">
                                      View Receipt
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-zinc-50 text-center rounded-xl border border-dashed border-zinc-200 text-[10px] text-zinc-400 font-light flex items-center justify-center h-14">
                                    No file uploaded
                                  </div>
                                )}
                              </div>

                              {/* Action controls */}
                              <div className="flex flex-col gap-1.5 pt-2">
                                {order.status === "pending" && (
                                  <button
                                    onClick={() => {
                                      const updatedOrder = { ...order, status: "verified" as const };
                                      const updated = orders.map((o) => o.id === order.id ? updatedOrder : o);
                                      setOrders(updated);
                                      localStorage.setItem("studio_photobook_orders", JSON.stringify(updated));
                                      saveOrderToCloud(updatedOrder);
                                    }}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                    Approve & Unlock
                                  </button>
                                )}

                                {order.status === "verified" && (
                                  <button
                                    onClick={() => {
                                      const updatedOrder = { ...order, status: "completed" as const };
                                      const updated = orders.map((o) => o.id === order.id ? updatedOrder : o);
                                      setOrders(updated);
                                      localStorage.setItem("studio_photobook_orders", JSON.stringify(updated));
                                      saveOrderToCloud(updatedOrder);
                                    }}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Mark Completed
                                  </button>
                                )}

                                {order.status !== "cancelled" && order.status !== "completed" && (
                                  <button
                                    onClick={() => {
                                      setDeleteConfirmTarget({
                                        type: "order_cancel",
                                        id: order.id,
                                        title: order.cover_title || `Order ${order.id}`
                                      });
                                    }}
                                    className="w-full py-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-transparent hover:border-rose-200 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                )}

                                {/* Delete order completely */}
                                <button
                                  onClick={() => {
                                    setDeleteConfirmTarget({
                                      type: "order_delete",
                                      id: order.id,
                                      title: order.cover_title || `Order ${order.id}`
                                    });
                                  }}
                                  className="w-full py-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  Delete Record
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Receipt Lightbox view */}
                    {viewingReceiptUrl && (
                      <div 
                        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setViewingReceiptUrl(null)}
                      >
                        <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85vh]">
                          <button 
                            className="absolute -top-12 right-0 p-2 text-white hover:text-zinc-300 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                            onClick={() => setViewingReceiptUrl(null)}
                          >
                            <X className="h-5 w-5" />
                            Close
                          </button>
                          <div className="flex-grow overflow-auto flex items-center justify-center">
                            <img src={viewingReceiptUrl} alt="Bank Transfer Proof Screenshot" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 text-center pt-3 uppercase font-bold">Proof of Bank Payment Receipt Screenshot</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-955 border border-zinc-800 p-8 rounded-3xl space-y-6 text-center shadow-2xl"
              style={{ backgroundColor: "#121214" }}
            >
              <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle className="h-8 w-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                  {deleteConfirmTarget.type === "album" && "Delete Collection"}
                  {deleteConfirmTarget.type === "order_cancel" && "Cancel Photobook Order"}
                  {deleteConfirmTarget.type === "order_delete" && "Delete Order Record"}
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {deleteConfirmTarget.type === "album" && (
                    <>Are you sure you want to delete <strong className="text-zinc-200 uppercase font-bold">"{deleteConfirmTarget.title}"</strong> and all its associated metadata? This action is permanent.</>
                  )}
                  {deleteConfirmTarget.type === "order_cancel" && (
                    <>Are you sure you want to cancel the photobook order for <strong className="text-zinc-200 uppercase font-bold">"{deleteConfirmTarget.title}"</strong>?</>
                  )}
                  {deleteConfirmTarget.type === "order_delete" && (
                    <>Are you sure you want to permanently delete the order record for <strong className="text-zinc-200 uppercase font-bold">"{deleteConfirmTarget.title}"</strong> from the logs?</>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors cursor-pointer"
                >
                  No, Keep It
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors cursor-pointer shadow-lg shadow-rose-900/20"
                >
                  Yes, Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
