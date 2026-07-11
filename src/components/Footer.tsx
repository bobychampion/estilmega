import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, Phone, MapPin, Camera } from "lucide-react";
import { mockSettings } from "../mockData";
import { Settings } from "../types";

export default function Footer() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("studio_settings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="border-t border-zinc-100 bg-zinc-50 py-16 text-zinc-800" id="studio-footer">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-zinc-900" />
              <h3 className="font-bold text-sm tracking-[0.15em] uppercase text-zinc-900">
                {settings.studio_name || "ESTIL STUDIO"}
              </h3>
            </div>
            <p className="text-xs font-light leading-relaxed text-zinc-500 max-w-xs">
              {settings.description}
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Navigation
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <Link to="/" className="hover:text-zinc-900 hover:underline transition-colors duration-200">
                Home Portfolio
              </Link>
              <Link to="/albums" className="hover:text-zinc-900 hover:underline transition-colors duration-200">
                Galleries Archive
              </Link>
              <Link to="/about" className="hover:text-zinc-900 hover:underline transition-colors duration-200">
                About the Artist
              </Link>
              <Link to="/contact" className="hover:text-zinc-900 hover:underline transition-colors duration-200">
                Inquire & Book
              </Link>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Inquiries
            </h4>
            <div className="space-y-3 text-xs text-zinc-500">
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2.5 hover:text-zinc-900 transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>{settings.contact_email}</span>
                </a>
              )}
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-2.5 hover:text-zinc-900 transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>{settings.contact_phone}</span>
                </a>
              )}
              {settings.contact_address && (
                <div className="flex items-start gap-2.5 text-zinc-500">
                  <MapPin className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-zinc-900 transition-colors pt-2"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>Instagram Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-16 border-t border-zinc-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-400">
            {settings.footer_text || "© 2026 ESTIL STUDIO. All rights reserved."}
          </p>
          <div className="text-[10px] font-mono tracking-widest text-zinc-400 flex items-center gap-4">
            <span>Powered by ESTIL STUDIO</span>
            <span className="text-zinc-200">|</span>
            <Link to="/admin" className="hover:text-zinc-900 transition-colors">
              Console Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
