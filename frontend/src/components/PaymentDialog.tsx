import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, Loader2, Phone, Smartphone, History, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: number;
  vehicleReg?: string;
  routeId?: number;
  routeName?: string;
  amount?: number;
  onPaymentSuccess: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  vehicleId,
  vehicleReg,
  routeId,
  routeName = 'Standard Route',
  amount: initialAmount = 50,
  onPaymentSuccess
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'mpesa'>('manual');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [previousPhones, setPreviousPhones] = useState<string[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [showPhoneHistory, setShowPhoneHistory] = useState(false);
  const { toast } = useToast();

  // Fetch previous M-Pesa phone numbers
  const fetchPreviousPhones = async () => {
    setLoadingPhones(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/payments/previous-phones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPreviousPhones(data.phones || []);
        setShowPhoneHistory(true);
      }
    } catch (error) {
      console.error('Error fetching previous phones:', error);
    } finally {
      setLoadingPhones(false);
    }
  };

  const selectPreviousPhone = (phone: string) => {
    setPhoneNumber(phone);
    setShowPhoneHistory(false);
  };

  const printTicket = (payment: any) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({
        title: 'Print blocked',
        description: 'Please allow pop-ups to print tickets.',
        variant: 'destructive',
      });
      return;
    }

    const paidAt = new Date(payment?.created_at || payment?.updated_at || Date.now());
    const dateText = paidAt.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeText = paidAt.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const transactionId =
      payment?.transaction_id ||
      payment?.checkout_request_id ||
      payment?.merchant_request_id ||
      `DRV-${Date.now()}`;

    const status = String(payment?.status || 'completed').toUpperCase();

    printWindow.document.write(`
      <html>
        <head>
          <title>Driver Ticket - ${transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; color: #111827; }
            .ticket { max-width: 520px; margin: 0 auto; background: #ffffff; border: 2px dashed #9ca3af; border-radius: 16px; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 700; }
            .status { font-size: 12px; font-weight: 600; color: #065f46; background: #d1fae5; border-radius: 999px; padding: 4px 10px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .amount { margin-top: 16px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; }
            .footer { margin-top: 22px; font-size: 12px; color: #6b7280; text-align: center; }
            @media print { body { background: #ffffff; padding: 0; } .ticket { border: 2px dashed #9ca3af; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="title">MatatuConnect Driver Ticket</div>
              <div class="status">${status}</div>
            </div>

            <div class="row"><span class="label">Transaction ID</span><span class="value">${transactionId}</span></div>
            <div class="row"><span class="label">Vehicle</span><span class="value">${vehicleReg || 'Assigned Vehicle'}</span></div>
            <div class="row"><span class="label">Route</span><span class="value">${routeName}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${dateText}</span></div>
            <div class="row"><span class="label">Time</span><span class="value">${timeText}</span></div>

            <div class="amount"><span>Amount Paid</span><span>KES ${Number(initialAmount)}</span></div>
            <div class="footer">Printed by Driver Dashboard • ${new Date().toLocaleString('en-KE')}</div>
          </div>
          <script>window.onload = function(){ window.print(); };</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleManualPayment = async (printAfter = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Record manual payment using simulatePayment endpoint with immediate completion
      const res = await fetch(API_BASE + '/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          routeId: routeId || 1,
          amount: initialAmount,
          phoneNumber: 'MANUAL-CASH',
          vehicle: null, // Let backend auto-assign vehicle
          vehicleId: vehicleId
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Payment Recorded',
          description: `Manual payment of KES ${initialAmount} recorded successfully`,
          duration: 3000
        });

        if (printAfter) {
          printTicket(data?.payment || null);
        }
        
        // Wait a moment for backend to process occupancy increment
        setTimeout(() => {
          onPaymentSuccess();
          onOpenChange(false);
          resetForm();
        }, 2500);
      } else {
        throw new Error(data.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('Manual payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Could not record payment',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Initiate live M-Pesa STK push
      const res = await fetch(API_BASE + '/api/payments/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          route: routeId || 1,
          amount: initialAmount,
          phone: normalizedPhone,
          vehicle: vehicleReg || undefined,
          vehicleId: vehicleId
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'M-Pesa Prompt Sent',
          description: `Check phone ${normalizedPhone} for M-Pesa prompt`,
          duration: 5000
        });

        onOpenChange(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('M-Pesa payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Could not initiate M-Pesa payment',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const normalizePhoneNumber = (phone: string): string | null => {
    const digitsOnly = phone.trim().replace(/[^0-9]/g, '');
    
    // 0712345678 -> 254712345678
    if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
      return `254${digitsOnly.slice(1)}`;
    }
    
    // 712345678 -> 254712345678
    if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
      return `254${digitsOnly}`;
    }
    
    // 254712345678 -> 254712345678
    if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
      return digitsOnly;
    }
    
    return null;
  };

  const resetForm = () => {
    setPhoneNumber('');
    setPaymentMethod('manual');
    setLoading(false);
    setShowPhoneHistory(false);
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Passenger Payment
          </DialogTitle>
          <DialogDescription>
            Collect payment for the passenger boarding {routeName}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Payment Amount</p>
          <p className="text-2xl font-bold text-amber-700">KES {initialAmount}</p>
          <p className="text-xs text-amber-800 mt-1">Fare is fixed to match occupancy payment amount.</p>
        </div>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'manual' | 'mpesa')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              M-Pesa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Cash Payment</p>
                  <p className="text-2xl font-bold text-blue-700">KES {initialAmount}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Record that the passenger paid <strong>KES {initialAmount}</strong> in cash. Click "Record Payment" to confirm.
            </p>
          </TabsContent>

          <TabsContent value="mpesa" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="phone">Passenger Phone Number</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchPreviousPhones}
                  disabled={loadingPhones || loading}
                  className="flex items-center gap-1 text-xs"
                >
                  <History className="h-3 w-3" />
                  {loadingPhones ? 'Loading...' : 'Use Previous'}
                </Button>
              </div>

              {showPhoneHistory && previousPhones.length > 0 && (
                <div className="border rounded-md p-2 bg-gray-50 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Recent phone numbers:</p>
                  {previousPhones.map((phone, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPreviousPhone(phone)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-blue-100 rounded"
                    >
                      {phone}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the passenger's phone number to send M-Pesa STK push prompt
              </p>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">M-Pesa Payment</p>
                  <p className="text-2xl font-bold text-green-700">KES {initialAmount}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              The passenger will receive an M-Pesa prompt on their phone to pay <strong>KES {initialAmount}</strong>.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          {paymentMethod === 'manual' ? (
            <>
              <Button
                onClick={() => handleManualPayment(false)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleManualPayment(true)}
                disabled={loading}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Record & Print
              </Button>
            </>
          ) : (
            <Button
              onClick={handleMpesaPayment}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Send M-Pesa Prompt
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
