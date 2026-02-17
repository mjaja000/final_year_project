import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import StarRating from "./StarRating";

const categoriesList = ["Speeding", "Overcharging", "Harassment", "Loud Music"] as const;

const complaintSchema = z
  .object({
    plateNumber: z.string().min(1, "Plate number is required"),
    categories: z.array(z.string()).optional(),
    rating: z.number().min(0).max(5).optional(),
    details: z.string().optional(),
  })
  .refine((data) => (data.categories?.length || 0) > 0 || (data.rating && data.rating > 0), {
    message: "Select at least one category or give a rating",
    path: ["categories"],
  });

export type ComplaintFormData = z.infer<typeof complaintSchema>;

type Props = {
  plateOptions?: string[];
  onSubmit?: (data: ComplaintFormData) => void;
  className?: string;
};

export default function ComplaintForm({ plateOptions = [], onSubmit, className = "" }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { plateNumber: "", categories: [], rating: 0, details: "" },
  });

  const watchedCategories = watch("categories") || [];
  const watchedRating = watch("rating") || 0;

  const [plateQuery, setPlateQuery] = useState("");

  const filteredPlates = useMemo(() => {
    const q = plateQuery.trim().toLowerCase();
    if (!q) return plateOptions;
    return plateOptions.filter((p) => p.toLowerCase().includes(q));
  }, [plateOptions, plateQuery]);

  function toggleCategory(cat: string) {
    const next = new Set(watchedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    const arr = Array.from(next);
    setValue("categories", arr, { shouldDirty: true, shouldTouch: true });
  }

  function submit(data: ComplaintFormData) {
    onSubmit?.(data);
    // default demo behavior: log to console
    console.log("Complaint submitted:", data);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className={`max-w-lg mx-auto p-4 space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Matatu Plate Number</label>
        <div className="relative">
          <input
            {...register("plateNumber")}
            value={undefined}
            onChange={(e) => {
              setValue("plateNumber", e.target.value);
              setPlateQuery(e.target.value);
            }}
            list="plates-list"
            placeholder="Search or type plate number"
            className="w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
          />
          <datalist id="plates-list">
            {filteredPlates.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        {errors.plateNumber && <p className="text-xs text-red-600 mt-1">{errors.plateNumber.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Categories</label>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((cat) => {
            const active = watchedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200"
                }`}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>
        {errors.categories && <p className="text-xs text-red-600 mt-1">{(errors.categories as any).message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <StarRating
          value={watchedRating}
          onChange={(v) => setValue("rating", v, { shouldDirty: true, shouldTouch: true })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
        <textarea
          {...register("details")}
          rows={4}
          placeholder="Describe what happened (optional)"
          className="w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
        >
          Submit Complaint
        </button>
      </div>
    </form>
  );
}
