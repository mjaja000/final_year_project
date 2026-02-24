import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import FeedbackForm from "@/components/FeedbackForm";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, ThumbsUp, Heart, ShieldCheck, Clock3, Sparkles } from "lucide-react";

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
        <meta
          name="description"
          content="Help us improve your matatu experience. Submit compliments and complaints. Your voice matters to us."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />

        <section className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-cyan-600 text-white py-14 sm:py-16 border-b-4 border-cyan-400 shadow-2xl">
          <div className="absolute -top-20 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-16 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Sparkles className="h-3.5 w-3.5" />
                Community Voice
              </span>
              <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                Share Your Feedback
              </h1>
              <p className="mt-4 text-base sm:text-lg text-blue-50/95 max-w-2xl">
                Compliments and complaints help us improve route safety, comfort, and service quality for every rider.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  4.8/5 Passenger Rating
                </span>
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                  <ThumbsUp className="h-4 w-4" />
                  10K+ Community Reviews
                </span>
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                  <Heart className="h-4 w-4" />
                  Every Voice Matters
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 items-start">
            <section className="lg:col-span-2 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Why your feedback matters</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Your report helps operators and management resolve issues faster and improve your day-to-day travel experience.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Safer journeys</p>
                    <p className="text-xs text-slate-600">Incidents are tracked and escalated to the right channel.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <Clock3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Faster response</p>
                    <p className="text-xs text-slate-600">Actionable details reduce turnaround time for fixes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Better service quality</p>
                    <p className="text-xs text-slate-600">Compliments and concerns shape driver and route improvements.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300 mb-1">Tip</p>
                <p className="text-sm">Include plate number, route, and time for the fastest assistance.</p>
              </div>
            </section>

            <section className="lg:col-span-3 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
              <FeedbackForm onBack={handleBack} onSuccess={handleSuccess} />
            </section>
          </div>

          <section className="mt-8 grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mb-3 text-white">
                <ThumbsUp className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Compliments Welcome</h3>
              <p className="text-sm text-slate-600">Celebrate staff and routes that consistently do well.</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center mb-3 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Complaints Are Heard</h3>
              <p className="text-sm text-slate-600">Report service gaps and incidents clearly for quick action.</p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-5">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3 text-white">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Quality Improvement</h3>
              <p className="text-sm text-slate-600">Your insights directly improve reliability and rider experience.</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
