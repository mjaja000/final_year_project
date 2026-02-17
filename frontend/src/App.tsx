import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Feedback from "./pages/Feedback";
import Occupancy from "./pages/Occupancy";
import Payment from "./pages/Payment";
import DriverLogin from "./pages/DriverLogin";
import DriverDashboard from "./pages/DriverDashboard";
import Drivers from "./pages/Drivers";
import NotFound from "./pages/NotFound";
import ComplaintDemo from "./pages/ComplaintDemo";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy-load the driver/admn combined login page
const DriverAdmn = lazy(() => import("./pages/DriverAdmn"));

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/admin"
                element={<Navigate to="/admin/login" replace />}
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/complaint-demo" element={<ComplaintDemo />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route
                path="/driver/admn"
                element={
                  <Suspense
                    fallback={
                      <div className="sr-only" role="status" aria-live="polite">
                        Loading driver login...
                      </div>
                    }
                  >
                    <DriverAdmn />
                  </Suspense>
                }
              />
              <Route path="/occupancy" element={<Occupancy />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/pay" element={<Navigate to="/payment" replace />} />
              <Route path="/driver/login" element={<DriverLogin />} />
              <Route path="/drivers" element={<Drivers />} />

              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Footer present on every page */}
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
