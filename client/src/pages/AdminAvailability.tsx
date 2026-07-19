import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferBetween: number;
  isActive: boolean;
}

export default function AdminAvailability() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"org" | "provider">("org");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>(() =>
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 0, isActive: i > 0 && i < 6 }))
  );

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: () => api.get("/availability/providers").then((r) => r.data),
  });

  const { data: orgAvailData } = useQuery({
    queryKey: ["org-availability"],
    queryFn: () => api.get("/availability").then((r) => r.data),
  });

  const { data: providerAvailData } = useQuery({
    queryKey: ["provider-availability", selectedProvider],
    queryFn: () => api.get(`/availability/providers/${selectedProvider}`).then((r) => r.data),
    enabled: !!selectedProvider,
  });

  useEffect(() => {
    if (mode === "org" && orgAvailData?.availability) {
      setSlots(
        DAYS.map((_, i) => {
          const existing = orgAvailData.availability.find((a: any) => a.dayOfWeek === i);
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, slotDuration: existing.slotDuration || 30, bufferBetween: existing.bufferBetween || 0, isActive: existing.isActive }
            : { dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 0, isActive: false };
        })
      );
    }
  }, [orgAvailData, mode]);

  useEffect(() => {
    if (mode === "provider" && providerAvailData?.schedule) {
      setSlots(
        DAYS.map((_, i) => {
          const existing = providerAvailData.schedule.find((a: any) => a.dayOfWeek === i);
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, slotDuration: existing.slotDuration || 30, bufferBetween: existing.bufferBetween || 0, isActive: existing.isActive }
            : { dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 0, isActive: false };
        })
      );
    }
  }, [providerAvailData, mode]);

  const saveMutation = useMutation({
    mutationFn: (data: { slots: Slot[]; providerId?: string }) =>
      data.providerId
        ? api.put(`/availability/providers/${data.providerId}`, { slots: data.slots })
        : api.put("/availability", { slots: data.slots }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-availability"] });
      queryClient.invalidateQueries({ queryKey: ["provider-availability"] });
      toast.success("Availability updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const removeOverridesMutation = useMutation({
    mutationFn: (providerId: string) => api.delete(`/availability/providers/${providerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability"] });
      toast.success("Overrides removed, falling back to org schedule");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove"),
  });

  function updateSlot(index: number, field: keyof Slot, value: any) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleSave() {
    const data: any = { slots };
    if (mode === "provider" && selectedProvider) data.providerId = selectedProvider;
    saveMutation.mutate(data);
  }

  const providers = providersData?.providers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground text-sm">Set working hours for the organization and individual providers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button variant={mode === "org" ? "default" : "ghost"} size="sm" onClick={() => { setMode("org"); setSelectedProvider(""); }}>Org Default</Button>
            <Button variant={mode === "provider" ? "default" : "ghost"} size="sm" onClick={() => setMode("provider")}>Per Provider</Button>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-1 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {mode === "provider" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {providers.map((p: any) => (
                <Button key={p._id} variant={selectedProvider === p._id ? "default" : "outline"} size="sm" onClick={() => setSelectedProvider(p._id)}>
                  {p.name}
                </Button>
              ))}
              {providers.length === 0 && <p className="text-sm text-gray-400">No providers found</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {mode === "org" ? "Organization Default Schedule" : selectedProvider ? `Provider Schedule` : "Select a provider above"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="w-24 shrink-0">
                  <Label className="text-xs font-medium">{DAYS[slot.dayOfWeek]}</Label>
                </div>
                <label className="flex items-center gap-2 shrink-0">
                  <input type="checkbox" checked={slot.isActive}
                    onChange={(e) => updateSlot(i, "isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary" />
                </label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={slot.startTime}
                    onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                    className="h-8 w-24 text-xs" disabled={!slot.isActive} />
                  <span className="text-xs text-gray-400">to</span>
                  <Input type="time" value={slot.endTime}
                    onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                    className="h-8 w-24 text-xs" disabled={!slot.isActive} />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Slot:</span>
                  <Input type="number" value={slot.slotDuration}
                    onChange={(e) => updateSlot(i, "slotDuration", Number(e.target.value))}
                    className="h-8 w-16 text-xs" disabled={!slot.isActive} />
                  <span>min</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Buffer:</span>
                  <Input type="number" value={slot.bufferBetween}
                    onChange={(e) => updateSlot(i, "bufferBetween", Number(e.target.value))}
                    className="h-8 w-16 text-xs" disabled={!slot.isActive} />
                  <span>min</span>
                </div>
              </div>
            ))}
          </div>

          {mode === "provider" && selectedProvider && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => removeOverridesMutation.mutate(selectedProvider)}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset to Org Default
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
