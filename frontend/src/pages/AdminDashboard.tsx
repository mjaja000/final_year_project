import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  MessageSquare,
  CreditCard,
  ThumbsUp,
  ThumbsDown,
  Trello,
  Gauge,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  PackageSearch,
  Shield,
  Truck,
  Printer,
  MapPin,
  Settings,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RouteManager from '@/components/admin/RouteManager';
import OccupancyOverview from '@/components/admin/OccupancyOverview';
import DriverManager from '@/components/admin/DriverManager';
import VehicleManager from '@/components/admin/VehicleManager';
import AdminRevenue from '@/components/admin/AdminRevenue';
import AdminMessages from '@/components/admin/AdminMessages';
import WhatsAppChats from '@/components/admin/WhatsAppChats';
import FeedbackManager from '@/components/admin/FeedbackManager';
import ManualPayment from '@/components/admin/ManualPayment';
import io from 'socket.io-client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import OccupancyDisplay from '@/components/OccupancyDisplay';
import api from '@/lib/api';
import { useSaccoName } from '@/hooks/useSaccoName';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Station selection (persisted to localStorage)
  const [selectedStation, setSelectedStation] = useState<string>(
    () => localStorage.getItem('adminSelectedStation') || ''
  );
  const handleStationChange = (station: string) => {
    setSelectedStation(station);
    localStorage.setItem('adminSelectedStation', station);
    queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
  };

  // SACCO name
  const { saccoName, invalidateSaccoName } = useSaccoName();
  const [saccoNameInput, setSaccoNameInput] = useState('');

  // Stations list
  const { data: stationsData } = useQuery({
    queryKey: ['admin', 'stations'],
    queryFn: () => api.admin.getStations(),
    staleTime: 2 * 60 * 1000,
  });
  const stations: string[] = stationsData?.stations || [];

  // SACCO name update mutation
  const updateSaccoMutation = useMutation({
    mutationFn: (name: string) => api.admin.updateSetting('sacco_name', name),
    onSuccess: () => {
      invalidateSaccoName();
      toast({ title: 'SACCO name updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update SACCO name', variant: 'destructive' });
    },
  });

  interface FeedbackEntry {
    id: string;
    vehicleNumber: string;
    route: string;
    type: 'complaint' | 'compliment';
    message: string;
    timestamp: Date;
    status: 'pending' | 'reviewed' | 'resolved';
    source?: string;
  }

  interface PaymentEntry {
    id: string;
    transactionId: string;
    vehicleNumber: string;
    route: string;
    amount: number;
    timestamp: Date;
    status: 'completed' | 'pending' | 'failed';
  }

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.getDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch payments from database
  const { data: paymentsResponse } = useQuery({
    queryKey: ['admin', 'payments', selectedStation],
    queryFn: () => api.admin.getPayments({ limit: 1000, station: selectedStation || undefined }),
    refetchInterval: 30000,
  });

  const { data: whatsappData } = useQuery({
    queryKey: ['admin', 'whatsapp', 'chats'],
    queryFn: async () => {
      const res = await fetch(API_BASE + '/api/whatsapp/chats');
      return res.json();
    },
    refetchInterval: 15000,
  });

  // Transform database payments to match PaymentEntry interface
  const dbPayments: PaymentEntry[] = useMemo(() => {
    if (!paymentsResponse?.payments) return [];
    return paymentsResponse.payments.map((p: any) => ({
      id: String(p.id),
      transactionId: p.transaction_id || `TXN-${p.id}`,
      vehicleNumber: p.vehicle_number || 'N/A',
      route: p.route_name || 'Unknown Route',
      amount: Number(p.amount),
      timestamp: new Date(p.created_at),
      status: p.status,
    }));
  }, [paymentsResponse]);

  const whatsappUnreadCount = useMemo(() => {
    const contacts = Array.isArray(whatsappData?.contacts) ? whatsappData.contacts : [];
    return contacts.reduce((sum: number, contact: any) => sum + (Number(contact.unread_count) || 0), 0);
  }, [whatsappData]);
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
  const [activeTab, setActiveTab] = useState('feedback');

  const printTicket = (payment: PaymentEntry) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({
        title: 'Print blocked',
        description: 'Please allow pop-ups to print tickets.',
        variant: 'destructive',
      });
      return;
    }

    const paidAt = payment.timestamp;
    const dateText = paidAt.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeText = paidAt.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${payment.transactionId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f5f7fb;
              margin: 0;
              padding: 24px;
              color: #111827;
            }
            .ticket {
              max-width: 520px;
              margin: 0 auto;
              background: #ffffff;
              border: 2px dashed #9ca3af;
              border-radius: 16px;
              padding: 24px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
            }
            .status {
              font-size: 12px;
              font-weight: 600;
              color: #065f46;
              background: #d1fae5;
              border-radius: 999px;
              padding: 4px 10px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              font-size: 14px;
            }
            .label {
              color: #6b7280;
            }
            .value {
              font-weight: 600;
            }
            .amount {
              margin-top: 16px;
              padding-top: 14px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 18px;
              font-weight: 700;
            }
            .footer {
              margin-top: 22px;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .ticket {
                border: 2px dashed #9ca3af;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="title">MatatuConnect Ticket</div>
              <div class="status">${payment.status.toUpperCase()}</div>
            </div>

            <div class="row"><span class="label">Transaction ID</span><span class="value">${payment.transactionId}</span></div>
            <div class="row"><span class="label">Vehicle</span><span class="value">${payment.vehicleNumber}</span></div>
            <div class="row"><span class="label">Route</span><span class="value">${payment.route}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${dateText}</span></div>
            <div class="row"><span class="label">Time</span><span class="value">${timeText}</span></div>

            <div class="amount"><span>Amount Paid</span><span>KES ${payment.amount}</span></div>

            <div class="footer">Printed by Admin Dashboard • ${new Date().toLocaleString('en-KE')}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Debug: Log active tab changes
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab);
  }, [activeTab]);

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
    queryKey: ['admin', 'feedback', 'reports'],
    queryFn: async () => {
      console.log('[AdminDashboard] Fetching feedback and reports from backend...');
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';

        const [feedbackResult, reportsResult] = await Promise.allSettled([
          fetch(`${apiBase}/api/admin/feedback?limit=1000`).then((res) => {
            if (!res.ok) throw new Error(`Admin feedback failed: ${res.status}`);
            return res.json();
          }),
          fetch(`${apiBase}/api/admin/reports?limit=1000`).then((res) => {
            if (!res.ok) throw new Error(`Admin reports failed: ${res.status}`);
            return res.json();
          }),
        ]);

        const feedback =
          feedbackResult.status === 'fulfilled' && Array.isArray(feedbackResult.value?.feedback)
            ? feedbackResult.value.feedback
            : [];

        const reports =
          reportsResult.status === 'fulfilled' && Array.isArray(reportsResult.value?.reports)
            ? reportsResult.value.reports
            : [];

        if (feedback.length === 0 && feedbackResult.status === 'rejected') {
          try {
            const fallbackRes = await fetch(`${apiBase}/api/feedback`);
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const fallbackFeedback = Array.isArray(fallbackData?.feedback)
                ? fallbackData.feedback
                : Array.isArray(fallbackData)
                  ? fallbackData
                  : [];
              console.log('[AdminDashboard] Fallback feedback fetched:', fallbackFeedback.length, 'items');
              return { feedback: fallbackFeedback, reports };
            }
          } catch (fallbackError) {
            console.error('[AdminDashboard] Fallback /api/feedback failed:', fallbackError);
          }
        }

        if (feedbackResult.status === 'rejected') {
          console.error('[AdminDashboard] Failed to fetch admin feedback:', feedbackResult.reason);
        }
        if (reportsResult.status === 'rejected') {
          console.error('[AdminDashboard] Failed to fetch admin reports:', reportsResult.reason);
        }

        console.log('[AdminDashboard] Feedback fetched:', feedback.length, 'items; Reports fetched:', reports.length, 'items');
        return { feedback, reports };
      } catch (error: any) {
        console.error('[AdminDashboard] Feedback/report fetch error:', error);
        return { feedback: [], reports: [] };
      }
    },
    refetchInterval: 15000,
  });
  useEffect(() => {
    const socket = io();

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
    const feedbackRaw = Array.isArray((feedbackQuery.data as any)?.feedback)
      ? (feedbackQuery.data as any).feedback
      : [];

    const reportsRaw = Array.isArray((feedbackQuery.data as any)?.reports)
      ? (feedbackQuery.data as any).reports
      : [];

    console.log('[AdminDashboard] Transforming feedback entries:', feedbackRaw.length, 'feedback and', reportsRaw.length, 'reports');

    const feedbackItems: FeedbackEntry[] = feedbackRaw.map((entry: any) => ({
      id: `fb-${String(entry.id ?? entry.feedback_id ?? Math.random())}`,
      vehicleNumber: entry.registration_number || entry.vehicle_number || entry.vehicleNumber || `Vehicle ${entry.vehicle_id}` || 'Unknown',
      route: entry.route_name || entry.route || `Route ${entry.route_id ?? ''}` || 'Unknown',
      type: (entry.feedback_type || '').toLowerCase().includes('complaint') ? 'complaint' : 'compliment',
      message: entry.comment || entry.message || '',
      timestamp: entry.created_at ? new Date(entry.created_at) : new Date(),
      status: ((entry.status || 'pending').toLowerCase() as FeedbackEntry['status']),
    }));

    const reportItems: FeedbackEntry[] = reportsRaw.map((entry: any) => {
      const reportType = String(entry.type || '').toUpperCase();
      const mappedType: FeedbackEntry['type'] = reportType === 'GENERAL' ? 'compliment' : 'complaint';

      return {
        id: `rp-${String(entry.id ?? Math.random())}`,
        vehicleNumber: entry.registration_number || entry.vehicle_number || entry.vehicleNumber || `Vehicle ${entry.matatu_id}` || 'Unknown',
        route: entry.route_name || entry.route || `Route ${entry.route_id ?? ''}` || 'Unknown',
        type: mappedType,
        message: entry.comment || entry.message || entry.category || '',
        timestamp: entry.created_at ? new Date(entry.created_at) : new Date(),
        status: 'pending',
      };
    });

    return [...feedbackItems, ...reportItems].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
    return dbPayments.filter(
      (p) =>
        p.vehicleNumber.toLowerCase().includes(search) ||
        p.route.toLowerCase().includes(search) ||
        p.transactionId.toLowerCase().includes(search)
    );
  }, [dbPayments, paymentSearch]);

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
    {
      key: 'source',
      header: 'Source',
      render: (item: FeedbackEntry) => (
        <span className="text-xs text-muted-foreground">
          {item.source || 'N/A'}
        </span>
      ),
      className: 'w-28',
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: PaymentEntry) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => printTicket(item)}
        >
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print
        </Button>
      ),
      className: 'w-28',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - {saccoName}</title>
        <meta name="description" content={`${saccoName} administrator dashboard for managing feedback and payment logs.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 text-white py-10 sm:py-14 shadow-2xl border-b-4 border-cyan-400">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-blue-100 mt-1 font-medium">{saccoName} · System Management & Analytics</p>
                  </div>
                </div>
                {/* Station selector */}
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-4 w-4 text-blue-200 shrink-0" />
                  <label className="text-xs text-blue-200 font-medium whitespace-nowrap">Managing Station:</label>
                  <select
                    value={selectedStation}
                    onChange={e => handleStationChange(e.target.value)}
                    className="text-sm bg-white/20 border border-white/30 text-white rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[180px]"
                  >
                    <option value="" className="text-gray-900">All Stations (SACCO-wide)</option>
                    {stations.map(s => (
                      <option key={s} value={s} className="text-gray-900">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto"> 
                <Button 
                  onClick={handleLogout} 
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 h-auto"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-blue-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">Total Feedback</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{feedbackEntries.length}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-orange-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold bg-white/30 backdrop-blur-md px-2 py-0.5 rounded-full">Urgent</span>
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">Pending Review</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                {feedbackEntries.filter((f) => f.status === 'pending').length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-green-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
                <Users className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">Total Payments</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                {dashboardData?.paymentStats?.total_payments || dbPayments.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-purple-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <DollarSign className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">Revenue</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1">
                KES {(dashboardData?.paymentStats?.total_revenue || dbPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-emerald-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">WhatsApp Chats</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{whatsappUnreadCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ntsa')}
              className="bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-lg p-3 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-0.5 text-left border border-red-400/30 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Shield className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">NTSA Reports</p>
              <p className="text-lg sm:text-xl font-bold tracking-tight">Available</p>
            </button>

            <button
              onClick={() => navigate('/admin/lost-and-found')}
              className="group bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-lg p-3 sm:p-4 hover:shadow-2xl transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 text-left shadow-xl border border-orange-400/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <PackageSearch className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs opacity-90 mb-1 font-medium">Lost & Found</p>
              <p className="text-lg sm:text-xl font-bold tracking-tight">View All</p>
            </button>
          </div>

          {/* Tabs - Enhanced Design */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 border-b-2 border-gray-200 p-4 overflow-x-auto">
                <TabsList className="inline-flex gap-2 h-auto bg-transparent p-0 min-w-max">
                  <TabsTrigger value="feedback" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <MessageSquare className="h-4 w-4" />
                    Feedback
                  </TabsTrigger>
                  <TabsTrigger value="ntsa" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Shield className="h-4 w-4" />
                    NTSA
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </TabsTrigger>
                  <TabsTrigger value="drivers" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Users className="h-4 w-4" />
                    Drivers
                  </TabsTrigger>
                  <TabsTrigger value="vehicles" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Truck className="h-4 w-4" />
                    Vehicles
                  </TabsTrigger>
                  <TabsTrigger value="routes" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Trello className="h-4 w-4" />
                    Routes
                  </TabsTrigger>
                  <TabsTrigger value="occupancy" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Gauge className="h-4 w-4" />
                    Occupancy
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-0">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50">
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

                <TabsContent value="ntsa" className="animate-fade-in m-0">
                  <div className="p-2">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      NTSA Complaint Management & Forwarding
                    </h3>
                    <FeedbackManager />
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="animate-fade-in m-0">
                  <div className="space-y-6">
                    {/* Manual Payment Section */}
                    <ManualPayment station={selectedStation} />
                    
                    {/* Payment Records Table */}
                    <DataTable
                      data={filteredPayments}
                      columns={paymentColumns}
                      searchPlaceholder="Search by transaction ID, vehicle, or route..."
                      searchValue={paymentSearch}
                      onSearchChange={setPaymentSearch}
                      emptyMessage="No payment records found"
                    />
                  </div>
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

                <TabsContent value="vehicles" className="animate-fade-in">
                  <div className="p-2">
                    <VehicleManager />
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
                      <RouteManager station={selectedStation} />
                    </section>
                  </div>
                </TabsContent>

                <TabsContent value="occupancy" className="animate-fade-in m-0">
                  <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                      <OccupancyOverview station={selectedStation} />
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

                <TabsContent value="whatsapp" className="animate-fade-in m-0">
                  <div className="p-2">
                    <h3 className="font-semibold mb-3">WhatsApp Chats</h3>
                    <WhatsAppChats />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="animate-fade-in m-0">
                  <div className="max-w-lg mx-auto p-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          SACCO Settings
                        </h2>
                        <p className="text-sm text-gray-300 mt-1">Configure your SACCO branding — changes reflect system-wide.</p>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* SACCO Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            SACCO Name
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            Current: <span className="font-semibold text-green-600">{saccoName}</span>
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={saccoNameInput}
                              onChange={e => setSaccoNameInput(e.target.value)}
                              placeholder={saccoName}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <Button
                              onClick={() => {
                                if (saccoNameInput.trim()) {
                                  updateSaccoMutation.mutate(saccoNameInput.trim());
                                  setSaccoNameInput('');
                                }
                              }}
                              disabled={!saccoNameInput.trim() || updateSaccoMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white px-4"
                            >
                              {updateSaccoMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
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
