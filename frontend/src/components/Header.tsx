import { Bus, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const userRole = (localStorage.getItem('userRole') || 'passenger') as 'passenger' | 'driver' | 'admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      {/* Matatu stripe accent */}
      <div className="h-1 matatu-stripe" />
      
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
          <Link to="/feedback" className="text-sm hover:text-primary transition-colors">Feedback</Link>
          <Link to="/payment" className="text-sm hover:text-primary transition-colors">Payments</Link>
          <Link to="/occupancy" className="text-sm hover:text-primary transition-colors">Occupancy</Link>

          {/* Admin link */}
          <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
            Admin
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="flex flex-col space-y-2 p-4">
            <Link 
              to="/" 
              className="text-sm py-2 px-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/feedback" 
              className="text-sm py-2 px-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Feedback
            </Link>
            <Link 
              to="/payment" 
              className="text-sm py-2 px-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Payments
            </Link>
            <Link 
              to="/occupancy" 
              className="text-sm py-2 px-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Occupancy
            </Link>
            <Link 
              to="/admin" 
              className="text-sm py-2 px-3 font-medium text-primary hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
