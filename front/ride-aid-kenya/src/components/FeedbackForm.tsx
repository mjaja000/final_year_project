import { useState } from 'react';
import { Send, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Route, validateVehicleNumber, routes as allRoutes } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  route?: Route | null;
  onBack: () => void;
  onSuccess: () => void;
}

type FeedbackType = 'complaint' | 'compliment';

const FeedbackForm = ({ route, onBack, onSuccess }: FeedbackFormProps) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(route?.id ?? (allRoutes[0]?.id ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sent' | 'failed'>('idle');
  const { toast } = useToast();

  const vehicleValid = validateVehicleNumber(vehicleNumber);
  const messageValid = message.trim().length > 0 && message.length <= 200;
  const canSubmit = vehicleValid && feedbackType && messageValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));

    setIsSubmitting(false);
    setSubmitted(true);

    toast({
      title: "Feedback Submitted!",
      description: "You'll receive an SMS confirmation shortly.",
    });

    // Simulate WhatsApp notification awareness (frontend only)
    setTimeout(() => {
      setWhatsappStatus('sent');
      toast({ title: 'WhatsApp', description: 'WhatsApp confirmation queued (simulation).' });
    }, 800);

    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="text-center py-8 animate-scale-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Thank You!
        </h3>
        <p className="text-muted-foreground mb-4">
          Your feedback has been submitted successfully.
        </p>
        <p className="text-sm text-muted-foreground">
          SMS confirmation will be sent to your registered number.
        </p>
        {whatsappStatus === 'sent' && (
          <p className="text-sm text-muted-foreground mt-2">WhatsApp confirmation sent (simulation)</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border pb-3">
        <span className="font-medium text-foreground">{route?.name ?? 'Select Route'}</span>
        <span>•</span>
        <span>{route?.from ?? ''} {route ? '→' : ''} {route?.to ?? ''}</span>
      </div>

      {/* Route Select */}
      <div className="space-y-2">
        <Label htmlFor="routeSelect">Route</Label>
        <select
          id="routeSelect"
          value={selectedRouteId ?? ''}
          onChange={(e) => setSelectedRouteId(e.target.value || null)}
          className="w-full rounded-md border px-3 py-2"
        >
          {allRoutes.map((r) => (
            <option key={r.id} value={r.id}>{r.name} — {r.from} → {r.to}</option>
          ))}
        </select>
      </div>

      {/* Vehicle Number */}
      <div className="space-y-2">
        <Label htmlFor="vehicleNumber">Vehicle Number</Label>
        <Input
          id="vehicleNumber"
          type="text"
          placeholder="e.g., KCA 123X"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          className={cn(
            "uppercase",
            vehicleNumber && !vehicleValid && "border-destructive focus-visible:ring-destructive"
          )}
          aria-describedby="vehicleHelp"
          maxLength={9}
        />
        <p id="vehicleHelp" className="text-xs text-muted-foreground">
          Enter the matatu registration number (e.g., KCA 123X)
        </p>
      </div>

      {/* Feedback Type */}
      <div className="space-y-2">
        <Label>Feedback Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFeedbackType('compliment')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
              feedbackType === 'compliment'
                ? "border-success bg-success/10 text-success"
                : "border-border hover:border-success/50 hover:bg-success/5"
            )}
            aria-pressed={feedbackType === 'compliment'}
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="font-medium">Compliment</span>
          </button>
          <button
            type="button"
            onClick={() => setFeedbackType('complaint')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
              feedbackType === 'complaint'
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border hover:border-destructive/50 hover:bg-destructive/5"
            )}
            aria-pressed={feedbackType === 'complaint'}
          >
            <ThumbsDown className="h-5 w-5" />
            <span className="font-medium">Complaint</span>
          </button>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="message">Your Message</Label>
          <span className={cn(
            "text-xs",
            message.length > 200 ? "text-destructive" : "text-muted-foreground"
          )}>
            {message.length}/200
          </span>
        </div>
        <Textarea
          id="message"
          placeholder="Share your experience..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(
            "min-h-[100px] resize-none",
            message && !messageValid && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={200}
        />
        {message && !messageValid && (
          <p className="text-xs text-destructive">Message must be between 1 and 200 characters</p>
        )}
      </div>

      {/* Validation Summary */}
      {!canSubmit && (
        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Please complete the following:</p>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {!vehicleValid && <li>Enter a valid vehicle number (e.g., KCA 123X)</li>}
            {!feedbackType && <li>Select a feedback type (Compliment or Complaint)</li>}
            {!messageValid && <li>Write a message between 1 and 200 characters</li>}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={!canSubmit}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <span className="animate-pulse-gentle">Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;
