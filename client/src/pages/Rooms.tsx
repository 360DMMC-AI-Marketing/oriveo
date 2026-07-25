import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Building2, Loader2, Plus, X, Search, Bed, Stethoscope,
  Wrench, ShieldCheck, Droplets, Monitor, FlaskConical,
  HeartPulse, Sofa, Video, HelpCircle, ChevronDown, Filter,
  Clock, Users, AlertTriangle, CheckCircle2, Eye, Trash2,
  Pencil, ArrowUpDown, LayoutGrid, List, Thermometer, MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ROOM_TYPES = [
  { id: "exam", label: "Exam Room", icon: Stethoscope },
  { id: "consultation", label: "Consultation", icon: Users },
  { id: "procedure", label: "Procedure Room", icon: HeartPulse },
  { id: "operating", label: "Operating Room", icon: Bed },
  { id: "imaging", label: "Imaging / Radiology", icon: Monitor },
  { id: "lab", label: "Laboratory", icon: FlaskConical },
  { id: "recovery", label: "Recovery Room", icon: Sofa },
  { id: "waiting", label: "Waiting Area", icon: Sofa },
  { id: "telehealth", label: "Telehealth Booth", icon: Video },
  { id: "other", label: "Other", icon: HelpCircle },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  available:   { label: "Available",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  occupied:    { label: "Occupied",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: Users },
  maintenance: { label: "Maintenance", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Wrench },
  reserved:    { label: "Reserved",    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: ShieldCheck },
  cleaning:    { label: "Cleaning",    color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Droplets },
};

const FLOOR_OPTIONS = ["Ground", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "B1", "B2"];

const QUICK_TEMPLATES = [
  { label: "Standard Clinic (8 rooms)", rooms: Array.from({ length: 8 }, (_, i) => ({ name: `Exam Room ${i + 1}`, number: `${i + 1}`, type: "exam" })) },
  { label: "Hospital Wing (20 rooms)", rooms: [
    ...Array.from({ length: 8 }, (_, i) => ({ name: `Exam Room ${i + 1}`, number: `${i + 1}`, type: "exam", floor: "1" })),
    ...Array.from({ length: 4 }, (_, i) => ({ name: `Consultation ${String.fromCharCode(65 + i)}`, number: `C${i + 1}`, type: "consultation", floor: "1" })),
    ...Array.from({ length: 4 }, (_, i) => ({ name: `Operating Room ${i + 1}`, number: `OR${i + 1}`, type: "operating", floor: "2" })),
    ...Array.from({ length: 2 }, (_, i) => ({ name: `Imaging ${i + 1}`, number: `IM${i + 1}`, type: "imaging", floor: "2" })),
    { name: "Recovery 1", number: "R1", type: "recovery", floor: "2" },
    { name: "Recovery 2", number: "R2", type: "recovery", floor: "2" },
  ]},
  { label: "Dental Clinic (6 rooms)", rooms: [
    { name: "Operatories 1-4", number: "O1-O4", type: "procedure" },
    { name: "Consultation Room", number: "C1", type: "consultation" },
    { name: "Sterilization Lab", number: "L1", type: "lab" },
  ]},
  { label: "Veterinary Hospital (10 rooms)", rooms: [
    ...Array.from({ length: 4 }, (_, i) => ({ name: `Exam Room ${i + 1}`, number: `E${i + 1}`, type: "exam" })),
    ...Array.from({ length: 2 }, (_, i) => ({ name: `Surgery ${i + 1}`, number: `S${i + 1}`, type: "operating" })),
    ...Array.from({ length: 2 }, (_, i) => ({ name: `Kennel ${i + 1}`, number: `K${i + 1}`, type: "recovery" })),
    { name: "Imaging Room", number: "IM1", type: "imaging" },
    { name: "Isolation Room", number: "ISO1", type: "procedure" },
  ]},
];

function RoomForm({ onSave, onClose, initial, staffList }: { onSave: (data: any) => void; onClose: () => void; initial?: any; staffList?: any[] }) {
  const [form, setForm] = useState(initial || { name: "", number: "", type: "exam", floor: "", wing: "", capacity: 1, equipment: "", notes: "", assignedStaff: [] });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleStaff = (userId: string) => {
    const current = form.assignedStaff || [];
    const next = current.includes(userId) ? current.filter((id: string) => id !== userId) : [...current, userId];
    set("assignedStaff", next);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{initial ? "Edit Room" : "Add Room"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Room Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Exam Room 1" className="mt-1" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Room Number</Label>
              <Input value={form.number} onChange={e => set("number", e.target.value)} placeholder="101" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Room Type</Label>
              <select value={form.type} onChange={e => set("type", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {ROOM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={e => set("capacity", parseInt(e.target.value) || 1)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Floor</Label>
              <select value={form.floor} onChange={e => set("floor", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— None —</option>
                {FLOOR_OPTIONS.map(f => <option key={f} value={f}>Floor {f}</option>)}
              </select>
            </div>
            <div>
              <Label>Wing</Label>
              <Input value={form.wing} onChange={e => set("wing", e.target.value)} placeholder="East / West / A" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Equipment (comma-separated)</Label>
            <Input value={form.equipment} onChange={e => set("equipment", e.target.value)} placeholder="Ultrasound, ECG, Pulse Oximeter" className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Special instructions..." />
          </div>
          <div>
            <Label>Assigned Staff</Label>
            <p className="text-xs text-gray-500 mb-2">Select who is in charge of / present in this room</p>
            {staffList && staffList.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-2">
                {staffList.map((s: any) => (
                  <label key={s._id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={(form.assignedStaff || []).includes(s._id)} onChange={() => toggleStaff(s._id)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-500 capitalize">({s.role})</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No staff members found. Add team members first.</p>
            )}
            {(form.assignedStaff || []).length > 0 && (
              <p className="text-xs text-emerald-600 mt-1">{(form.assignedStaff || []).length} staff member(s) assigned</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.name.trim()) { toast.error("Room name required"); return; } onSave({ ...form, equipment: typeof form.equipment === "string" ? form.equipment.split(",").map((s: string) => s.trim()).filter(Boolean) : form.equipment }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {initial ? "Save Changes" : "Add Room"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, onEdit, onStatusChange, onSeed }: { room: any; onEdit: () => void; onStatusChange: (status: string) => void; onSeed?: () => void }) {
  const status = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
  const StatusIcon = status.icon;
  const typeInfo = ROOM_TYPES.find(t => t.id === room.type);
  const TypeIcon = typeInfo?.icon || HelpCircle;
  const [showActions, setShowActions] = useState(false);

  return (
    <div className={`rounded-xl border-2 ${status.border} ${status.bg} p-4 transition-all hover:shadow-md relative group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${status.bg} border ${status.border}`}>
            <TypeIcon size={18} className={status.color} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{room.name}</h3>
            {room.number && <p className="text-xs text-gray-500">#{room.number}</p>}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowActions(!showActions)} className="p-1 hover:bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronDown size={14} />
          </button>
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[140px] py-1">
              <button onClick={() => { onEdit(); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"><Pencil size={13} /> Edit</button>
              {room.status !== "available" && <button onClick={() => { onStatusChange("available"); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-emerald-600"><CheckCircle2 size={13} /> Set Available</button>}
              {room.status !== "occupied" && <button onClick={() => { onStatusChange("occupied"); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"><Users size={13} /> Set Occupied</button>}
              {room.status !== "maintenance" && <button onClick={() => { onStatusChange("maintenance"); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-600"><Wrench size={13} /> Set Maintenance</button>}
              {room.status !== "reserved" && <button onClick={() => { onStatusChange("reserved"); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"><ShieldCheck size={13} /> Set Reserved</button>}
              {room.status !== "cleaning" && <button onClick={() => { onStatusChange("cleaning"); setShowActions(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-purple-600"><Droplets size={13} /> Set Cleaning</button>}
            </div>
          )}
        </div>
      </div>

      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color} border ${status.border}`}>
        <StatusIcon size={12} /> {status.label}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-1.5"><TypeIcon size={12} /> {typeInfo?.label || room.type}</div>
        {(room.floor || room.wing) && <div className="flex items-center gap-1.5"><MapPin size={12} /> {[room.floor && `Floor ${room.floor}`, room.wing].filter(Boolean).join(" · ")}</div>}
        {room.capacity > 1 && <div className="flex items-center gap-1.5"><Users size={12} /> Capacity: {room.capacity}</div>}
        {room.assignedStaff && room.assignedStaff.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Stethoscope size={12} className="mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {room.assignedStaff.map((s: any) => (
                <span key={s._id || s} className="px-1.5 py-0.5 bg-white/80 rounded text-[10px] font-medium text-emerald-700 border border-emerald-200">{s.name || "Staff"}</span>
              ))}
            </div>
          </div>
        )}
        {room.currentPatient && <div className="flex items-center gap-1.5 text-red-600 font-medium"><Users size={12} /> {room.currentPatient.name}</div>}
        {room.currentProvider && <div className="flex items-center gap-1.5"><Stethoscope size={12} /> {room.currentProvider.name}</div>}
      </div>

      {room.equipment && room.equipment.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {room.equipment.slice(0, 3).map((eq: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 bg-white/80 rounded text-[10px] font-medium text-gray-600 border">{eq}</span>
          ))}
          {room.equipment.length > 3 && <span className="px-1.5 py-0.5 bg-white/80 rounded text-[10px] text-gray-500">+{room.equipment.length - 3}</span>}
        </div>
      )}
    </div>
  );
}

export default function Rooms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSeed, setShowSeed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", filterStatus, filterType, filterFloor, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);
      if (filterFloor) params.set("floor", filterFloor);
      if (search) params.set("search", search);
      return api.get(`/rooms?${params}`).then(r => r.data);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["room-stats"],
    queryFn: () => api.get("/rooms/stats").then(r => r.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ["room-staff"],
    queryFn: () => api.get("/rooms/staff").then(r => r.data),
  });

  const staffList = staffData?.users || [];

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/rooms", d),
    onSuccess: () => { toast.success("Room added"); queryClient.invalidateQueries({ queryKey: ["rooms"] }); setShowForm(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/rooms/${id}`, d),
    onSuccess: () => { toast.success("Room updated"); queryClient.invalidateQueries({ queryKey: ["rooms"] }); setEditingRoom(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/rooms/${id}/status`, { status }),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["rooms"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => { toast.success("Room removed"); queryClient.invalidateQueries({ queryKey: ["rooms"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const seedMut = useMutation({
    mutationFn: (rooms: any[]) => api.post("/rooms/seed", { rooms }),
    onSuccess: (r) => { toast.success(`${r.data.count} rooms created`); queryClient.invalidateQueries({ queryKey: ["rooms"] }); setShowSeed(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const rooms = data?.rooms || [];
  const summary = data?.summary || { total: 0, available: 0, occupied: 0, maintenance: 0, reserved: 0, cleaning: 0 };

  const allFloors: string[] = [...new Set(rooms.map((r: any) => r.floor).filter(Boolean))] as string[];
  const occupiedPct = summary.total > 0 ? Math.round((summary.occupied / summary.total) * 100) : 0;

  if (user?.organization?.clinicSize !== "large") {
    return (
      <div className="p-8 text-center">
        <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Room Management</h2>
        <p className="text-gray-500">This feature is available for large clinics and hospitals.</p>
        <p className="text-sm text-gray-400 mt-2">Upgrade your clinic size in Settings to enable room management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-sm text-gray-500 mt-1">{summary.total} rooms · {occupiedPct}% occupancy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSeed(!showSeed)}><LayoutGrid size={14} className="mr-1" /> Quick Setup</Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Add Room</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: summary.total, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Available", value: summary.available, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Occupied", value: summary.occupied, color: "text-red-600", bg: "bg-red-50" },
          { label: "Reserved", value: summary.reserved, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Cleaning", value: summary.cleaning, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Maintenance", value: summary.maintenance, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy Bar */}
      {summary.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
              <span className="text-sm font-bold text-gray-900">{occupiedPct}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div className="bg-emerald-500 transition-all" style={{ width: `${(summary.available / summary.total) * 100}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${(summary.occupied / summary.total) * 100}%` }} />
                <div className="bg-blue-500 transition-all" style={{ width: `${(summary.reserved / summary.total) * 100}%` }} />
                <div className="bg-purple-500 transition-all" style={{ width: `${(summary.cleaning / summary.total) * 100}%` }} />
                <div className="bg-amber-500 transition-all" style={{ width: `${(summary.maintenance / summary.total) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Reserved</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Cleaning</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup Panel */}
      {showSeed && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <LayoutGrid size={16} /> Quick Room Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-3">Pre-populate rooms for your clinic type:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_TEMPLATES.map(tmpl => (
                <button key={tmpl.label} onClick={() => seedMut.mutate(tmpl.rooms)} disabled={seedMut.isPending}
                  className="text-left p-3 rounded-lg border bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-all disabled:opacity-50">
                  <p className="text-sm font-medium text-gray-900">{tmpl.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{tmpl.rooms.length} rooms</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms..." className="pl-9" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All Types</option>
              {ROOM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All Floors</option>
              {allFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
            </select>
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-gray-50"}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-gray-50"}`}><List size={16} /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No rooms yet</h3>
            <p className="text-gray-500 mb-4">Add rooms or use Quick Setup to get started.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowSeed(true)}><LayoutGrid size={14} className="mr-1" /> Quick Setup</Button>
              <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Add Room</Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room: any) => (
            <RoomCard key={room._id} room={room} onEdit={() => setEditingRoom(room)} onStatusChange={(s) => statusMut.mutate({ id: room._id, status: s })} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Room</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Floor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Provider</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rooms.map((room: any) => {
                  const st = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
                  const ti = ROOM_TYPES.find(t => t.id === room.type);
                  return (
                    <tr key={room._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{room.name}</div>
                        {room.number && <div className="text-xs text-gray-500">#{room.number}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ti?.label || room.type}</td>
                      <td className="px-4 py-3 text-gray-600">{room.floor || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.color} border ${st.border}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {room.assignedStaff?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {room.assignedStaff.map((s: any) => (
                              <span key={s._id || s} className="px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] font-medium text-emerald-700 border border-emerald-200">{s.name || "Staff"}</span>
                            ))}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{room.currentPatient?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{room.currentProvider?.name || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingRoom(room)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={13} /></button>
                          {room.status !== "available" && <button onClick={() => statusMut.mutate({ id: room._id, status: "available" })} className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600"><CheckCircle2 size={13} /></button>}
                          <button onClick={() => { if (confirm("Remove this room?")) deleteMut.mutate(room._id); }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Floor breakdown */}
      {stats?.byFloor?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><ArrowUpDown size={16} /> By Floor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.byFloor.map((f: any) => (
                <button key={f._id} onClick={() => setFilterFloor(filterFloor === f._id ? "" : f._id)} className={`px-3 py-2 rounded-lg border text-sm ${filterFloor === f._id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white hover:bg-gray-50"}`}>
                  Floor {f._id} <span className="ml-1 font-bold">{f.count}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type breakdown */}
      {stats?.byType?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><LayoutGrid size={16} /> By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.byType.map((t: any) => {
                const ti = ROOM_TYPES.find(rt => rt.id === t._id);
                return (
                  <button key={t._id} onClick={() => setFilterType(filterType === t._id ? "" : t._id)} className={`px-3 py-2 rounded-lg border text-sm ${filterType === t._id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white hover:bg-gray-50"}`}>
                    {ti?.label || t._id} <span className="ml-1 font-bold">{t.count}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && <RoomForm staffList={staffList} onSave={(d) => createMut.mutate(d)} onClose={() => setShowForm(false)} />}
      {editingRoom && <RoomForm staffList={staffList} initial={{ ...editingRoom, equipment: Array.isArray(editingRoom.equipment) ? editingRoom.equipment.join(", ") : "", assignedStaff: (editingRoom.assignedStaff || []).map((s: any) => typeof s === "string" ? s : s._id) }} onSave={(d) => updateMut.mutate({ id: editingRoom._id, ...d })} onClose={() => setEditingRoom(null)} />}
    </div>
  );
}
