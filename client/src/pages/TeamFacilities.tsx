import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Building2 } from "lucide-react";
import ClinicUsers from "@/pages/ClinicUsers";
import Rooms from "@/pages/Rooms";

export default function TeamFacilities() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isLarge = user?.organization?.clinicSize === "large";
  const [tab, setTab] = useState("team");

  const tabs = [
    ...(isAdmin ? [{ value: "team", label: "Team", icon: Users }] : []),
    ...(isLarge ? [{ value: "rooms", label: "Rooms", icon: Building2 }] : []),
  ];

  if (tabs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
        <p>Operations is not available for your clinic.</p>
      </div>
    );
  }

  const active = tabs.some((t) => t.value === tab) ? tab : tabs[0].value;

  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {isAdmin && (
          <TabsContent value="team">
            <ClinicUsers />
          </TabsContent>
        )}
        {isLarge && (
          <TabsContent value="rooms">
            <Rooms />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
