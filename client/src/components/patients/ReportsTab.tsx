import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function ReportsTab({ patientId }: { patientId: string }) {
  const { data } = useQuery({
    queryKey: ["patient-reports", patientId],
    queryFn: () => api.get(`/patients/${patientId}/unified`).then((r) => r.data),
  });

  const reports = data?.reports || [];

  if (reports.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No AI call reports yet</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((r: any) => (
        <Card key={r._id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Call Report</span>
                <Badge variant="outline" className={r.triageLevel >= 7 ? "bg-red-50 text-red-700" : r.triageLevel >= 4 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}>
                  Tier {r.triageLevel || "?"}
                </Badge>
                {r.doctorSigned ? (
                  <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Signed</Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 text-amber-600"><XCircle className="h-3 w-3" /> Pending</Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">{r.callDate ? formatDateTime(r.callDate) : ""}</span>
            </div>

            <div className="mt-2 text-sm text-gray-600 line-clamp-2">
              {r.chiefComplaint && <p><span className="font-medium text-gray-800">Chief Complaint:</span> {r.chiefComplaint}</p>}
              {r.aiAssessment && <p className="mt-1">{r.aiAssessment}</p>}
            </div>

            {r.nextSteps && r.nextSteps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.nextSteps.slice(0, 3).map((s: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
                {r.nextSteps.length > 3 && <span className="text-xs text-gray-400">+{r.nextSteps.length - 3} more</span>}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <Link to={`/reports/${r._id}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs">View Full Report</Button>
              </Link>
              {r.doctorSigned && r.signedBy?.name && (
                <span className="text-xs text-gray-500">Signed by {r.signedBy.name}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
