import React from "react";

interface GramRideLogoProps {
  size?: "sm" | "md" | "lg";
  brandName?: string;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Minimal, transparent-background GramRide AI brand mark combining:
 * - Dark blue location pin silhouette
 * - Integrated minimal front-facing bus cabin
 * - Emerald green winding road leading to the pin tip
 */
export const GramRideLogo: React.FC<GramRideLogoProps> = ({
  size = "sm",
  brandName = "GramRide AI",
  showWordmark = true,
  className = "",
}) => {
  const iconDimensions =
    size === "lg" ? "w-20 h-20 sm:w-24 sm:h-24" : size === "md" ? "w-10 h-10" : "w-8 h-8";

  const textSize =
    size === "lg"
      ? "text-3xl sm:text-4xl font-extrabold tracking-tight"
      : size === "md"
      ? "text-lg font-extrabold tracking-tight"
      : "text-base sm:text-lg font-extrabold tracking-tight";

  // Split trailing "AI" so "GramRide" stays dark blue and "AI" renders in emerald green
  const hasAiSuffix = brandName.endsWith(" AI");
  const primaryWord = hasAiSuffix ? brandName.slice(0, -3) : brandName;

  return (
    <span
      className={`inline-flex items-center ${
        size === "lg" ? "flex-col gap-3 text-center" : "gap-2"
      } bg-transparent select-none ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions} shrink-0 bg-transparent`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gramride-pin-blue" x1="12" y1="4" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F2942" />
          </linearGradient>
          <linearGradient id="gramride-road-emerald" x1="20" y1="36" x2="44" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer Location Pin (Dark Blue, transparent backdrop) */}
        <path
          d="M32 3C18.745 3 8 13.745 8 27C8 42.15 27.62 57.15 31.02 59.64C31.6 60.07 32.4 60.07 32.98 59.64C36.38 57.15 56 42.15 56 27C56 13.745 45.255 3 32 3Z"
          fill="url(#gramride-pin-blue)"
        />

        {/* Emerald Green Winding Road merging toward the pin tip */}
        <path
          d="M20.5 39.5C23.5 36.2 28.2 35.8 32 35.8C35.8 35.8 40.5 36.2 43.5 39.5L34.4 55.6C33.3 57.5 30.7 57.5 29.6 55.6L20.5 39.5Z"
          fill="url(#gramride-road-emerald)"
        />
        {/* Crisp dashed center lane on the road */}
        <path
          d="M32 39.5V53.5"
          stroke="#ECFDF5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3.2 3.2"
        />

        {/* Minimal Bus Body nested cleanly inside the pin crown */}
        <rect x="20" y="14" width="24" height="20" rx="5" fill="#FFFFFF" />
        {/* Bus Side Mirrors */}
        <rect x="17.2" y="19" width="2" height="5.5" rx="1" fill="#10B981" />
        <rect x="44.8" y="19" width="2" height="5.5" rx="1" fill="#10B981" />
        {/* Panoramic Windshield */}
        <rect x="22.8" y="17" width="18.4" height="8.5" rx="2.2" fill="#0F2942" />
        {/* Emerald Top Destination Strip */}
        <rect x="26.5" y="15" width="11" height="1.6" rx="0.8" fill="#10B981" />
        {/* Twin Headlights + Grille */}
        <circle cx="24.5" cy="29.5" r="1.7" fill="#059669" />
        <circle cx="39.5" cy="29.5" r="1.7" fill="#059669" />
        <rect x="28.5" y="28.8" width="7" height="1.5" rx="0.75" fill="#0F2942" />
        {/* Bus Wheels */}
        <rect x="22.5" y="33.5" width="3.8" height="2.4" rx="1" fill="#0F2942" />
        <rect x="37.7" y="33.5" width="3.8" height="2.4" rx="1" fill="#0F2942" />
      </svg>

      {showWordmark && (
        <span className={`font-display leading-none ${textSize}`}>
          <span className="text-[#0F2942]">{primaryWord}</span>
          {hasAiSuffix && <span className="text-emerald-600 ml-1">AI</span>}
        </span>
      )}
    </span>
  );
};
