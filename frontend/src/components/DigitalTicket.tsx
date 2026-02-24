import { Ticket, Clock, Bus, MapPin, Info, CheckCircle, Printer, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateTransactionId } from '@/lib/mockData';
import QRCode from '@/components/QRCode';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  
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

  const handleSendToWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      // Since we don't have paymentId in props, we'll construct the ticket info
      // and potentially call an endpoint to send via WhatsApp
      // For now, we'll show a success toast, but this could be enhanced with backend integration
      
      const ticketInfo = `
🎫 *Your Bus Ticket*

✓ Status: Confirmed
🚌 Vehicle: ${vehicleNumber}
📍 Route: ${route.name}
💰 Amount: KES ${route.fare}
⏰ Booked: ${formattedDate} at ${formattedTime}
📋 Transaction ID: ${resolvedTransactionId}

Your ticket will be printed automatically. Keep this message for reference.
      `.trim();

      // Simulate WhatsApp send (in production, this would call a backend endpoint)
      const encodedMessage = encodeURIComponent(ticketInfo);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      toast.success('Ticket opened in WhatsApp!', {
        description: 'Share it with yourself or forward to your contacts',
        classes: {
          toast: 'bg-gradient-to-r from-emerald-600/90 to-green-600/90 border-emerald-400/50 text-white shadow-lg',
          title: 'text-white font-semibold',
          description: 'text-emerald-100',
        },
      });
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      toast.error('Could not open WhatsApp', {
        classes: {
          toast: 'bg-gradient-to-r from-rose-600/90 to-red-600/90 border-rose-400/50 text-white shadow-lg',
        },
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="animate-scale-in space-y-4">
      {/* Success Header - Large Premium Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full blur-md opacity-60"></div>
            <CheckCircle className="relative h-12 w-12 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 mb-1">Payment Confirmed!</h2>
        <p className="text-emerald-700 text-sm">Your ticket has been successfully processed</p>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-xl p-6 space-y-5">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <QRCode value={resolvedTransactionId} size={140} />
          </div>
        </div>

        {/* Ticket Details - Two Column Layout */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Vehicle</p>
              <p className="text-lg font-bold text-slate-900">{vehicleNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-emerald-600">KES {route.fare}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Route</p>
              <p className="text-base font-semibold text-slate-900 line-clamp-2">{route.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Date & Time</p>
              <p className="text-sm font-medium text-slate-700">{formattedDate} • {formattedTime}</p>
            </div>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Transaction ID</span>
          <span className="font-mono text-sm font-bold text-slate-700">{resolvedTransactionId}</span>
        </div>

        {/* Print Notice - Highlighted Section */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-lg p-4 flex items-start gap-3">
          <div className="mt-1">
            <Printer className="h-5 w-5 text-blue-600 flex-shrink-0" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">Ticket Will Be Printed</p>
            <p className="text-xs text-blue-700 mt-0.5">Your ticket will be automatically printed and issued to you. Keep this confirmation for your records.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleSendToWhatsApp}
          disabled={isSendingWhatsApp}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          {isSendingWhatsApp ? 'Sending...' : 'Send Ticket to WhatsApp'}
        </Button>

        {/* SMS Instructions Toggle */}
        <button
          onClick={() => setShowSmsInfo(!showSmsInfo)}
          className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors py-2"
          aria-expanded={showSmsInfo}
        >
          <Info className="h-4 w-4" />
          {showSmsInfo ? 'Hide' : 'Show'} M-Pesa Instructions
        </button>

        {showSmsInfo && (
          <div className="mt-2 p-4 bg-slate-100/50 border border-slate-200 rounded-lg text-sm text-slate-700 animate-fade-in space-y-2">
            <p className="font-semibold text-slate-900 mb-2">M-Pesa Payment Instructions:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
              <li>Go to M-Pesa menu</li>
              <li>Select "Lipa na M-Pesa"</li>
              <li>Select "Pay Bill"</li>
              <li>Enter Business Number: <span className="font-mono font-semibold text-slate-900">123456</span></li>
              <li>Enter Account: <span className="font-mono font-semibold text-slate-900">{vehicleNumber.replace(/\s/g, '')}</span></li>
              <li>Enter Amount: <span className="font-semibold text-slate-900">KES {route.fare}</span></li>
              <li>Enter your M-Pesa PIN</li>
            </ol>
          </div>
        )}

        <Button onClick={onClose} variant="outline" className="w-full mt-2 py-2.5 rounded-lg">
          Done
        </Button>
      </div>
    </div>
  );
};

export default DigitalTicket;
