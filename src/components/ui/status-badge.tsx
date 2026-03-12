import { clsx } from "clsx";

interface StatusBadgeProps {
  label: string;
  colorClass: string;
  className?: string;
}

export function StatusBadge({ label, colorClass, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "badge",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
