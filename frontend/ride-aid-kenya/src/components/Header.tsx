import { Bus, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import React from 'react';

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

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setNavOpen((v) => !v)}
        className="p-2 mr-1 hover:bg-muted rounded-lg transition-colors"
        aria-expanded={navOpen}
        aria-label="Open navigation menu"
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {navOpen && (
        <div ref={ref} className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
          <nav className="flex flex-col">
            <Link to="/" className="text-sm py-2 px-3 hover:bg-muted rounded-t-lg" onClick={() => setNavOpen(false)}>Home</Link>
            <Link to="/feedback" className="text-sm py-2 px-3 hover:bg-muted" onClick={() => setNavOpen(false)}>Feedback</Link>
            <Link to="/payment" className="text-sm py-2 px-3 hover:bg-muted" onClick={() => setNavOpen(false)}>Payments</Link>
            <Link to="/occupancy" className="text-sm py-2 px-3 hover:bg-muted" onClick={() => setNavOpen(false)}>Occupancy</Link>
            <Link to="/drivers" className="text-sm py-2 px-3 hover:bg-muted" onClick={() => setNavOpen(false)}>Drivers</Link>
            <Link to="/admin/login" className="text-sm py-2 px-3 hover:bg-muted" onClick={() => setNavOpen(false)}>Admin</Link>
            <Link to="/driver/login" className="text-sm py-2 px-3 hover:bg-muted rounded-b-lg" onClick={() => setNavOpen(false)}>Driver Login</Link>
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

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      {/* Matatu stripe accent */}
      <div className="h-1 matatu-stripe" />
      
      <div className="container relative flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {/* Top-left menu button (opens inline dropdown) */}
          <MenuButton />

          <Link 
            to="/" 
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors shrink-0"
            aria-label="MatatuConnect Home"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Bus className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg">MatatuConnect</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
          <Link to="/feedback" className="text-sm hover:text-primary transition-colors">Feedback</Link>
          <Link to="/payment" className="text-sm hover:text-primary transition-colors">Payments</Link>
          <Link to="/occupancy" className="text-sm hover:text-primary transition-colors">Occupancy</Link>
          <Link to="/drivers" className="text-sm hover:text-primary transition-colors">Drivers</Link>

          {/* Admin link */}
          <Link to="/admin/login" className="text-sm font-medium text-primary hover:underline">Admin</Link>
          <Link to="/driver/login" className="text-sm hover:text-primary transition-colors">Driver Login</Link>
        </nav>

        {/* Right-side mobile toggle removed. Top-left button controls the menu on all screen sizes. */}
      </div>
    </header>
  );
};

export default Header;
