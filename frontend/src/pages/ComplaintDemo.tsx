import React from "react";
import ReportContainer from "../components/ReportContainer";
import { ReportData } from "@/lib/reportSchema";

export default function ComplaintDemo() {
  const plates = ["KAA-123A", "KBB-456B", "KCC-789C", "KDD-101D", "KEE-202E"];

  const handleSubmit = async (data: ReportData) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Demo report submitted:", data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report a Matatu
          </h1>
          <p className="text-gray-600">
            Share feedback or report an incident with your matatu experience.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <ReportContainer
            plateOptions={plates}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Demo Info Section */}
        <div className="mt-8 px-4 space-y-4 text-sm">
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
      </div>
    </div>
  );
}
