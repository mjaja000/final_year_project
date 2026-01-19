import Header from "@/components/Header";
import PaymentSimulation from "@/components/PaymentSimulation";

export default function Payment() {
  const handleBack = () => {
    if (typeof window !== "undefined") window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Payment Processing</h1>
        <PaymentSimulation route="payment" onBack={handleBack} />
      </main>
    </div>
  );
}
