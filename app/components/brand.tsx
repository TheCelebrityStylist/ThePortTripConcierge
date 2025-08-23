"use client";

import Image from "next/image";

interface BrandWordmarkProps {
  className?: string;
}

/** Full PortTrip wordmark (uses /public/logo.svg) */
export function BrandWordmark({ className = "h-6 w-auto" }: BrandWordmarkProps) {
  return (
    <Image
      src="/logo.svg"
      alt="PortTrip"
      width={160}
      height={32}
      priority
      className={className}
    />
  );
}

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Circular PortTrip mark (uses /public/logo-mark.svg) */
export function BrandMark({ size = 36, className = "" }: BrandMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white/10 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/logo-mark.svg"
        alt="PortTrip"
        width={Math.floor(size * 0.72)}
        height={Math.floor(size * 0.72)}
        className="opacity-90"
      />
    </span>
  );
}


