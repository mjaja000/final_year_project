import { useEffect, useState } from 'react';
import { CreditCard, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Route, validateVehicleNumber, routes as allRoutes } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import DigitalTicket from '@/components/DigitalTicket';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface PaymentSimulationProps {
  initialRouteId?: string;
  initialVehicleNumber?: string;
  onBack: () => void;
}

const PaymentSimulation = ({ initialRouteId, initialVehicleNumber, onBack }: PaymentSimulationProps) => {
  const [vehicleNumber, setVehicleNumber] = useState((initialVehicleNumber ?? '').toUpperCase());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(initialRouteId ?? (allRoutes[0]?.id ?? ''));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const [pollingId, setPollingId] = useState<number | null>(null);

  const vehicleValid = validateVehicleNumber(vehicleNumber);
  const phoneValid = phoneNumber.trim().length >= 9;
  const fare = allRoutes.find((r) => r.id === selectedRouteId)?.fare ?? 0;
  const vehicleLocked = Boolean(initialVehicleNumber);

  const handlePayment = async () => {
    if (!vehicleValid) {
      toast({
        title: "Invalid Vehicle Number",
        description: "Please enter a valid vehicle registration number.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneValid) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number for M-Pesa confirmation.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Call backend to create simulated payment (backend also sends WhatsApp/SMS)
      const payload = {
        routeId: Number(selectedRouteId),
        amount: fare,
        phoneNumber: phoneNumber,
      };

      const res = await api.payments.create(payload);
      const createdPayment = res.payment;

      toast({
        title: "Payment Initiated",
        description: "M-Pesa STK prompt (simulated). You will receive a WhatsApp confirmation when payment completes.",
      });

      // If backend reports notifications status, show it
      if (res.notificationsSent && res.notificationsSent.whatsapp) {
        toast({ title: "WhatsApp confirmation sent", description: "You'll receive a message shortly." });
      }

      // Poll for payment completion/transaction id
      const maxAttempts = 15; // ~15 seconds
      let attempts = 0;

      const id = window.setInterval(async () => {
        attempts += 1;
        try {
          const statusRes = await api.payments.getById(createdPayment.id);
          const payment = statusRes.payment || statusRes;
          if (payment && payment.status === 'completed' && payment.transaction_id) {
            window.clearInterval(id);
            setTransactionRef(payment.transaction_id);
            setPaymentStatus('success');
            setIsProcessing(false);
            toast({ title: 'Payment Confirmed', description: `Transaction ID: ${payment.transaction_id}` });
            // Show ticket
            setTimeout(() => setShowTicket(true), 400);
          }
        } catch (err) {
          // ignore transient failures
        }

        if (attempts >= maxAttempts) {
          window.clearInterval(id);
          setIsProcessing(false);
          setPaymentStatus('idle');
          toast({ title: 'Payment Pending', description: 'Payment is still processing. You will receive confirmation via WhatsApp.' });
        }
      }, 1000);

      setPollingId(id);
    } catch (error: any) {
      setIsProcessing(false);
      setPaymentStatus('failed');
      toast({ title: 'Payment Failed', description: error.message || 'Payment could not be initiated.', variant: 'destructive' });
      setTimeout(() => setPaymentStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    // cleanup polling if component unmounts
    return () => {
      if (pollingId) {
        window.clearInterval(pollingId);
      }
    };
  }, [pollingId]);

  if (showTicket) {
    // pass the selected route object to the ticket
    const selRoute = allRoutes.find((r) => r.id === selectedRouteId)!;
    return (
      <DigitalTicket
        route={selRoute}
        vehicleNumber={vehicleNumber}
        onClose={() => {
          setShowTicket(false);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Route Info */}
      <div className="text-center pb-3 sm:pb-4 border-b border-border">
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">Payment Simulation (No real money involved)</p>
        <div className="mt-2 mb-4">
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-background text-sm"
            disabled={Boolean(initialRouteId)}
          >
            {allRoutes.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.from} → {r.to} — KES {r.fare}</option>
            ))}
          </select>
        </div>
        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">KES {fare}</p>
      </div>

      {/* Vehicle Number */}
      <div className="space-y-2">
        <Label htmlFor="paymentVehicle" className="text-sm">Vehicle Number</Label>
        <Input
          id="paymentVehicle"
          type="text"
          placeholder="e.g., KCA 123X"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          className={cn(
            "uppercase text-center text-base sm:text-lg",
            vehicleNumber && !vehicleValid && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={9}
          readOnly={vehicleLocked}
        />
        {vehicleLocked && (
          <p className="text-xs text-muted-foreground">Vehicle is pre-selected from occupancy.</p>
        )}
        {vehicleNumber && !vehicleValid && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Enter a valid vehicle registration number
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm">Phone Number (M-Pesa)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g., 0712 345 678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className={cn(
            "text-center text-sm",
            phoneNumber && !phoneValid && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={13}
        />
        {phoneNumber && !phoneValid && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Enter a valid phone number (at least 9 digits)
          </p>
        )}
      </div>

      {/* Payment Info */}
      <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-start gap-3 text-secondary-foreground">
          <Smartphone className="h-6 sm:h-8 w-6 sm:w-8 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base">M-Pesa Payment Simulation</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This is a demonstration — no real money will be charged.
            </p>
            {paymentStatus === 'success' && transactionRef && (
              <p className="mt-2 text-xs sm:text-sm text-success font-medium break-all">
                ✓ Transaction ref: <span className="font-mono">{transactionRef}</span>
              </p>
            )}
            {paymentStatus === 'failed' && (
              <p className="mt-2 text-xs sm:text-sm text-destructive font-medium">✕ Payment failed. Try again.</p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {(vehicleNumber || phoneNumber) && (!vehicleValid || !phoneValid) && (
        <div className="p-3 bg-muted rounded-lg text-xs sm:text-sm text-muted-foreground">
          <p className="font-medium mb-1 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Please complete the following:
          </p>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {vehicleNumber && !vehicleValid && <li>Enter a valid vehicle registration</li>}
            {phoneNumber && !phoneValid && <li>Enter a valid phone number</li>}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:flex-1 text-sm"
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={handlePayment}
          variant="hero"
          disabled={!vehicleValid || !phoneValid || isProcessing}
          className="w-full sm:flex-1 text-sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay KES {fare}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSimulation;
