import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const roleLabels: Record<string, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
};

export const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  doctor: "bg-blue-100 text-blue-800",
  nurse: "bg-green-100 text-green-800",
  receptionist: "bg-orange-100 text-orange-800",
};

export const callStatusColors: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};
