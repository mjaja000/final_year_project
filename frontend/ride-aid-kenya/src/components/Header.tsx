import { Bus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const userRole = (localStorage.getItem('userRole') || 'passenger') as 'passenger' | 'driver' | 'admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      {/* Matatu stripe accent */}
      <div className="h-1 matatu-stripe" />
      
      <div className="container flex h-14 items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
          aria-label="MatatuConnect Home"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg">MatatuConnect</span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link to="/feedback" className="text-sm">Feedback</Link>
          <Link to="/payment" className="text-sm">Payments</Link>
          <Link to="/occupancy" className="text-sm">Occupancy</Link>

          {/* Admin link */}
          <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
