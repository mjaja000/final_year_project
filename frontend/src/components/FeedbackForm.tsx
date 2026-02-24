import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import ComplaintService from '@/lib/complaint.service';

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
  const [incidentCategory, setIncidentCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [crewDetails, setCrewDetails] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [evidence, setEvidence] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [saccoName, setSaccoName] = useState('');
  const [ntsaPriority, setNtsaPriority] = useState<string | null>(null);
  const [ntsaCategory, setNtsaCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const ntsaOptions = [
    {
      priority: 'CRITICAL',
      category: 'Vehicle Safety Violations',
      examples: [
        'Missing three-point seatbelts',
        'Poorly mounted seats',
        'Missing anti-roll bars',
        'No conformity plate',
        'Unroadworthy vehicles operating with RSL Direct violations',
      ],
      reason: 'Core NTSA safety mandate. These issues can lead to fatal accidents.',
    },
    {
      priority: 'CRITICAL',
      category: 'Sexual Harassment & Assault',
      examples: [
        'Inappropriate physical touching',
        'Stripping or undressing incidents',
        'Sexual comments with gestures',
        'Crew blocking women from exiting',
      ],
      reason: 'NTSA can revoke PSV licenses and enforce operator compliance.',
    },
    {
      priority: 'HIGH',
      category: 'Dangerous Driving & Operations',
      examples: [
        'Speeding and reckless overtaking',
        'Overloading beyond capacity',
        'Unauthorized route deviations',
        'Forcing passengers to alight early',
      ],
      reason: 'NTSA can suspend licenses of repeat offenders and enforce safety standards.',
    },
    {
      priority: 'MEDIUM',
      category: 'Commercial Exploitation',
      examples: [
        'Mid-journey fare hikes',
        'Overcharging without refund',
        'Fare manipulation by touts',
      ],
      reason: 'Handle locally first; escalate if a pattern emerges.',
    },
    {
      priority: 'MEDIUM',
      category: 'Verbal Abuse & Harassment',
      examples: [
        'Abusive language from crew',
        'Obscene music forced on passengers',
        'Intimidation when complaining',
      ],
      reason: 'Document under consumer rights protections; escalate after multiple reports.',
    },
    {
      priority: 'LOW',
      category: 'Service Quality Issues',
      examples: [
        'Dirty or unhygienic vehicles',
        'Makeshift seats',
        'Poor customer service',
      ],
      reason: 'Track trends locally and monitor SACCO compliance.',
    },
  ];

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
  const needsNtsaSelection = feedbackType === 'complaint' && reportType === 'REPORT_TO_NTSA';
  const ntsaSelectionValid = !needsNtsaSelection || Boolean(ntsaPriority && ntsaCategory);
  const canSubmit = Boolean(
    selectedRouteId &&
    selectedVehicleId &&
    feedbackType &&
    messageValid &&
    ntsaSelectionValid &&
    !isSubmitting
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      let evidencePayload: string | undefined = evidence || undefined;
      if (reportType === 'REPORT_TO_NTSA' && evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach((file) => formData.append('files', file));

        const uploadRes = await fetch(`${api.baseURL}/api/feedback/evidence`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload evidence files');
        }

        const uploadData = await uploadRes.json();
        const fileUrls = Array.isArray(uploadData?.files)
          ? uploadData.files.map((file: any) => file.url).filter(Boolean)
          : [];

        evidencePayload = JSON.stringify({
          files: fileUrls,
          notes: evidence || undefined,
        });
      }

      const payload = {
        routeId: Number(selectedRouteId),
        vehicleId: Number(selectedVehicleId),
        feedbackType: feedbackType === 'complaint' ? 'Complaint' : 'Compliment',
        comment: message.trim(),
        reportType: feedbackType === 'complaint' ? reportType : undefined,
        ntsaPriority: reportType === 'REPORT_TO_NTSA' ? ntsaPriority : undefined,
        ntsaCategory: reportType === 'REPORT_TO_NTSA' ? ntsaCategory : undefined,
        saccoName: reportType === 'REPORT_TO_NTSA' ? saccoName : undefined,
        incidentDate: incidentDate || undefined,
        incidentTime: incidentTime || undefined,
        crewDetails: crewDetails || undefined,
        vehicleNumber: vehicleNumber || undefined,
        evidence: evidencePayload,
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
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('[FeedbackForm] Submission error:', err);
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
      <div className="text-center py-10 animate-scale-in rounded-2xl border border-emerald-200 bg-emerald-50/50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4 shadow-sm">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Thank You!
        </h3>
        <p className="text-muted-foreground mb-4">
          Your feedback has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-fade-in">
      {/* Debug Info - Only show in development */}
      {import.meta.env.DEV && (
        <div className="text-xs bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 mb-4">
          <div>Routes: {routesQuery.isLoading ? 'Loading...' : routes.length} loaded</div>
          <div>Vehicles: {vehiclesQuery.isLoading ? 'Loading...' : vehicles.length} loaded</div>
          <div>Can Submit: {canSubmit ? '✓ Yes' : '✗ No'}</div>
          {routesQuery.isError && <div className="text-red-600">❌ Routes error: {(routesQuery.error as any)?.message}</div>}
          {vehiclesQuery.isError && <div className="text-red-600">❌ Vehicles error: {(vehiclesQuery.error as any)?.message}</div>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-muted-foreground rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <span className="font-medium text-foreground">{selectedRoute?.route_name || 'Select Route'}</span>
        <span className="hidden sm:inline">•</span>
        <span>
          {(selectedRoute?.start_location || '')} {selectedRoute ? '→' : ''} {(selectedRoute?.end_location || '')}
        </span>
      </div>

      {/* Route Select */}
      <div className="space-y-2">
        <Label htmlFor="routeSelect" className="text-sm font-semibold text-slate-800">Route</Label>
        <select
          id="routeSelect"
          value={selectedRouteId ?? ''}
          onChange={(e) => {
            setSelectedRouteId(e.target.value || null);
            setSelectedVehicleId(null);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
        <Label htmlFor="vehicleSelect" className="text-sm font-semibold text-slate-800">Vehicle</Label>
        <select
          id="vehicleSelect"
          value={selectedVehicleId ?? ''}
          onChange={(e) => setSelectedVehicleId(e.target.value || null)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70"
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
        <Label className="text-sm font-semibold text-slate-800">Feedback Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setFeedbackType('compliment');
              setIncidentCategory(null);
            }}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-xs sm:text-sm shadow-sm",
              feedbackType === 'compliment'
                ? "border-success bg-success/10 text-success"
                : "border-slate-200 bg-white hover:border-success/50 hover:bg-success/5"
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
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-xs sm:text-sm shadow-sm",
              feedbackType === 'complaint'
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-slate-200 bg-white hover:border-destructive/50 hover:bg-destructive/5"
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
        <div className="space-y-2 p-4 bg-amber-50/70 rounded-xl border border-amber-200 shadow-sm">
          <Label className="text-sm font-semibold text-amber-900">Report Type</Label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setReportType('FEEDBACK');
                setNtsaPriority(null);
                setNtsaCategory(null);
              }}
              className={cn(
                "text-left p-3 rounded-xl border-2 transition-all text-xs sm:text-sm bg-white/90",
                reportType === 'FEEDBACK'
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300"
              )}
            >
              <span className="font-medium">💬 General Feedback</span>
              <p className="text-xs text-gray-600 mt-1">Regular complaints about service</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setReportType('INCIDENT');
                setNtsaPriority(null);
                setNtsaCategory(null);
              }}
              className={cn(
                "text-left p-3 rounded-xl border-2 transition-all text-xs sm:text-sm bg-white/90",
                reportType === 'INCIDENT'
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 hover:border-orange-300"
              )}
            >
              <span className="font-medium">🚨 Serious Incident</span>
              <p className="text-xs text-gray-600 mt-1">Safety, harassment, or dangerous behavior</p>
            </button>
            <button
              type="button"
              onClick={() => setReportType('REPORT_TO_NTSA')}
              className={cn(
                "text-left p-3 rounded-xl border-2 transition-all text-xs sm:text-sm bg-white/90",
                reportType === 'REPORT_TO_NTSA'
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 hover:border-red-300"
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
        <div className="space-y-3 p-4 bg-red-50/80 rounded-xl border border-red-200 shadow-sm">
          <p className="text-xs text-red-800 font-semibold">
            📋 NTSA Reporting Details (helps authorities take action)
          </p>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Priority & Complaint Category</Label>
            <div className="grid grid-cols-1 gap-2">
              {ntsaOptions.map((option) => {
                const isSelected = ntsaPriority === option.priority && ntsaCategory === option.category;
                return (
                  <button
                    key={`${option.priority}-${option.category}`}
                    type="button"
                    onClick={() => {
                      setNtsaPriority(option.priority);
                      setNtsaCategory(option.category);
                    }}
                    className={cn(
                      "text-left p-3 rounded-xl border-2 transition-all text-xs sm:text-sm bg-white",
                      isSelected
                        ? "border-red-500 bg-white"
                        : "border-slate-200 hover:border-red-300"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-red-700">{option.priority}</span>
                      <span className="font-medium">{option.category}</span>
                    </div>
                    <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                      {option.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-gray-700">{option.reason}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="incidentDate" className="text-xs">Incident Date</Label>
              <input
                id="incidentDate"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="incidentTime" className="text-xs">Time</Label>
              <input
                id="incidentTime"
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs uppercase transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="saccoName" className="text-xs">SACCO Name</Label>
            <input
              id="saccoName"
              type="text"
              placeholder="e.g., Kenya Mpya"
              value={saccoName}
              onChange={(e) => setSaccoName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evidence" className="text-xs">Evidence Notes or Links</Label>
            <input
              id="evidence"
              type="text"
              placeholder="Links to evidence if available"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evidenceFiles" className="text-xs">Upload Evidence Files</Label>
            <input
              id="evidenceFiles"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
            {evidenceFiles.length > 0 && (
              <p className="text-[11px] text-gray-600">
                Selected: {evidenceFiles.map((file) => file.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
          <Label htmlFor="message" className="text-sm font-semibold text-slate-800">Your Message</Label>
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
            "min-h-[120px] resize-none text-sm rounded-xl border-slate-300 bg-white shadow-sm focus-visible:ring-primary/30",
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
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-muted-foreground">
          <p className="font-medium mb-1">Please complete the following:</p>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {!selectedRouteId && <li>Select a route</li>}
            {!selectedVehicleId && <li>Select a vehicle</li>}
            {!feedbackType && <li>Select a feedback type (Compliment or Complaint)</li>}
            {!ntsaSelectionValid && <li>Select an NTSA priority and category</li>}
            {!messageValid && <li>Write a message between 1 and 200 characters</li>}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
        {import.meta.env.DEV && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              console.log('[TEST] Testing feedback API...');
              try {
                const testPayload = {
                  routeId: 1,
                  vehicleId: 1,
                  feedbackType: 'Complaint' as const,
                  comment: 'Test feedback from form debug button',
                };
                console.log('[TEST] Payload:', testPayload);
                const result = await ComplaintService.submitComplaint(testPayload);
                console.log('[TEST] API Success:', result);
                toast({
                  title: 'API Test Success!',
                  description: 'Feedback API is working properly',
                });
              } catch (err: any) {
                console.error('[TEST] API Error:', err);
                toast({
                  title: 'API Test Failed',
                  description: err.message,
                  variant: 'destructive',
                });
              }
            }}
            className="text-xs"
          >
            🧪 Test API
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:flex-1 text-sm rounded-xl h-11"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={!canSubmit}
          className="w-full sm:flex-1 text-sm rounded-xl h-11"
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
