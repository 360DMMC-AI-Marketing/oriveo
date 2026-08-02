import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import {
  HeartPulse, ClipboardList, CheckCircle2, Circle, Loader2,
  CalendarDays, PhoneCall, AlertTriangle, UserRound,
} from "lucide-react";

export default function FamilyPortal() {
  const { token } = useParams();
  const { data, isLoading, isError, error }: any = useQuery({
    queryKey: ["family", token],
    queryFn: () => api.get(`/homecare/family/${token}`).then(r => r.data),
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-10">
            <AlertTriangle size={40} className="mx-auto mb-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Link unavailable</h2>
            <p className="text-sm text-gray-500">{(error as any)?.response?.data?.message || "This link is invalid or has expired."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white"><HeartPulse size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.patient}'s Care</h1>
            <p className="text-sm text-gray-500">Home care status for family members</p>
          </div>
        </div>

        {!data.carePlan && (
          <Card className="mb-4">
            <CardContent className="p-6 text-center">
              <ClipboardList size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No active care plan yet.</p>
            </CardContent>
          </Card>
        )}

        {data.carePlan && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">{data.carePlan.title}</h2>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium capitalize">{data.carePlan.status}</span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-4"><UserRound size={14} /> Caregiver: {data.carePlan.caregiver}</p>
              {data.carePlan.medications?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-2">Medications</p>
                  <div className="space-y-1.5">
                    {data.carePlan.medications.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-gray-800">{m.name}</span>
                        <span className="text-xs text-gray-500">{m.dose} {m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.carePlan.tasks?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-2">Care Tasks</p>
                  <div className="space-y-1.5">
                    {data.carePlan.tasks.map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {t.completed ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <Circle size={16} className="text-gray-300 shrink-0" />}
                        <span className={t.completed ? "line-through text-gray-400" : "text-gray-700"}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.carePlan.notes && <p className="text-sm text-gray-600 mt-4 border-t pt-3">{data.carePlan.notes}</p>}
            </CardContent>
          </Card>
        )}

        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><CalendarDays size={15} /> Recent Visits</h2>
        {data.visits.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-gray-500 text-sm">No visits recorded yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {data.visits.map((v: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{new Date(v.scheduledAt).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                      v.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      v.status === "in-progress" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>{v.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><UserRound size={12} /> {v.caregiver}</p>
                  {v.vitals && (v.vitals.bloodPressure || v.vitals.heartRate || v.vitals.spo2 || v.vitals.temperature) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {v.vitals.bloodPressure && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">BP {v.vitals.bloodPressure}</span>}
                      {v.vitals.heartRate && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">HR {v.vitals.heartRate}</span>}
                      {v.vitals.spo2 && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">SpO2 {v.vitals.spo2}%</span>}
                      {v.vitals.temperature && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">Temp {v.vitals.temperature}°C</span>}
                      {v.vitals.weight && <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{v.vitals.weight} kg</span>}
                    </div>
                  )}
                  {v.notes && <p className="text-sm text-gray-600 mt-3">{v.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-8">Powered by Oriveo Home Care</p>
      </div>
    </div>
  );
}
