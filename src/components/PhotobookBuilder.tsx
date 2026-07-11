import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Download, Check, Loader2, ChevronLeft, 
  ChevronRight, CreditCard, ArrowRight, Lock, Upload, X, 
  FileText, CheckCircle, MapPin, Phone, Mail, User, Info, AlertCircle
} from "lucide-react";
import { Album, Photo, PhotobookOrder } from "../types";
import { jsPDF } from "jspdf";
import { saveOrderToCloud } from "../dbSync";

interface PhotobookBuilderProps {
  album: Album;
  photos: Photo[];
  onClose: () => void;
}

export default function PhotobookBuilder({ album, photos, onClose }: PhotobookBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([...photos]);
  
  // Customization Options
  const [coverTitle, setCoverTitle] = useState(album.title.toUpperCase());
  const [coverSubtitle, setCoverSubtitle] = useState("A PREMIUM COMMEMORATIVE COLLECTION");
  const [layoutStyle, setLayoutStyle] = useState<"editorial" | "noir" | "warm">("editorial");
  const [bookSize, setBookSize] = useState<string>("Square 8x8 (Standard)");
  
  // Package Selection
  const [selectedPackage, setSelectedPackage] = useState<"digital" | "hardcover">("digital");
  const [clientName, setClientName] = useState(() => {
    const saved = localStorage.getItem("studio_client_identity");
    return saved ? JSON.parse(saved).name : "";
  });
  const [clientEmail, setClientEmail] = useState(() => {
    const saved = localStorage.getItem("studio_client_identity");
    return saved ? JSON.parse(saved).email || "" : "";
  });
  const [clientPhone, setClientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  
  // Bank Payment Details
  const [senderName, setSenderName] = useState("");
  const [referenceCode] = useState(() => `EST-PB-${Math.floor(100000 + Math.random() * 900000)}`);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Book Preview Flip-through States
  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1...N = Inner pages, N+1 = Back cover
  
  // PDF Generation States
  const [pdfProgress, setPdfProgress] = useState<number>(-1); // -1 = idle, 0...100 = progress
  const [pdfStatusText, setPdfStatusText] = useState("");
  
  // Submitted Order State
  const [submittedOrder, setSubmittedOrder] = useState<PhotobookOrder | null>(null);

  // Drag and Drop files for Proof of Payment
  const [dragActive, setDragActive] = useState(false);

  // pricing
  const prices = {
    digital: 10000, // ₦10,000
    hardcover: 25000 // ₦25,000
  };

  const currentPrice = prices[selectedPackage];

  // Load photos to make sure order is maintained
  useEffect(() => {
    setSelectedPhotos([...photos].sort((a, b) => a.order - b.order));
  }, [photos]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processReceiptFile = (file: File) => {
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processReceiptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processReceiptFile(e.target.files[0]);
    }
  };

  // Reorder photos helpers
  const movePhoto = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === selectedPhotos.length - 1) return;

    const targetIndex = direction === "left" ? index - 1 : index + 1;
    const list = [...selectedPhotos];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setSelectedPhotos(list);
  };

  const removePhotoFromBook = (id: string) => {
    setSelectedPhotos(selectedPhotos.filter(p => p.id !== id));
  };

  // Generate Base64 from Proxy Image URL helper
  const getProxyBase64 = async (url: string): Promise<string> => {
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Proxy error");
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Failed to load image via proxy, attempting direct fetch: ", url);
      // Fallback to direct fetch (might trigger CORS on some servers, but good as fallback)
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (directErr) {
        throw new Error("Could not fetch image asset base64");
      }
    }
  };

  // Generate the actual PDF client side using jsPDF!
  const generatePDF = async (watermarked: boolean = true) => {
    setPdfProgress(0);
    setPdfStatusText("Starting PDF compiler...");
    
    try {
      // jsPDF instance
      // Using 'p' for portrait, 'pt' for points, 'a4' format (595.28 x 841.89 points)
      // For square books, let's make a custom page size (600 x 600 points)
      let width = 595;
      let height = 595;
      let orientation: "p" | "l" = "p";

      if (bookSize.toLowerCase().includes("portrait")) {
        width = 595;
        height = 842;
        orientation = "p";
      } else if (bookSize.toLowerCase().includes("landscape")) {
        width = 842;
        height = 595;
        orientation = "l";
      }

      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: [width, height],
        compress: true
      });

      // Styling parameters based on theme
      const themeColors = {
        editorial: { bg: [249, 246, 240], text: [15, 23, 42], border: [20, 20, 20] }, // Warm paper / dark text
        noir: { bg: [18, 18, 18], text: [244, 244, 245], border: [197, 160, 89] }, // Dark charcoal / gold border
        warm: { bg: [249, 242, 233], bgReal: [248, 244, 236], text: [88, 71, 59], border: [203, 189, 172] }
      };

      const style = layoutStyle === "noir" ? themeColors.noir : layoutStyle === "warm" ? themeColors.warm : themeColors.editorial;

      // Draw Cover Page
      setPdfStatusText("Compiling Cover Page...");
      pdf.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      pdf.rect(0, 0, width, height, "F");

      // Double-border style for cover
      if (layoutStyle === "editorial") {
        pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
        pdf.setLineWidth(1.5);
        pdf.rect(20, 20, width - 40, height - 40, "S");
        pdf.rect(24, 24, width - 48, height - 48, "S");
      } else if (layoutStyle === "noir") {
        pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
        pdf.setLineWidth(1);
        pdf.rect(25, 25, width - 50, height - 50, "S");
      }

      // Cover Texts
      pdf.setTextColor(style.text[0], style.text[1], style.text[2]);
      
      // Studio Name Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("ESTIL STUDIO", width / 2, 50, { align: "center" });

      // Title
      pdf.setFont("times", "bold");
      pdf.setFontSize(26);
      pdf.text(coverTitle, width / 2, height * 0.28, { align: "center" });

      // Subtitle
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.text(coverSubtitle, width / 2, height * 0.33, { align: "center" });

      // Load Cover Image
      if (selectedPhotos.length > 0) {
        try {
          const coverBase64 = await getProxyBase64(selectedPhotos[0].url);
          
          // Image size in PDF cover (e.g. 45% height)
          const imgW = width * 0.65;
          const imgH = height * 0.38;
          const imgX = (width - imgW) / 2;
          const imgY = height * 0.40;

          // Add image
          pdf.addImage(coverBase64, "JPEG", imgX, imgY, imgW, imgH, undefined, "MEDIUM");

          // Draw image border
          if (layoutStyle !== "warm") {
            pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
            pdf.setLineWidth(1.5);
            pdf.rect(imgX, imgY, imgW, imgH, "S");
          }
        } catch (coverErr) {
          console.warn("Could not load cover photo into PDF: ", coverErr);
        }
      }

      // Cover Footer
      pdf.setTextColor(style.text[0], style.text[1], style.text[2]);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("COMMEMORATIVE CLIENT MEMORY BOOK", width / 2, height - 45, { align: "center" });
      
      if (watermarked) {
        pdf.setTextColor(239, 68, 68);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("ESTIL WATERMARKED PREVIEW - NOT FOR PRINT", width / 2, height - 28, { align: "center" });
      }

      // Draw Inner Pages
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const progressPct = Math.round(((i + 1) / selectedPhotos.length) * 100);
        setPdfProgress(progressPct);
        setPdfStatusText(`Processing Photograph ${i + 1} of ${selectedPhotos.length}...`);

        pdf.addPage();
        
        // Fill page background
        pdf.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
        pdf.rect(0, 0, width, height, "F");

        // Photo Border
        if (layoutStyle === "editorial") {
          pdf.setDrawColor(180, 180, 180);
          pdf.setLineWidth(0.5);
          pdf.rect(30, 30, width - 60, height - 60, "S");
        }

        try {
          const photoBase64 = await getProxyBase64(photo.url);
          
          // Compute fitting bounds
          // Perfect margin calculation
          const maxW = width - 80;
          const maxH = height - 120;
          
          // Set standard landscape sizes, or handle aspect ratio
          let finalW = maxW;
          let finalH = maxW * (3/4); // standard default landscape 4:3
          
          if (photo.width && photo.height) {
            const aspect = photo.width / photo.height;
            if (aspect > 1) { // Landscape photo
              finalW = maxW;
              finalH = maxW / aspect;
              if (finalH > maxH) {
                finalH = maxH;
                finalW = maxH * aspect;
              }
            } else { // Portrait photo
              finalH = maxH;
              finalW = maxH * aspect;
              if (finalW > maxW) {
                finalW = maxW;
                finalH = maxW / aspect;
              }
            }
          }

          const photoX = (width - finalW) / 2;
          const photoY = (height - finalH) / 2 - 10;

          // Draw actual photo
          pdf.addImage(photoBase64, "JPEG", photoX, photoY, finalW, finalH, undefined, "MEDIUM");

          // Frame borders
          if (layoutStyle !== "warm") {
            pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
            pdf.setLineWidth(1);
            pdf.rect(photoX, photoY, finalW, finalH, "S");
          }

        } catch (imgLoadErr) {
          console.warn(`Could not load photo ${photo.filename} into PDF`, imgLoadErr);
          // Fallback box with text
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(40, 40, width - 80, height - 120, "S");
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.text(`[Photograph: ${photo.filename}]`, width / 2, height / 2, { align: "center" });
        }

        // Inner Page Footers
        pdf.setTextColor(style.text[0], style.text[1], style.text[2]);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(`${album.title.toUpperCase()}`, 40, height - 35);
        pdf.text(`PAGE ${i + 1}`, width - 40, height - 35, { align: "right" });

        // Watermark Overlay on EVERY PAGE
        if (watermarked) {
          pdf.saveGraphicsState();
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(36);
          pdf.setTextColor(200, 200, 200);
          // Apply diagonal watermark text
          pdf.text("ESTIL WATERMARK", width / 2, height / 2, { 
            align: "center", 
            angle: 45,
          });
          pdf.setFontSize(12);
          pdf.setTextColor(220, 100, 100);
          pdf.text("WATERMARKED PREVIEW", width / 2, height / 2 + 30, { 
            align: "center", 
            angle: 45,
          });
          pdf.restoreGraphicsState();
        }
      }

      // Add Back Cover
      setPdfStatusText("Creating Back Cover...");
      pdf.addPage();
      pdf.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      pdf.rect(0, 0, width, height, "F");

      if (layoutStyle === "editorial") {
        pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
        pdf.setLineWidth(1.5);
        pdf.rect(20, 20, width - 40, height - 40, "S");
      }

      pdf.setTextColor(style.text[0], style.text[1], style.text[2]);
      pdf.setFont("times", "italic");
      pdf.setFontSize(14);
      pdf.text("Thank you for choosing Estil Photography.", width / 2, height * 0.40, { align: "center" });
      pdf.text("May these captured moments live forever.", width / 2, height * 0.45, { align: "center" });

      // Back logo brand
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("E S T I L  S T U D I O", width / 2, height * 0.58, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("WWW.ESTILSTUDIOPHOTOGRAPHY.COM", width / 2, height * 0.62, { align: "center" });

      if (watermarked) {
        pdf.setTextColor(239, 68, 68);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("PREVIEW ONLY", width / 2, height - 50, { align: "center" });
      }

      // Save PDF
      setPdfStatusText("Downloading compiled PDF document...");
      const finalFileName = watermarked 
        ? `${album.title.toLowerCase().replace(/\s+/g, "_")}_photobook_PREVIEW.pdf`
        : `${album.title.toLowerCase().replace(/\s+/g, "_")}_photobook_HD.pdf`;
      
      pdf.save(finalFileName);
      setPdfProgress(-1);
      setPdfStatusText("");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setPdfStatusText(`Error: ${err.message || "Failed to generate PDF. Make sure all images are reachable."}`);
      setTimeout(() => {
        setPdfProgress(-1);
      }, 5000);
    }
  };

  // Submit secure bank transfer order!
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !clientEmail || !senderName) {
      alert("Please fill in all required client and transfer information.");
      return;
    }

    setIsUploading(true);

    const newOrder: PhotobookOrder = {
      id: `PB-${Date.now()}`,
      album_id: album.id,
      album_title: album.title,
      client_name: clientName,
      client_email: clientEmail,
      cover_title: coverTitle,
      cover_subtitle: coverSubtitle,
      layout_style: layoutStyle,
      book_size: bookSize,
      photo_ids: selectedPhotos.map(p => p.id),
      total_price: currentPrice,
      payment_method: "bank_transfer",
      payment_reference: referenceCode,
      payment_sender_name: senderName,
      payment_receipt_url: receiptBase64 || undefined,
      status: "pending",
      created_at: new Date().toISOString(),
      delivery_address: selectedPackage === "hardcover" ? deliveryAddress : undefined,
      delivery_phone: selectedPackage === "hardcover" ? clientPhone : undefined
    };

    // Save to shared localStorage database and Cloud
    const savedOrdersStr = localStorage.getItem("studio_photobook_orders");
    const existingOrders: PhotobookOrder[] = savedOrdersStr ? JSON.parse(savedOrdersStr) : [];
    
    // Add new order
    existingOrders.unshift(newOrder);
    localStorage.setItem("studio_photobook_orders", JSON.stringify(existingOrders));
    saveOrderToCloud(newOrder);

    // Also update this specific client order state
    setSubmittedOrder(newOrder);
    setIsUploading(false);
    setStep(5);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Outer Card */}
      <div 
        className="bg-white text-zinc-900 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
        style={{ minHeight: "80vh", maxHeight: "90vh" }}
        id="photobook-wizard-container"
      >
        {/* Left Side: Dynamic Side Header showcasing status */}
        <div className="w-full md:w-[32%] bg-zinc-950 p-6 md:p-8 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#C5A059] text-black">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono tracking-[0.25em] font-black uppercase text-[#C5A059]">ESTIL MEMORIES</span>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">Step {step} of 5</span>
              <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100">
                {step === 1 && "Design Cover"}
                {step === 2 && "Sort Pages"}
                {step === 3 && "Preview Book"}
                {step === 4 && "Secure Checkout"}
                {step === 5 && "Order Placed!"}
              </h2>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                {step === 1 && "Configure the visual layout, cover typography, and aesthetic style of your custom photobook."}
                {step === 2 && "Rearrange pages, shift image indices, and remove photos to craft a gorgeous linear story."}
                {step === 3 && "Flip through pages in your realistic leather-bound notebook mockup to review layouts before ordering."}
                {step === 4 && "Secure your premium HD order with a fast bank transfer and proof submission."}
                {step === 5 && "Your request has been filed! Check your order details or download a watermarked proof."}
              </p>
            </div>
          </div>

          {/* Stepper Progress bar */}
          <div className="space-y-4 pt-8 md:pt-0">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`h-1 flex-1 rounded transition-all duration-300 ${
                    step >= i ? "bg-[#C5A059]" : "bg-zinc-800"
                  }`} 
                />
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>{Math.round(((step - 1) / 4) * 100)}% COMPLETE</span>
              <span className="text-[#C5A059] font-bold">{selectedPhotos.length} PHOTOS SELECTED</span>
            </div>
          </div>
        </div>

        {/* Right Side: Step Content Area */}
        <div className="flex-grow flex flex-col justify-between overflow-hidden">
          {/* Header toolbar */}
          <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">Interactive Builder</span>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{album.title}</h3>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Core Content Screen */}
          <div className="flex-grow overflow-y-auto p-6 md:p-8" id="wizard-content-viewport">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 h-full"
              >
                {/* STEP 1: COVER CUSTOMIZATION */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Input Options */}
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Customize Cover Details</h4>
                          <p className="text-[11px] text-zinc-400">Personalize titles and visual branding of the photobook</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1.5">Book Cover Title</label>
                            <input 
                              type="text" 
                              value={coverTitle}
                              onChange={(e) => setCoverTitle(e.target.value.toUpperCase())}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-5 py-3 text-xs text-zinc-800 outline-none focus:border-zinc-950 font-bold uppercase"
                              placeholder="e.g. THE PERFECT WEDDING"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1.5">Sub-title caption</label>
                            <input 
                              type="text" 
                              value={coverSubtitle}
                              onChange={(e) => setCoverSubtitle(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-5 py-3 text-xs text-zinc-800 outline-none focus:border-zinc-950 text-zinc-600 font-medium"
                              placeholder="e.g. COMMEMORATIVE MEMORY ALBUM"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 space-y-4">
                          <div>
                            <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-2">Photobook Paper Style</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "editorial", name: "Classic Editorial", desc: "Warm Cream & Thin Borders" },
                                { id: "noir", name: "Modern Noir", desc: "Solid Dark Gold & Chic Sleekness" },
                                { id: "warm", name: "Cozy Beige", desc: "Warm Linen & Soft Frames" }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setLayoutStyle(opt.id as any)}
                                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                                    layoutStyle === opt.id 
                                      ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
                                      : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800"
                                  }`}
                                >
                                  <span className="text-[10px] font-bold tracking-wide uppercase leading-tight">{opt.name}</span>
                                  <span className={`text-[8px] mt-1.5 leading-tight ${layoutStyle === opt.id ? "text-zinc-400" : "text-zinc-500"}`}>{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-2">Physical Dimensions</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                "Square 8x8 (Standard)",
                                "Portrait A4 (Editorial)",
                                "Landscape A4 (Panoramic)"
                              ].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setBookSize(size)}
                                  className={`p-3 rounded-xl border text-[10px] font-bold tracking-wider uppercase text-center transition-all cursor-pointer ${
                                    bookSize === size 
                                      ? "border-zinc-950 bg-zinc-100 text-zinc-950"
                                      : "border-zinc-150 bg-white text-zinc-500 hover:border-zinc-200 hover:text-zinc-800"
                                  }`}
                                >
                                  {size.replace(" (Standard)", "").replace(" (Editorial)", "").replace(" (Panoramic)", "")}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Realistic Layout Preview */}
                      <div className="bg-zinc-100 rounded-3xl p-6 flex flex-col items-center justify-center border border-zinc-200 relative overflow-hidden">
                        <span className="absolute top-4 left-4 text-[8px] font-mono tracking-widest text-zinc-400 uppercase">Cover Mockup Preview</span>
                        
                        {/* Simulated Cover Book */}
                        <div 
                          className={`w-[260px] aspect-[1/1] shadow-xl rounded-lg p-5 flex flex-col justify-between border-r-4 transition-all duration-300 ${
                            layoutStyle === "noir" 
                              ? "bg-zinc-900 border-[#C5A059] text-zinc-100" 
                              : layoutStyle === "warm" 
                                ? "bg-[#F9F5EE] border-[#CBD5E1] text-[#5C4D3C]" 
                                : "bg-[#FCFAF7] border-zinc-300 text-zinc-900"
                          }`}
                        >
                          <div className="text-center space-y-1">
                            <span className="text-[7px] tracking-[0.35em] font-mono font-black uppercase opacity-60">ESTIL COMPILATION</span>
                            <h5 className="text-sm font-black uppercase tracking-wider line-clamp-2 mt-2" style={{ fontFamily: "serif" }}>
                              {coverTitle || "UNTITLED COLLECTION"}
                            </h5>
                            <p className="text-[7px] font-mono tracking-widest italic opacity-75 uppercase line-clamp-1">
                              {coverSubtitle || "COMMEMORATIVE CLIENT BOOK"}
                            </p>
                          </div>

                          {/* Cover photo slot */}
                          <div className="flex-grow my-4 bg-zinc-200 rounded overflow-hidden relative border border-black/5 aspect-[3/2]">
                            {selectedPhotos.length > 0 ? (
                              <img 
                                src={selectedPhotos[0].url} 
                                alt="Cover Mock" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-zinc-400" />
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <span className="text-[7px] font-mono tracking-widest opacity-60">ESTIL STUDIO & PHOTOGRAPHY © 2026</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PAGE REORDERING & SORTING */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Story Page Re-indexer</h4>
                      <p className="text-[11px] text-zinc-400">Drag or click to re-arrange pages. The cover image will automatically be the first photo in this order.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-1 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                      {selectedPhotos.map((photo, index) => (
                        <div 
                          key={photo.id}
                          className={`relative group bg-white border border-zinc-200 rounded-xl overflow-hidden p-2 flex flex-col justify-between shadow-sm hover:shadow transition-all duration-200`}
                        >
                          {/* Image container */}
                          <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden relative">
                            <img src={photo.url} alt="Sorter" className="w-full h-full object-cover" />
                            
                            {/* Page index badge */}
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[8px] font-mono text-white font-bold">
                              {index === 0 ? "COVER / PG 1" : `PAGE ${index + 1}`}
                            </span>

                            {/* Exclude photo button */}
                            <button
                              type="button"
                              onClick={() => removePhotoFromBook(photo.id)}
                              className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-opacity cursor-pointer shadow"
                              title="Exclude photo from book"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Controls Row */}
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-100">
                            <button
                              type="button"
                              onClick={() => movePhoto(index, "left")}
                              disabled={index === 0}
                              className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            
                            <span className="text-[8px] font-mono text-zinc-400 uppercase font-black tracking-widest">ORDER: {index}</span>

                            <button
                              type="button"
                              onClick={() => movePhoto(index, "right")}
                              disabled={index === selectedPhotos.length - 1}
                              className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: FLIP-THROUGH BOOK SPREAD PREVIEW */}
                {step === 3 && (
                  <div className="space-y-6 flex flex-col items-center justify-center">
                    <div className="space-y-1 text-center w-full">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Album Page-Spread Preview</h4>
                      <p className="text-[11px] text-zinc-400">Experience a realistic representation of your physical book spread layouts</p>
                    </div>

                    {/* Book Mockup Platform */}
                    <div className="w-full max-w-3xl aspect-[1.8/1] bg-zinc-100 border border-zinc-200 rounded-3xl p-6 flex flex-col justify-between items-center relative overflow-hidden shadow-inner">
                      {/* Left and Right Spreads inside physical binder */}
                      <div className="w-full flex flex-col sm:flex-row gap-0.5 bg-zinc-200 p-2.5 rounded-2xl shadow-lg border border-zinc-300 max-w-2xl flex-grow overflow-hidden relative">
                        {/* Leather Seam Center Spine */}
                        <div className="hidden sm:block absolute top-0 bottom-0 left-1/2 -ml-1 w-2.5 bg-gradient-to-r from-zinc-700 via-zinc-900 to-zinc-700 shadow z-20 opacity-90 rounded" />

                        {currentPage === 0 ? (
                          /* Render Front Cover spread (Center layout single sheet) */
                          <div 
                            className={`w-full flex items-center justify-center transition-all duration-300 ${
                              layoutStyle === "noir" 
                                ? "bg-zinc-900 text-zinc-100" 
                                : layoutStyle === "warm" 
                                  ? "bg-[#F9F5EE] text-[#5C4D3C]" 
                                  : "bg-[#FCFAF7] text-zinc-900"
                            }`}
                          >
                            <div className="max-w-md text-center p-8 space-y-3">
                              <span className="text-[7px] tracking-[0.4em] font-mono font-black opacity-50 uppercase">ESTIL STUDIO COMPILATION</span>
                              <h5 className="text-lg font-black uppercase tracking-wider" style={{ fontFamily: "serif" }}>{coverTitle}</h5>
                              <p className="text-[8px] font-mono tracking-widest uppercase opacity-75 mb-4">{coverSubtitle}</p>
                              
                              <div className="w-[180px] aspect-[4/3] rounded overflow-hidden mx-auto shadow border border-black/5 bg-zinc-200">
                                {selectedPhotos.length > 0 && <img src={selectedPhotos[0].url} alt="Cover" className="w-full h-full object-cover" />}
                              </div>
                              
                              <span className="text-[7px] font-mono tracking-widest opacity-60 block pt-4">PAGE 1 / COVER</span>
                            </div>
                          </div>
                        ) : currentPage > selectedPhotos.length ? (
                          /* Render Back Cover spread */
                          <div 
                            className={`w-full flex items-center justify-center transition-all duration-300 ${
                              layoutStyle === "noir" 
                                ? "bg-zinc-900 text-zinc-100" 
                                : layoutStyle === "warm" 
                                  ? "bg-[#F9F5EE] text-[#5C4D3C]" 
                                  : "bg-[#FCFAF7] text-zinc-900"
                            }`}
                          >
                            <div className="text-center p-8 space-y-4">
                              <span className="text-[8px] tracking-[0.4em] font-mono font-black opacity-50 uppercase">THE END</span>
                              <h5 className="text-md font-bold tracking-widest uppercase italic text-[#C5A059]" style={{ fontFamily: "serif" }}>Thank You</h5>
                              <p className="text-[9px] font-mono tracking-wider max-w-sm leading-relaxed opacity-75">
                                Crafted proudly with ESTIL Studio Photography services. Every moment preserved elegantly.
                              </p>
                              <span className="text-[7px] font-mono tracking-widest opacity-60 block pt-8">BACK COVER</span>
                            </div>
                          </div>
                        ) : (
                          /* Render Side-By-Side Pages */
                          <>
                            {/* Left Page (Odd Page or Photo detail) */}
                            <div 
                              className={`flex-1 flex flex-col justify-between p-4 relative transition-all duration-300 ${
                                layoutStyle === "noir" 
                                  ? "bg-zinc-900 text-zinc-100" 
                                  : layoutStyle === "warm" 
                                    ? "bg-[#F9F5EE] text-[#5C4D3C]" 
                                    : "bg-[#FCFAF7] text-zinc-900"
                              }`}
                            >
                              <span className="text-[7px] font-mono tracking-wider opacity-45">{album.title.toUpperCase()}</span>
                              
                              {/* Photo Slot */}
                              <div className="flex-grow flex items-center justify-center my-3 overflow-hidden">
                                <div className={`max-w-full max-h-[160px] overflow-hidden shadow-sm ${layoutStyle === "warm" ? "rounded-xl border-4 border-[#CBD5E1]" : "border border-zinc-200"}`}>
                                  <img 
                                    src={selectedPhotos[currentPage - 1].url} 
                                    alt="Left Spread Page" 
                                    className="object-contain max-h-[150px] w-auto h-auto"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[7px] font-mono tracking-wider opacity-60 mt-2">
                                <span>ESTIL MEMORIES</span>
                                <span>PAGE {currentPage}</span>
                              </div>
                            </div>

                            {/* Right Page (Next Page or Photo detail if exists, else Blank or Back Cover hint) */}
                            <div 
                              className={`flex-1 flex flex-col justify-between p-4 relative transition-all duration-300 ${
                                layoutStyle === "noir" 
                                  ? "bg-zinc-900 text-zinc-100" 
                                  : layoutStyle === "warm" 
                                    ? "bg-[#F9F5EE] text-[#5C4D3C]" 
                                    : "bg-[#FCFAF7] text-zinc-900"
                              }`}
                            >
                              {currentPage < selectedPhotos.length ? (
                                <>
                                  <span className="text-[7px] font-mono tracking-wider opacity-45 text-right">{album.title.toUpperCase()}</span>
                                  
                                  {/* Photo Slot */}
                                  <div className="flex-grow flex items-center justify-center my-3 overflow-hidden">
                                    <div className={`max-w-full max-h-[160px] overflow-hidden shadow-sm ${layoutStyle === "warm" ? "rounded-xl border-4 border-[#CBD5E1]" : "border border-zinc-200"}`}>
                                      <img 
                                        src={selectedPhotos[currentPage].url} 
                                        alt="Right Spread Page" 
                                        className="object-contain max-h-[150px] w-auto h-auto"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-[7px] font-mono tracking-wider opacity-60 mt-2">
                                    <span>PAGE {currentPage + 1}</span>
                                    <span>ESTIL MEMORIES</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                  <span className="text-[7px] font-mono tracking-widest opacity-45 uppercase">Blank Page / Next is Cover</span>
                                  <div className="h-20 w-20 border border-dashed border-zinc-300 rounded-full flex items-center justify-center mt-3 opacity-50">
                                    <BookOpen className="h-6 w-6 text-zinc-400" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Mockup Controller Buttons */}
                      <div className="flex items-center gap-4 mt-4 select-none">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 2))}
                          disabled={currentPage === 0}
                          className="px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 disabled:opacity-40 text-zinc-700 hover:text-zinc-950 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm cursor-pointer"
                        >
                          Prev Pages
                        </button>
                        
                        <span className="text-[9px] font-mono text-zinc-500 font-extrabold">
                          {currentPage === 0 
                            ? "FRONT COVER SPREAD" 
                            : currentPage > selectedPhotos.length 
                              ? "BACK COVER SPREAD" 
                              : `PAGES ${currentPage} - ${Math.min(currentPage + 1, selectedPhotos.length)} OF ${selectedPhotos.length}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.min(selectedPhotos.length + 1, prev + 2))}
                          disabled={currentPage > selectedPhotos.length}
                          className="px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 disabled:opacity-40 text-zinc-700 hover:text-zinc-950 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm cursor-pointer"
                        >
                          Next Pages
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: PREMIUM ORDER FORM & CHECKOUT */}
                {step === 4 && (
                  <form onSubmit={handleSubmitOrder} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Packages & Bank details */}
                      <div className="space-y-5 overflow-y-auto max-h-[55vh] pr-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Select Premium Tier</h4>
                          <p className="text-[11px] text-zinc-400">Unlock professional Clean print resolution & remove watermarks</p>
                        </div>

                        {/* Packages select */}
                        <div className="space-y-3">
                          <div 
                            onClick={() => setSelectedPackage("digital")}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                              selectedPackage === "digital" 
                                ? "border-[#C5A059] bg-[#C5A059]/5" 
                                : "border-zinc-200 hover:border-zinc-300 bg-white"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-800">Premium Digital HD Book</span>
                              <span className="text-[9px] text-zinc-400 block font-light leading-relaxed">
                                Get watermark-free ultra high-resolution printable PDF. Ideal for sharing digitally.
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-zinc-900 block">{formatCurrency(prices.digital)}</span>
                              <span className="text-[8px] text-[#C5A059] font-mono tracking-widest font-black uppercase">DIGITAL DOWNLOAD</span>
                            </div>
                          </div>

                          <div 
                            onClick={() => setSelectedPackage("hardcover")}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                              selectedPackage === "hardcover" 
                                ? "border-[#C5A059] bg-[#C5A059]/5" 
                                : "border-zinc-200 hover:border-zinc-300 bg-white"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-800">Hardcover Printed + Digital Package</span>
                              <span className="text-[9px] text-zinc-400 block font-light leading-relaxed">
                                Beautiful premium bound landscape/square hardcover print book shipped to you + HD PDF download.
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-zinc-900 block">{formatCurrency(prices.hardcover)}</span>
                              <span className="text-[8px] text-zinc-400 font-mono tracking-widest font-bold block uppercase mt-0.5">PRINT + POSTAGE</span>
                            </div>
                          </div>
                        </div>

                        {/* Bank Invoice Details */}
                        <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-white/5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-[#C5A059] tracking-widest uppercase font-bold">Fast Secure Bank Transfer</span>
                            <div className="flex gap-1">
                              <div className="h-2 w-2 rounded-full bg-[#C5A059] animate-pulse" />
                              <span className="text-[8px] text-zinc-400 font-mono">Awaiting proof</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Bank Name</span>
                              <strong className="text-zinc-200 font-bold uppercase tracking-wide">Zenith Bank PLC</strong>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Account Number</span>
                              <strong className="text-zinc-100 font-mono text-xs tracking-wider">1223940582</strong>
                            </div>
                            <div className="space-y-1 col-span-2">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Account Name</span>
                              <strong className="text-[#C5A059] font-bold uppercase tracking-wider text-[11px]">ESTIL STUDIO DIGITAL SERVICES LTD</strong>
                            </div>
                          </div>

                          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] text-zinc-400 block uppercase">Mandatory Transfer Reference</span>
                              <strong className="text-white font-mono text-xs tracking-wider">{referenceCode}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-zinc-400 block uppercase">Total Payable</span>
                              <strong className="text-[#C5A059] font-black text-sm">{formatCurrency(currentPrice)}</strong>
                            </div>
                          </div>

                          <p className="text-[9px] text-zinc-400 leading-normal font-light">
                            * Please input the reference <strong className="text-white font-mono">{referenceCode}</strong> in your banking app's description/narrative field so we can automatically auto-reconcile your order!
                          </p>
                        </div>
                      </div>

                      {/* Right: Client Proof Input Form */}
                      <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Client & Transfer details</h4>
                          <p className="text-[11px] text-zinc-400">File your order details to request immediate admin unlock</p>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Your Name *</label>
                              <div className="relative">
                                <User className="absolute left-3 top-3.5 h-3.5 w-3.5 text-zinc-400" />
                                <input 
                                  type="text" 
                                  required
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-3 text-[11px] text-zinc-800 outline-none focus:border-zinc-950 font-medium"
                                  placeholder="Full Name"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Your Email *</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-3.5 w-3.5 text-zinc-400" />
                                <input 
                                  type="email" 
                                  required
                                  value={clientEmail}
                                  onChange={(e) => setClientEmail(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-3 text-[11px] text-zinc-800 outline-none focus:border-zinc-950 font-medium"
                                  placeholder="name@email.com"
                                />
                              </div>
                            </div>
                          </div>

                          {selectedPackage === "hardcover" && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-3"
                            >
                              <div>
                                <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Delivery Contact Phone *</label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3.5 h-3.5 w-3.5 text-zinc-400" />
                                  <input 
                                    type="text" 
                                    required={selectedPackage === "hardcover"}
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-3 text-[11px] text-zinc-800 outline-none focus:border-zinc-950 font-medium"
                                    placeholder="e.g. +234 803 123 4567"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Shipping Delivery Address *</label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-3.5 h-3.5 w-3.5 text-zinc-400" />
                                  <textarea 
                                    required={selectedPackage === "hardcover"}
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    rows={2}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-9 pr-4 py-3 text-[11px] text-zinc-800 outline-none focus:border-zinc-950 font-medium resize-none"
                                    placeholder="Full home or office mailing physical address..."
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div className="pt-3 border-t border-zinc-100 space-y-3">
                            <div>
                              <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Bank Account Sender Name *</label>
                              <input 
                                type="text" 
                                required
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-5 py-3 text-[11px] text-zinc-800 outline-none focus:border-zinc-950 font-medium"
                                placeholder="Exact account holder name transfer was sent from"
                              />
                            </div>

                            {/* Drag and Drop file selector for receipt */}
                            <div>
                              <label className="block text-[8px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">Attach Transfer Receipt (Optional)</label>
                              <div 
                                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                                  dragActive 
                                    ? "border-[#C5A059] bg-[#C5A059]/5" 
                                    : receiptFile 
                                      ? "border-emerald-500 bg-emerald-500/5" 
                                      : "border-zinc-250 hover:border-zinc-300"
                                }`}
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById("receipt-uploader")?.click()}
                              >
                                <input 
                                  id="receipt-uploader"
                                  type="file" 
                                  accept="image/*,application/pdf"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                                {receiptFile ? (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-zinc-800">{receiptFile.name}</span>
                                    <span className="text-[8px] text-zinc-400">File attached. Click or drag to change.</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <Upload className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600" />
                                    <span className="text-[10px] font-bold text-zinc-700">Upload transaction screenshot/PDF</span>
                                    <span className="text-[8px] text-zinc-400">Drag & Drop receipt or click to browse</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 5: SUCCESS & WATERMARKED DOWNLOAD */}
                {step === 5 && submittedOrder && (
                  <div className="text-center py-8 max-w-lg mx-auto flex flex-col items-center justify-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                      className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"
                    >
                      <Check className="h-8 w-8 stroke-[3.5px]" />
                    </motion.div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">Verification Reference: {submittedOrder.payment_reference}</span>
                      <h4 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Transfer Order Logged!</h4>
                      <p className="text-[11px] text-zinc-500 font-light leading-relaxed">
                        We have logged your payment for <strong className="text-zinc-800 font-bold">{formatCurrency(submittedOrder.total_price)}</strong> from <strong className="text-zinc-800 font-semibold">{submittedOrder.payment_sender_name}</strong>. Our finance desk will automatically verify the transfer within 30 minutes!
                      </p>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl w-full text-left space-y-2.5">
                      <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-black">
                        <span>Order Summary</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 text-[8px] font-extrabold uppercase animate-pulse">Awaiting Verification</span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between text-zinc-700">
                          <span>Package:</span>
                          <strong className="text-zinc-900 uppercase font-bold text-[10px]">
                            {submittedOrder.layout_style} photobook ({submittedOrder.book_size})
                          </strong>
                        </div>
                        <div className="flex justify-between text-zinc-700">
                          <span>Account Email:</span>
                          <span className="text-zinc-900 font-mono font-medium">{submittedOrder.client_email}</span>
                        </div>
                        <div className="flex justify-between text-zinc-700">
                          <span>Layout Style:</span>
                          <span className="text-zinc-900 font-bold uppercase">{submittedOrder.layout_style} Style</span>
                        </div>
                      </div>
                    </div>

                    {/* Instant Download Action */}
                    <div className="space-y-3 pt-4 w-full">
                      <button
                        type="button"
                        onClick={() => generatePDF(true)}
                        disabled={pdfProgress >= 0}
                        className="w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {pdfProgress >= 0 ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>COMPILING PDF ({pdfProgress}%)</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Download Watermarked Preview PDF (Free)</span>
                          </>
                        )}
                      </button>

                      <div className="p-3 bg-blue-50 border border-blue-200/50 rounded-xl flex gap-2.5 text-left">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-800 font-medium leading-normal">
                          The watermarked proof can be generated completely client-side right now. Once your bank transfer is verified by the admin in their dashboard, you can revisit this collection to download your premium Clean high-res PDF!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Compile Progress Overlay */}
          {pdfProgress >= 0 && (
            <div className="absolute inset-0 bg-black/65 z-40 flex items-center justify-center p-6 text-center text-white backdrop-blur-sm">
              <div className="max-w-md space-y-4">
                <Loader2 className="h-10 w-10 text-[#C5A059] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Compiling PDF Photobook</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">{pdfStatusText}</p>
                </div>
                
                {/* Progress bar */}
                <div className="w-64 bg-zinc-800 h-2 rounded-full overflow-hidden mx-auto border border-white/5">
                  <div 
                    className="h-full bg-[#C5A059] transition-all duration-300"
                    style={{ width: `${pdfProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-300 block">{pdfProgress}% Completed</span>
              </div>
            </div>
          )}

          {/* Footer toolbar buttons */}
          <div className="p-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-zinc-100 transition-all cursor-pointer select-none"
              >
                Go Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer select-none"
              >
                <span>Continue</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : step === 4 ? (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isUploading || !senderName}
                className="px-8 py-3.5 bg-[#C5A059] hover:bg-[#b59049] text-black rounded-full text-[10px] font-black tracking-widest uppercase disabled:opacity-50 transition-all shadow flex items-center gap-2 cursor-pointer select-none"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>LOGGING PAYMENT...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5 stroke-[2.5px]" />
                    <span>Submit Bank Transfer Order</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm cursor-pointer select-none"
              >
                Close Builder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
