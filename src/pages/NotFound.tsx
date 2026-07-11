import { Link } from "react-router-dom";
import { Camera, Compass, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[75vh] flex-col items-center justify-center text-center px-6"
      id="not-found-page"
    >
      <div className="space-y-6 max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <Compass className="h-6 w-6 animate-spin-slow" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-serif text-3xl tracking-tight text-zinc-900 dark:text-white">Frame Not Found</h1>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            The perspective you are looking for does not exist in this archive. It might have been relocated or archived permanently.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 px-6 py-2.5 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all text-zinc-700 dark:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Portfolio
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
