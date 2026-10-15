import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: string, currency: string) {
  const raw = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return `${currency} —`;
  const [, sign, integer, rawFraction = ""] = match;
  const fraction = rawFraction.padEnd(2, "0");
  const minimumFractionDigits = Math.min(20, Math.max(2, fraction.length));
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  });
  const template = formatter.formatToParts(sign ? -1 : 1);
  const integerValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(BigInt(integer));
  let hasWrittenInteger = false;
  return template
    .map((part) => {
      if (part.type === "integer") {
        if (hasWrittenInteger) return "";
        hasWrittenInteger = true;
        return integerValue;
      }
      if (part.type === "fraction") return fraction.slice(0, minimumFractionDigits);
      if (part.type === "decimal" && minimumFractionDigits === 0) return "";
      return part.value;
    })
    .join("");
}

export function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
