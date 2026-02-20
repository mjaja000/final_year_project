import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveVehicleMap from '@/components/Map/LiveVehicleMap';

/**
 * LiveMapPage - Full-screen vehicle tracking map
 * 
 * Dedicated page for viewing real-time vehicle locations in a larger format
 */
const LiveMapPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" aria-hidden="true" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Live Vehicle Tracking
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm sm:text-base text-blue-800">
            <strong>💡 Tip:</strong> Click "Find Nearest Vehicle" and enable location sharing to see which vehicle is closest to you.
            You can also click on any vehicle marker to see details.
          </p>
        </div>

        {/* Full Map */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <LiveVehicleMap height="calc(100vh - 240px)" showLocationToggle={true} />
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span><strong>Green markers</strong> show vehicles that are currently online and available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Red markers</strong> show vehicles that are currently offline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Blue marker</strong> shows your current location (when you enable location sharing)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Yellow circle</strong> highlights the nearest vehicle to you</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default LiveMapPage;
