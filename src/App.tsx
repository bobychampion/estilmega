/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Albums from "./pages/Albums";
import AlbumDetails from "./pages/AlbumDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { mockSettings, mockAlbums, mockPhotos } from "./mockData";
import { syncFromFirestore, testConnection } from "./dbSync";
import { Loader2 } from "lucide-react";

// Component to scroll viewport to top on path changes
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      // Test the Cloud connection
      await testConnection();
      // Sync all data from Firestore to client-side localStorage
      await syncFromFirestore();
      setIsReady(true);
    }
    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
        <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-mono">Synchronizing with Estil Studio Cloud...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-100 selection:text-black">
        {/* Navigation Header */}
        <Navbar />

        {/* Dynamic Page Stage */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/albums/:id" element={<AlbumDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Studio Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}


