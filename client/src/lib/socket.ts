import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  const port = import.meta.env.VITE_SOCKET_PORT || 5000;
  let userId = "";
  try {
    const userData = JSON.parse(localStorage.getItem("oriveo_user") || "{}");
    userId = userData._id || "";
  } catch { /* localStorage corrupted, proceed without userId */ }
  socket = io(`ws://${window.location.hostname}:${port}`, {
    auth: { token },
    query: { userId },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type NotificationType =
  | "emergency"
  | "high_severity"
  | "inbound_received"
  | "inbound_completed"
  | "report_ready"
  | "call_failed"
  | "follow_up_needed"
  | "appointment_reminder"
  | "system_alert"
  | "call_transferred";

export interface NotificationData {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  call?: { _id: string; status: string };
  patient?: { _id: string; name: string; phone: string };
  read: boolean;
  readAt?: string;
  createdAt: string;
}
