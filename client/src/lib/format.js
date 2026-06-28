import { getCurrency } from "./settings.js";

export function formatHours(minutes) {
  return `${(minutes / 60).toFixed(2)} h`;
}

// HH:MM:SS from a total number of seconds — used for live/elapsed timers.
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatMoney(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: getCurrency(),
  }).format(amount ?? 0);
}
