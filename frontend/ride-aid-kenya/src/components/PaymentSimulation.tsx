import { useState } from 'react';
import { CreditCard, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Route, validateVehicleNumber, routes as allRoutes, generateTransactionId } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import DigitalTicket from '@/components/DigitalTicket';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PaymentSimulationProps {
  route: Route;
  onBack: () => void;
}

const PaymentSimulation = ({ route, onBack }: PaymentSimulationProps) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(route?.id ?? (allRoutes[0]?.id ?? ''));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();

  const vehicleValid = validateVehicleNumber(vehicleNumber);
  const phoneValid = phoneNumber.trim().length >= 9;
  const fare = allRoutes.find((r) => r.id === selectedRouteId)?.fare ?? route.fare;

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

    // Simulate network / backend processing
    await new Promise(resolve => setTimeout(resolve, 1800));

    const txn = generateTransactionId();
    // Small chance to simulate failure
    const success = Math.random() > 0.08;

    setTransactionRef(txn);
    setIsProcessing(false);
    setPaymentStatus(success ? 'success' : 'failed');

    if (success) {
      toast({
        title: "Payment Successful!",
        description: `Transaction ID: ${txn}. Your digital ticket is ready.`,
      });
      setTimeout(() => {
        setShowTicket(true);
      }, 500);
    } else {
      toast({
        title: "Payment Failed",
        description: "The payment simulation failed. Please try again.",
        variant: "destructive",
      });
      // Reset for retry
      setTimeout(() => {
        setPaymentStatus('idle');
      }, 2000);
    }
  };

  if (showTicket) {
    // pass the selected route object to the ticket
    const selRoute = allRoutes.find((r) => r.id === selectedRouteId) ?? route!;
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
    <div className="space-y-6 animate-fade-in">
      {/* Route Info */}
      <div className="text-center pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground mb-3">Payment Simulation (No real money involved)</p>
        <div className="mt-2 mb-4">
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-background"
          >
            {allRoutes.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.from} → {r.to} — KES {r.fare}</option>
            ))}
          </select>
        </div>
        <p className="text-5xl font-bold text-foreground">KES {fare}</p>
      </div>

      {/* Vehicle Number */}
      <div className="space-y-2">
        <Label htmlFor="paymentVehicle">Vehicle Number</Label>
        <Input
          id="paymentVehicle"
          type="text"
          placeholder="e.g., KCA 123X"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          className={cn(
            "uppercase text-center text-lg",
            vehicleNumber && !vehicleValid && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={9}
        />
        {vehicleNumber && !vehicleValid && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Enter a valid vehicle registration number
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (M-Pesa)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g., 0712 345 678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className={cn(
            "text-center",
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
      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-3 text-secondary-foreground">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">M-Pesa Payment Simulation</p>
            <p className="text-sm text-muted-foreground">
              This is a demonstration — no real money will be charged.
            </p>
            {paymentStatus === 'success' && transactionRef && (
              <p className="mt-2 text-sm text-success font-medium">
                ✓ Transaction ref: <span className="font-mono">{transactionRef}</span>
              </p>
            )}
            {paymentStatus === 'failed' && (
              <p className="mt-2 text-sm text-destructive font-medium">✕ Payment failed. Try again.</p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {(vehicleNumber || phoneNumber) && (!vehicleValid || !phoneValid) && (
        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
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
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={handlePayment}
          variant="hero"
          disabled={!vehicleValid || !phoneValid || isProcessing}
          className="flex-1"
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
