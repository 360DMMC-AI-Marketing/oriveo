import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Users, X, Loader2, UserPlus, Shield, Stethoscope, User as UserIcon, Building2, ChevronDown, ChevronRight, Plus, Check, AlertCircle, Settings } from "lucide-react";

const ROLE_ICONS: Record<string, any> = {
  admin: Shield,
  doctor: Stethoscope,
  nurse: Users,
  receptionist: UserIcon,
};
const ROLE_COLORS: Record<string, string> = {
  admin: "text-purple-600 bg-purple-50",
  doctor: "text-blue-600 bg-blue-50",
  nurse: "text-emerald-600 bg-emerald-50",
  receptionist: "text-amber-600 bg-amber-50",
};

const DEPT_ICONS: Record<string, string> = {
  medical: "🩺", nursing: "🏥", admin: "📋", support: "🔧", lab: "🔬",
  imaging: "📡", "child-life": "🧸", "neuro-dx": "🧠", therapy: "💬",
  aesthetics: "✨", aides: "🤝", endoscopy: "🔦", "diabetes-ed": "🍎",
  infusion: "💉", "social-work": "🤗", dialysis: "🩸", "resp-therapy": "🫁",
  optometry: "👁️", audiology: "👂", hygiene: "🦷", assisting: "🪑",
  surgical: "🏨", "surgical-nursing": "🏨", anesthesia: "😷",
  "child-care": "🧒", tech: "🔧", surgery: "🏨", kennel: "🐾",
  grooming: "✂️", farriery: "🐴", barn: "🌾", "farm-svc": "🚜",
  clinical: "🩺", orthodontic: "😁",
};

export default function ClinicUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "doctor", department: "" });
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showManageTeams, setShowManageTeams] = useState(false);

  const { data: deptData, isLoading: loadingDepts } = useQuery({
    queryKey: ["org-departments"],
    queryFn: () => api.get("/clinic-config/departments").then((r) => r.data),
  });

  const saveDeptMutation = useMutation({
    mutationFn: (depts: any[]) => api.put("/clinic-config/departments", { departments: depts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-departments"] });
      queryClient.invalidateQueries({ queryKey: ["org", "users"] });
      toast.success("Teams updated");
    },
    onError: () => toast.error("Failed to update teams"),
  });

  const allDepartments: any[] = deptData?.departments || [];
  const available: any[] = deptData?.available || [];
  const activeDepts = allDepartments.filter((d) => d.isActive);
  const availableToAdd = available.filter((a) => !allDepartments.find((d) => d.id === a.id));

  const addTeam = (dept: any) => {
    const exists = allDepartments.find((d) => d.id === dept.id);
    if (exists) {
      saveDeptMutation.mutate(allDepartments.map((d) => d.id === dept.id ? { ...d, isActive: true } : d));
    } else {
      saveDeptMutation.mutate([...allDepartments, { ...dept, isActive: true }]);
    }
  };

  const removeTeam = (id: string) => {
    saveDeptMutation.mutate(allDepartments.filter((d) => d.id !== id));
  };

  const toggleTeam = (id: string) => {
    saveDeptMutation.mutate(allDepartments.map((d) => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const { data, isLoading } = useQuery({
    queryKey: ["org", "users"],
    queryFn: () => api.get("/org/users").then(r => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: any) => api.post("/org/users/invite", body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["org", "users"] });
      setInviteResult(res.data.user);
      setInviteForm({ name: "", email: "", role: "doctor", department: "" });
      toast.success("User invited");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: any) => api.put(`/org/users/${userId}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org", "users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const changeDept = useMutation({
    mutationFn: ({ userId, department }: any) => api.put(`/org/users/${userId}/department`, { department }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org", "users"] }); toast.success("Department updated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deactivateUser = useMutation({
    mutationFn: (userId: string) => api.put(`/org/users/${userId}/deactivate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org", "users"] }); toast.success("User deactivated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const users: any[] = data?.users || [];
  const departments = activeDepts;

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = { _undefined: [] };
    for (const d of departments) groups[d.id] = [];
    for (const u of users) {
      if (u.department && groups[u.department]) groups[u.department].push(u);
      else groups._undefined.push(u);
    }
    return groups;
  }, [users, departments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-gray-500 text-sm">{users.length} / {data?.maxUsers || 5} members across {departments.length} departments</p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?.role === "admin" && (
            <Button variant="outline" onClick={() => { setShowManageTeams(!showManageTeams); if (!showManageTeams) { setShowInvite(false); setInviteResult(null); } }} className="gap-1">
              {showManageTeams ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              {showManageTeams ? "Close" : "Manage Teams"}
            </Button>
          )}
          <Button onClick={() => { setShowInvite(!showInvite); setInviteResult(null); if (!showInvite) setShowManageTeams(false); }} className="gap-1">
            {showInvite ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showInvite ? "Close" : "Invite Member"}
          </Button>
        </div>
      </div>

      {/* Manage Teams Panel */}
      {showManageTeams && currentUser?.role === "admin" && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-4">
            {activeDepts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Active Teams</p>
                <div className="flex flex-wrap gap-2">
                  {activeDepts.map((dept: any) => (
                    <span key={dept.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#0a7c6f]/20 bg-[#0a7c6f]/5 px-3 py-1.5 text-xs font-medium text-[#0a7c6f]">
                      {DEPT_ICONS[dept.id] || "📋"} {dept.label}
                      <button onClick={() => removeTeam(dept.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-[#0a7c6f]/10 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {availableToAdd.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Available to Add</p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map((dept: any) => (
                    <button key={dept.id} onClick={() => addTeam(dept)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:border-[#0a7c6f]/30 hover:bg-[#0a7c6f]/5 hover:text-[#0a7c6f] transition-colors">
                      {DEPT_ICONS[dept.id] || "📋"} {dept.label}
                      <Plus className="h-3 w-3 ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Form */}
      {showInvite && (
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">Invite Team Member</h3>
            {inviteResult ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-medium">User invited successfully!</p>
                <p>Email: <strong>{inviteResult.email}</strong></p>
                <p>Temporary password: <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">{inviteResult.tempPassword}</code></p>
                {inviteResult.department && <p>Department: {departments.find(d => d.id === inviteResult.department)?.label || inviteResult.department}</p>}
                <p className="text-xs mt-1 text-green-600">Share this password securely with the new user.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setInviteResult(null)}>Invite Another</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <Input value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <Input value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="john@clinic.com" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Role</label>
                    <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Department</label>
                    <select value={inviteForm.department} onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Auto (by role)</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{DEPT_ICONS[d.id] || "📋"} {d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => inviteMutation.mutate(inviteForm)} disabled={!inviteForm.name || !inviteForm.email || inviteMutation.isPending}>
                    {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Send Invite
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Department Sections */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {departments.map((dept: any) => {
            const members = grouped[dept.id] || [];
            const isCollapsed = collapsed[dept.id];
            return (
              <Card key={dept.id} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => setCollapsed({ ...collapsed, [dept.id]: !isCollapsed })}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a7c6f]/10 text-lg">
                      {DEPT_ICONS[dept.id] || "📋"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{dept.label}</h3>
                      <p className="text-xs text-gray-500">{members.length} member{members.length !== 1 ? "s" : ""} — {dept.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {(dept.roles || []).map((role: string) => {
                        const RI = ROLE_ICONS[role];
                        return (
                          <span key={role} className="inline-flex items-center gap-0.5 rounded bg-white border px-1.5 py-0.5 text-[10px] text-gray-500">
                            {RI ? <RI className="h-3 w-3" /> : null} {role}
                          </span>
                        );
                      })}
                    </div>
                    {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
                {!isCollapsed && (
                  <CardContent className="p-0">
                    {members.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p>No staff assigned to this department yet.</p>
                        <p className="text-xs mt-0.5">Invite members or edit existing users to assign them here.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {members.map((u: any) => {
                          const RoleIcon = ROLE_ICONS[u.role] || UserIcon;
                          const roleColor = ROLE_COLORS[u.role] || "text-gray-600 bg-gray-50";
                          const isSelf = u._id === currentUser?._id;
                          return (
                            <div key={u._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${roleColor}`}>
                                  <RoleIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(you)</span>}
                                  </p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {u.isActive ? (
                                  <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active" />
                                ) : (
                                  <span className="flex h-2 w-2 rounded-full bg-gray-300" title="Inactive" />
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {u.role}
                                </span>
                                {!isSelf && currentUser?.role === "admin" && u.isActive && (
                                  <>
                                    <select value={u.role} onChange={e => changeRole.mutate({ userId: u._id, role: e.target.value })}
                                      className="text-xs border rounded px-2 py-1 text-gray-600">
                                      <option value="admin">Admin</option>
                                      <option value="doctor">Doctor</option>
                                      <option value="nurse">Nurse</option>
                                      <option value="receptionist">Receptionist</option>
                                    </select>
                                    <select value={u.department || ""} onChange={e => changeDept.mutate({ userId: u._id, department: e.target.value })}
                                      className="text-xs border rounded px-2 py-1 text-gray-600 max-w-[130px]">
                                      <option value="">No department</option>
                                      {departments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                      ))}
                                    </select>
                                    <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => deactivateUser.mutate(u._id)}>
                                      Deactivate
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* No Department */}
          {(grouped._undefined || []).length > 0 && (
            <Card className="overflow-hidden border-dashed">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-500 text-sm">Unassigned</h3>
                    <p className="text-xs text-gray-400">{grouped._undefined.length} member{grouped._undefined.length !== 1 ? "s" : ""} without department</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-0 divide-y divide-dashed">
                {grouped._undefined.map((u: any) => {
                  const RoleIcon = ROLE_ICONS[u.role] || UserIcon;
                  const roleColor = ROLE_COLORS[u.role] || "text-gray-600 bg-gray-50";
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <div key={u._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${roleColor}`}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {u.isActive ? (
                          <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active" />
                        ) : (
                          <span className="flex h-2 w-2 rounded-full bg-gray-300" title="Inactive" />
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.role}
                        </span>
                        {!isSelf && currentUser?.role === "admin" && u.isActive && (
                          <>
                            <select value={u.department || ""} onChange={e => changeDept.mutate({ userId: u._id, department: e.target.value })}
                              className="text-xs border rounded px-2 py-1 text-gray-600 max-w-[130px]">
                              <option value="">No department</option>
                              {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.label}</option>
                              ))}
                            </select>
                            <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => deactivateUser.mutate(u._id)}>
                              Deactivate
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet. Invite your first member.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
