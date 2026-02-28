import React from 'react';
import { Bus, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Matatu<span className="text-green-500">Connect</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Kenya's #1 Matatu booking platform for modern travelers.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:support@matatuconnect.co.ke" className="text-gray-400 hover:text-green-500 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/occupancy" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Occupancy Tracking
                </Link>
              </li>
              <li>
                <Link to="/payment" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  M-Pesa Payments
                </Link>
              </li>
              <li>
                <Link to="/drivers" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Driver Directory
                </Link>
              </li>
              <li>
                <Link to="/lost-and-found" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Lost and Found
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#about" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Feedback
                </Link>
              </li>
              <li>
                <a href="https://photos.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Gallery
                </a>
              </li>
              <li>
                <a href="mailto:support@matatuconnect.co.ke" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#how-it-works" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/driver/login" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Driver Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © {new Date().getFullYear()} MatatuConnect. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs text-gray-500">
              <span className="px-3 py-1 bg-gray-800 rounded-full">Kenya Digital</span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">NTSA Compliant</span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">M-Pesa Ready</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;