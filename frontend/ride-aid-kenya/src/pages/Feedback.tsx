import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import FeedbackForm from "@/components/FeedbackForm";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, ThumbsUp, Heart } from "lucide-react";

export default function Feedback() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleSuccess = () => {
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <>
      <Helmet>
        <title>Share Feedback — MatatuConnect</title>
        <meta name="description" content="Help us improve your matatu experience. Submit compliments and complaints. Your voice matters to us." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Share Your Feedback</h1>
          <p className="text-base sm:text-lg opacity-95 max-w-xl mx-auto">
            Help us improve your experience. Your voice matters to us!
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
              <span>4.8/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              <span>10K+ Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span>We Value You</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          <FeedbackForm onBack={handleBack} onSuccess={handleSuccess} />
        </div>
        
        {/* Why Feedback Matters */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
              <ThumbsUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Compliments Welcome</h3>
            <p className="text-sm text-gray-600">Let us know when we're doing great!</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Complaints Heard</h3>
            <p className="text-sm text-gray-600">Help us improve by reporting issues</p>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
