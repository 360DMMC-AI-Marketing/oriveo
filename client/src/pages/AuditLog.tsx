import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ShieldCheck, Filter } from "lucide-react";

interface AuditEntry {
  _id: string;
  action: string;
  userEmail: string;
  userRole: string;
  resourceType: string;
  resourceId: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  userId?: { name: string; email: string };
}

export default function AuditLog() {
  const [days, setDays] = useState("7");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ days, page: String(page), limit: "50" });
  if (actionFilter) params.set("action", actionFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", days, actionFilter, page],
    queryFn: () =>
      api.get(`/audit/logs?${params.toString()}`).then((r) => r.data),
  });

  const { data: actionsData } = useQuery({
    queryKey: ["audit-actions"],
    queryFn: () =>
      api.get("/audit/logs/actions").then((r) => r.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["audit-summary", days],
    queryFn: () =>
      api.get(`/audit/logs/summary?days=${days}`).then((r) => r.data),
  });

  const logs: AuditEntry[] = data?.logs || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };
  const actions: string[] = actionsData?.actions || [];
  const summary = summaryData?.summary || [];

  const actionLabels: Record<string, string> = {
    "patient.viewed": "Patient Viewed",
    "patient.updated": "Patient Updated",
    "patient.created": "Patient Created",
    "call.viewed": "Call Viewed",
    "call.transcript.viewed": "Transcript Viewed",
    "call.recorded": "Call Recorded",
    "call.transferred": "Call Transferred",
    "ehr.synced": "EHR Synced",
    "ehr.exported": "EHR Exported",
    "settings.changed": "Settings Changed",
    "user.login": "User Login",
    "user.logout": "User Logout",
  };

  const resourceIcons: Record<string, string> = {
    Patient: "👤",
    Call: "📞",
    Appointment: "📅",
    Questionnaire: "📋",
    Config: "⚙️",
    User: "👥",
    Group: "👪",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HIPAA Audit Log</h1>
          <p className="text-gray-500">Track all PHI access and system changes</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">Compliance Tracking Active</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Events ({days}d)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summaryData?.total || 0}</p></CardContent>
        </Card>
        {summary.slice(0, 3).map((s: any) => (
          <Card key={s._id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 truncate">{actionLabels[s._id] || s._id}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.count}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Event Log</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm">
                <option value="">All Actions</option>
                {actions.map((a) => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
              </select>
              <select value={days} onChange={(e) => setDays(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm">
                <option value="1">Last 24h</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No audit events found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Resource</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-gray-900">{log.userId?.name || log.userEmail || "System"}</div>
                        <div className="text-xs text-gray-400 capitalize">{log.userRole}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {log.resourceType ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            {resourceIcons[log.resourceType] || "📄"} {log.resourceType}
                            {log.resourceId ? ` #${log.resourceId.slice(-8)}` : ""}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs truncate">{log.description}</td>
                      <td className="py-3 text-xs text-gray-400 font-mono">{log.ipAddress || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}