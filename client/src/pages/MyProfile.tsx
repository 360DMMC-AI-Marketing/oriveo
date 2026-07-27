import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, User, Lock, Clock, RotateCcw, ChevronDown, ChevronRight, Shield, ShieldOff } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferBetween: number;
  isActive: boolean;
}

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showAvailability, setShowAvailability] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [slots, setSlots] = useState<Slot[]>(() =>
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 0, isActive: i > 0 && i < 6 }))
  );

  const queryClient = useQueryClient();

  const { data: mySchedule } = useQuery({
    queryKey: ["my-availability"],
    queryFn: () => api.get("/availability/me").then((r) => r.data),
    enabled: showAvailability,
    staleTime: 120000,
  });

  useEffect(() => {
    if (mySchedule?.schedule) {
      setSlots(
        DAYS.map((_, i) => {
          const existing = mySchedule.schedule.find((a: any) => a.dayOfWeek === i);
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, slotDuration: existing.slotDuration || 30, bufferBetween: existing.bufferBetween || 0, isActive: existing.isActive }
            : { dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferBetween: 0, isActive: false };
        })
      );
    }
  }, [mySchedule]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) => api.put("/auth/profile", data),
    onSuccess: (res: any) => {
      const u = res?.data?.user || res?.user || res;
      if (u?.name) { setName(u.name); setPhone(u.phone || ""); updateUser(u); }
      toast.success("Profile updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update"),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => api.post("/auth/change-password", data),
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); toast.success("Password changed"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to change password"),
  });

  const saveAvailMutation = useMutation({
    mutationFn: (data: { slots: Slot[] }) => api.put("/availability/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
      toast.success("Your availability updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const resetAvailMutation = useMutation({
    mutationFn: () => api.delete("/availability/me"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
      toast.success("Reset to org defaults");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to reset"),
  });

  const disable2FAMutation = useMutation({
    mutationFn: (password: string) => api.post("/auth/2fa/disable", { password }),
    onSuccess: () => {
      updateUser({ twoFactorEnabled: false } as any);
      setDisable2FAPassword("");
      setShow2FA(false);
      toast.success("Two-factor authentication disabled");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to disable 2FA"),
  });

  function updateSlot(index: number, field: keyof Slot, value: any) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information, availability, and password</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Input value={user?.role || ""} disabled className="bg-gray-50 capitalize" />
            </div>
            {user?.profession && (
              <div className="space-y-1">
                <Label className="text-xs">Profession</Label>
                <Input value={user.profession} disabled className="bg-gray-50" />
              </div>
            )}
            {user?.specialty && user.specialty.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Specialty</Label>
                <Input value={user.specialty.join(", ")} disabled className="bg-gray-50" />
              </div>
            )}
          </div>
          <Button size="sm" onClick={() => updateMutation.mutate({ name, phone })} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <button
          onClick={() => setShowAvailability(!showAvailability)}
          className="flex w-full items-center gap-2 px-6 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
        >
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900 flex-1">My Availability</span>
          {showAvailability ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        {showAvailability && (
          <CardContent className="space-y-3 border-t pt-4">
            <p className="text-xs text-gray-400">Set your weekly working hours. These override the organization's default schedule.</p>
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
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
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={() => saveAvailMutation.mutate({ slots })} disabled={saveAvailMutation.isPending}>
                <Save className="mr-1 h-4 w-4" /> {saveAvailMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => resetAvailMutation.mutate()} disabled={resetAvailMutation.isPending}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset to Default
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => passwordMutation.mutate({ currentPassword, newPassword })} disabled={passwordMutation.isPending || !currentPassword || !newPassword}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <button
          onClick={() => setShow2FA(!show2FA)}
          className="flex w-full items-center gap-2 px-6 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
        >
          <Shield className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900 flex-1">Two-Factor Authentication</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.twoFactorEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {user.twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
          {show2FA ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        {show2FA && (
          <CardContent className="space-y-4 border-t pt-4">
            <p className="text-xs text-gray-500">
              Two-factor authentication adds an extra layer of security by requiring a verification code from your authenticator app when signing in.
            </p>
            {user.twoFactorEnabled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">2FA is enabled on your account</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Enter your password to disable 2FA</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={disable2FAPassword}
                      onChange={(e) => setDisable2FAPassword(e.target.value)}
                      className="h-9 text-sm max-w-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disable2FAMutation.mutate(disable2FAPassword)}
                      disabled={disable2FAMutation.isPending || !disable2FAPassword}
                      className="text-danger border-danger/30 hover:bg-danger/5"
                    >
                      <ShieldOff className="mr-1 h-3.5 w-3.5" />
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/2fa-setup")}
                className="rounded-lg"
              >
                <Shield className="mr-1 h-4 w-4" />
                Enable 2FA
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
