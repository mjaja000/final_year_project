import React from "react";
import ReportContainer from "../components/ReportContainer";
import { ReportData } from "@/lib/reportSchema";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";
import { MessageSquare } from "lucide-react";

export default function ComplaintDemo() {
  const plates = ["KAA-123A", "KBB-456B", "KCC-789C", "KDD-101D", "KEE-202E"];

  const handleSubmit = async (data: ReportData) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Demo report submitted:", data);
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
            <ReportContainer
              plateOptions={plates}
              onSubmit={handleSubmit}
            />
          </div>
        </main>
      </div>
    </>
  );
}
