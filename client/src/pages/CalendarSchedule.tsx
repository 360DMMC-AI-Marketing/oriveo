import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Clock,
  Plus, User, X, AlertCircle, CheckCircle, ArrowRight, TrendingUp,
  Activity, Loader2, Repeat, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { medicalTemplates } from "@/data/medicalTemplates";

export default function CalendarSchedule() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCall, setEditingCall] = useState<any>(null);
  const [addForm, setAddForm] = useState({ patient: "", patientName: "", questionnaire: "", time: "09:00", language: "en", recurringMonthly: false, remindAppointment: false, nextAppointmentDate: "", nextAppointmentPlace: "" });
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: callsData, isLoading: callsLoading } = useQuery({ queryKey: ["calls"], queryFn: () => api.get("/calls").then((r) => r.data) });
  const { data: patientsData } = useQuery({ queryKey: ["patients"], queryFn: () => api.get("/patients").then((r) => r.data) });

  const calls = callsData?.calls || [];
  const patients = patientsData?.patients || [];

  const filteredPatients = patients.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const callsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    calls.forEach((call: any) => {
      const date = call.scheduledAt
        ? new Date(call.scheduledAt).toISOString().split("T")[0]
        : new Date(call.createdAt).toISOString().split("T")[0];
      if (!map[date]) map[date] = [];
      map[date].push(call);
    });
    return map;
  }, [calls]);

  const selectedDayCalls = selectedDate ? (callsByDate[selectedDate] || []) : [];

  const sortedCalls = useMemo(() => [...selectedDayCalls].sort((a: any, b: any) => new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime()), [selectedDayCalls]);

  const getDayCalls = (dateStr: string) => callsByDate[dateStr] || [];

  const getPatientName = (patientId: any) => {
    if (!patientId) return "Unknown";
    if (typeof patientId === "string") {
      const p = patients.find((p: any) => p._id === patientId);
      return p?.name || "Unknown";
    }
    return patientId.name || "Unknown";
  };

  const getHighestRisk = (dayCalls: any[]) => {
    const max = Math.max(...dayCalls.map((c) => c.aiSeverityScore || 0));
    if (max >= 7) return "high";
    if (max >= 4) return "medium";
    return "low";
  };

  const todayStr = today.toISOString().split("T")[0];

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const stats = useMemo(() => {
    const todayCalls = getDayCalls(todayStr).length;
    let weekCalls = 0;
    let highRisk = 0;
    calls.forEach((call: any) => {
      const date = call.scheduledAt
        ? new Date(call.scheduledAt).toISOString().split("T")[0]
        : new Date(call.createdAt).toISOString().split("T")[0];
      if (date >= weekStartStr && date <= weekEndStr) weekCalls++;
      if ((call.aiSeverityScore || 0) >= 7 && call.status === "pending") highRisk++;
    });
    return { todayCalls, weekCalls, highRisk };
  }, [calls, todayStr, weekStartStr, weekEndStr]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setShowAdd(false);
  };

  const handleAddCall = async () => {
    if (!addForm.patient || !addForm.questionnaire || !selectedDate) return;
    const template = medicalTemplates.find((t) => t.condition === addForm.questionnaire);
    if (!template) { toast.error("Invalid template"); return; }
    try {
      const { data: qData } = await api.post("/questionnaires", {
        title: template.condition + " Checkup",
        questions: template.questions.map((q, i) => ({ text: q, order: i + 1, type: "open" })),
        category: "general",
        language: addForm.language,
      });
      const questionnaireId = qData.questionnaire._id;
      const baseDate = new Date(`${selectedDate}T${addForm.time}`);
      const dates = [baseDate];
      if (addForm.recurringMonthly) {
        for (let i = 1; i <= 12; i++) {
          const next = new Date(baseDate);
          next.setMonth(next.getMonth() + i);
          dates.push(next);
        }
      }
      for (const dt of dates) {
        await api.post("/calls", {
          patient: addForm.patient,
          questionnaire: questionnaireId,
          language: addForm.language,
          scheduledAt: dt.toISOString(),
          ...(addForm.remindAppointment && {
            nextAppointmentDate: addForm.nextAppointmentDate || undefined,
            nextAppointmentPlace: addForm.nextAppointmentPlace || undefined,
          }),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      queryClient.invalidateQueries({ queryKey: ["questionnaires"] });
      setShowAdd(false);
      setAddForm({ patient: "", patientName: "", questionnaire: "", time: "09:00", language: "en", recurringMonthly: false, remindAppointment: false, nextAppointmentDate: "", nextAppointmentPlace: "" });
      toast.success(dates.length > 1 ? `${dates.length} monthly calls scheduled` : "Call scheduled");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayCalls = getDayCalls(dateStr);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const isPast = dateStr < todayStr;
    const risk = dayCalls.length > 0 ? getHighestRisk(dayCalls) : null;
    const patientNames = dayCalls.slice(0, 2).map((c) => getPatientName(c.patient));
    const extraCount = dayCalls.length - 2;
    const allCompleted = dayCalls.length > 0 && dayCalls.every((c) => c.status === "completed");

    days.push(
      <button
        key={d}
        onClick={() => handleDayClick(d)}
        className={`relative flex flex-col items-start rounded-xl p-2 text-sm transition-all min-h-[80px] border ${
          isSelected
            ? "bg-primary text-white ring-2 ring-primary border-primary shadow-lg scale-[1.02]"
            : isToday
            ? "bg-primary-light border-primary/30 text-gray-900 font-bold"
            : isPast && dayCalls.length === 0
            ? "border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
            : "border-gray-200 text-gray-700 hover:border-primary/40 hover:shadow-sm hover:bg-gray-50"
        }`}
      >
        {risk && (
          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
            risk === "high" ? "bg-gradient-to-r from-red-400 to-red-500" :
            risk === "medium" ? "bg-gradient-to-r from-amber-400 to-amber-500" :
            "bg-gradient-to-r from-green-400 to-green-500"
          }`} />
        )}
        <div className="flex items-center justify-between w-full mt-0.5">
          <span className={`text-sm ${isSelected ? "text-white" : isToday ? "text-primary" : ""}`}>{d}</span>
          {dayCalls.length > 0 && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {dayCalls.length}
            </span>
          )}
        </div>
        {patientNames.length > 0 && (
          <div className="mt-1 space-y-0.5 w-full">
            {patientNames.map((name, i) => (
              <span key={i} className={`block text-[10px] leading-tight truncate ${isSelected ? "text-white/80" : allCompleted ? "text-gray-400 line-through" : "text-gray-500"}`}>
                {name}
              </span>
            ))}
            {extraCount > 0 && (
              <span className={`text-[10px] ${isSelected ? "text-white/60" : "text-gray-400"}`}>
                +{extraCount} more
              </span>
            )}
          </div>
        )}
        {isToday && !isSelected && (
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
        )}
      </button>
    );
  }

  const getCallStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "in-progress": return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100";
      case "failed": return "bg-red-100";
      case "in-progress": return "bg-blue-100";
      default: return "bg-amber-100";
    }
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 7) return <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">High</span>;
    if (score >= 4) return <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Med</span>;
    return null;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const renderedCallRows = useMemo(() => {
    if (sortedCalls.length === 0) {
      return (
        <div className="flex flex-col items-center py-12 text-gray-400">
          <CalendarIcon className="h-8 w-8 mb-2" />
          <p className="text-sm">No calls on this day</p>
        </div>
      );
    }
    return sortedCalls.map((call: any) => {
      const time = call.scheduledAt ? formatTime(call.scheduledAt) : "—";
      return (
        <div key={call._id} className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group ${call.status === "completed" ? "opacity-60" : ""}`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getStatusBg(call.status)}`}>
            {getCallStatusIcon(call.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium truncate ${call.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>{getPatientName(call.patient)}</span>
              {getSeverityBadge(call.aiSeverityScore)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{time}</span>
              <span>·</span>
              <span className="capitalize">{call.status}</span>
              {call.questionnaire?.title && <><span>·</span><span className="truncate">{call.questionnaire.title}</span></>}
            </div>
            {call.nextAppointmentDate && (
              <div className="flex items-center gap-1 mt-0.5">
                <CalendarIcon className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">
                  Appt: {new Date(call.nextAppointmentDate).toLocaleDateString()}{call.nextAppointmentPlace ? ` @ ${call.nextAppointmentPlace}` : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={`/calls/${call._id}`}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
            {call.status !== "completed" && call.status !== "in-progress" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-primary"
                onClick={() => {
                  const pid = typeof call.patient === "object" ? call.patient._id : call.patient;
                  const pname = typeof call.patient === "object" ? call.patient.name : getPatientName(call.patient);
                  const t = call.scheduledAt ? new Date(call.scheduledAt).toTimeString().slice(0, 5) : "09:00";
                  setAddForm({ patient: pid, patientName: pname, questionnaire: call.questionnaire?.title?.replace(" Checkup", "") || "", time: t, language: call.language || "en", recurringMonthly: false, remindAppointment: !!call.nextAppointmentDate, nextAppointmentDate: call.nextAppointmentDate ? new Date(call.nextAppointmentDate).toISOString().split("T")[0] : "", nextAppointmentPlace: call.nextAppointmentPlace || "" });
                  setSearch(pname);
                  setEditingCall(call);
                  setShowAdd(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {call.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-primary"
                onClick={() => {
                  api.post(`/calls/${call._id}/recall`).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["calls"] });
                    toast.success("Call started");
                  }).catch(() => toast.error("Failed"));
                }}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
            {call.status !== "completed" && call.status !== "in-progress" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                onClick={() => {
                  if (window.confirm("Remove this scheduled call?")) {
                    api.delete(`/calls/${call._id}`).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["calls"] });
                      toast.success("Call removed");
                    }).catch(() => toast.error("Failed to remove call"));
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      );
    });
  }, [sortedCalls, getPatientName, getStatusBg, getCallStatusIcon, getSeverityBadge, formatTime]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Meeting</h1>
          <p className="text-gray-500">Schedule and manage automated patient checkup calls</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <TrendingUp className="h-4 w-4" /> Today: {stats.todayCalls}
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-blue-600 font-medium">
            <Activity className="h-4 w-4" /> Week: {stats.weekCalls}
          </div>
          {stats.highRisk > 0 && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-red-600 font-medium">
                <AlertCircle className="h-4 w-4" /> At Risk: {stats.highRisk}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: selectedDate ? "1fr 380px" : "1fr" }}>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {monthName}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }} className="h-8 w-8 text-xs">Today</Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">{days}</div>
          </CardContent>
        </Card>

        {selectedDate && (
          <div className="space-y-3 animate-in slide-in-from-right">
            <Card>
              <div className="px-4 py-3 flex items-center justify-between border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">Schedule a Call</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — {selectedDayCalls.length} call{selectedDayCalls.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setShowAdd(!showAdd); setSearch(""); }} className="h-8">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                {showAdd && (
                  <div className="p-4 border-b bg-gray-50/50 space-y-3">
                    <div className="relative">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Patient *</label>
                      <Input
                        placeholder="Search patients..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
                        onFocus={() => setShowSearch(true)}
                        className="h-9 text-sm"
                      />
                      {showSearch && search && (
                        <div className="absolute z-10 w-full rounded-lg border bg-white shadow-lg max-h-36 overflow-y-auto mt-1">
                          {filteredPatients.length === 0 ? (
                            <p className="p-2 text-xs text-gray-400">No patients found</p>
                          ) : (
                            filteredPatients.map((p: any) => (
                              <button
                                key={p._id}
                                onClick={() => { setAddForm({ ...addForm, patient: p._id, patientName: p.name }); setSearch(p.name); setShowSearch(false); }}
                                className="w-full flex items-center gap-2 p-2 text-sm hover:bg-gray-50 text-left"
                              >
                                <User className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="truncate">{p.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{p.phone}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Questionnaire *</label>
                      <select value={addForm.questionnaire} onChange={(e) => setAddForm({ ...addForm, questionnaire: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option value="">Select a template...</option>
                        {medicalTemplates.map((t) => (
                          <option key={t.id} value={t.condition}>{t.condition} ({t.questions.length}q)</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Time</label>
                        <Input type="time" value={addForm.time} onChange={(e) => setAddForm({ ...addForm, time: e.target.value })} className="h-9 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Language</label>
                        <select value={addForm.language} onChange={(e) => setAddForm({ ...addForm, language: e.target.value })}
                          className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                          <option value="fr">French</option>
                          <option value="es">Spanish</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={addForm.recurringMonthly} onChange={(e) => setAddForm({ ...addForm, recurringMonthly: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Repeat className="h-3 w-3" /> Repeat monthly (next 12 months on same day)
                      </span>
                    </label>
                    <div className="border-t pt-2">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" checked={addForm.remindAppointment} onChange={(e) => setAddForm({ ...addForm, remindAppointment: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-xs font-medium text-gray-600">Notify patient about next doctor appointment at end of call</span>
                      </label>
                      {addForm.remindAppointment && (
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Appointment Date *</label>
                            <Input type="date" value={addForm.nextAppointmentDate} onChange={(e) => setAddForm({ ...addForm, nextAppointmentDate: e.target.value })} className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Place *</label>
                            <Input value={addForm.nextAppointmentPlace} onChange={(e) => setAddForm({ ...addForm, nextAppointmentPlace: e.target.value })} placeholder="e.g., Dr. Smith, Room 3" className="h-9 text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="w-full" onClick={handleAddCall} disabled={!addForm.patient || !addForm.questionnaire || !selectedDate}>
                      <Phone className="mr-2 h-3 w-3" /> {addForm.recurringMonthly ? "Schedule Monthly Series" : "Schedule Call"}
                    </Button>
                  </div>
                )}

                {selectedDayCalls.length === 0 && !showAdd ? (
                  <div className="flex flex-col items-center py-12 text-gray-400">
                    <CalendarIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">No calls on this day</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
                      <Plus className="mr-1 h-3 w-3" /> Schedule a call
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {renderedCallRows}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {callsLoading && (
        <div className="flex items-center justify-center py-4 text-gray-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading calls...
        </div>
      )}
    </div>
  );
}
