import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Phone, Users, Play, Pause, CheckCircle2, XCircle,
  Clock, TrendingUp, Upload
} from "lucide-react";

interface BatchCampaign {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "running" | "completed" | "paused" | "failed";
  totalPatients: number;
  completedCalls: number;
  successfulCalls: number;
  failedCalls: number;
  scheduledAt: string;
  createdAt: string;
}

export default function BatchCalling() {
  const queryClient = useQueryClient();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
  });

  const patients = patientsData?.patients || [];

  const startCampaignMutation = useMutation({
    mutationFn: async (data: { name: string; patientIds: string[]; scheduledAt?: string }) => {
      return api.post("/voice/batch/start", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-campaigns"] });
      toast.success("Campaign started");
      setShowNewCampaign(false);
      setCampaignName("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to start campaign");
    },
  });

  const campaigns: BatchCampaign[] = [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      running: "bg-emerald-100 text-emerald-800",
      completed: "bg-green-100 text-green-800",
      paused: "bg-amber-100 text-amber-800",
      failed: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const handleStartCampaign = () => {
    if (!campaignName.trim()) {
      toast.error("Campaign name required");
      return;
    }
    const patientIds = patients.map((p: any) => p._id);
    const scheduledAt = scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined;
    startCampaignMutation.mutate({ name: campaignName, patientIds, scheduledAt });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Calling</h1>
          <p className="text-muted-foreground">
            Run automated outbound call campaigns at scale
          </p>
        </div>
        <Button onClick={() => setShowNewCampaign(!showNewCampaign)} className="gap-2">
          <Upload className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Phone className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === "running" || c.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {showNewCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>New Batch Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g., Weekly Checkup - June 30"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Schedule Date (optional)</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule Time (optional)</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-muted-foreground">
                This campaign will call all <strong>{patients.length} patients</strong>{" "}
                {scheduleDate ? `on ${scheduleDate} at ${scheduleTime || "any time"}` : "immediately"}.
                Each patient will receive an AI-powered voice call.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStartCampaign} disabled={startCampaignMutation.isPending}>
                {startCampaignMutation.isPending ? "Starting..." : "Launch Campaign"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No campaigns yet</p>
              <p className="text-sm text-gray-400">
                Create your first batch call campaign to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{campaign.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{campaign.totalPatients} patients</span>
                      <span>{campaign.completedCalls} completed</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {campaign.successfulCalls}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3 w-3" />
                        {campaign.failedCalls}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    {campaign.status === "running" && (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
