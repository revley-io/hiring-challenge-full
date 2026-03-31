import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusColor: Record<string, string> = {
  captured:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
  auth: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  active:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
}
