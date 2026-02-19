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
  const reportType = "GENERAL"; // Fixed to feedback only
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
      setValue("plateNumber", "");
      setValue("rating", 0);
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

        {/* Star Rating */}
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
