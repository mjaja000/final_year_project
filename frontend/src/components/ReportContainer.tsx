import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reportSchema,
  ReportData,
  ReportType,
  NTSA_CATEGORIES,
  NTSA_PRIORITIES,
} from "@/lib/reportSchema";
import StarRating from "./StarRating";
import CategoryChips from "./CategoryChips";
import { toast } from "sonner";

type Props = {
  plateOptions?: string[];
  onSubmit?: (data: ReportData) => Promise<void> | void;
  className?: string;
};

export default function ReportContainer({ plateOptions = [], onSubmit, className = "" }: Props) {
  const [reportType, setReportType] = useState<ReportType>("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [plateQuery, setPlateQuery] = useState("");
  const ntsaOptions = [
    {
      priority: "CRITICAL",
      category: "Vehicle Safety Violations",
      examples: [
        "Missing three-point seatbelts",
        "Poorly mounted seats",
        "Missing anti-roll bars",
        "No conformity plate",
        "Unroadworthy vehicles operating with RSL Direct violations",
      ],
    },
    {
      priority: "CRITICAL",
      category: "Sexual Harassment & Assault",
      examples: [
        "Inappropriate physical touching",
        "Stripping or undressing incidents",
        "Sexual comments with gestures",
        "Crew blocking women from exiting",
      ],
    },
    {
      priority: "HIGH",
      category: "Dangerous Driving & Operations",
      examples: [
        "Speeding and reckless overtaking",
        "Overloading beyond capacity",
        "Unauthorized route deviations",
        "Forcing passengers to alight early",
      ],
    },
    {
      priority: "MEDIUM",
      category: "Commercial Exploitation",
      examples: [
        "Mid-journey fare hikes",
        "Overcharging without refund",
        "Fare manipulation by touts",
      ],
    },
    {
      priority: "MEDIUM",
      category: "Verbal Abuse & Harassment",
      examples: [
        "Abusive language from crew",
        "Obscene music forced on passengers",
        "Intimidation when complaining",
      ],
    },
    {
      priority: "LOW",
      category: "Service Quality Issues",
      examples: [
        "Dirty or unhygienic vehicles",
        "Makeshift seats",
        "Poor customer service",
      ],
    },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "GENERAL",
      plateNumber: "",
      rating: 0,
      ntsaPriority: undefined,
      ntsaCategory: undefined,
      details: "",
    } as any,
    mode: "onChange",
  });

  const watchedPlateNumber = watch("plateNumber");
  const watchedRating = watch("rating");
  const watchedCategory = watch("category");
  const watchedNtsaPriority = watch("ntsaPriority");
  const watchedNtsaCategory = watch("ntsaCategory");

  const filteredPlates = useMemo(() => {
    const q = plateQuery.trim().toLowerCase();
    if (!q) return plateOptions;
    return plateOptions.filter((p) => p.toLowerCase().includes(q));
  }, [plateOptions, plateQuery]);

  async function handleFormSubmit(data: ReportData) {
    setIsLoading(true);
    try {
      const reportLabels: Record<ReportType, string> = {
        GENERAL: "feedback",
        INCIDENT: "incident",
        REPORT_TO_NTSA: "report to NTSA",
      };
      // Optimistic UI: show success toast before completing
      toast.success("Report submitted successfully!", {
        description: `Your ${reportLabels[data.reportType]} has been recorded.`,
      });

      // Call the onSubmit function if provided, or default behavior
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log("Report data:", data);
      }

      // Reset form after successful submission
      setValue("plateNumber", "");
      setValue("rating", 0);
      setValue("category", undefined);
      setValue("ntsaPriority", undefined);
      setValue("ntsaCategory", undefined);
      setValue("details", "");
      setPlateQuery("");
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
    if (type !== "GENERAL") {
      setValue("rating", 0, { shouldValidate: true });
    }
    if (type !== "INCIDENT") {
      setValue("category", undefined, { shouldValidate: true });
    }
    if (type !== "REPORT_TO_NTSA") {
      setValue("ntsaPriority", undefined, { shouldValidate: true });
      setValue("ntsaCategory", undefined, { shouldValidate: true });
    }
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 space-y-6 ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <input type="hidden" {...register("reportType")} />

          {/* Matatu Selection */}
          <div>
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
            <div className="grid grid-cols-3 gap-2">
              {(["GENERAL", "INCIDENT", "REPORT_TO_NTSA"] as const).map((type) => {
                const isActive = reportType === type;
                const bgColor =
                  type === "INCIDENT"
                    ? "bg-red-600"
                    : type === "REPORT_TO_NTSA"
                      ? "bg-red-700"
                      : "bg-emerald-600";
                const borderColor =
                  type === "INCIDENT"
                    ? "border-red-600"
                    : type === "REPORT_TO_NTSA"
                      ? "border-red-700"
                      : "border-emerald-600";
                const label =
                  type === "GENERAL"
                    ? "💬 Feedback"
                    : type === "INCIDENT"
                      ? "⚠️ Incident"
                      : "🛡️ Report to NTSA";

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
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {reportType === "GENERAL"
                ? "Share Your Feedback"
                : reportType === "REPORT_TO_NTSA"
                  ? "Report to NTSA"
                  : "Report Incident"}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {reportType === "GENERAL"
                ? "Rate your experience with this matatu service."
                : reportType === "REPORT_TO_NTSA"
                  ? "Provide details for an NTSA-reportable incident."
                  : "Provide details about the incident you experienced."}
            </p>

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

          {/* NTSA: Priority and Category */}
          {reportType === "REPORT_TO_NTSA" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Priority</p>
                <div className="flex flex-wrap gap-2">
                  {NTSA_PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setValue("ntsaPriority", priority, { shouldValidate: true })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        watchedNtsaPriority === priority
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
                {errors && "ntsaPriority" in errors && errors.ntsaPriority && (
                  <p className="text-xs text-red-600 mt-2">{errors.ntsaPriority.message as string}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Complaint Category</p>
                <div className="grid grid-cols-1 gap-2">
                  {ntsaOptions.map((option) => {
                    const isSelected =
                      watchedNtsaCategory === option.category && watchedNtsaPriority === option.priority;
                    return (
                      <button
                        key={`${option.priority}-${option.category}`}
                        type="button"
                        onClick={() => {
                          setValue("ntsaPriority", option.priority, { shouldValidate: true });
                          setValue("ntsaCategory", option.category as (typeof NTSA_CATEGORIES)[number], {
                            shouldValidate: true,
                          });
                        }}
                        className={`text-left rounded-lg border-2 p-3 transition-all ${
                          isSelected
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-red-700">{option.priority}</span>
                          <span className="text-sm font-medium text-gray-900">{option.category}</span>
                        </div>
                        <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                          {option.examples.map((example) => (
                            <li key={example}>{example}</li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
                {errors && "ntsaCategory" in errors && errors.ntsaCategory && (
                  <p className="text-xs text-red-600 mt-2">{errors.ntsaCategory.message as string}</p>
                )}
              </div>
            </div>
          )}

          {/* Details Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              {...register("details")}
              rows={4}
              placeholder="Share your experience or provide additional feedback"
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    );
}
