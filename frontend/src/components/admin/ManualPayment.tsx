import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPhoneValidationError, normalizeKenyanPhone } from "@/utils/phoneValidation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface ManualPaymentProps {
  station?: string;
}

const ManualPayment = ({ station = '' }: ManualPaymentProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentForm, setPaymentForm] = useState({
    routeId: '',
    phoneNumber: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'mpesa'
  });

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: api.routes.getAll,
  });

  const routes: any[] = Array.isArray(routesQuery.data)
    ? routesQuery.data
    : Array.isArray((routesQuery.data as any)?.routes)
      ? (routesQuery.data as any).routes
      : [];

  // Handle route selection - auto-fill fare
  const handlePaymentRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === Number(routeId));
    setPaymentForm(prev => ({
      ...prev,
      routeId,
      amount: route?.fare ? String(route.fare) : ''
    }));
  };

  // Submit manual payment
  const submitManualPayment = async () => {
    // Validate form
    if (!paymentForm.routeId || !paymentForm.amount) {
      toast({ title: 'Incomplete form', description: 'Please select route and amount', variant: 'destructive' });
      return;
    }

    // Validate phone number
    const phoneError = getPhoneValidationError(paymentForm.phoneNumber);
    if (phoneError) {
      toast({ title: 'Invalid phone number', description: phoneError, variant: 'destructive' });
      return;
    }

    const normalizedPhone = normalizeKenyanPhone(paymentForm.phoneNumber);
    if (!normalizedPhone) {
      toast({ title: 'Invalid phone', description: 'Could not normalize phone number', variant: 'destructive' });
      return;
    }

    try {
      // If M-Pesa selected, initiate STK push
      if (paymentForm.paymentMethod === 'mpesa') {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/payments/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            routeId: Number(paymentForm.routeId),
            amount: Number(paymentForm.amount),
            phoneNumber: normalizedPhone
          })
        });

        const data = await res.json();
        if (res.ok) {
          toast({
            title: 'M-Pesa prompt sent',
            description: `Check phone ${paymentForm.phoneNumber} to complete payment`,
            icon: <Phone className="h-4 w-4 text-blue-600" />
          });

          // Reset form
          setPaymentForm({ routeId: '', phoneNumber: '', amount: '', paymentMethod: 'cash' });

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        } else {
          toast({ title: 'M-Pesa failed', description: data.message || 'Could not send payment prompt', variant: 'destructive' });
        }
      } else {
        // Cash payment - direct recording
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/manual-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            routeId: Number(paymentForm.routeId),
            phoneNumber: normalizedPhone,
            amount: Number(paymentForm.amount),
            paymentMethod: 'cash',
            station
          })
        });

        const data = await res.json();
        if (res.ok) {
          toast({
            title: 'Payment processed',
            description: `Transaction ${data.transactionId} - KSh ${paymentForm.amount}`,
            icon: <CheckCircle className="h-4 w-4 text-green-600" />
          });

          // Reset form
          setPaymentForm({ routeId: '', phoneNumber: '', amount: '', paymentMethod: 'cash' });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

          // Print receipt if requested
          if (data.payment) {
            printReceipt(data.payment, data.route);
          }
        } else {
          toast({ title: 'Payment failed', description: data.message || 'Could not process payment', variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error', variant: 'destructive' });
    }
  };

  // Print receipt
  const printReceipt = (payment: any, route: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${payment.transaction_id}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
          h2 { text-align: center; margin-bottom: 5px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-between; margin: 5px 0; }
          .label { font-weight: bold; }
          .total { font-size: 1.2em; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <h2>PAYMENT RECEIPT</h2>
        <p class="center">${station || 'Station'}</p>
        <div class="line"></div>
        <div class="row"><span class="label">Transaction ID:</span><span>${payment.transaction_id}</span></div>
        <div class="row"><span class="label">Route:</span><span>${route?.route_name || 'N/A'}</span></div>
        <div class="row"><span class="label">Phone:</span><span>${payment.phone_number}</span></div>
        <div class="row"><span class="label">Payment Method:</span><span>${payment.payment_method}</span></div>
        <div class="row"><span class="label">Date:</span><span>${new Date(payment.created_at).toLocaleString()}</span></div>
        <div class="line"></div>
        <div class="row total"><span>AMOUNT:</span><span>KSh ${payment.amount}</span></div>
        <div class="line"></div>
        <p class="center">Thank you for traveling with us!</p>
        <p class="center" style="font-size: 0.8em;">MatatuConnect</p>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    setTimeout(() => {
      receiptWindow.print();
    }, 250);
  };

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          Manual Payment
        </CardTitle>
        <CardDescription>
          Record cash or M-Pesa payments for station customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Route Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment-route">Route</Label>
            <Select value={paymentForm.routeId} onValueChange={handlePaymentRouteChange}>
              <SelectTrigger id="payment-route">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map(route => (
                  <SelectItem key={route.id} value={String(route.id)}>
                    {route.route_name} - KSh {route.fare}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="payment-phone">Phone Number</Label>
            <Input
              id="payment-phone"
              placeholder="0712345678"
              value={paymentForm.phoneNumber}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount (KSh)</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentForm.paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
              >
                Cash
              </Button>
              <Button
                type="button"
                variant={paymentForm.paymentMethod === 'mpesa' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'mpesa' }))}
              >
                M-Pesa
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={submitManualPayment}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Process Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPayment;
