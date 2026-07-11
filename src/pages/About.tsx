import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Camera, Calendar, Award, Compass, ArrowUpRight } from "lucide-react";
import { mockSettings } from "../mockData";

export default function About() {
  const [settings] = useState(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });

  const credentials = [
    {
      icon: Award,
      title: "Publications & Press",
      desc: "Featured in leading wedding diaries, local lifestyle publications, and contemporary portraits journals."
    },
    {
      icon: Compass,
      title: "Philosophy",
      desc: "Pure, natural lighting composition combined with cinematic, high-speed digital frames."
    },
    {
      icon: Camera,
      title: "Artistic Direction",
      desc: "Candid emotional storytelling capturing spontaneous celebrations and intimate milestones."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white py-20 text-zinc-900"
      id="about-page"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="border-b border-zinc-100 pb-10 mb-16">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-400">
            About the Artist
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-1 uppercase">
            Behind the Lens
          </h1>
        </div>

        {/* Brand/Bio Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Picture Column */}
          <div className="lg:col-span-5 relative" id="photographer-portrait">
            <div className="aspect-[4/5] overflow-hidden bg-zinc-100 p-2 border border-zinc-100 rounded-3xl">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200"
                alt="Photographer portrait"
                className="h-full w-full object-cover rounded-2xl grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Minimal Caption Box */}
            <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur border border-zinc-100 p-5 rounded-2xl shadow-md max-w-[240px]">
              <p className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                ESTIL STUDIO
              </p>
              <p className="text-[9px] text-zinc-500 tracking-widest font-bold uppercase mt-1">
                Founder & Lead Photographer
              </p>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-7 space-y-10" id="photographer-bio">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-zinc-900 uppercase leading-normal">
                Hi, we are Estil Studio. We observe and preserve raw human joy, silent connections, and beautiful milestone celebrations.
              </h2>
              <p className="text-sm font-light leading-relaxed text-zinc-600">
                {settings.description}
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-600">
                Based out of Lagos, Nigeria, our studio works across wedding events, premium corporate conferences, editorial portrait sessions, and intimate golden birthdays. Photography is not just capturing shapes; it is an intimate conversation with natural light and genuine human laughter. We operate with a standard of precision and elegant discretion.
              </p>
            </div>

            {/* Core credentials checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-zinc-100">
              {credentials.map((cred, i) => {
                const Icon = cred.icon;
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-700">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-[10px] tracking-widest uppercase font-bold text-zinc-900">
                      {cred.title}
                    </h3>
                    <p className="text-xs font-light leading-relaxed text-zinc-500">
                      {cred.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="pt-6">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-md"
              >
                Inquire For Booking
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
