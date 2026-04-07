import React from 'react';
import { Bus, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative mt-20 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-300">
      {/* Enhanced Background Gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-12 h-96 w-96 rounded-full bg-emerald-600/30 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 right-16 h-96 w-96 rounded-full bg-amber-500/25 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-teal-500/20 blur-[80px]" />
      </div>

      {/* Top Banner with enhanced styling */}
      <div className="relative border-b border-white/10 bg-gradient-to-r from-emerald-500/5 via-white/5 to-amber-500/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-base sm:text-lg font-medium text-slate-200 tracking-wide">
            Better commuting for Kenya, one ride at a time. 🇰🇪
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-1.5 text-emerald-200 font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-500/30 transition-all duration-300">
              ✓ NTSA Aligned
            </span>
            <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1.5 text-amber-100 font-semibold shadow-lg shadow-amber-500/20 hover:bg-amber-500/30 transition-all duration-300">
              ✓ M-Pesa Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 mb-5 group">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-700/50 group-hover:shadow-emerald-500/60 transition-all duration-300 group-hover:scale-110">
                <Bus className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Matatu<span className="text-emerald-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-xs">
              Kenya's smart mobility companion for safer bookings, transparent fares, and real-time route confidence.
            </p>
            {/* Social Icons - Enhanced */}
            <div className="flex gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 hover:text-white hover:border-emerald-400/60 hover:bg-emerald-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 hover:text-white hover:border-blue-400/60 hover:bg-blue-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 hover:text-white hover:border-slate-400/60 hover:bg-slate-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20 hover:-translate-y-1"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="mailto:support@matatuconnect.co.ke" 
                className="group relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 hover:text-white hover:border-amber-400/60 hover:bg-amber-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services Column - Enhanced */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/occupancy" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Occupancy Tracking
                </Link>
              </li>
              <li>
                <Link to="/payment" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  M-Pesa Payments
                </Link>
              </li>
              <li>
                <Link to="/drivers" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Driver Directory
                </Link>
              </li>
              <li>
                <Link to="/lost-and-found" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Lost and Found
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column - Enhanced */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/#about" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Feedback
                </Link>
              </li>
              <li>
                <a href="https://photos.google.com/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Gallery
                </a>
              </li>
              <li>
                <a href="mailto:support@matatuconnect.co.ke" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column - Enhanced */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/#how-it-works" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/#features" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Features
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/driver/login" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Driver Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column - Enhanced */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="group inline-flex items-center text-sm text-slate-400 hover:text-emerald-300 transition-all duration-200">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Enhanced */}
      <div className="relative border-t border-white/10 bg-gradient-to-r from-black/40 via-black/20 to-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="text-sm text-slate-500 font-medium">
              © {new Date().getFullYear()} MatatuConnect. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 cursor-default">
                🇰🇪 Kenya Digital
              </span>
              <span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 cursor-default">
                🛡️ Safety First
              </span>
              <span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 cursor-default">
                💳 Cashless Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;