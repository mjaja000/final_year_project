import React from "react";

type StarRatingProps = {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  className?: string;
  label?: string;
  colorClass?: string;
};

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 24,
  className = "",
  label = "Rate this report",
  colorClass = "text-amber-500",
}: StarRatingProps) {
  const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange?.(rating);
    }
  };

  return (
    <div
      className={`inline-flex gap-2 items-center ${className}`}
      role="radiogroup"
      aria-label={label}
    >
      {Array.from({ length: max }).map((_, idx) => {
        const i = idx + 1;
        const filled = i <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            aria-checked={filled}
            aria-label={`${i} star${i > 1 ? "s" : ""} - ${label}`}
            role="radio"
            tabIndex={i === 1 ? 0 : -1}
            className={`transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center ${
              filled ? `${colorClass}` : "text-gray-300 hover:text-gray-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
