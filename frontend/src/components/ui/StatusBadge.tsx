import { cn } from "../../lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const colors =
    normalized === "COMPLETED" || normalized === "OK" || normalized === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "PENDING" || normalized === "DISCREPANCY" || normalized === "REVERSED_PENDING_REVIEW"
        ? "bg-amber-50 text-amber-700"
        : normalized === "REVERSED"
          ? "bg-slate-100 text-slate-600"
          : "bg-rose-50 text-rose-700";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", colors)}>{normalized.replaceAll("_", " ")}</span>;
}
