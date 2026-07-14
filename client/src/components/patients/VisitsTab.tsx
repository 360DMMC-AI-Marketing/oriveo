import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, Play, Download, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  "no-show": "bg-red-100 text-red-700 border-red-200",
};

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  appointment: <Calendar className="h-3.5 w-3.5" />,
  report: <AlertTriangle className="h-3.5 w-3.5" />,
};

export default function VisitsTab({ patientId }: { patientId: string }) {
  const { data } = useQuery({
    queryKey: ["patient-visits", patientId],
    queryFn: () => api.get(`/patients/${patientId}/unified`).then((r) => r.data),
  });

  const calls = data?.calls || [];
  const appointments = data?.appointments || [];

  const visits: any[] = [
    ...calls.map((c: any) => ({ ...c, _type: "call", _date: new Date(c.createdAt).getTime() })),
    ...appointments.map((a: any) => ({ ...a, _type: "appointment", _date: new Date(a.date).getTime() })),
  ].sort((a, b) => b._date - a._date);

  if (visits.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No visits recorded yet</p>;
  }

  return (
    <div className="space-y-3">
      {visits.map((v: any) => (
        <Card key={`${v._type}-${v._id}`}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{typeIcons[v._type] || null}</span>
                <Badge variant="outline" className={statusColors[v.status] || ""}>
                  {v.status || "unknown"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {v._type === "call" ? formatDateTime(v.createdAt) : formatDateTime(v.date)}
                </span>
              </div>
              {v._type === "call" && v.aiSeverityScore && (
                <span className={`text-xs font-medium ${
                  v.aiSeverityScore >= 7 ? "text-red-600" :
                  v.aiSeverityScore >= 4 ? "text-amber-500" : "text-green-600"
                }`}>
                  {v.aiSeverityScore}/10
                </span>
              )}
            </div>
            <div className="mt-1">
              {v._type === "call" && (
                <div className="flex items-center gap-3">
                  {v.questionnaire?.title && <span className="text-xs text-gray-500">{v.questionnaire.title}</span>}
                  {v.audioUrl && <Download className="h-3.5 w-3.5 text-gray-400" />}
                  <Link to={`/calls/${v._id}`} className="text-xs text-primary hover:underline">View details →</Link>
                </div>
              )}
              {v._type === "appointment" && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{v.title}</span>
                  {v.bookedBy?.name && <span>· Booked by {v.bookedBy.name}</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
