import { AlertTriangle, PhoneIncoming, PhoneCall, FileText, XCircle, Clock, Calendar, Info, CheckCheck } from "lucide-react";

export const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  emergency: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Emergency" },
  high_severity: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", label: "High Severity" },
  inbound_received: { icon: PhoneIncoming, color: "text-blue-600", bg: "bg-blue-50", label: "Inbound Call" },
  inbound_completed: { icon: PhoneCall, color: "text-green-600", bg: "bg-green-50", label: "Call Completed" },
  report_ready: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50", label: "Report Ready" },
  call_failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Call Failed" },
  follow_up_needed: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Follow-up Needed" },
  appointment_reminder: { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50", label: "Appointment" },
  system_alert: { icon: Info, color: "text-gray-600", bg: "bg-gray-50", label: "System Alert" },
  call_transferred: { icon: PhoneCall, color: "text-blue-600", bg: "bg-blue-50", label: "Call Transferred" },
  appointment_pending: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", label: "Appointment" },
  appointment_confirmed: { icon: CheckCheck, color: "text-green-600", bg: "bg-green-50", label: "Appointment Confirmed" },
};

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
