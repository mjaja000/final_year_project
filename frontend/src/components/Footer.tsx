import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div>
          <h4 className="font-semibold text-lg mb-2">Find Us 📸</h4>
          <p className="text-sm text-muted-foreground mb-3">See photos of routes, vehicles, and on-ground operations.</p>
          <a href="https://photos.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary font-medium">
            <img src="/images/google-photos.svg" alt="Google Photos" className="h-10 w-auto" />
            Open Google Photos
          </a>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2">Contact Us ☎️</h4>
          <p className="text-sm text-muted-foreground mb-2">Have questions? Reach out — placeholders below can be updated in settings.</p>
          <ul className="text-sm space-y-1">
            <li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> <span>+254 7XX XXX XXX</span></li>
            <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> <span>support@matatuconnect.co.ke</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2">Routes Map 🗺️</h4>
          <p className="text-sm text-muted-foreground mb-3">Overview of all routes shown on the Kenyan map (image from /public/images).</p>
          <img src="/images/kenya-routes.svg" alt="Kenya routes map" className="rounded-lg border border-border shadow-sm w-full h-40 object-cover" />
        </div>
      </div>

      <div className="border-t border-border mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>© {new Date().getFullYear()} MatatuConnect</div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;