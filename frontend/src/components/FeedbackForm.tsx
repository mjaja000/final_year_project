import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface FeedbackFormProps {
  route?: { id?: string | number } | null;
  onBack: () => void;
  onSuccess: () => void;
}

type FeedbackType = 'complaint' | 'compliment';
type ReportType = 'FEEDBACK' | 'INCIDENT' | 'REPORT_TO_NTSA';

const FeedbackForm = ({ route, onBack, onSuccess }: FeedbackFormProps) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [reportType, setReportType] = useState<ReportType>('FEEDBACK');
  const [message, setMessage] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(route?.id ? String(route.id) : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sent' | 'failed'>('idle');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [crewDetails, setCrewDetails] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [evidence, setEvidence] = useState('');
  const { toast } = useToast();

  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: api.routes.getAll,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.getAll,
  });

  const routes = useMemo(() => {
    const raw = Array.isArray(routesQuery.data)
      ? routesQuery.data
      : Array.isArray((routesQuery.data as any)?.routes)
        ? (routesQuery.data as any).routes
        : [];

    return raw
      .map((r: any) => ({
        ...r,
        id: Number(r.id ?? r.route_id ?? r.routeId ?? 0),
      }))
      .filter((r: any) => Number.isFinite(r.id) && r.status !== 'inactive');
  }, [routesQuery.data]);

  const vehicles = useMemo(() => {
    const raw = Array.isArray(vehiclesQuery.data)
      ? vehiclesQuery.data
      : Array.isArray((vehiclesQuery.data as any)?.vehicles)
        ? (vehiclesQuery.data as any).vehicles
        : [];

    return raw
      .map((v: any) => ({
        ...v,
        id: Number(v.id ?? v.vehicle_id ?? v.vehicleId ?? 0),
      }))
      .filter((v: any) => Number.isFinite(v.id) && v.status !== 'inactive');
  }, [vehiclesQuery.data]);

  const selectedRoute = routes.find((r: any) => String(r.id) === String(selectedRouteId ?? '')) || null;
  const filteredVehicles = selectedRouteId
    ? vehicles.filter((v: any) => String(v.route_id ?? v.routeId ?? '') === String(selectedRouteId))
    : vehicles;

  const messageValid = message.trim().length > 0 && message.length <= 200;
  const canSubmit = Boolean(selectedRouteId && selectedVehicleId && feedbackType && messageValid && !isSubmitting);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        routeId: Number(selectedRouteId),
        vehicleId: Number(selectedVehicleId),
        feedbackType: feedbackType === 'complaint' ? 'Complaint' : 'Compliment',
        comment: message.trim(),
        reportType: feedbackType === 'complaint' ? reportType : undefined,
        incidentDate: incidentDate || undefined,
        incidentTime: incidentTime || undefined,
        crewDetails: crewDetails || undefined,
        vehicleNumber: vehicleNumber || undefined,
        evidence: evidence || undefined,
      };

      await api.feedback.create(payload);

      setSubmitted(true);
      toast({
        title: "Feedback Submitted!",
        description: reportType === 'REPORT_TO_NTSA' 
          ? "Your complaint has been classified and forwarded to NTSA if critical."
          : "Your feedback has been saved.",
      });

      setTimeout(() => {
        setWhatsappStatus('sent');
        toast({ title: 'WhatsApp', description: 'WhatsApp confirmation queued (if enabled).' });
      }, 800);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      toast({
        title: 'Failed to submit feedback',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-muted-foreground border-b border-border pb-3">
        <span className="font-medium text-foreground">{selectedRoute?.route_name || 'Select Route'}</span>
        <span className="hidden sm:inline">•</span>
        <span>
          {(selectedRoute?.start_location || '')} {selectedRoute ? '→' : ''} {(selectedRoute?.end_location || '')}
        </span>
      </div>

      {/* Route Select */}
      <div className="space-y-2">
        <Label htmlFor="routeSelect" className="text-sm">Route</Label>
        <select
          id="routeSelect"
          value={selectedRouteId ?? ''}
          onChange={(e) => {
            setSelectedRouteId(e.target.value || null);
            setSelectedVehicleId(null);
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {routesQuery.isLoading ? 'Loading routes...' : 'Select route'}
          </option>
          {routes.map((r: any) => (
            <option key={r.id} value={r.id}>
              {r.route_name || `Route ${r.id}`} — {r.start_location} → {r.end_location}
            </option>
          ))}
        </select>
        {routes.length === 0 && !routesQuery.isLoading && (
          <p className="text-xs text-muted-foreground">No active routes available.</p>
        )}
      </div>

      {/* Vehicle Select */}
      <div className="space-y-2">
        <Label htmlFor="vehicleSelect" className="text-sm">Vehicle</Label>
        <select
          id="vehicleSelect"
          value={selectedVehicleId ?? ''}
          onChange={(e) => setSelectedVehicleId(e.target.value || null)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={!selectedRouteId}
        >
          <option value="" disabled>
            {!selectedRouteId
              ? 'Select route first'
              : vehiclesQuery.isLoading
                ? 'Loading vehicles...'
                : 'Select vehicle'}
          </option>
          {filteredVehicles.map((v: any) => (
            <option key={v.id} value={v.id}>
              {v.registration_number || v.vehicle_number || v.vehicleNumber || `Vehicle ${v.id}`}
            </option>
          ))}
        </select>
        {selectedRouteId && filteredVehicles.length === 0 && !vehiclesQuery.isLoading && (
          <p className="text-xs text-muted-foreground">No active vehicles for this route.</p>
        )}
      </div>

      {/* Feedback Type */}
      <div className="space-y-2">
        <Label className="text-sm">Feedback Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setFeedbackType('compliment')}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm",
              feedbackType === 'compliment'
                ? "border-success bg-success/10 text-success"
                : "border-border hover:border-success/50 hover:bg-success/5"
            )}
            aria-pressed={feedbackType === 'compliment'}
          >
            <ThumbsUp className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="font-medium">Compliment</span>
          </button>
          <button
            type="button"
            onClick={() => setFeedbackType('complaint')}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm",
              feedbackType === 'complaint'
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border hover:border-destructive/50 hover:bg-destructive/5"
            )}
            aria-pressed={feedbackType === 'complaint'}
          >
            <ThumbsDown className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="font-medium">Complaint</span>
          </button>
        </div>
      </div>

      {/* Report Type - Only show for complaints */}
      {feedbackType === 'complaint' && (
        <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <Label className="text-sm font-semibold">Report Type</Label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setReportType('FEEDBACK')}
              className={cn(
                "text-left p-3 rounded-lg border-2 transition-all text-xs sm:text-sm",
                reportType === 'FEEDBACK'
                  ? "border-blue-500 bg-blue-50"
                  : "border-border hover:border-blue-300"
              )}
            >
              <span className="font-medium">💬 General Feedback</span>
              <p className="text-xs text-gray-600 mt-1">Regular complaints about service</p>
            </button>
            <button
              type="button"
              onClick={() => setReportType('INCIDENT')}
              className={cn(
                "text-left p-3 rounded-lg border-2 transition-all text-xs sm:text-sm",
                reportType === 'INCIDENT'
                  ? "border-orange-500 bg-orange-50"
                  : "border-border hover:border-orange-300"
              )}
            >
              <span className="font-medium">🚨 Serious Incident</span>
              <p className="text-xs text-gray-600 mt-1">Safety, harassment, or dangerous behavior</p>
            </button>
            <button
              type="button"
              onClick={() => setReportType('REPORT_TO_NTSA')}
              className={cn(
                "text-left p-3 rounded-lg border-2 transition-all text-xs sm:text-sm",
                reportType === 'REPORT_TO_NTSA'
                  ? "border-red-500 bg-red-50"
                  : "border-border hover:border-red-300"
              )}
            >
              <span className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                🚔 Report to NTSA
              </span>
              <p className="text-xs text-gray-600 mt-1">
                Vehicle safety violations, reckless driving, licensing issues
              </p>
            </button>
          </div>
        </div>
      )}

      {/* NTSA-specific fields */}
      {feedbackType === 'complaint' && reportType === 'REPORT_TO_NTSA' && (
        <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-800 font-semibold">
            📋 NTSA Reporting Details (helps authorities take action)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="incidentDate" className="text-xs">Incident Date</Label>
              <input
                id="incidentDate"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="incidentTime" className="text-xs">Time</Label>
              <input
                id="incidentTime"
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="vehicleNumber" className="text-xs">Vehicle Plate Number</Label>
            <input
              id="vehicleNumber"
              type="text"
              placeholder="e.g., KAA 123B"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="w-full rounded-md border px-2 py-1.5 text-xs uppercase"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="crewDetails" className="text-xs">Crew Details (if identifiable)</Label>
            <input
              id="crewDetails"
              type="text"
              placeholder="Driver/conductor name, ID, or description"
              value={crewDetails}
              onChange={(e) => setCrewDetails(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evidence" className="text-xs">Evidence (photos, videos URL)</Label>
            <input
              id="evidence"
              type="text"
              placeholder="Links to evidence if available"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-xs"
            />
          </div>
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
          <Label htmlFor="message" className="text-sm">Your Message</Label>
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
            "min-h-[100px] resize-none text-sm",
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
        <div className="p-3 bg-muted rounded-lg text-xs sm:text-sm text-muted-foreground">
          <p className="font-medium mb-1">Please complete the following:</p>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {!selectedRouteId && <li>Select a route</li>}
            {!selectedVehicleId && <li>Select a vehicle</li>}
            {!feedbackType && <li>Select a feedback type (Compliment or Complaint)</li>}
            {!messageValid && <li>Write a message between 1 and 200 characters</li>}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:flex-1 text-sm"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={!canSubmit}
          className="w-full sm:flex-1 text-sm"
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
