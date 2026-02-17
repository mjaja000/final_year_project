import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import OccupancyDisplay from "@/components/OccupancyDisplay";
import { Gauge, Users, MapPin, Clock, TrendingUp } from "lucide-react";

export default function Occupancy() {
  return (
    <>
      <Helmet>
        <title>Live Occupancy Tracking — MatatuConnect</title>
        <meta name="description" content="Real-time matatu occupancy tracking across all Nairobi routes. Check vehicle capacity before you travel. Never miss a ride!" />
        <meta name="keywords" content="matatu occupancy, real-time tracking, nairobi routes, vehicle capacity, live updates" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Gauge className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Live Occupancy</h1>
          <p className="text-base sm:text-lg opacity-95 max-w-2xl mx-auto">
            Real-time vehicle capacity tracking across all routes. Never miss a ride!
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Live Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>All Routes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Overview of routes */}
      <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="font-semibold mb-3">Map of Routes</h3>
          <p className="text-sm text-muted-foreground mb-4">View an overview of all routes across Kenya. This is a placeholder image — replace with an exported map SVG/PNG in <code>/public/images/kenya-routes.svg</code>.</p>
          <img src="/images/routes.png" alt="Kenya routes map" className="rounded-md w-full h-56 object-cover border" />
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border-2 border-blue-100 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">🚕</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Empty</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 border-2 border-yellow-100 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">🚗</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Half-Full</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-red-100 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">🚙</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Full</div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          <OccupancyDisplay />
        </div>
        
        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Live Updates Every 15 Seconds</h3>
              <p className="text-sm text-gray-600">
                Our system automatically refreshes occupancy data from drivers and conductors in real-time. For manual updates, visit the Admin Dashboard → Occupancy tab.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
