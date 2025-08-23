"use client";

import Image from "next/image";

export function BrandWordmark({ className = "h-6 w-auto" }: { className?: string }) {
  // Horizontal logo (e.g., wordmark)
  return (
    <Image
      src="/logo.svg"
      alt="PortTrip"
      width={200}
      height={40}
      priority
      className={className}
    />
  );
}

export function BrandMark(
  { size = 36, className = "" }: { size?: number; className?: string }
) {
  // Square icon, shown in a subtle rounded pill so it visually matches the UI.
  const inner = Math.floor(size * 0.78);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white/10 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/logo-mark.svg"
        alt="PortTrip"
        width={inner}
        height={inner}
        className="opacity-95"
      />
    </span>
  );
}


