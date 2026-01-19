import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, CreditCard, ThumbsUp, ThumbsDown, Trello } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { mockFeedback, mockPayments, FeedbackEntry, PaymentEntry, routes as allRoutes } from '@/lib/mockData';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type OccupancyStatus = 'empty' | 'half' | 'full';
const storageKey = 'matatu_occupancy_v1';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [occupancyData, setOccupancyData] = useState<Record<string, Record<string, OccupancyStatus>>>({});

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin');
    }
    
    // Load occupancy data
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setOccupancyData(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to load occupancy data:', e);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin');
  };

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    const search = feedbackSearch.toLowerCase();
    return mockFeedback.filter(
      (f) =>
        f.vehicleNumber.toLowerCase().includes(search) ||
        f.route.toLowerCase().includes(search) ||
        f.message.toLowerCase().includes(search)
    );
  }, [feedbackSearch]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    const search = paymentSearch.toLowerCase();
    return mockPayments.filter(
      (p) =>
        p.vehicleNumber.toLowerCase().includes(search) ||
        p.route.toLowerCase().includes(search) ||
        p.transactionId.toLowerCase().includes(search)
    );
  }, [paymentSearch]);

  const feedbackColumns = [
    {
      key: 'timestamp',
      header: 'Date',
      render: (item: FeedbackEntry) => (
        <span className="text-sm">
          {item.timestamp.toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      render: (item: FeedbackEntry) => (
        <span className="font-mono text-sm font-medium">{item.vehicleNumber}</span>
      ),
      className: 'w-28',
    },
    {
      key: 'route',
      header: 'Route',
      className: 'w-24',
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: FeedbackEntry) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            item.type === 'compliment' ? 'badge-success' : 'badge-error'
          )}
        >
          {item.type === 'compliment' ? (
            <ThumbsUp className="h-3 w-3" />
          ) : (
            <ThumbsDown className="h-3 w-3" />
          )}
          {item.type}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'message',
      header: 'Message',
      render: (item: FeedbackEntry) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {item.message}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: FeedbackEntry) => (
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            item.status === 'resolved' && 'badge-success',
            item.status === 'reviewed' && 'badge-warning',
            item.status === 'pending' && 'bg-muted text-muted-foreground'
          )}
        >
          {item.status}
        </span>
      ),
      className: 'w-24',
    },
  ];

  const paymentColumns = [
    {
      key: 'timestamp',
      header: 'Date',
      render: (item: PaymentEntry) => (
        <span className="text-sm">
          {item.timestamp.toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (item: PaymentEntry) => (
        <span className="font-mono text-sm">{item.transactionId}</span>
      ),
      className: 'w-36',
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      render: (item: PaymentEntry) => (
        <span className="font-mono text-sm font-medium">{item.vehicleNumber}</span>
      ),
      className: 'w-28',
    },
    {
      key: 'route',
      header: 'Route',
      className: 'w-24',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: PaymentEntry) => (
        <span className="font-medium">KES {item.amount}</span>
      ),
      className: 'w-24',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: PaymentEntry) => (
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            item.status === 'completed' && 'badge-success',
            item.status === 'pending' && 'badge-warning',
            item.status === 'failed' && 'badge-error'
          )}
        >
          {item.status}
        </span>
      ),
      className: 'w-24',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - MatatuConnect</title>
        <meta name="description" content="MatatuConnect administrator dashboard for managing feedback and payment logs." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage feedback and payment records
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Feedback</p>
              <p className="text-2xl font-bold text-foreground">{mockFeedback.length}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-accent">
                {mockFeedback.filter((f) => f.status === 'pending').length}
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-foreground">{mockPayments.length}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Revenue (Simulated)</p>
              <p className="text-2xl font-bold text-success">
                KES {mockPayments.reduce((sum, p) => sum + p.amount, 0)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback Logs
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Simulations
              </TabsTrigger>
              <TabsTrigger value="occupancy" className="gap-2">
                <Trello className="h-4 w-4" />
                Occupancy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="animate-fade-in">
              <DataTable
                data={filteredFeedback}
                columns={feedbackColumns}
                searchPlaceholder="Search by vehicle, route, or message..."
                searchValue={feedbackSearch}
                onSearchChange={setFeedbackSearch}
                emptyMessage="No feedback entries found"
              />
            </TabsContent>

            <TabsContent value="payments" className="animate-fade-in">
              <DataTable
                data={filteredPayments}
                columns={paymentColumns}
                searchPlaceholder="Search by transaction ID, vehicle, or route..."
                searchValue={paymentSearch}
                onSearchChange={setPaymentSearch}
                emptyMessage="No payment records found"
              />
            </TabsContent>

            <TabsContent value="occupancy" className="animate-fade-in">
              <OccupancyManagement 
                occupancyData={occupancyData} 
                onUpdate={(data) => {
                  setOccupancyData(data);
                  localStorage.setItem(storageKey, JSON.stringify(data));
                  toast({
                    title: 'Occupancy Updated',
                    description: 'Vehicle occupancy status has been updated.'
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

// Occupancy Management Component
interface OccupancyManagementProps {
  occupancyData: Record<string, Record<string, OccupancyStatus>>;
  onUpdate: (data: Record<string, Record<string, OccupancyStatus>>) => void;
}

const OccupancyManagement = ({ occupancyData, onUpdate }: OccupancyManagementProps) => {
  const [selectedRouteId, setSelectedRouteId] = useState(allRoutes[0]?.id ?? '');

  const selectedRoute = allRoutes.find((r) => r.id === selectedRouteId);
  const routeVehicles = selectedRoute?.vehicles ?? [];
  const routeOccupancy = occupancyData[selectedRouteId] ?? {};

  const handleUpdateOccupancy = (vehicle: string, status: OccupancyStatus) => {
    const newData = { ...occupancyData };
    if (!newData[selectedRouteId]) {
      newData[selectedRouteId] = {};
    }
    newData[selectedRouteId][vehicle] = status;
    onUpdate(newData);
  };

  const getOccupancyColor = (status: OccupancyStatus) => {
    switch (status) {
      case 'empty':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'half':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'full':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyLabel = (status: OccupancyStatus) => {
    switch (status) {
      case 'empty':
        return '🚕 Empty';
      case 'half':
        return '🚗 Half-Full';
      case 'full':
        return '🚙 Full';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="routeSelect">Select Route</Label>
          <select
            id="routeSelect"
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full mt-2 rounded-md border px-3 py-2 bg-background"
          >
            {allRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.from} → {r.to}
              </option>
            ))}
          </select>
        </div>

        {selectedRoute && (
          <div className="text-sm text-muted-foreground">
            <p>Fare: <span className="font-semibold text-foreground">KES {selectedRoute.fare}</span></p>
            <p>Vehicles: <span className="font-semibold text-foreground">{routeVehicles.length}</span></p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Vehicle Occupancy Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routeVehicles.map((vehicle) => (
            <div key={vehicle} className="p-4 border border-border rounded-lg">
              <p className="font-mono font-semibold mb-3">{vehicle}</p>
              <div className="flex gap-2 flex-wrap">
                {(['empty', 'half', 'full'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={routeOccupancy[vehicle] === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateOccupancy(vehicle, status)}
                    className={cn(
                      'transition-all',
                      routeOccupancy[vehicle] === status && getOccupancyColor(status)
                    )}
                  >
                    {getOccupancyLabel(status)}
                  </Button>
                ))}
              </div>
              {routeOccupancy[vehicle] && (
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {getOccupancyLabel(routeOccupancy[vehicle])}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
