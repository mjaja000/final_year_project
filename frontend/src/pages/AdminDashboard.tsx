import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, CreditCard, ThumbsUp, ThumbsDown, Trello, Gauge, TrendingUp, Users, DollarSign, AlertCircle, Truck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RouteManager from '@/components/admin/RouteManager';
import OccupancyManager from '@/components/admin/OccupancyManager';
import DriverManager from '@/components/admin/DriverManager';
import AdminRevenue from '@/components/admin/AdminRevenue';
import AdminMessages from '@/components/admin/AdminMessages';
import WhatsAppChats from '@/components/admin/WhatsAppChats';
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
  interface PaymentEntry {
    id: string;
    transactionId: string;
    vehicleNumber: string;
    route: string;
    amount: number;
    timestamp: Date;
    status: 'completed' | 'pending' | 'failed';
  }

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.getDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch payments from database
  const { data: paymentsResponse } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.admin.getPayments({ limit: 1000 }),
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

  const printTicket = (payment: PaymentEntry) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast({ title: 'Print blocked', description: 'Please allow popups to print tickets', variant: 'destructive' });
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeTransactionId = escapeHtml(String(payment.transactionId || 'N/A'));
    const safeVehicleNumber = escapeHtml(String(payment.vehicleNumber || 'N/A'));
    const safeRoute = escapeHtml(String(payment.route || 'N/A'));
    const safeStatus = escapeHtml(String(payment.status || 'unknown').toUpperCase());
    const normalizedStatus = String(payment.status || '').toLowerCase();
    const formattedPaymentDate = payment.timestamp.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedAmount = Number(payment.amount || 0).toLocaleString('en-KE');
    const printedAt = new Date().toLocaleString('en-KE');
    const barcodeValue = safeTransactionId.replace(/[^A-Za-z0-9]/g, '').slice(-12) || '000000000000';

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Ticket - ${safeTransactionId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 16px;
            background: #f8fafc;
            color: #0f172a;
            max-width: 420px;
            margin: 0 auto;
            line-height: 1.35;
          }
          .ticket {
            border: 2px dashed #334155;
            border-radius: 10px;
            padding: 18px;
            background: white;
            box-shadow: 0 8px 30px rgba(2, 6, 23, 0.08);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .logo {
            font-size: 22px;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 4px;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
          }
          .section {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px dashed #cbd5e1;
          }
          .row {
            display: grid;
            grid-template-columns: 120px 1fr;
            align-items: start;
            gap: 6px;
            margin: 7px 0;
            font-size: 14px;
          }
          .label {
            font-weight: bold;
            color: #1e293b;
          }
          .value {
            text-align: right;
            color: #0f172a;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .value--mono {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            letter-spacing: 0.1px;
          }
          .amount {
            font-size: 20px;
            font-weight: bold;
            color: #16a34a;
          }
          .status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status.completed { background: #dcfce7; color: #16a34a; }
          .status.pending { background: #fef3c7; color: #d97706; }
          .status.failed { background: #fee2e2; color: #dc2626; }
          .status.default { background: #e2e8f0; color: #334155; }
          .footer {
            text-align: center;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 2px solid #1e293b;
            font-size: 11px;
            color: #64748b;
          }
          .barcode {
            text-align: center;
            font-size: 16px;
            margin: 12px 0 4px;
            letter-spacing: 4px;
            font-weight: 700;
            color: #0f172a;
          }
          .barcode-caption {
            text-align: center;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; background: white; }
            .ticket { box-shadow: none; border-radius: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="logo">🚌 MatatuConnect</div>
            <div class="subtitle">Payment Receipt</div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Transaction ID:</span>
              <span class="value value--mono">${safeTransactionId}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${formattedPaymentDate}</span>
            </div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Vehicle:</span>
              <span class="value">${safeVehicleNumber}</span>
            </div>
            <div class="row">
              <span class="label">Route:</span>
              <span class="value">${safeRoute}</span>
            </div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Amount Paid:</span>
              <span class="value amount">KES ${formattedAmount}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status ${normalizedStatus === 'completed' || normalizedStatus === 'pending' || normalizedStatus === 'failed' ? normalizedStatus : 'default'}">${safeStatus}</span>
              </span>
            </div>
          </div>

          <div class="barcode">${barcodeValue}</div>
          <div class="barcode-caption">Ticket Reference</div>

          <div class="footer">
            <div style="margin-bottom: 5px;">Thank you for using MatatuConnect</div>
            <div>Keep this receipt for your records</div>
            <div style="margin-top: 10px; font-size: 10px;">
              Printed: ${printedAt}
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            🖨️ Print Ticket
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Close
          </button>
        </div>

        <script>
          // Auto-print on load (optional)
          // window.onload = () => window.print();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback');

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
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

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
          onClick={() => printTicket(item)}
          className="flex items-center gap-1"
        >
          <Printer className="h-3 w-3" />
          <span className="hidden sm:inline">Print</span>
        </Button>
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Feedback</p>
              <p className="text-3xl sm:text-4xl font-bold">{feedbackEntries.length}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
            >
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
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <Users className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Payments</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {dashboardData?.paymentStats?.total_payments || dbPayments.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold">
                KES {(dashboardData?.paymentStats?.total_revenue || dbPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
              </p>
            </button>

            <button
              type="button"
              onClick={async () => {
                setActiveTab('whatsapp');
              }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm opacity-90 mb-1">WhatsApp Chats</p>
              <p className="text-2xl sm:text-3xl font-bold">{whatsappUnreadCount}</p>
            </button>
          </div>

          {/* Tabs - Enhanced Design */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 p-4">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-7 h-auto bg-white rounded-xl shadow-sm p-1">
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

                  <TabsTrigger value="vehicles" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Vehicles</span>
                    <span className="sm:hidden">Veh</span>
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
                  <TabsTrigger value="whatsapp" className="gap-1 sm:gap-2 text-xs sm:text-sm py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    <span className="sm:hidden">WA</span>
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

                <TabsContent value="whatsapp" className="animate-fade-in m-0">
                  <div className="p-2">
                    <h3 className="font-semibold mb-3">WhatsApp Chats</h3>
                    <WhatsAppChats />
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
