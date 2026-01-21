import Header from "@/components/Header";
import OccupancyDisplay from "@/components/OccupancyDisplay";

export default function Occupancy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Occupancy Management</h1>
        <div className="grid grid-cols-1 gap-8">
          <OccupancyDisplay />
          <div className="p-4 rounded-lg border bg-white shadow-sm text-sm text-muted-foreground">
            Occupancy updates are now managed from the Admin Dashboard → Occupancy tab.
          </div>
        </div>
      </main>
    </div>
  );
}
