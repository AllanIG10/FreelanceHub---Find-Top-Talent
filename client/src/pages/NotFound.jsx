import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Briefcase } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <span className="text-8xl sm:text-[120px] lg:text-[160px] font-black bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent leading-none select-none">
            404
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* SVG Illustration */}
          <div className="flex justify-center mb-6">
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60 dark:opacity-40">
              <ellipse cx="90" cy="100" rx="70" ry="12" fill="#e5e7eb" className="dark:fill-gray-700" />
              <rect x="60" y="30" width="60" height="65" rx="8" fill="#d1fae5" className="dark:fill-green-900/30" />
              <rect x="68" y="42" width="44" height="4" rx="2" fill="#6ee7b7" />
              <rect x="68" y="52" width="36" height="4" rx="2" fill="#6ee7b7" />
              <rect x="68" y="62" width="40" height="4" rx="2" fill="#6ee7b7" />
              <rect x="68" y="72" width="24" height="4" rx="2" fill="#6ee7b7" />
              <circle cx="90" cy="25" r="18" fill="#14a800" />
              <text x="90" y="31" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">?</text>
              <circle cx="130" cy="40" r="8" fill="#fef3c7" className="dark:fill-amber-900/30" />
              <circle cx="50" cy="55" r="6" fill="#dbeafe" className="dark:fill-blue-900/30" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mb-8 max-w-sm mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <Home size={18} /> Go Home
            </Link>
            <Link
              to="/jobs"
              className="flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 hover:text-green-500 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <Briefcase size={18} /> Browse Jobs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
