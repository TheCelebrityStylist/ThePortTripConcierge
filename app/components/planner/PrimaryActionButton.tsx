"use client";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function PrimaryActionButton({ label, onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
