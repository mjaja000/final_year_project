import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Helmet } from "react-helmet-async";

export default function Index() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = new URLSearchParams({ from, to, date }).toString();
    navigate(`/occupancy?${q}`);
  };

  return (
    <>
      <Helmet>
        <title>MatatuConnect — Book & Track</title>
        <meta
          name="description"
          content="Find routes, check vehicle occupancy in real-time and pay seamlessly with MatatuConnect."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <header className="relative bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 text-white">
          <div className="max-w-6xl mx-auto py-20 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                  Book the best matatu rides — fast, safe, and cashless
                </h1>
                <p className="text-lg opacity-90 mb-6">
                  Discover routes, view live occupancy and pay securely with M‑PESA or card — all in one simple flow.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link to="/occupancy" className="bg-white text-black px-5 py-3 rounded-lg font-medium shadow">
                    View Routes
                  </Link>
                  <Link to="/payment" className="border border-white/70 text-white px-5 py-3 rounded-lg">
                    Pay Now
                  </Link>
                  <Link to="/admin" className="px-4 py-3 text-white underline">
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto py-12 px-6">
          <section className="bg-white rounded-xl shadow p-6 -mt-12">
            <h2 className="text-2xl font-bold mb-4">Select Your Route</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choose a matatu route to get started — view live occupancy and available vehicles.
            </p>

            <div className="grid gap-4">
              {/* Example route cards — replace with dynamic data as needed */}
              {[
                { name: "Route 23", from: "CBD Nairobi", to: "Westlands", price: "KES 50" },
                { name: "Route 46", from: "CBD Nairobi", to: "Eastleigh", price: "KES 40" },
                { name: "Route 58", from: "CBD Nairobi", to: "South B", price: "KES 60" },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <div className="text-sm text-green-700 font-medium mb-1">{r.name}</div>
                    <div className="text-sm text-muted-foreground">{r.from} → {r.to}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{r.price}</div>
                    <div className="text-xs text-muted-foreground">3 vehicles</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">🚍</div>
              <h3 className="font-semibold mb-2">Flexible payments</h3>
              <p className="text-sm text-muted-foreground">Pay with M‑PESA, card or bank — secure and simple.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">💬</div>
              <h3 className="font-semibold mb-2">Great customer care</h3>
              <p className="text-sm text-muted-foreground">Support available 8:00 AM to 10:00 PM via phone, chat or email.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">⚡</div>
              <h3 className="font-semibold mb-2">Enjoy convenience</h3>
              <p className="text-sm text-muted-foreground">Book anytime from your office, home or market.</p>
            </div>
          </section>

          <footer className="mt-12 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MatatuConnect. Improving public transport in Kenya.
          </footer>
        </main>
      </div>
    </>
  );
}
