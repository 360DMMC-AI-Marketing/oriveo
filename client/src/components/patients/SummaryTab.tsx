import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Calendar, Shield, MapPin, HeartPulse, AlertTriangle, Droplets, Pill, Syringe, Stethoscope, PhoneCall, BookOpen, PawPrint } from "lucide-react";

export default function SummaryTab({ patient }: { patient: any }) {
  const isPet = patient.patientType === "pet";
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            {isPet ? (
              <>
                <InfoRow icon={<PawPrint className="h-3.5 w-3.5 text-amber-600" />} label="Species" value={patient.species} />
                <InfoRow icon={<PawPrint className="h-3.5 w-3.5 text-amber-600" />} label="Breed" value={patient.breed} />
                <InfoRow label="Weight" value={patient.weight ? `${patient.weight} kg` : "—"} />
                <InfoRow label="Color" value={patient.color} />
                <InfoRow label="Microchip ID" value={patient.microchipId} />
                <InfoRow label="Gender" value={patient.gender} />
                <InfoRow label="Assigned Vet" value={patient.assignedDoctor?.name} />
                <InfoRow label="Last Checkup" value={patient.lastCheckupDate ? new Date(patient.lastCheckupDate).toLocaleDateString() : "—"} />
                <InfoRow label="Next Scheduled" value={patient.nextScheduledDate ? new Date(patient.nextScheduledDate).toLocaleDateString() : "—"} />
                <div className="col-span-full border-t pt-2 mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Owner Information</p>
                </div>
                <InfoRow label="Owner Name" value={patient.ownerName} />
                <InfoRow label="Owner Phone" value={patient.ownerPhone} />
                <InfoRow label="Owner Email" value={patient.ownerEmail} />
              </>
            ) : (
              <>
                <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Gender" value={patient.gender} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"} />
                <InfoRow icon={<Shield className="h-3.5 w-3.5 text-red-600" />} label="Blood Type" value={patient.bloodType} />
                <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={patient.phone} />
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={patient.email} />
                <InfoRow icon={<Stethoscope className="h-3.5 w-3.5" />} label="Assigned Doctor" value={patient.assignedDoctor?.name} />
                <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Insurance ID" value={patient.insuranceId} />
                <div className="col-span-full">
                  <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={patient.address} />
                </div>
              </>
            )}
          </div>
          <div className="border-t pt-3">
            <p className="text-sm font-semibold flex items-center gap-2 mb-2"><Stethoscope className="h-4 w-4 text-primary" /> Medical Summary</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MedCard icon={<HeartPulse className="h-3 w-3 text-blue-600" />} label="Primary Diagnosis" value={patient.primaryDiagnosis} />
              <MedCard icon={<AlertTriangle className="h-3 w-3 text-amber-600" />} label="Chronic Conditions" value={patient.chronicConditions} />
              <MedCard icon={<Droplets className="h-3 w-3 text-red-600" />} label="Allergies" value={patient.allergies} />
              <MedCard icon={<Pill className="h-3 w-3 text-purple-600" />} label="Current Medications" value={patient.currentMedications} />
              <MedCard icon={<Syringe className="h-3 w-3 text-cyan-600" />} label="Past Surgeries" value={patient.pastSurgeries} />
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-sm font-semibold flex items-center gap-2 mb-2"><PhoneCall className="h-4 w-4 text-primary" /> Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 block text-xs">Name</span><span className="font-medium">{patient.emergencyContact || "—"}</span></div>
              <div><span className="text-gray-500 block text-xs">Phone</span><span className="font-medium">{patient.emergencyContactPhone || "—"}</span></div>
            </div>
          </div>
          {patient.medicalNotes && (
            <div className="border-t pt-3">
              <span className="text-xs text-gray-500">Additional Medical Notes</span>
              <p className="text-sm bg-gray-50 rounded-lg p-3 mt-1">{patient.medicalNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-sm space-y-3">
            <div>
              <span className="text-gray-500 block text-xs">Language</span>
              <span className="font-medium uppercase">{patient.language}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Last Checkup</span>
              <span className="font-medium">{patient.lastCheckupDate ? new Date(patient.lastCheckupDate).toLocaleDateString() : "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Next Scheduled</span>
              <Badge variant="outline">{patient.nextScheduledDate ? new Date(patient.nextScheduledDate).toLocaleDateString() : "None"}</Badge>
            </div>
            <div className="border-t pt-3">
              <span className="text-gray-500 block text-xs flex items-center gap-1 mb-1"><BookOpen className="h-3 w-3" /> AI Knowledge Base Notes</span>
              <p className="text-sm bg-gray-50 rounded-lg p-3">{patient.kbNotes || <span className="text-gray-400 italic">No notes</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  return (
    <div>
      <span className="text-gray-500 block text-xs flex items-center gap-1">{icon}{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function MedCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs flex items-center gap-1 mb-0.5">{icon}{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
