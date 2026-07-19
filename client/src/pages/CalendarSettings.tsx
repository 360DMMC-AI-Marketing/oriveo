import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, ExternalLink, Link2Off, CheckCircle2, Loader2 } from "lucide-react";

export default function CalendarSettings() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ["calendar-status"],
    queryFn: () => api.get("/calendar/status").then((r) => r.data),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post("/calendar/disconnect"),
    onSuccess: () => {
      refetch();
      toast.success("Google Calendar disconnected");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to disconnect"),
  });

  async function handleConnect() {
    try {
      const { data } = await api.get("/calendar/auth-url");
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to get auth URL");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data } = await api.post("/calendar/sync");
      setSyncResult(data);
      toast.success("Sync completed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const connected = statusData?.connected;
  const email = statusData?.email;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar Settings</h1>
        <p className="text-muted-foreground text-sm">Sync your appointments with Google Calendar</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Connected</p>
                  {email && <p className="text-xs text-emerald-600">{email}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Calendar className="mr-1 h-4 w-4" />}
                  Sync Now
                </Button>
                <Button variant="destructive" size="sm" onClick={() => disconnectMutation.mutate()}>
                  <Link2Off className="mr-1 h-4 w-4" /> Disconnect
                </Button>
              </div>

              {syncResult && (
                <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
                  <p>Outbound: {syncResult.outboundCreated} created, {syncResult.outboundUpdated} updated</p>
                  <p>Inbound: {syncResult.inboundCreated} created, {syncResult.inboundUpdated} updated</p>
                  {syncResult.errors > 0 && <p className="text-red-500">{syncResult.errors} errors</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Connect your Google Calendar to automatically sync appointments between Oriveo and Google Calendar.
              </p>
              <Button onClick={handleConnect}>
                <Calendar className="mr-2 h-4 w-4" /> Connect Google Calendar
              </Button>
              <p className="text-xs text-gray-400">
                You'll be redirected to Google to authorize access. Only calendar events are read and written.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
