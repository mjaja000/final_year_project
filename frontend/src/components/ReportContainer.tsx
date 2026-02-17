import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema, ReportData, ReportType } from "@/lib/reportSchema";
import StarRating from "./StarRating";
import CategoryChips from "./CategoryChips";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  plateOptions?: string[];
  onSubmit?: (data: ReportData) => Promise<void> | void;
  className?: string;
};

export default function ReportContainer({ plateOptions = [], onSubmit, className = "" }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reportType, setReportType] = useState<ReportType>("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [plateQuery, setPlateQuery] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ReportData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "GENERAL",
      plateNumber: "",
      rating: 0,
      details: "",
    } as any,
    mode: "onChange",
  });

  const watchedPlateNumber = watch("plateNumber");
  const watchedRating = watch("rating");
  const watchedCategory = watch("category");
  const watchedDetails = watch("details");

  const filteredPlates = useMemo(() => {
    const q = plateQuery.trim().toLowerCase();
    if (!q) return plateOptions;
    return plateOptions.filter((p) => p.toLowerCase().includes(q));
  }, [plateOptions, plateQuery]);

  const canProceedStep1 = watchedPlateNumber.trim().length > 0;

  async function handleStep1Next() {
    if (canProceedStep1) {
      setStep(2);
    }
  }

  function handleStep2Back() {
    setStep(1);
  }

  async function handleFormSubmit(data: ReportData) {
    setIsLoading(true);
    try {
      // Optimistic UI: show success toast before completing
      toast.success("Report submitted successfully!", {
        description: `Your ${data.reportType.toLowerCase()} report has been recorded.`,
      });

      // Call the onSubmit function if provided, or default behavior
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log("Report data:", data);
      }

      // Reset form after successful submission
      setStep(1);
      setReportType("GENERAL");
      setValue("plateNumber", "");
      setValue("rating", 0);
      setValue("category", undefined);
      setValue("details", "");
    } catch (error) {
      toast.error("Failed to submit report", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleReportTypeChange(type: ReportType) {
    setReportType(type);
    setValue("reportType", type, { shouldValidate: true });
    // Reset conditional fields
    if (type === "GENERAL") {
      setValue("rating", 0, { shouldValidate: true });
    } else {
      setValue("rating", 0, { shouldValidate: true });
    }
  }

  return (
    <div className={`max-w-2xl mx-auto p-4 space-y-4 ${className}`}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className={`flex-1 h-2 rounded-full ${step === 1 ? "bg-indigo-600" : "bg-gray-200"}`} />
        <span className="mx-2 text-sm font-medium text-gray-600">
          Step {step} of 2
        </span>
        <div className={`flex-1 h-2 rounded-full ${step === 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* STEP 1: Matatu Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Select Matatu
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Enter or search for the matatu plate number you want to report.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matatu Plate Number
              </label>
              <div className="relative">
                <input
                  {...register("plateNumber")}
                  onChange={(e) => {
                    setValue("plateNumber", e.target.value);
                    setPlateQuery(e.target.value);
                  }}
                  list="plates-list"
                  placeholder="E.g., KAA-123A"
                  autoComplete="off"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  aria-label="Matatu plate number"
                />
                <datalist id="plates-list">
                  {filteredPlates.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              {errors.plateNumber && (
                <p className="text-xs text-red-600 mt-2">
                  {errors.plateNumber.message}
                </p>
              )}
            </div>

            {/* Report Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["GENERAL", "INCIDENT"] as const).map((type) => {
                  const isActive = reportType === type;
                  const bgColor =
                    type === "INCIDENT" ? "bg-red-600" : "bg-emerald-600";
                  const borderColor =
                    type === "INCIDENT" ? "border-red-600" : "border-emerald-600";

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleReportTypeChange(type)}
                      aria-pressed={isActive}
                      className={`
                        min-h-[48px] rounded-lg font-medium transition-all border-2
                        focus:outline-none focus:ring-2 focus:ring-offset-1
                        ${
                          isActive
                            ? `${bgColor} text-white ${borderColor} focus:ring-gray-400`
                            : `bg-white text-gray-700 border-gray-200 hover:border-gray-300 focus:ring-gray-400`
                        }
                      `}
                    >
                      {type === "GENERAL" ? "💬 Feedback" : "⚠️ Incident"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={!canProceedStep1}
              className="w-full min-h-[48px] mt-6 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: Form Content */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {reportType === "GENERAL" ? "Share Your Feedback" : "Report Incident"}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {reportType === "GENERAL"
                  ? "Rate your experience with this matatu service."
                  : "Provide details about the incident you experienced."}
              </p>

              <input
                type="hidden"
                {...register("reportType")}
              />

              {/* Plate Number Display */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Reporting Matatu:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {watchedPlateNumber}
                </p>
              </div>
            </div>

            {/* GENERAL: Star Rating */}
            {reportType === "GENERAL" && (
              <div>
                <StarRating
                  value={watchedRating}
                  onChange={(v) => setValue("rating", v, { shouldValidate: true })}
                  colorClass="text-emerald-500"
                  label="Rate this matatu service"
                />
                {errors && "rating" in errors && errors.rating && (
                  <p className="text-xs text-red-600 mt-2">
                    {errors.rating.message}
                  </p>
                )}
              </div>
            )}

            {/* INCIDENT: Category Chips */}
            {reportType === "INCIDENT" && (
              <CategoryChips
                value={watchedCategory}
                onChange={(v) => setValue("category", v as any, { shouldValidate: true })}
              />
            )}

            {/* Details Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                {...register("details")}
                rows={4}
                placeholder="Describe what happened (optional but helpful)"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>

            {/* Submit & Back Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStep2Back}
                disabled={isLoading}
                className="flex-1 min-h-[48px] bg-gray-200 text-gray-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-300 disabled:opacity-50 transition"
              >
                <ChevronLeft size={20} /> Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 min-h-[48px] bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
