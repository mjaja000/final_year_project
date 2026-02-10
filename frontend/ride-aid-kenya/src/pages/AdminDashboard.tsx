import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, CreditCard, ThumbsUp, ThumbsDown, Trello, Gauge, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { mockPayments, PaymentEntry } from '@/lib/mockData';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RouteManager from '@/components/admin/RouteManager';
import OccupancyManager from '@/components/admin/OccupancyManager';
import DriverManager from '@/components/admin/DriverManager';
import AdminRevenue from '@/components/admin/AdminRevenue';
import AdminMessages from '@/components/admin/AdminMessages';
import io from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OccupancyDisplay from '@/components/OccupancyDisplay';
import api from '@/lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  interface FeedbackEntry {
    id: string;
    vehicleNumber: string;
    route: string;
    type: 'complaint' | 'compliment';
    message: string;
    timestamp: Date;
    status: 'pending' | 'reviewed' | 'resolved';
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin/login');
  };

  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const sendWhatsAppTest = async () => {
    try {
      const phone = window.prompt('Enter phone number to send test (e.g., 0712345678 or 2547...)');
      if (!phone) return;
      const message = window.prompt('Enter test message', 'This is a WhatsApp test from MatatuConnect') || 'MatatuConnect WhatsApp test message';

      setSendingWhatsApp(true);

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'WhatsApp test sent', description: 'A test message was sent to ' + phone });
      } else {
        toast({ title: 'WhatsApp test failed', description: data.error || 'Failed to send test message', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'WhatsApp test failed', description: err.message || 'Unable to send test', variant: 'destructive' });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Socket: subscribe to server events for admin
  const queryClient = useQueryClient();
  const feedbackQuery = useQuery({
    queryKey: ['feedback'],
    queryFn: api.feedback.getAll,
    refetchInterval: 15000,
  });
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const socket = io(API_BASE.replace(/http(s?):\/\//, ''));

    socket.on('connect', () => {
      socket.emit('join', 'admin');
    });

    socket.on('booking.created', (payload: any) => {
      toast({ title: 'New booking', description: 'A booking was just created', variant: 'default' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    });

    socket.on('trip.updated', (trip: any) => {
      toast({ title: 'Trip updated', description: `Trip ${trip.id} is now ${trip.status}`, variant: 'default' });
      queryClient.invalidateQueries({ queryKey: ['occupancy'] });
    });

    socket.on('driver.statusUpdated', (payload: any) => {
      toast({ title: 'Driver status', description: `${payload.username || payload.userId} is ${payload.status}`, variant: 'default' });
    });

    return () => {
      socket.off('booking.created');
      socket.off('trip.updated');
      socket.off('driver.statusUpdated');
      socket.disconnect();
    };
  }, [queryClient, toast]);

  const feedbackEntries = useMemo<FeedbackEntry[]>(() => {
    const raw = Array.isArray(feedbackQuery.data)
      ? feedbackQuery.data
      : Array.isArray((feedbackQuery.data as any)?.feedback)
        ? (feedbackQuery.data as any).feedback
        : [];

    return raw.map((entry: any) => ({
      id: String(entry.id ?? entry.feedback_id ?? entry.feedbackId ?? Math.random()),
      vehicleNumber: entry.registration_number || entry.vehicle_number || entry.vehicleNumber || 'Unknown',
      route: entry.route_name || `Route ${entry.route_id ?? ''}`,
      type: String(entry.feedback_type || '').toLowerCase() === 'complaint' ? 'complaint' : 'compliment',
      message: entry.comment || entry.message || '',
      timestamp: entry.created_at ? new Date(entry.created_at) : new Date(),
      status: ((entry.status || 'pending').toLowerCase() as FeedbackEntry['status']),
    }));
  }, [feedbackQuery.data]);

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    const search = feedbackSearch.toLowerCase();
    return feedbackEntries.filter(
      (f) =>
        f.vehicleNumber.toLowerCase().includes(search) ||
        f.route.toLowerCase().includes(search) ||
        f.message.toLowerCase().includes(search)
    );
  }, [feedbackEntries, feedbackSearch]);

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <Header />

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white py-8 sm:py-12 shadow-2xl">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-gray-400">Manage your transport system</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2"> 
                <Button
                  onClick={async () => {
                    // call sendWhatsAppTest (defined below)
                    await sendWhatsAppTest();
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white mr-2"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send WhatsApp test
                </Button>

                <Button 
                  onClick={handleLogout} 
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="container py-6 sm:py-8 px-4">
          {/* Stats - Enhanced Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Feedback</p>
              <p className="text-3xl sm:text-4xl font-bold">{feedbackEntries.length}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Urgent</span>
              </div>
              <p className="text-sm opacity-90 mb-1">Pending Review</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {feedbackEntries.filter((f) => f.status === 'pending').length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <Users className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Payments</p>
              <p className="text-3xl sm:text-4xl font-bold">{mockPayments.length}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold">
                KES {mockPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tabs - Enhanced Design */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <Tabs defaultValue="feedback" className="w-full">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 p-4">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-6 h-auto bg-white rounded-xl shadow-sm p-1">
                  <TabsTrigger value="feedback" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Feedback</span>
                    <span className="sm:hidden">Feed</span>
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Payments</span>
                    <span className="sm:hidden">Pay</span>
                  </TabsTrigger>
                  <TabsTrigger value="drivers" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Drivers</span>
                    <span className="sm:hidden">Drv</span>
                  </TabsTrigger>

                  <TabsTrigger value="routes" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                    <Trello className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Routes</span>
                    <span className="sm:hidden">Rts</span>
                  </TabsTrigger>

                  <TabsTrigger value="occupancy" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                    <Gauge className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Occupancy</span>
                    <span className="sm:hidden">Occ</span>
                  </TabsTrigger>

                  <TabsTrigger value="revenue" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Revenue</span>
                    <span className="sm:hidden">Rev</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <TabsContent value="feedback" className="animate-fade-in m-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm text-muted-foreground">Latest feedback from users</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => feedbackQuery.refetch()}
                      disabled={feedbackQuery.isFetching}
                    >
                      {feedbackQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                  <DataTable
                    data={filteredFeedback}
                    columns={feedbackColumns}
                    searchPlaceholder="Search by vehicle, route, or message..."
                    searchValue={feedbackSearch}
                    onSearchChange={setFeedbackSearch}
                    emptyMessage="No feedback entries found"
                  />
                </TabsContent>

                <TabsContent value="payments" className="animate-fade-in m-0">
                  <DataTable
                    data={filteredPayments}
                    columns={paymentColumns}
                    searchPlaceholder="Search by transaction ID, vehicle, or route..."
                    searchValue={paymentSearch}
                    onSearchChange={setPaymentSearch}
                    emptyMessage="No payment records found"
                  />
                </TabsContent>

                <TabsContent value="drivers" className="animate-fade-in m-0">
                  <div className="p-2">
                    <h3 className="font-semibold mb-3">Driver Management</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <DriverManager />
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Messages</h4>
                        <div className="bg-white p-3 rounded">
                          <AdminMessages />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="animate-fade-in m-0">
                  <div className="p-2">
                    <h3 className="font-semibold mb-3">Revenue & Sales</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <AdminRevenue />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="routes" className="animate-fade-in m-0">
                  <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                      <h3 className="font-semibold mb-4">Routes & Fares</h3>
                      <RouteManager />
                    </section>
                  </div>
                </TabsContent>

                <TabsContent value="occupancy" className="animate-fade-in m-0">
                  <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                      <h3 className="font-semibold mb-4">Occupancy Control</h3>
                      <OccupancyManager />
                    </section>

                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                      <h3 className="font-semibold mb-2">Live Occupancy Overview</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Read‑only view mirroring the user occupancy page.
                      </p>
                      <OccupancyDisplay interactive={false} showPayButton={false} />
                    </section>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
