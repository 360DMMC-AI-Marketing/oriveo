import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Users, X, Loader2, UserPlus, Shield, Stethoscope, User as UserIcon } from "lucide-react";

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

export default function ClinicUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "doctor" });
  const [inviteResult, setInviteResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org", "users"],
    queryFn: () => api.get("/org/users").then(r => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: any) => api.post("/org/users/invite", body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["org", "users"] });
      setInviteResult(res.data.user);
      setInviteForm({ name: "", email: "", role: "doctor" });
      toast.success("User invited");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: any) => api.put(`/org/users/${userId}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org", "users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deactivateUser = useMutation({
    mutationFn: (userId: string) => api.put(`/org/users/${userId}/deactivate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org", "users"] }); toast.success("User deactivated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-gray-500 text-sm">{users.length} / {data?.maxUsers || 5} members</p>
        </div>
        <Button onClick={() => { setShowInvite(!showInvite); setInviteResult(null); }} className="gap-1">
          {showInvite ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showInvite ? "Close" : "Invite Member"}
        </Button>
      </div>

      {showInvite && (
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">Invite Team Member</h3>
            {inviteResult ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-medium">User invited successfully!</p>
                <p>Email: <strong>{inviteResult.email}</strong></p>
                <p>Temporary password: <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">{inviteResult.tempPassword}</code></p>
                <p className="text-xs mt-1 text-green-600">Share this password securely with the new user.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setInviteResult(null)}>Invite Another</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
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

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => {
            const RoleIcon = ROLE_ICONS[u.role] || UserIcon;
            const roleColor = ROLE_COLORS[u.role] || "text-gray-600 bg-gray-50";
            const isSelf = u._id === currentUser?._id;
            return (
              <Card key={u._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${roleColor}`}>
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.role}
                      </span>
                      {u.isActive ? (
                        <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active" />
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-gray-300" title="Inactive" />
                      )}
                    </div>
                  </div>
                  {!isSelf && currentUser?.role === "admin" && (
                    <div className="mt-2 flex gap-2">
                      <select value={u.role} onChange={e => changeRole.mutate({ userId: u._id, role: e.target.value })}
                        className="text-xs border rounded px-2 py-1">
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                      {u.isActive && (
                        <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => deactivateUser.mutate(u._id)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
