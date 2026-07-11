import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle2, Phone, Mail, Clock, Calendar, MapPin } from "lucide-react";
import { mockSettings } from "../mockData";
import { Settings } from "../types";

export default function Contact() {
  const [settings] = useState<Settings>(() => {
    const saved = localStorage.getItem("studio_settings");
    return saved ? JSON.parse(saved) : mockSettings;
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Portrait");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setFormSubmitted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white py-20 text-zinc-900"
      id="contact-page"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="border-b border-zinc-100 pb-10 mb-16">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-400">
            Booking & Consults
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-1 uppercase">
            Let's Collaborate
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-7 bg-zinc-50 border border-zinc-100 p-8 sm:p-10 rounded-3xl shadow-sm">
            <AnimatePresence mode="wait">
              {!formSubmitted ? (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wider">
                      Inquiry Form
                    </h2>
                    <p className="text-xs text-zinc-500 font-light">
                      We reply to all qualified celebration and wedding requests within 24 business hours.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Esther Adeleke"
                        className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 transition-colors placeholder-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. esther@example.com"
                        className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 transition-colors placeholder-zinc-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Portrait">Fine Art Portraiture</option>
                      <option value="Wedding">Private Wedding Commissions</option>
                      <option value="Editorial">Editorial Fashion / Commercial</option>
                      <option value="Event">Anniversaries & Celebrations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                      Message / Project Scope *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your desired event, date, location details, and styling wishes..."
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 transition-colors resize-none leading-relaxed placeholder-zinc-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-md"
                  >
                    Send Commission Inquiry
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="py-12 text-center space-y-6"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-wider text-zinc-900">
                      Message Received
                    </h3>
                    <p className="text-xs text-zinc-500 font-light max-w-md mx-auto leading-relaxed">
                      Thank you, <strong>{name}</strong>. Your inquiry regarding <strong>{category}</strong> is now registered. ESTIL STUDIO will reach out to you directly at <strong>{email}</strong> within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                    }}
                    className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase border border-zinc-200 px-6 py-2.5 rounded-full hover:bg-zinc-50 text-zinc-600 transition-all"
                  >
                    Submit New Request
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-10 lg:pl-6" id="contact-details">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">
                Direct Contact
              </h3>
              <div className="space-y-3.5 text-xs text-zinc-600 tracking-wide font-light">
                {settings.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4.5 w-4.5 text-zinc-400" />
                    <span>{settings.contact_email}</span>
                  </div>
                )}
                {settings.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4.5 w-4.5 text-zinc-400" />
                    <span>{settings.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">
                Studio Hours
              </h3>
              <div className="space-y-3.5 text-xs text-zinc-600 tracking-wide font-light">
                <div className="flex items-start gap-3">
                  <Clock className="h-4.5 w-4.5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-800">Monday — Friday</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">09:00 AM — 05:00 PM (WAT)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4.5 w-4.5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-800">Saturdays & Sunday</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">By pre-booked event commission only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Studio & On-Location Shoot
              </h4>
              <p className="text-xs font-light leading-relaxed text-zinc-500">
                Our main operations are centered in Lagos, Nigeria. We travel globally for luxury destination weddings and international editorial commissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
