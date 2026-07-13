import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Play, Download } from "lucide-react";

export default function Recordings() {
  const { data, isLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api.get("/calls").then((r) => r.data),
  });

  const calls = data?.calls?.filter((c: any) => c.audioUrl) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
        <p className="text-gray-500">Listen to recorded patient calls</p>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Mic className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No recordings yet</p>
            <p className="text-sm text-gray-400">Completed calls with audio will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {calls.map((call: any) => (
            <Card key={call._id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Play className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{call.patient?.name || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{new Date(call.createdAt).toLocaleDateString()} · {call.duration ? `${Math.floor(call.duration / 60)}m` : "—"}</p>
                  </div>
                  {call.status === "completed" && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Completed</span>
                  )}
                </div>
                <audio controls className="w-full h-9" src={call.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                <div className="mt-2 flex gap-2">
                  <a href={`/calls/${call._id}`} className="text-sm text-primary hover:underline">View details</a>
                  {call.audioUrl && (
                    <a href={call.audioUrl} download className="text-sm text-gray-500 hover:underline flex items-center gap-1">
                      <Download className="h-3 w-3" /> Download
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
