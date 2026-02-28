import { Bus, Menu, X, Home as HomeIcon, MessageSquare, CreditCard, Users, MapPin, Shield, LogIn, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useSaccoName } from '@/hooks/useSaccoName';

// Inline top-left menu button component
function MenuButton() {
  const [navOpen, setNavOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (navOpen && ref.current && !ref.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setNavOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setNavOpen((v) => !v)}
        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
        aria-expanded={navOpen}
        aria-controls="main-nav-menu"
        aria-haspopup="true"
        aria-label="Open navigation menu"
      >
        {navOpen ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      </button>

      {navOpen && (
        <div
          ref={ref}
          id="main-nav-menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <nav className="flex flex-col py-2" aria-label="Primary">
            <Link 
              to="/" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <HomeIcon className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Home</span>
            </Link>
            
            <Link 
              to="/feedback" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <MessageSquare className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Complaint/Feedback</span>
            </Link>
            
            <Link 
              to="/payment" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <CreditCard className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Payments</span>
            </Link>
            
            <Link 
              to="/occupancy" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <MapPin className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Occupancy</span>
            </Link>
            
            <Link 
              to="/drivers" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <Users className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Drivers</span>
            </Link>
            
            <Link 
              to="/lost-and-found" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <Package className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Lost and Found</span>
            </Link>
            
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2 mx-4" />
            
            <Link 
              to="/admin/login" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <Shield className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Admin</span>
            </Link>
            
            <Link 
              to="/driver/login" 
              className="flex items-center gap-3 text-sm py-2.5 px-4 text-black dark:text-white hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-all group" 
              onClick={() => setNavOpen(false)}
            >
              <LogIn className="h-5 w-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <span className="font-medium">Driver Login</span>
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const userRole = (localStorage.getItem('userRole') || 'passenger') as 'passenger' | 'driver' | 'admin';
  const { saccoName } = useSaccoName();

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-950 shadow-md border-b border-gray-200 dark:border-gray-800">
      {/* Matatu stripe accent - Kenyan flag inspired colors */}
      <div className="h-1.5 flex">
        <div className="flex-1 bg-black"></div>
        <div className="flex-1 bg-red-600"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>
      
      <div className="container relative flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-3 font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity shrink-0 group"
            aria-label={`${saccoName} Home`}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {saccoName}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Home
          </Link>
          <Link to="/feedback" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Complaint/Feedback
          </Link>
          <Link to="/payment" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Payments
          </Link>
          <Link to="/occupancy" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Occupancy
          </Link>
          <Link to="/drivers" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Drivers
          </Link>
          <Link to="/lost-and-found" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Lost and Found
          </Link>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2"></div>

          {/* Admin link */}
          <Link to="/admin/login" className="px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Admin
          </Link>
          <Link to="/driver/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all">
            Driver Login
          </Link>
        </nav>

        {/* Menu button (visible on all screens) */}
        <MenuButton />
      </div>
    </header>
  );
};

export default Header;
