import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Camera, Menu, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mockSettings } from "../mockData";
import { Settings } from "../types";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });

  // Listen for storage changes to keep studio name in sync (e.g. after edit in Admin console)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("studio_settings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    // Poll localstorage periodically in case of inline state modifications
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const links = [
    { name: "Home", path: "/" },
    { name: "Galleries", path: "/albums" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md transition-all duration-300 shadow-sm" id="main-nav">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo / Branding in luxury Pixieset style */}
          <Link to="/" className="flex items-center gap-2 group" id="logo-link">
            <Camera className="h-4.5 w-4.5 text-zinc-900 group-hover:scale-110 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="font-bold text-xs tracking-[0.2em] text-zinc-900 group-hover:text-zinc-600 transition-colors uppercase">
                {settings.studio_name || "ESTIL STUDIO"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8" id="desktop-menu">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 hover:text-zinc-950 font-bold ${
                  isActive(link.path)
                    ? "text-zinc-950 border-b border-zinc-950 pb-1"
                    : "text-zinc-400"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <Link
              to="/admin"
              className="flex items-center gap-1.5 border border-zinc-200 px-4 py-2 text-[9px] tracking-[0.15em] uppercase transition-all duration-300 hover:bg-zinc-50 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 rounded-full font-bold"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Console Panel
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 md:hidden transition-all"
            aria-label="Toggle Menu"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-b border-zinc-100 bg-white md:hidden shadow-lg"
            id="mobile-menu-panel"
          >
            <div className="space-y-4 px-6 py-8">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block text-xs tracking-[0.2em] uppercase py-1 font-bold ${
                    isActive(link.path)
                      ? "text-zinc-950 border-l-2 border-zinc-950 pl-2"
                      : "text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-zinc-100">
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 border border-zinc-200 px-4 py-2.5 text-[9px] tracking-[0.15em] uppercase transition-all duration-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 rounded-full font-bold"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Console Panel
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
