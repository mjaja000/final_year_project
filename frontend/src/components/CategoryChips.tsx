import React from "react";
import { INCIDENT_CATEGORIES } from "@/lib/reportSchema";

type CategoryChipsProps = {
  value?: string;
  onChange?: (category: string) => void;
  className?: string;
};

export default function CategoryChips({ value, onChange, className = "" }: CategoryChipsProps) {
  return (
    <fieldset className={`space-y-2 ${className}`}>
      <legend className="block text-sm font-medium text-gray-700 mb-2">
        Incident Category
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INCIDENT_CATEGORIES.map((category) => {
          const isActive = value === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange?.(category)}
              aria-pressed={isActive}
              aria-label={`Report ${category} incident`}
              className={`
                min-h-[48px] px-4 py-2 rounded-lg text-sm font-medium
                transition-all border-2 focus:outline-none focus:ring-2 focus:ring-offset-1
                ${
                  isActive
                    ? "bg-red-600 text-white border-red-600 focus:ring-red-400"
                    : "bg-white text-gray-700 border-gray-200 hover:border-red-300 focus:ring-red-400"
                }
              `}
            >
              {category}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
