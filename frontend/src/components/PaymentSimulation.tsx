import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Smartphone, Loader2, AlertCircle, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { validateVehicleNumber } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import DigitalTicket from '@/components/DigitalTicket';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface PaymentSimulationProps {
  initialRouteId?: string;
  initialVehicleNumber?: string;
  initialRouteName?: string;
  initialRouteFrom?: string;
  initialRouteTo?: string;
  initialRouteFare?: number;
  onBack: () => void;
}

type RouteOption = {
  id: string;
  name: string;
  from: string;
  to: string;
  fare: number;
};

const PaymentSimulation = ({
  initialRouteId,
  initialVehicleNumber,
  initialRouteName,
  initialRouteFrom,
  initialRouteTo,
  initialRouteFare,
  onBack,
}: PaymentSimulationProps) => {
  const [vehicleNumber, setVehicleNumber] = useState((initialVehicleNumber ?? '').toUpperCase());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(initialRouteId ?? '');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeVehicles, setRouteVehicles] = useState<string[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(initialVehicleNumber ?? '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<{ sent: boolean; error: string | null } | null>(null);
  const [driverWhatsappStatus, setDriverWhatsappStatus] = useState<{ sent: boolean; error: string | null } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();
  const [pollingId, setPollingId] = useState<number | null>(null);
  const paymentMode = String(import.meta.env.VITE_PAYMENT_MODE || 'mpesa').toLowerCase();
  const useLiveMpesa = paymentMode !== 'simulation' && paymentMode !== 'mock';

  const initialRouteFallback = useMemo<RouteOption | null>(() => {
    if (!initialRouteId) {
      return null;
    }

    return {
      id: initialRouteId,
      name: initialRouteName || `Route ${initialRouteId}`,
      from: initialRouteFrom || '',
      to: initialRouteTo || '',
      fare: Number(initialRouteFare ?? 0),
    };
  }, [initialRouteId, initialRouteName, initialRouteFrom, initialRouteTo, initialRouteFare]);

  useEffect(() => {
    let active = true;
    const loadRoutes = async () => {
      setRoutesLoading(true);
      try {
        const routesRes = await api.routes.getAll();
        const routeList = Array.isArray(routesRes)
          ? routesRes
          : Array.isArray((routesRes as any)?.routes)
            ? (routesRes as any).routes
            : [];

        const mapped = routeList.map((r: any) => ({
          id: String(r.id),
          name: r.route_name || r.routeName || `Route ${r.id}`,
          from: r.start_location || r.startLocation || '',
          to: r.end_location || r.endLocation || '',
          fare: Number(r.base_fare ?? r.baseFare ?? r.price ?? 0),
        }));

        if (active) {
          setRoutes(mapped);
        }
      } catch (error: any) {
        if (active) {
          setRoutes([]);
        }
      } finally {
        if (active) {
          setRoutesLoading(false);
        }
      }
    };

    loadRoutes();
    return () => {
      active = false;
    };
  }, []);

  const availableRoutes = useMemo(() => {
    if (!initialRouteFallback) {
      return routes;
    }
    const exists = routes.some((r) => r.id === initialRouteFallback.id);
    return exists ? routes : [initialRouteFallback, ...routes];
  }, [routes, initialRouteFallback]);

  const vehicleLocked = Boolean(initialVehicleNumber);

  useEffect(() => {
    if (!selectedRouteId && availableRoutes.length > 0) {
      setSelectedRouteId(availableRoutes[0].id);
    }
  }, [availableRoutes, selectedRouteId]);

  useEffect(() => {
    let active = true;
    const loadVehicles = async () => {
      if (!selectedRouteId) {
        setRouteVehicles([]);
        return;
      }

      if (!vehicleLocked) {
        setSelectedVehicle('');
        setVehicleNumber('');
      }

      setVehiclesLoading(true);
      try {
        const vehiclesRes = await api.vehicles.getByRoute(Number(selectedRouteId));
        const vehicleList = Array.isArray(vehiclesRes)
          ? vehiclesRes
          : Array.isArray((vehiclesRes as any)?.vehicles)
            ? (vehiclesRes as any).vehicles
            : [];

        const mapped = vehicleList
          .map((v: any) => v.registration_number || v.registration || v.number || '')
          .filter((value: string) => Boolean(value));

        if (active) {
          setRouteVehicles(mapped);
        }
      } catch (error: any) {
        if (active) {
          setRouteVehicles([]);
        }
      } finally {
        if (active) {
          setVehiclesLoading(false);
        }
      }
    };

    loadVehicles();
    return () => {
      active = false;
    };
  }, [selectedRouteId, vehicleLocked]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }
    setVehicleNumber(selectedVehicle.toUpperCase());
  }, [selectedVehicle]);

  const vehicleValid = validateVehicleNumber(vehicleNumber);
  const phoneValid = phoneNumber.trim().length >= 9;
  const selectedRoute = availableRoutes.find((r) => r.id === selectedRouteId);
  const fare = selectedRoute?.fare ?? initialRouteFallback?.fare ?? 0;
  const pollIntervalMs = useLiveMpesa ? 1500 : 1000;
  const refreshEveryAttempts = useLiveMpesa ? 3 : 1;

  const showPaymentToast = ({
    title,
    description,
    variant = 'default',
  }: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => {
    toast({
      title,
      description,
      variant,
      duration: 5000,
      className: cn(
        'rounded-xl border-2 p-5 pr-10 shadow-2xl',
        variant === 'destructive'
          ? 'border-red-400 bg-gradient-to-br from-red-50 to-rose-50 text-red-900'
          : 'border-emerald-300 bg-gradient-to-br from-white to-emerald-50 text-foreground'
      ),
    });
  };

  const pollPaymentUntilResolved = (paymentId: number, maxAttempts = 90) => {
    let attempts = 0;
    const id = window.setInterval(async () => {
      attempts += 1;
      try {
        const shouldRefresh = useLiveMpesa && (attempts === 1 || attempts % refreshEveryAttempts === 0);
        const statusRes = await api.payments.getById(paymentId, shouldRefresh);
        const payment = statusRes.payment || statusRes;

        if (payment?.status === 'completed') {
          window.clearInterval(id);
          const ref = statusRes.ticket?.reference || payment.transaction_id || `TKT-${payment.id}`;
          setTransactionRef(ref);
          setPaidAt(String(statusRes.ticket?.paidAt || payment.updated_at || new Date().toISOString()));
          setWhatsappStatus(statusRes.whatsapp_status || null);
          setDriverWhatsappStatus(statusRes.driver_whatsapp_status || null);
          setPaymentStatus('success');
          setIsProcessing(false);
          showPaymentToast({ title: 'Payment Confirmed', description: `Ticket: ${ref}` });
          setTimeout(() => setShowTicket(true), 300);
          return;
        }

        if (payment?.status === 'failed') {
          window.clearInterval(id);
          setIsProcessing(false);
          setPaymentStatus('failed');
          showPaymentToast({
            title: 'Payment Failed',
            description: payment.failure_reason || 'M-Pesa payment was not completed.',
            variant: 'destructive',
          });
          return;
        }
      } catch {
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(id);
        setIsProcessing(false);
        setPaymentStatus('idle');
        showPaymentToast({
          title: 'Still Waiting',
          description: 'Complete the M-Pesa prompt on your phone. Ticket will appear once verified.',
        });
      }
    }, pollIntervalMs);

    setPollingId(id);
  };

  const handlePayment = async () => {
    if (!vehicleValid) {
      showPaymentToast({
        title: "Invalid Vehicle Number",
        description: "Please enter a valid vehicle registration number.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneValid) {
      showPaymentToast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number for M-Pesa confirmation.",
        variant: "destructive",
      });
      return;
    }

    const routeIdNumber = Number(selectedRouteId);
    if (!selectedRouteId || Number.isNaN(routeIdNumber)) {
      showPaymentToast({
        title: "Select a Route",
        description: "Please choose a valid route before paying.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      if (useLiveMpesa) {
        const res = await api.payments.initiate({
          phone: phoneNumber,
          amount: fare,
          vehicle: vehicleNumber,
          route: routeIdNumber,
        });

        if (res.success && res.payment_id) {
          setPaymentStatus('processing');
          showPaymentToast({
            title: 'STK Prompt Sent',
            description: 'Check your phone for the M-Pesa prompt and enter your PIN.',
          });
          pollPaymentUntilResolved(Number(res.payment_id), 120);
        } else {
          setPaymentStatus('failed');
          showPaymentToast({
            title: 'Payment Failed',
            description: res.message || 'Failed to initiate M-Pesa prompt.',
            variant: 'destructive',
          });
          setIsProcessing(false);
        }
        return;
      }

      // Call backend to create simulated payment (backend also sends WhatsApp/SMS)
      const payload = {
        routeId: routeIdNumber,
        amount: fare,
        phoneNumber: phoneNumber,
      };

      const res = await api.payments.create(payload);
      const createdPayment = res.payment;

      showPaymentToast({
        title: 'Payment Initiated',
        description: 'M-Pesa STK prompt (simulated). You will receive a WhatsApp confirmation when payment completes.',
      });

      // If backend reports notifications status, show it
      if (res.notificationsSent && res.notificationsSent.whatsapp) {
        showPaymentToast({ title: 'WhatsApp Confirmation Sent', description: "You'll receive a message shortly." });
      }

      // Poll for payment completion/transaction id
      pollPaymentUntilResolved(Number(createdPayment.id), 15);
    } catch (error: any) {
      setIsProcessing(false);
      setPaymentStatus('failed');
      showPaymentToast({ title: 'Payment Failed', description: error.message || 'Payment could not be initiated.', variant: 'destructive' });
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
    const selRoute = selectedRoute || initialRouteFallback || {
      id: selectedRouteId || 'unknown',
      name: initialRouteName || 'Route',
      from: initialRouteFrom || '',
      to: initialRouteTo || '',
      fare: fare,
    };
    return (
      <DigitalTicket
        route={selRoute}
        vehicleNumber={vehicleNumber}
        transactionId={transactionRef || undefined}
        paidAt={paidAt || undefined}
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
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {useLiveMpesa ? 'Live M-Pesa Payment' : 'Payment Simulation (No real money involved)'}
        </p>
        <div className="mt-2 mb-4">
          {Boolean(initialRouteId) ? (
            <div className="w-full rounded-md border px-3 py-2 bg-secondary/40 text-sm text-foreground">
              {selectedRoute?.name || initialRouteName || `Route ${initialRouteId}`} — {selectedRoute?.from || initialRouteFrom || ''} → {selectedRoute?.to || initialRouteTo || ''} — KES {fare}
            </div>
          ) : (
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-background text-sm"
            >
              {availableRoutes.length === 0 && routesLoading && (
                <option value="">Loading routes...</option>
              )}
              {availableRoutes.length === 0 && !routesLoading && (
                <option value="">No routes available</option>
              )}
              {availableRoutes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.from} → {r.to} — KES {r.fare}</option>
              ))}
            </select>
          )}
        </div>
        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">KES {fare}</p>
      </div>

      {/* Vehicle Number */}
      <div className="space-y-2">
        <Label htmlFor="paymentVehicle" className="text-sm">Vehicle Number</Label>
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-background text-sm"
          disabled={vehicleLocked}
        >
          <option value="">Select a vehicle from this route</option>
          {vehiclesLoading && <option value="">Loading vehicles...</option>}
          {!vehiclesLoading && routeVehicles.length === 0 && (
            <option value="">No vehicles available</option>
          )}
          {routeVehicles.map((vehicle) => (
            <option key={vehicle} value={vehicle}>{vehicle}</option>
          ))}
        </select>
        <Input
          id="paymentVehicle"
          type="text"
          placeholder="e.g., KCA 123X"
          value={vehicleNumber}
          onChange={(e) => {
            setVehicleNumber(e.target.value.toUpperCase());
            if (!vehicleLocked) {
              setSelectedVehicle('');
            }
          }}
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
      <div
        className={cn(
          "rounded-xl border p-4 sm:p-5 shadow-sm transition-all",
          paymentStatus === 'success' && "border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50",
          paymentStatus === 'failed' && "border-red-300 bg-gradient-to-br from-red-50 to-rose-50",
          paymentStatus === 'processing' && "border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50",
          paymentStatus === 'idle' && "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={cn(
              "shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
              paymentStatus === 'success' && "bg-emerald-100 text-emerald-700",
              paymentStatus === 'failed' && "bg-red-100 text-red-700",
              paymentStatus === 'processing' && "bg-blue-100 text-blue-700",
              paymentStatus === 'idle' && "bg-slate-200 text-slate-700"
            )}
          >
            {paymentStatus === 'success' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : paymentStatus === 'failed' ? (
              <XCircle className="h-6 w-6" />
            ) : paymentStatus === 'processing' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Smartphone className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base sm:text-lg text-foreground">
              {paymentStatus === 'success'
                ? 'Payment Confirmed'
                : paymentStatus === 'failed'
                  ? 'Payment Failed'
                  : paymentStatus === 'processing'
                    ? 'Awaiting M-Pesa Confirmation'
                    : useLiveMpesa
                      ? 'M-Pesa STK Prompt'
                      : 'M-Pesa Payment Simulation'}
            </p>

            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {paymentStatus === 'success'
                ? 'Your payment has been verified successfully and your ticket is ready.'
                : paymentStatus === 'failed'
                  ? 'We could not complete this transaction. Please try again.'
                  : paymentStatus === 'processing'
                    ? 'Check your phone, enter your M-Pesa PIN, and wait for confirmation.'
                    : useLiveMpesa
                      ? 'A real STK prompt will be sent to your phone.'
                      : 'This is a demonstration — no real money will be charged.'}
            </p>

            <div className="mt-3 space-y-1.5">
              {paymentStatus === 'processing' && (
                <p className="text-xs sm:text-sm font-medium text-blue-700 flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" /> Processing in progress...
                </p>
              )}

              {paymentStatus === 'success' && transactionRef && (
                <p className="text-xs sm:text-sm text-emerald-700 font-semibold break-all">
                  Transaction ref: <span className="font-mono">{transactionRef}</span>
                </p>
              )}

              {whatsappStatus && (
                <p className={cn(
                  "text-xs sm:text-sm font-medium",
                  whatsappStatus.sent ? "text-emerald-700" : "text-amber-700"
                )}>
                  {whatsappStatus.sent
                    ? "✓ Customer WhatsApp notification sent"
                    : `⚠ Customer WhatsApp failed: ${whatsappStatus.error || "Unknown error"}`}
                </p>
              )}

              {driverWhatsappStatus && (
                <p className={cn(
                  "text-xs sm:text-sm font-medium",
                  driverWhatsappStatus.sent ? "text-emerald-700" : "text-amber-700"
                )}>
                  {driverWhatsappStatus.sent
                    ? "✓ Driver WhatsApp notification sent"
                    : `⚠ Driver WhatsApp failed: ${driverWhatsappStatus.error || "Unknown error"}`}
                </p>
              )}
            </div>
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
