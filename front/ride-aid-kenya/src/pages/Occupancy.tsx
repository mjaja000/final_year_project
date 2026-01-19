import Header from "@/components/Header";
import OccupancyDisplay from "@/components/OccupancyDisplay";
import  OccupancyUpdate from "@/components/OccupancyUpdate";

export default function Occupancy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Occupancy Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <OccupancyDisplay />
          <OccupancyUpdate />
        </div>
      </main>
    </div>
  );
}
