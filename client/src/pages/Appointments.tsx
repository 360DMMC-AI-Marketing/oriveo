import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User,
  Plus, X, Phone, Video, MapPin, CheckCircle, AlertCircle, Loader2,
  Search, Filter, List, CalendarDays, ChevronDown, Users,
} from "lucide-react";
import { toast } from "sonner";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
};

  const STATUS_ACTIONS = [
  { label: "Confirm", from: "scheduled", to: "confirmed", color: "text-indigo-600 hover:bg-indigo-50" },
  { label: "Complete", from: "confirmed", to: "completed", color: "text-emerald-600 hover:bg-emerald-50" },
  { label: "No Show", from: "confirmed", to: "no-show", color: "text-gray-600 hover:bg-gray-100" },
  { label: "Cancel", to: "cancelled", color: "text-red-600 hover:bg-red-50" },
];

export default function Appointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    patient: "", title: "", date: "", time: "09:00", duration: 30,
    type: "in-person" as "in-person" | "phone" | "video",
    location: "", reason: "", notes: "", status: "scheduled", provider: "",
  });
  function setFormField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [quickPatient, setQuickPatient] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const dateParam = statusFilter === "all" ? undefined : selectedDate;

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointments", dateParam, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("sort", "date");
      if (dateParam) {
        const start = new Date(dateParam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateParam);
        end.setHours(23, 59, 59, 999);
        params.set("start", start.toISOString());
        params.set("end", end.toISOString());
      }
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      return api.get(`/appointments?${params}`).then((r) => r.data);
    },
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
  });
  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then((r) => r.data),
  });

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: () => api.get("/availability/providers").then((r) => r.data),
  });

  const appointments = appointmentsData?.appointments || [];
  const patients = patientsData?.patients || [];
  const groups = groupsData?.groups || [];
  const providers = providersData?.providers || [];

  const memberIds = new Set<string>();
  for (const g of groups) {
    for (const m of g.members || []) memberIds.add(m._id);
  }

  function togglePatient(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleGroup(group: any) {
    const next = new Set(selectedIds);
    const mIds = (group.members || []).map((m: any) => m._id);
    const allSelected = mIds.every((id: string) => next.has(id));
    if (allSelected) mIds.forEach((id: string) => next.delete(id));
    else mIds.forEach((id: string) => next.add(id));
    setSelectedIds(next);
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (editing) return api.put(`/appointments/${editing._id}`, data);
      if (data.patientIds) return api.post("/appointments/batch", data);
      return api.post("/appointments", data);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (!editing && form.date) setSelectedDate(form.date);
      setShowForm(false);
      setEditing(null);
      setSelectedIds(new Set());
      resetForm();
      const count = res?.data?.count || 1;
      toast.success(editing ? "Appointment updated" : `${count} appointment${count > 1 ? "s" : ""} created`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save appointment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  function resetForm() {
    setForm({ patient: "", title: "", date: "", time: "09:00", duration: 30, type: "in-person", location: "", reason: "", notes: "", status: "scheduled", provider: "" });
  }

  function handleEdit(appt: any) {
    const d = new Date(appt.date);
    setForm({
      patient: appt.patient?._id || "",
      title: appt.title,
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
      duration: appt.duration || 30,
      type: appt.type || "in-person",
      location: appt.location || "",
      reason: appt.reason || "",
      notes: appt.notes || "",
      status: appt.status,
      provider: appt.provider || "",
    });
    setEditing(appt);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      if (!form.title || !form.date) { toast.error("Title and date required"); return; }
      createMutation.mutate({
        ...form,
        date: new Date(`${form.date}T${form.time}:00`).toISOString(),
      });
      return;
    }
    const patientIds = [...selectedIds];
    if (patientIds.length === 0 && !form.patient) {
      toast.error("Select at least one patient");
      return;
    }
    if (!form.title || !form.date) {
      toast.error("Title and date are required");
      return;
    }
    const base = {
      title: form.title,
      date: new Date(`${form.date}T${form.time}:00`).toISOString(),
      duration: form.duration,
      type: form.type,
      location: form.location,
      reason: form.reason,
      notes: form.notes,
      provider: form.provider || null,
    };
    if (patientIds.length > 0) {
      createMutation.mutate({ ...base, patientIds });
    } else {
      createMutation.mutate({ ...base, patient: form.patient });
    }
  }

  function handleQuickCall(patient: any) {
    if (!patient?.phone) { toast.error("Patient has no phone number"); return; }
    navigate(`/voice-agent?patientId=${patient._id}&patientName=${encodeURIComponent(patient.name)}`);
  }

  function getAppointmentsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a: any) => {
      const ad = new Date(a.date);
      return ad.getFullYear() === currentYear && ad.getMonth() === currentMonth && ad.getDate() === day;
    });
  }

  function getDayStatus(day: number) {
    const dayApps = getAppointmentsForDay(day);
    if (dayApps.length === 0) return null;
    if (dayApps.some((a: any) => a.status === "cancelled" || a.status === "no-show")) return "cancelled";
    if (dayApps.some((a: any) => a.status === "scheduled" || a.status === "confirmed")) return "has-scheduled";
    return "completed";
  }

  const filteredPatients = patients.filter((p: any) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch)
  );

  const sortedAppointments = [...appointments].sort((a: any, b: any) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, otherMonth: true });
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, otherMonth: false });
  while (days.length % 7 !== 0) days.push({ day: days.length % 7 + 1, otherMonth: true });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm">Today's schedule and patient management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("calendar")}>
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {/* Quick-add bar */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{editing ? "Edit Appointment" : "Quick Add Appointment"}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pb-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">
                    {editing ? "Patient" : `Patients (${selectedIds.size} selected)`}
                  </Label>
                  {editing ? (
                    <div className="rounded-lg border px-3 py-2 text-sm bg-gray-50 h-10 flex items-center">{editing.patient?.name || editing.patient}</div>
                  ) : (
                    <div>
                      <Button type="button" variant="outline" size="sm" className="w-full justify-between h-10 text-sm"
                        onClick={() => setShowPatientPicker(!showPatientPicker)}>
                        {selectedIds.size > 0
                          ? `${selectedIds.size} patient${selectedIds.size > 1 ? "s" : ""} selected`
                          : form.patient
                            ? patients.find((p: any) => p._id === form.patient)?.name || "1 selected"
                            : "Select patients..."}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showPatientPicker ? "rotate-180" : ""}`} />
                      </Button>

                      {showPatientPicker && (
                        <div className="mt-2 max-h-72 overflow-y-auto space-y-2 border rounded-lg p-2 bg-white shadow-lg">
                          {/* Search inside picker */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search..." value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              className="pl-8 h-8 text-xs" />
                          </div>

                          {/* Groups */}
                          {groups.filter((g: any) => !patientSearch || g.name.toLowerCase().includes(patientSearch.toLowerCase())).map((g: any) => {
                            const members = g.members || [];
                            const allSel = members.every((m: any) => selectedIds.has(m._id));
                            const partial = !allSel && members.some((m: any) => selectedIds.has(m._id));
                            return (
                              <label key={g._id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                                <input type="checkbox" checked={allSel}
                                  ref={(el) => { if (el) el.indeterminate = partial; }}
                                  onChange={() => toggleGroup(g)}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary" />
                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium flex-1">{g.name}</span>
                                <span className="text-muted-foreground">{members.length}</span>
                              </label>
                            );
                          })}

                          <div className="border-t pt-1 space-y-0.5">
                            {filteredPatients.map((p: any) => (
                              <label key={p._id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                                <input type="checkbox" checked={selectedIds.has(p._id)}
                                  onChange={() => togglePatient(p._id)}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary" />
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium flex-1">{p.name}</span>
                                <span className="text-muted-foreground">{p.phone}</span>
                                {memberIds.has(p._id) && <span className="text-[10px] text-gray-400">in group</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Input type="time" value={form.time} onChange={(e) => setFormField("time", e.target.value)} className="h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Provider</Label>
                  <select value={form.provider} onChange={(e) => setFormField("provider", e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Auto-assign</option>
                    {providers.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} {p.specialty?.length ? `(${p.specialty.join(", ")})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Checkup, Follow-up..." className="h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="in-person">In Person</option>
                    <option value="phone">Phone Call</option>
                    <option value="video">Video Call</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className="h-10 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
                {editing && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => { deleteMutation.mutate(editing._id); setShowForm(false); }}>
                    Delete
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats + Filter row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[
            { label: "All", value: "all" },
            { label: "Scheduled", value: "scheduled" },
            { label: "Confirmed", value: "confirmed" },
            { label: "Completed", value: "completed" },
            { label: "No Show", value: "no-show" },
            { label: "Cancelled", value: "cancelled" },
          ].map((filt) => (
            <button key={filt.value} onClick={() => setStatusFilter(filt.value === "all" ? "" : filt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                (filt.value === "all" && !statusFilter) || statusFilter === filt.value
                  ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {filt.label}
            </button>
          ))}
        </div>
        {viewMode === "list" && (
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setSelectedDate(today.toISOString().split("T")[0])}
              className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded">Today</button>
            <span className="font-medium min-w-[140px] text-center">
              {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {viewMode === "calendar" ? (
        /* Calendar Grid */
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{MONTHS[currentMonth]} {currentYear}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setCurrentMonth(m => { if (m === 0) { setCurrentYear(y => y - 1); return 11; } return m - 1; }); }}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}>
                  Today
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setCurrentMonth(m => { if (m === 11) { setCurrentYear(y => y + 1); return 0; } return m + 1; }); }}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">{d}</div>
              ))}
              {days.map((d, i) => {
                const dayApps = getAppointmentsForDay(d.day);
                const status = getDayStatus(d.day);
                const isToday = d.day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSelected = selectedDate === `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                return (
                  <button key={i} onClick={() => {
                    if (!d.otherMonth) {
                      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                      setSelectedDate(ds);
                      setViewMode("list");
                    }
                  }}
                    className={`relative flex flex-col items-center justify-center rounded-lg p-1.5 text-sm transition-colors cursor-pointer aspect-square
                      ${d.otherMonth ? "text-gray-300" : ""}
                      ${isToday ? "bg-primary/10 text-primary font-semibold" : ""}
                      ${isSelected && !d.otherMonth ? "ring-2 ring-primary" : ""}
                      ${!isToday && !isSelected && !d.otherMonth ? "hover:bg-gray-100" : ""}
                    `}>
                    <span className="text-xs">{d.day}</span>
                    {status === "has-scheduled" && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    {status === "cancelled" && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />}
                    {status === "completed" && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {!d.otherMonth && dayApps.length > 1 && (
                      <span className="absolute -top-px -right-px flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                        {dayApps.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Timeline List View */
        <div className="space-y-1">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && sortedAppointments.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CalendarIcon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-500">No appointments for this date</p>
                <p className="text-sm text-gray-400 mb-3">Schedule a new appointment</p>
                <Button size="sm" onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}>
                  <Plus className="mr-1 h-4 w-4" /> New Appointment
                </Button>
              </CardContent>
            </Card>
          )}
          {sortedAppointments.map((appt: any) => {
            const apptDate = new Date(appt.date);
            const patient = appt.patient;
            return (
              <div key={appt._id}
                className="flex items-center gap-3 rounded-lg border px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                {/* Time column */}
                <div className="w-16 shrink-0 text-center">
                  <div className="text-sm font-semibold text-gray-800">
                    {apptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{appt.duration}min</div>
                </div>

                {/* Type icon */}
                <div className="shrink-0">
                  {appt.type === "phone" ? <Phone className="h-4 w-4 text-blue-500" /> :
                   appt.type === "video" ? <Video className="h-4 w-4 text-purple-500" /> :
                   <MapPin className="h-4 w-4 text-gray-400" />}
                </div>

                {/* Patient info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{patient?.name || "Unknown"}</span>
                    {patient?.phone && (
                      <span className="text-xs text-muted-foreground shrink-0">{patient.phone}</span>
                    )}
                    {patient?.language && patient.language !== "en" && (
                      <span className="text-[10px] uppercase text-muted-foreground/60 border rounded px-1 shrink-0">{patient.language}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium truncate">{appt.title}</span>
                    {appt.reason && <span className="truncate">· {appt.reason}</span>}
                    {appt.location && <span className="truncate">· {appt.location}</span>}
                  </div>
                </div>

                {/* Status badge + actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={`text-xs border ${STATUS_COLORS[appt.status] || "bg-gray-100"}`}>
                    {appt.status}
                  </Badge>

                  {/* Quick status changes */}
                  {appt.status === "scheduled" && (
                    <button onClick={() => statusMutation.mutate({ id: appt._id, status: "confirmed" })}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      Confirm
                    </button>
                  )}
                  {(appt.status === "confirmed" || appt.status === "scheduled") && (
                    <button onClick={() => statusMutation.mutate({ id: appt._id, status: "completed" })}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      Done
                    </button>
                  )}
                  {(appt.status !== "completed" && appt.status !== "cancelled" && appt.status !== "no-show") && (
                    <button onClick={() => statusMutation.mutate({ id: appt._id, status: "cancelled" })}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      Cancel
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {patient?.phone && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Call patient"
                      onClick={() => handleQuickCall(patient)}>
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit"
                    onClick={() => handleEdit(appt)}>
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
