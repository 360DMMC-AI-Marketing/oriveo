import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, Search, Phone, User, Users, ChevronDown, ChevronUp, UserMinus, Trash2, X, Upload, Loader2, PawPrint,
} from "lucide-react";
import VoiceInputButton from "@/components/VoiceInputButton";
import LanguageSelect from "@/components/LanguageSelect";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Patients() {
  const { user } = useAuth();
  const isVet = user?.organization?.specialty === "veterinary";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<"patient" | "group" | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [expandGroup, setExpandGroup] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [patientType, setPatientType] = useState<"human" | "pet">(isVet ? "pet" : "human");
  const [patientForm, setPatientForm] = useState({
    name: "", phone: "", email: "", language: "en", primaryDiagnosis: "", chronicConditions: "",
    allergies: "", currentMedications: "", pastSurgeries: "", medicalNotes: "", assignedDoctor: "",
    address: "", emergencyContact: "", emergencyContactPhone: "", insuranceId: "", kbNotes: "",
    patientType: isVet ? "pet" : "human",
    species: "", breed: "", weight: "", color: "", microchipId: "",
    ownerName: "", ownerPhone: "", ownerEmail: "",
  });
  const [groupForm, setGroupForm] = useState({ name: "", description: "", diagnosisFilter: "" });

  const { data: patientsRes, isLoading } = useQuery({
    queryKey: ["patients", patientType],
    queryFn: () => api.get(`/patients?patientType=${patientType}`).then((r) => r.data),
  });
  const { data: groupsRes } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then((r) => r.data),
  });

  const patients = patientsRes?.patients || [];
  const groups = groupsRes?.groups || [];

  const createPatient = useMutation({
    mutationFn: (d: any) => api.post("/patients", { ...d, patientType }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setShowForm(null); toast.success("Patient added"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });
  const deletePatient = useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["patients"] }); toast.success("Deleted"); },
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Something went wrong"); },
  });
  const createGroup = useMutation({
    mutationFn: (d: any) => api.post("/groups", d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); setShowForm(null); setGroupForm({ name: "", description: "", diagnosisFilter: "" }); toast.success("Group created"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });
  const deleteGroup = useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); toast.success("Group deleted"); },
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Something went wrong"); },
  });
  const addMember = useMutation({
    mutationFn: ({ g, p }: { g: string; p: string }) => api.post(`/groups/${g}/members`, { patientId: p }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); setGroupSearch(""); },
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Something went wrong"); },
  });
  const removeMember = useMutation({
    mutationFn: ({ g, p }: { g: string; p: string }) => api.delete(`/groups/${g}/members/${p}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groups"] }); },
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Something went wrong"); },
  });
  const callGroup = useMutation({
    mutationFn: (id: string) => api.post(`/groups/${id}/call`, {}),
    onSuccess: () => toast.success("Calls created"),
    onError: (err: any) => { toast.error(err?.response?.data?.message || "Something went wrong"); },
  });

  const memberIds = new Set<string>();
  for (const g of groups) {
    for (const m of g.members || []) {
      memberIds.add(m._id);
    }
  }
  const ungrouped = patients.filter((p: any) => !memberIds.has(p._id));
  const filtered = search
    ? patients.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))
    : null;

  function callPatient(p: any) {
    if (!p?.phone) { toast.error("No phone number"); return; }
    navigate(`/voice-agent?patientId=${p._id}&patientName=${encodeURIComponent(p.name)}`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/patients/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(`Imported ${data.imported} patients (${data.skipped} skipped)`);
      if (data.errors?.length > 0) toast.warning(`${data.errors.length} rows had errors`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Import failed");
    }
    setImporting(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm">Manage patients and organize them into groups</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" onChange={handleImport} className="hidden" ref={fileRef} />
          <Button variant="outline" disabled={importing} className="gap-1" onClick={() => fileRef.current?.click()}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowForm(showForm === "group" ? null : "group")}>
            <Users className="mr-1 h-4 w-4" /> {showForm === "group" ? "Cancel" : "New Group"}
          </Button>
          <Button onClick={() => setShowForm(showForm === "patient" ? null : "patient")}>
            <Plus className="mr-1 h-4 w-4" /> {showForm === "patient" ? "Cancel" : "Add Patient"}
          </Button>
        </div>
      </div>

        <div className="relative flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search patients..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <VoiceInputButton onResult={(text) => setSearch(text)} language="en-US" />
        </div>

        {showForm === "patient" && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">New {patientType === "pet" ? "Pet" : "Patient"}</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowForm(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => { setPatientType("human"); setPatientForm({ ...patientForm, patientType: "human" }) }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${patientType === "human" ? "border-primary bg-primary text-white" : "border-gray-200"}`}><User className="h-3 w-3 inline mr-1" />Human</button>
                <button type="button" onClick={() => { setPatientType("pet"); setPatientForm({ ...patientForm, patientType: "pet" }) }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${patientType === "pet" ? "border-primary bg-primary text-white" : "border-gray-200"}`}><PawPrint className="h-3 w-3 inline mr-1" />Pet</button>
              </div>
              {patientType === "pet" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1"><label className="text-xs font-medium">Pet Name *</label>
                    <Input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Species *</label>
                    <Input value={patientForm.species} onChange={(e) => setPatientForm({ ...patientForm, species: e.target.value })} placeholder="e.g. Dog, Cat" className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Breed</label>
                    <Input value={patientForm.breed} onChange={(e) => setPatientForm({ ...patientForm, breed: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Weight (kg)</label>
                    <Input type="number" value={patientForm.weight} onChange={(e) => setPatientForm({ ...patientForm, weight: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Color</label>
                    <Input value={patientForm.color} onChange={(e) => setPatientForm({ ...patientForm, color: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Microchip ID</label>
                    <Input value={patientForm.microchipId} onChange={(e) => setPatientForm({ ...patientForm, microchipId: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Owner Name *</label>
                    <Input value={patientForm.ownerName} onChange={(e) => setPatientForm({ ...patientForm, ownerName: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Owner Phone</label>
                    <Input value={patientForm.ownerPhone} onChange={(e) => setPatientForm({ ...patientForm, ownerPhone: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Owner Email</label>
                    <Input value={patientForm.ownerEmail} onChange={(e) => setPatientForm({ ...patientForm, ownerEmail: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Allergies</label>
                    <Input value={patientForm.allergies} onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Current Meds</label>
                    <Input value={patientForm.currentMedications} onChange={(e) => setPatientForm({ ...patientForm, currentMedications: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Past Surgeries</label>
                    <Input value={patientForm.pastSurgeries} onChange={(e) => setPatientForm({ ...patientForm, pastSurgeries: e.target.value })} className="h-9 text-sm" /></div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1"><label className="text-xs font-medium">Name *</label>
                    <Input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Phone *</label>
                    <Input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Email</label>
                    <Input value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Language</label>
                    <LanguageSelect value={patientForm.language} onChange={(v) => setPatientForm({ ...patientForm, language: v })} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Primary Diagnosis</label>
                    <Input value={patientForm.primaryDiagnosis} onChange={(e) => setPatientForm({ ...patientForm, primaryDiagnosis: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Chronic Conditions</label>
                    <Input value={patientForm.chronicConditions} onChange={(e) => setPatientForm({ ...patientForm, chronicConditions: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Allergies</label>
                    <Input value={patientForm.allergies} onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })} className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Medications</label>
                    <Input value={patientForm.currentMedications} onChange={(e) => setPatientForm({ ...patientForm, currentMedications: e.target.value })} className="h-9 text-sm" /></div>
                </div>
              )}
              <div className="mt-2">
                <label className="text-xs font-medium">KB Notes</label>
                <textarea value={patientForm.kbNotes} onChange={(e) => setPatientForm({ ...patientForm, kbNotes: e.target.value })}
                  placeholder={patientType === "pet" ? "AI context: pet is nervous during exams, prefers female vet..." : "AI context: patient prefers afternoon calls, hard of hearing..."}
                  className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" disabled={createPatient.isPending} onClick={() => {
                  if (!patientForm.name) { toast.error("Name required"); return; }
                  if (patientType === "human" && !patientForm.phone) { toast.error("Phone required"); return; }
                  if (patientType === "pet" && !patientForm.species) { toast.error("Species required"); return; }
                  createPatient.mutate(patientForm);
                }}>Save</Button>
                <Button variant="outline" size="sm" onClick={() => setShowForm(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

      {showForm === "group" && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">New Group</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowForm(null)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><label className="text-xs font-medium">Name *</label>
                <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><label className="text-xs font-medium">Auto-Filter Diagnosis</label>
                <Input placeholder="e.g., Diabetes" value={groupForm.diagnosisFilter} onChange={(e) => setGroupForm({ ...groupForm, diagnosisFilter: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><label className="text-xs font-medium">Description</label>
                <Input value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} className="h-9 text-sm" /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" disabled={createGroup.isPending} onClick={() => {
                if (!groupForm.name.trim()) { toast.error("Name required"); return; }
                createGroup.mutate(groupForm);
              }}>Create</Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
            <Users className="h-4 w-4" /> Groups ({groups.length})
          </h2>
          {groups.map((group: any) => {
            const isOpen = expandGroup === group._id;
            const members = group.members || [];
            const nonMembers = patients.filter((p: any) => !members.some((m: any) => m._id === p._id));

            return (
              <Card key={group._id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandGroup(isOpen ? null : group._id)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                    <span className="font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">{members.length}</span>
                    {group.diagnosisFilter && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Filter: {group.diagnosisFilter}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm" variant="outline" className="h-7 text-xs gap-1"
                      disabled={members.length === 0 || callGroup.isPending}
                      onClick={() => callGroup.mutate(group._id)}
                    >
                      <Phone className="h-3 w-3" /> Call All
                    </Button>
                    <button
                      onClick={() => { if (confirm("Delete group?")) deleteGroup.mutate(group._id); }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-2">
                    {/* Add member */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search patient to add..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                      {groupSearch && nonMembers.filter((p: any) =>
                        p.name.toLowerCase().includes(groupSearch.toLowerCase()) || p.phone.includes(groupSearch)
                      ).length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {nonMembers.filter((p: any) =>
                            p.name.toLowerCase().includes(groupSearch.toLowerCase()) || p.phone.includes(groupSearch)
                          ).slice(0, 8).map((p: any) => (
                            <button key={p._id}
                              onClick={() => addMember.mutate({ g: group._id, p: p._id })}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 border-b last:border-0 flex justify-between"
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="text-muted-foreground">{p.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Members */}
                    {members.length === 0 ? (
                      <p className="text-xs text-gray-400 py-1">No members yet. Search above to add patients.</p>
                    ) : (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {members.map((m: any) => (
                          <div key={m._id} className="flex items-center justify-between rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                            <Link to={`/patients/${m._id}`} className="flex items-center gap-2 min-w-0 flex-1">
                              {m.patientType === "pet" ? <PawPrint className="h-3.5 w-3.5 text-amber-500 shrink-0" /> : <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                              <span className="text-sm font-medium truncate">{m.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{m.patientType === "pet" ? m.species || "Pet" : m.phone}</span>
                              {m.primaryDiagnosis && <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 truncate">{m.primaryDiagnosis}</span>}
                            </Link>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => callPatient(m)} className="p-1 rounded hover:bg-primary/10 text-gray-400 hover:text-primary" title="Call">
                                <Phone className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => removeMember.mutate({ g: group._id, p: m._id })}
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Remove">
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Ungrouped Patients */}
      {isLoading ? (
        <p className="text-sm text-gray-500 py-4">Loading...</p>
      ) : patients.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-gray-400">No patients yet.</CardContent></Card>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <User className="h-4 w-4" /> Patients ({ungrouped.length})
          </h2>
          {(search ? filtered : ungrouped).length === 0 ? (
            <Card><CardContent className="py-6 text-center text-sm text-gray-400">
              {search ? "No matching patients." : "All patients are in groups."}
            </CardContent></Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(search ? filtered : ungrouped).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50">
                  <Link to={`/patients/${p._id}`} className="min-w-0 flex-1">
                    <div className="text-sm font-medium hover:text-primary truncate flex items-center gap-1.5">
                      {p.patientType === "pet" ? <PawPrint className="h-3.5 w-3.5 text-amber-500 shrink-0" /> : <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                      <span>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {p.patientType === "pet" ? (
                        <span>{p.species}{p.breed ? ` · ${p.breed}` : ""}</span>
                      ) : (
                        <>
                          <span>{p.phone}</span>
                          {p.primaryDiagnosis && <span className="truncate">· {p.primaryDiagnosis}</span>}
                        </>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => callPatient(p)} className="p-1.5 rounded hover:bg-primary/10 text-gray-400 hover:text-primary" title="Call">
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    {groups.length > 0 && !memberIds.has(p._id) && (
                      <div className="relative group">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Add to group">
                          <Users className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block min-w-[160px] bg-white border rounded-lg shadow-lg py-1">
                          {groups.filter((g: any) => !g.members?.some((m: any) => m._id === p._id)).map((g: any) => (
                            <button key={g._id} onClick={() => addMember.mutate({ g: g._id, p: p._id })}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">
                              {g.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${p.name}"?`)) deletePatient.mutate(p._id); }}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
