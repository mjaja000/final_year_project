import React, { useState } from 'react';
import { CreditCard, Smartphone, Loader2, CheckCircle2, X } from 'lucide-react';
import api from '@/lib/api';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: number;
  routeId?: number;
  routeName?: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  vehicleId,
  routeId,
  routeName = 'Standard Route',
  amount,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    alert(`${title}\n${description}`);
  };

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Valid Kenyan formats: 07xxxxxxxx, 2547xxxxxxxx, 7xxxxxxxx
    if (digitsOnly.startsWith('254') && digitsOnly.length === 12) return true;
    if (digitsOnly.startsWith('0') && digitsOnly.length === 10) return true;
    if (digitsOnly.startsWith('7') && digitsOnly.length === 9) return true;
    
    return false;
  };

  const handlePayment = async () => {
    // Validate phone number
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      showToast('Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)', 'destructive');
      return;
    }

    if (!routeId) {
      showToast('Error', 'Route information is missing', 'destructive');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        routeId,
        phoneNumber,
        amount,
        paymentMethod,
        vehicleId,
      };

      const response = await api.driver.addPassengerPayment(payload);

      if (response.success || response.payment) {
        showToast('✅ Payment Recorded', paymentMethod === 'cash' 
          ? `Cash payment of KES ${amount} recorded successfully`
          : `M-Pesa payment of KES ${amount} completed`);

        // Reset form
        setPhoneNumber('');
        setPaymentMethod('cash');
        onOpenChange(false);

        // Trigger success callback
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      showToast('Payment Failed', error.message || 'Failed to process payment. Please try again.', 'destructive');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4 p-6" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          disabled={isProcessing}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5" />
            Passenger Payment
          </h2>
          <p className="text-sm text-slate-600">
            Record payment for {routeName} - KES {amount}
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="e.g., 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isProcessing}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Enter passenger's phone number for payment confirmation
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-md transition ${
                paymentMethod === 'cash'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CreditCard className="w-4 h-4" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('mpesa')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-md transition ${
                paymentMethod === 'mpesa'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Smartphone className="w-4 h-4" />
              M-Pesa
            </button>
          </div>
        </div>

        {/* Payment Method Info */}
        <div className="mb-6">
          {paymentMethod === 'cash' ? (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <CreditCard className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-sm mb-1">Cash Payment</p>
                <p className="text-xs text-slate-600">
                  Record that passenger paid KES {amount} in cash. This will immediately increment occupancy.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-3">
                <Smartphone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-sm mb-1">M-Pesa Payment</p>
                  <p className="text-xs text-slate-600">
                    Passenger will receive M-Pesa prompt on their phone
                  </p>
                </div>
              </div>
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ⚠️ <strong>Sandbox Mode:</strong> Using test M-Pesa credentials. No real money will be charged.
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || !phoneNumber}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {paymentMethod === 'cash' ? 'Record Payment' : 'Send M-Pesa Prompt'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
