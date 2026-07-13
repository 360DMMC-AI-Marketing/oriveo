import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Phone, Users, Search, Calendar,
  User, X, Loader2, Plus, FileText,
} from "lucide-react";

export default function ScheduleCall() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [questionnaireId, setQuestionnaireId] = useState("");
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const { data: patientsRes } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
  });
  const { data: groupsRes } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then((r) => r.data),
  });
  const { data: qRes } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: () => api.get("/questionnaires").then((r) => r.data),
  });

  const patients = patientsRes?.patients || [];
  const groups = groupsRes?.groups || [];
  const questionnaires = qRes?.questionnaires || [];

  const memberIds = new Set<string>();
  for (const g of groups) {
    for (const m of g.members || []) memberIds.add(m._id);
  }

  const filteredPatients = search
    ? patients.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))
    : patients;

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

  function isGroupSelected(group: any): boolean {
    const mIds = (group.members || []).map((m: any) => m._id);
    return mIds.length > 0 && mIds.every((id: string) => selectedIds.has(id));
  }

  function isGroupPartiallySelected(group: any): boolean {
    const mIds = (group.members || []).map((m: any) => m._id);
    const count = mIds.filter((id: string) => selectedIds.has(id)).length;
    return count > 0 && count < mIds.length;
  }

  function addQuestion() {
    const q = newQuestion.trim();
    if (!q) return;
    setCustomQuestions([...customQuestions, q]);
    setNewQuestion("");
  }

  function removeQuestion(idx: number) {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  }

  const startCampaign = useMutation({
    mutationFn: (data: any) => api.post("/batch/start", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-campaigns"] });
      toast.success("Calls scheduled");
      setName("");
      setSelectedIds(new Set());
      setScheduleDate("");
      setScheduleTime("");
      setQuestionnaireId("");
      setCustomQuestions([]);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });

  function handleSubmit() {
    if (!name.trim()) { toast.error("Campaign name required"); return; }
    if (selectedIds.size === 0) { toast.error("Select at least one patient"); return; }
    const scheduledAt = scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined;
    startCampaign.mutate({
      name: name.trim(),
      patientIds: [...selectedIds],
      scheduledAt,
      questionnaireId: questionnaireId || undefined,
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Call</h1>
          <p className="text-gray-500 text-sm">Select patients or groups and schedule AI-powered calls</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search patients..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {groups.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1"><Users className="h-4 w-4" /> Groups — check a group to call all its members</h2>
              <div className="grid gap-1 sm:grid-cols-2">
                {groups.map((g: any) => {
                  const members = g.members || [];
                  const checked = isGroupSelected(g);
                  const partial = isGroupPartiallySelected(g);
                  return (
                    <label key={g._id} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox"
                        checked={checked}
                        ref={(el) => { if (el) el.indeterminate = partial; }}
                        onChange={() => toggleGroup(g)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0" />
                      <Users className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium flex-1">{g.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{members.length} patients</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
              <User className="h-4 w-4" /> Patients
              <span className="text-xs text-muted-foreground font-normal">({filteredPatients.length})</span>
            </h2>
            <div className="grid gap-1 sm:grid-cols-2">
              {filteredPatients.map((p: any) => (
                <label key={p._id} className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox"
                    checked={selectedIds.has(p._id)}
                    onChange={() => togglePatient(p._id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </div>
                  {memberIds.has(p._id) && <span className="text-[10px] text-gray-400 shrink-0">in group</span>}
                  {p.primaryDiagnosis && <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 truncate shrink-0">{p.primaryDiagnosis}</span>}
                </label>
              ))}
              {filteredPatients.length === 0 && (
                <p className="text-sm text-gray-400 col-span-2 py-4 text-center">No patients found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 pt-4"><CardTitle className="text-sm">Campaign Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Campaign Name *</label>
                <Input placeholder="e.g., Weekly Checkup" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Schedule</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-9 text-sm" />
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-9 text-sm" />
                </div>
                {!scheduleDate && <p className="text-[10px] text-muted-foreground">Leave empty to call immediately</p>}
              </div>

              {/* Questionnaire / Custom Questions */}
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1"><FileText className="h-3 w-3" /> Questions to Ask</label>

                <select value={questionnaireId} onChange={(e) => setQuestionnaireId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
                  <option value="">No template</option>
                  {questionnaires.map((q: any) => <option key={q._id} value={q._id}>{q.name}</option>)}
                </select>

                <div className="text-center text-[10px] text-muted-foreground">— or add custom questions —</div>

                {/* Custom question list */}
                {customQuestions.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {customQuestions.map((q, i) => (
                      <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1.5 text-xs">
                        <span className="flex-1">{q}</span>
                        <button onClick={() => removeQuestion(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1">
                  <Input placeholder="Type a question..." value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuestion(); } }}
                    className="h-8 text-xs flex-1" />
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={addQuestion} disabled={!newQuestion.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Selected patients */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Selected patients</span>
                  <span className="font-bold text-lg">{selectedIds.size}</span>
                </div>
                {selectedIds.size > 0 && (
                  <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                    {[...selectedIds].slice(0, 20).map((id) => {
                      const p = patients.find((p: any) => p._id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">{p.name}</span>
                          <button onClick={() => togglePatient(id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    {selectedIds.size > 20 && <p className="text-xs text-gray-400">...and {selectedIds.size - 20} more</p>}
                  </div>
                )}
              </div>

              <Button className="w-full gap-2" disabled={startCampaign.isPending || selectedIds.size === 0}
                onClick={handleSubmit}>
                {startCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {scheduleDate ? "Schedule Calls" : "Call Now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
