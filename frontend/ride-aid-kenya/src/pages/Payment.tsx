import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import PaymentSimulation from "@/components/PaymentSimulation";
import { CreditCard, Shield, Zap, CheckCircle } from "lucide-react";
import { useLocation } from 'react-router-dom';

export default function Payment() {
  const handleBack = () => {
    if (typeof window !== "undefined") window.history.back();
  };

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const routeId = params.get('routeId') ?? undefined;
  const vehicle = params.get('vehicle') ?? undefined;

  return (
    <>
      <Helmet>
        <title>Secure Payment — MatatuConnect</title>
        <meta name="description" content="Complete your matatu booking payment securely with M-PESA or card. 256-bit encryption, instant processing." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <CreditCard className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Secure Payment</h1>
          <p className="text-base sm:text-lg opacity-95 max-w-xl mx-auto">
            Complete your payment quickly and securely with M-PESA or card
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Instant Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Verified Secure</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          <PaymentSimulation
            initialRouteId={routeId ?? undefined}
            initialVehicleNumber={vehicle ?? undefined}
            onBack={handleBack}
          />
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Your Payment is Protected</h3>
              <p className="text-sm text-gray-600">
                We use industry-standard encryption to protect your payment information. Your transaction is completely secure and your data is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
