import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import OccupancyDisplay from "@/components/OccupancyDisplay";
import RouteVisualizationMap from "@/components/Map/RouteVisualizationMap";
import { Gauge, Users, MapPin, Clock, TrendingUp, Radar, BadgeCheck } from "lucide-react";

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
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12 sm:py-16">
          <div className="absolute -top-24 right-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Gauge className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Live Occupancy</h1>
            <p className="text-base sm:text-lg opacity-95 max-w-2xl mx-auto">
              Real-time vehicle capacity tracking across all routes. Never miss a ride!
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-semibold">
                <Radar className="h-3.5 w-3.5" />
                Live Vehicle Signals
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" />
                Route-aware Capacity View
              </span>
            </div>
            
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

        <main className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border-2 border-blue-100 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">🚕</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Empty</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 border-2 border-yellow-100 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">🚗</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Filling</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-red-100 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">🚙</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Full</div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <section className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
              <OccupancyDisplay />
            </section>

            <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="mb-4 sm:mb-5">
                <h3 className="font-semibold text-base sm:text-lg text-slate-900">Route Map & Selection</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Select any route to view the road path from origin to destination and monitor active vehicles.
                </p>
              </div>
              <RouteVisualizationMap />
            </section>

            <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 items-start">
              <aside className="lg:col-span-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-bold text-slate-900 mb-2">How to read this board</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2"><span>🚕</span><span>Empty means seats are readily available.</span></li>
                  <li className="flex items-start gap-2"><span>🚗</span><span>Filling usually indicates active boarding.</span></li>
                  <li className="flex items-start gap-2"><span>🚙</span><span>Full suggests you should choose a different vehicle or route.</span></li>
                </ul>
              </aside>

              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 mb-2">Best commuting tip</h3>
                <p className="text-sm text-slate-600">
                  Pick routes with more <strong>empty</strong> vehicles during peak hours for faster boarding and shorter wait times.
                </p>
              </div>
            </div>
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
