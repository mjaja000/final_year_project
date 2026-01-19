import Header from "@/components/Header";
import FeedbackForm from "@/components/FeedbackForm";

export default function Feedback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Share Your Feedback</h1>
        <FeedbackForm />
      </main>
    </div>
  );
}
