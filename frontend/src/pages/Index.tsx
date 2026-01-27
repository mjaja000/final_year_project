import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Star, MapPin, Clock, Shield, Zap, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Fallback popular routes for when backend is unavailable
const POPULAR_ROUTES = [
  { id: 1, name: "Route 23", from: "CBD Nairobi", to: "Westlands", price: 80, distance: 7.2, vehicles: 15, rating: 4.8 },
  { id: 2, name: "Route 33", from: "Thika Road", to: "CBD", price: 100, distance: 12.5, vehicles: 20, rating: 4.6 },
  { id: 3, name: "Route 111", from: "Ngong Road", to: "Town", price: 70, distance: 6.8, vehicles: 12, rating: 4.7 },
  { id: 4, name: "Route 45", from: "Eastleigh", to: "CBD", price: 60, distance: 5.4, vehicles: 18, rating: 4.9 },
];

const TESTIMONIALS = [
  { name: "James Mwangi", role: "Daily Commuter", message: "MatatuConnect has made my daily commute so much easier. I know exactly when my matatu will arrive!", rating: 5 },
  { name: "Sarah Wanjiku", role: "Business Owner", message: "The cashless payment option is a game-changer. No more worrying about carrying cash!", rating: 5 },
  { name: "Peter Omondi", role: "Student", message: "Real-time occupancy tracking helps me plan my trips better. Highly recommended!", rating: 5 },
];

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch routes from backend with fallback
  const { data: backendRoutes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: api.routes.getAll,
    retry: 1,
    staleTime: 30000,
  });

  // Use backend routes if available, otherwise show popular routes
  const displayRoutes = backendRoutes && backendRoutes.length > 0 
    ? backendRoutes.map((r: any) => ({
        id: r.id,
        name: r.route_name,
        from: r.start_location,
        to: r.end_location,
        price: r.price,
        distance: r.distance_km,
        vehicles: 15, // placeholder
        rating: 4.7, // placeholder
      }))
    : POPULAR_ROUTES;

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/occupancy?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <Helmet>
        <title>MatatuConnect — Book & Track Your Matatu Rides in Kenya</title>
        <meta
          name="description"
          content="Kenya's leading matatu booking platform. Find routes, check real-time occupancy, and pay seamlessly with M-PESA. Join 50,000+ daily riders."
        />
        <meta name="keywords" content="matatu, kenya, transport, booking, m-pesa, nairobi, public transport, routes, occupancy, cashless payment" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://matatuconnect.co.ke/" />
        <meta property="og:title" content="MatatuConnect — Book & Track Your Matatu Rides" />
        <meta property="og:description" content="Kenya's #1 matatu booking platform. Real-time tracking, cashless payments, and guaranteed seats." />
        <meta property="og:image" content="https://matatuconnect.co.ke/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://matatuconnect.co.ke/" />
        <meta property="twitter:title" content="MatatuConnect — Book & Track Your Matatu Rides" />
        <meta property="twitter:description" content="Kenya's #1 matatu booking platform. Real-time tracking, cashless payments, and guaranteed seats." />
        <meta property="twitter:image" content="https://matatuconnect.co.ke/twitter-image.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://matatuconnect.co.ke/" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "MatatuConnect",
            "description": "Smart transport management platform for Kenya's matatu industry",
            "url": "https://matatuconnect.co.ke",
            "logo": "https://matatuconnect.co.ke/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+254-700-000-000",
              "contactType": "Customer Service",
              "areaServed": "KE",
              "availableLanguage": ["English", "Swahili"]
            },
            "sameAs": [
              "https://facebook.com/matatuconnect",
              "https://twitter.com/matatuconnect",
              "https://instagram.com/matatuconnect"
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Skip to main content link for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-green-600 focus:text-white focus:rounded-lg focus:shadow-xl"
        >
          Skip to main content
        </a>
        <Header />

        {/* Hero Section - Modern & Engaging */}
        <header className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white overflow-hidden" role="banner">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-6xl mx-auto py-12 sm:py-16 md:py-24 px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 animate-fade-in">
                <Zap className="h-4 w-4" />
                <span>Kenya's #1 Matatu Booking Platform</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in">
                Your Journey, <br className="sm:hidden" />
                <span className="text-yellow-300">Simplified</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl opacity-95 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Book matatu rides with confidence. Real-time tracking, cashless payments, and guaranteed seats — all at your fingertips.
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleQuickSearch} className="max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-xl sm:rounded-full p-2 shadow-2xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search routes (e.g., CBD to Westlands)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 sm:py-6 text-base border-0 focus-visible:ring-0 bg-transparent text-gray-900 placeholder:text-gray-400 rounded-lg sm:rounded-full"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 sm:py-6 rounded-lg sm:rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Search Routes
                  </Button>
                </div>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Link to="/occupancy">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-50 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                    <MapPin className="h-5 w-5 mr-2" />
                    View All Routes
                  </Button>
                </Link>
                <Link to="/payment">
                  <Button size="lg" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all group">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Quick Payment
                    <span className="ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 mt-12 text-sm opacity-90 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                  <span>4.8/5 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="max-w-6xl mx-auto py-12 sm:py-16 px-4 sm:px-6 space-y-16 sm:space-y-20" role="main">
          {/* Popular Routes Section */}
          <section className="animate-fade-in" aria-labelledby="popular-routes-heading">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <h2 id="popular-routes-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">Popular Routes</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  {backendRoutes && backendRoutes.length > 0 
                    ? "Live routes from our network" 
                    : "Most traveled routes in Nairobi"}
                </p>
              </div>
              <Link to="/occupancy" className="text-green-600 hover:text-green-700 font-semibold text-sm sm:text-base hidden sm:block">
                View All →
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {displayRoutes.slice(0, 4).map((route: any) => (
                  <Link 
                    key={route.id} 
                    to="/occupancy"
                    className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {route.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700">{route.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-900 font-medium text-base sm:text-lg">
                          <MapPin className="h-5 w-5 text-green-600" />
                          <span>{route.from}</span>
                          <span className="text-gray-400">→</span>
                          <span>{route.to}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{route.distance} km</span>
                          <span>•</span>
                          <span>{route.vehicles} vehicles active</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">KES {route.price}</div>
                          <div className="text-xs text-gray-500">per trip</div>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 group-hover:scale-105 transition-transform">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-6 sm:hidden">
              <Link to="/occupancy" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                View All Routes →
              </Link>
            </div>
          </section>

          {/* Features Section - Enhanced Visual Design */}
          <section className="animate-fade-in" aria-labelledby="features-heading">
            <div className="text-center mb-10 sm:mb-12">
              <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Why Choose MatatuConnect?</h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the future of public transport with features designed for your convenience
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Link to="/payment" className="group">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border-2 border-green-100 hover:border-green-400 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Cashless Payments</h3>
                  <p className="text-sm sm:text-base text-gray-600">Pay instantly with M-PESA, cards, or bank transfers. Fast, secure, and hassle-free.</p>
                  <div className="mt-4 flex items-center text-green-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>

              <Link to="/occupancy" className="group">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-100 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Real-time Tracking</h3>
                  <p className="text-sm sm:text-base text-gray-600">See live occupancy status and vehicle locations. Never miss your ride again.</p>
                  <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    <span>View occupancy</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>

              <Link to="/feedback" className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-100 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">24/7 Support</h3>
                  <p className="text-sm sm:text-base text-gray-600">Get help anytime via phone, chat, or email. We're here for you round the clock.</p>
                  <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    <span>Contact us</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Testimonials Section - Social Proof */}
          <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-white animate-fade-in" aria-labelledby="testimonials-heading">
            <div className="text-center mb-10 sm:mb-12">
              <h2 id="testimonials-heading" className="text-2xl sm:text-3xl font-bold mb-3">Trusted by Thousands of Commuters</h2>
              <p className="text-base sm:text-lg text-gray-300">
                See what our happy customers are saying
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-100 mb-4 text-sm sm:text-base italic">"{testimonial.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12 pt-12 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">50K+</div>
                <div className="text-sm sm:text-base text-gray-300">Daily Riders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">200+</div>
                <div className="text-sm sm:text-base text-gray-300">Active Routes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">500+</div>
                <div className="text-sm sm:text-base text-gray-300">Vehicles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">4.8/5</div>
                <div className="text-sm sm:text-base text-gray-300">User Rating</div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-8 sm:p-12 text-white animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Commute?</h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-95">
              Join thousands of satisfied commuters who have made the switch to smarter travel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/occupancy">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
                  Browse Routes Now
                </Button>
              </Link>
              <Link to="/admin">
                <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:from-yellow-300 hover:to-orange-300 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all group">
                  <Shield className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Admin Portal
                  <svg className="h-5 w-5 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </section>

          <footer className="text-center text-sm sm:text-base text-gray-600 pt-8 border-t border-gray-200" role="contentinfo">
            <p>© {new Date().getFullYear()} MatatuConnect. Revolutionizing public transport in Kenya.</p>
          </footer>
        </main>
      </div>
    </>
  );
}
