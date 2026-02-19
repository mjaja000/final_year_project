import { Ticket, Clock, Bus, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateTransactionId } from '@/lib/mockData';
import QRCode from '@/components/QRCode';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DigitalTicketProps {
  route: {
    id: string;
    name: string;
    from: string;
    to: string;
    fare: number;
  };
  vehicleNumber: string;
  transactionId?: string;
  paidAt?: string | Date;
  onClose: () => void;
}

const DigitalTicket = ({ route, vehicleNumber, transactionId, paidAt, onClose }: DigitalTicketProps) => {
  const [showSmsInfo, setShowSmsInfo] = useState(false);
  
  const resolvedTransactionId = transactionId || generateTransactionId();
  const timestamp = paidAt ? new Date(paidAt) : new Date();
  const formattedDate = timestamp.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = timestamp.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-scale-in">
      <div className="ticket">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Digital Ticket</span>
          </div>
          <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            Valid
          </span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-4 border-y border-dashed border-border">
          <div className="p-3 bg-card rounded-lg shadow-sm">
            <QRCode value={resolvedTransactionId} size={120} />
          </div>
        </div>

        {/* Ticket Details */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Bus className="h-4 w-4" />
              Vehicle
            </span>
            <span className="font-medium text-foreground">{vehicleNumber}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              Route
            </span>
            <span className="font-medium text-foreground">{route.name}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Time
            </span>
            <span className="font-medium text-foreground">{formattedDate} • {formattedTime}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="text-xl font-bold text-primary">KES {route.fare}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-muted-foreground">{resolvedTransactionId}</span>
          </div>
        </div>
      </div>

      {/* SMS Instructions Toggle */}
      <button
        onClick={() => setShowSmsInfo(!showSmsInfo)}
        className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={showSmsInfo}
      >
        <Info className="h-4 w-4" />
        {showSmsInfo ? 'Hide' : 'Show'} SMS Instructions
      </button>

      {showSmsInfo && (
        <div className="mt-3 p-4 bg-secondary/50 rounded-lg text-sm text-secondary-foreground animate-fade-in">
          <p className="font-medium mb-2">M-Pesa Payment Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Go to M-Pesa menu</li>
            <li>Select "Lipa na M-Pesa"</li>
            <li>Select "Pay Bill"</li>
            <li>Enter Business Number: <span className="font-mono font-medium text-foreground">123456</span></li>
            <li>Enter Account: <span className="font-mono font-medium text-foreground">{vehicleNumber.replace(/\s/g, '')}</span></li>
            <li>Enter Amount: <span className="font-medium text-foreground">KES {route.fare}</span></li>
            <li>Enter your M-Pesa PIN</li>
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6">
        <Button onClick={onClose} variant="outline" className="w-full">
          Done
        </Button>
      </div>
    </div>
  );
};

export default DigitalTicket;
