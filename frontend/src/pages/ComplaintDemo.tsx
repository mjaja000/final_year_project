import React from "react";
import ReportContainer from "../components/ReportContainer";
import { ReportData } from "@/lib/reportSchema";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { MessageSquare } from "lucide-react";
import api from "@/lib/api";
export default function ComplaintDemo() {
  const plates = ["KAA-123A", "KBB-456B", "KCC-789C", "KDD-101D", "KEE-202E"];

  const handleSubmit = async (data: ReportData) => {
    // Submit to the backend API
    await api.reports.submit(data);
    console.log("Report submitted to database:", data);
  };

  return (
    <>
      <Helmet>
        <title>Feedback — MatatuConnect</title>
        <meta name="description" content="Share your matatu experience and help improve service quality" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white py-12 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Share Your Feedback</h1>
            <p className="text-base sm:text-lg opacity-95 max-w-xl mx-auto">
              Help us improve matatu services by sharing your experience
            </p>
          </div>
        </div>

        <main className="max-w-3xl mx-auto py-8 px-4">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
            <ReportContainer plateOptions={plates} onSubmit={handleSubmit} />
          </div>

          {/* Demo Info Section */}
          <div className="mt-8 space-y-4 text-sm">
            <details className="bg-white p-4 rounded-lg shadow cursor-pointer">
              <summary className="font-medium text-gray-900 hover:text-indigo-600">
                📋 Demo Information
              </summary>
              <div className="mt-4 space-y-2 text-gray-600">
                <p>
                  <strong>Test Plates:</strong> {plates.join(", ")}
                </p>
                <p>
                  <strong>Report Types:</strong>
                </p>
                <ul className="ml-4 space-y-1">
                  <li>
                    • <strong>Feedback (GENERAL):</strong> Rate the service (1-5 stars)
                  </li>
                  <li>
                    • <strong>Incident (INCIDENT):</strong> Report a specific issue (category + details)
                  </li>
                  <li>
                    • <strong>Report to NTSA (REPORT_TO_NTSA):</strong> Escalated incident report (category + details)
                  </li>
                </ul>
                <p>
                  <strong>Validation:</strong> Plate number is always required. For feedback, a rating (1-5) is required. For incidents, a category must be selected.
                </p>
                <p>
                  <strong>Accessibility:</strong> All interactive elements support keyboard navigation, screen readers, and have proper ARIA labels.
                </p>
              </div>
            </details>

            <details className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow cursor-pointer">
              <summary className="font-medium text-blue-900 hover:text-blue-700">
                🚀 Features
              </summary>
              <ul className="mt-4 space-y-2 ml-4 text-blue-900">
                <li>✓ Multi-step form (Matatu Selection → Report Details)</li>
                <li>✓ Searchable plate number dropdown with autocomplete</li>
                <li>✓ Conditional fields based on report type</li>
                <li>✓ Zod validation with discriminated unions</li>
                <li>✓ Toast notifications for success/error feedback</li>
                <li>✓ Loading state handling during submission</li>
                <li>✓ Mobile-first responsive design (48x48px touch targets)</li>
                <li>✓ WCAG 2.1 accessibility compliance</li>
              </ul>
            </details>
          </div>
        </main>
      </div>
    </>
  );
}
}
