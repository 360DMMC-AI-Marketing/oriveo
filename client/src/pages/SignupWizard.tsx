import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import Logo from "@/components/ui/Logo";
import {
  Building2, User, ArrowRight, ArrowLeft, Loader2, Sparkles,
  HeartPulse, Smile, Dog, Stethoscope, Users, Check,
} from "lucide-react";

const CLINIC_TYPE_ICONS: Record<string, any> = { human: HeartPulse, dental: Smile, veterinary: Dog };
const CLINIC_TYPE_COLORS: Record<string, string> = {
  human: "bg-emerald-100 text-emerald-600 border-emerald-200",
  dental: "bg-blue-100 text-blue-600 border-blue-200",
  veterinary: "bg-amber-100 text-amber-600 border-amber-200",
};

export default function SignupWizard() {
  const { signup: authSignup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clinicTypes, setClinicTypes] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    clinicType: "", specialty: "",
    clinicName: "", clinicSlug: "", plan: "starter",
    clinicSize: "small",
    staffDoctors: 0, staffNurses: 0, staffReceptionists: 0, staffOther: 0, workstations: 1,
  });

  useEffect(() => {
    api.get("/clinic-config/types").then((r) => setClinicTypes(r.data.types)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.clinicType) {
      api.get(`/clinic-config/specialties/${form.clinicType}`)
        .then((r) => { setSpecialties(r.data.specialties); setForm((f) => ({ ...f, specialty: "" })); })
        .catch(() => setSpecialties([]));
    }
  }, [form.clinicType]);

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const autoSlug = (v: string) => setForm((f) => ({
    ...f, clinicName: v,
    clinicSlug: v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  }));

  const canNext = () => {
    if (step === 1) return form.name && form.email && form.password;
    if (step === 2) return !!form.clinicType;
    if (step === 3) return !!form.specialty;
    if (step === 4) return !!form.clinicSize;
    if (step === 5) return form.clinicName && form.clinicSlug;
    return true;
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const payload: any = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, role: "admin",
        clinicName: form.clinicName, clinicSlug: form.clinicSlug,
        clinicType: form.clinicType, clinicSize: form.clinicSize,
        specialty: form.specialty,
      };
      if (form.clinicSize === "small") {
        payload.staffSetup = {
          doctors: form.staffDoctors, nurses: form.staffNurses,
          receptionists: form.staffReceptionists, otherStaff: form.staffOther,
          workstations: form.workstations,
        };
      }
      await authSignup(payload);
      toast.success("Your clinic is ready!");
      navigate("/clinic");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: "Account", icon: User },
    { num: 2, label: "Type", icon: Building2 },
    { num: 3, label: "Specialty", icon: Stethoscope },
    { num: 4, label: "Size", icon: Users },
    { num: 5, label: "Clinic", icon: Building2 },
  ];

  const selectedType = clinicTypes.find((t) => t.id === form.clinicType);
  const TypeIcon = form.clinicType ? CLINIC_TYPE_ICONS[form.clinicType] || Building2 : Building2;
  const typeColorClass = form.clinicType ? CLINIC_TYPE_COLORS[form.clinicType] || "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="md" variant="dark" />
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Platform</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="/contact" className="text-sm text-primary font-medium transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-medium">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="bg-primary hover:bg-primary-dark text-sm px-5">Request a Demo</Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <Logo size="xl" showText={false} />
            </div>
          <CardTitle className="text-2xl">Set up your clinic</CardTitle>
          <p className="text-sm text-gray-500 mt-1">AI-powered triage tailored to your practice</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-1">
            {stepLabels.map((s) => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step >= s.num ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  <s.icon className="h-3 w-3" />
                </div>
                {s.num < 5 && <div className={`w-6 h-0.5 ${step > s.num ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Your Account</p>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name" />
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email address" />
              <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Password (min 6 chars)" />
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone (optional)" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Clinic Type</p>
              <p className="text-xs text-gray-400 mb-2">What kind of practice do you run?</p>
              <div className="grid gap-2">
                {clinicTypes.map((type) => {
                  const Icon = CLINIC_TYPE_ICONS[type.id] || Building2;
                  const isSelected = form.clinicType === type.id;
                  const colorClass = CLINIC_TYPE_COLORS[type.id] || "bg-gray-100 text-gray-600";
                  return (
                    <button key={type.id} type="button"
                      onClick={() => set("clinicType", type.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? colorClass : "bg-gray-100 text-gray-500"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="h-3 w-3" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColorClass}`}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{selectedType?.label} Specialty</p>
                  <p className="text-xs text-gray-400">Choose your specialization</p>
                </div>
              </div>
              <div className="grid gap-2">
                {specialties.map((spec) => (
                  <button key={spec.id} type="button"
                    onClick={() => set("specialty", spec.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      form.specialty === spec.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      form.specialty === spec.id ? typeColorClass : "bg-gray-100 text-gray-500"
                    }`}>
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{spec.label}</p>
                    </div>
                    {form.specialty === spec.id && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="h-3 w-3" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Clinic Size</p>
              <p className="text-xs text-gray-400 mb-2">This determines available features and billing</p>
              <div className="grid gap-2">
                <button type="button"
                  onClick={() => set("clinicSize", "small")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    form.clinicSize === "small" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    form.clinicSize === "small" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Small Clinic</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Solo or small practice with limited staff. Simplified dashboard, single-provider scheduling, basic invoicing.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Up to 5 providers</span>
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Single location</span>
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Basic reports</span>
                    </div>
                  </div>
                  {form.clinicSize === "small" && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="h-3 w-3" /></div>}
                </button>

                <button type="button"
                  onClick={() => set("clinicSize", "large")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    form.clinicSize === "large" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    form.clinicSize === "large" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Large Clinic / Hospital</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Multi-provider, multi-department. Full scheduling, room management, role-based access, advanced billing.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Unlimited providers</span>
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Multi-department</span>
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Advanced billing</span>
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">Role-based access</span>
                    </div>
                  </div>
                  {form.clinicSize === "large" && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="h-3 w-3" /></div>}
                </button>
              </div>

              {form.clinicSize === "small" && (
                <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1"><Users className="h-3 w-3" /> Staff Setup</p>
                  <p className="text-xs text-gray-400 mb-2">How many staff members do you need? Accounts will be auto-created with temporary passwords.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Doctors</label>
                      <Input type="number" min={0} value={form.staffDoctors} onChange={e => set("staffDoctors", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Nurses</label>
                      <Input type="number" min={0} value={form.staffNurses} onChange={e => set("staffNurses", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Receptionists</label>
                      <Input type="number" min={0} value={form.staffReceptionists} onChange={e => set("staffReceptionists", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Other Staff</label>
                      <Input type="number" min={0} value={form.staffOther} onChange={e => set("staffOther", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Workstations</label>
                      <Input type="number" min={1} value={form.workstations} onChange={e => set("workstations", parseInt(e.target.value) || 1)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Your Clinic</p>
              <Input value={form.clinicName} onChange={e => autoSlug(e.target.value)} placeholder="Clinic name" />
              <div>
                <label className="text-xs text-gray-400">clinic-url.com/<strong>{form.clinicSlug || "your-clinic"}</strong></label>
                <Input value={form.clinicSlug} onChange={e => set("clinicSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="your-clinic" className="mt-1" />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border space-y-1.5">
                <p className="text-xs font-medium text-gray-700">Summary</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <TypeIcon className="h-3.5 w-3.5" />
                  {selectedType?.label} &middot; {specialties.find(s => s.id === form.specialty)?.label}
                  &middot; {form.clinicSize === "small" ? "Small Clinic" : "Large Clinic"}
                </div>
                {form.clinicSize === "small" && (
                  <p className="text-xs text-gray-500">
                    Staff: {form.staffDoctors + form.staffNurses + form.staffReceptionists + form.staffOther} members, {form.workstations} workstation{form.workstations > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1 flex-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1 flex-1" disabled={!canNext()}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSignup} disabled={loading || !canNext()} className="gap-1 flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Creating..." : "Create Your Clinic"}
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Logo size="sm" variant="light" />
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The intelligence platform for patient communication. Trusted by 1,200+ healthcare organizations since 2003.
              </p>
            </div>
            {[
              {
                title: "Platform",
                links: [
                  { label: "Overview", to: "/features" },
                  { label: "Features", to: "/features" },
                  { label: "Integrations", to: "/integrations" },
                  { label: "Security", to: "/security" },
                  { label: "Compliance", to: "/compliance" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Documentation", to: "/documentation" },
                  { label: "API Reference", to: "/api-reference" },
                  { label: "Case Studies", to: "/case-studies" },
                  { label: "Whitepapers", to: "/whitepapers" },
                  { label: "Blog", to: "/blog" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us", to: "/about-us" },
                  { label: "Leadership", to: "/leadership" },
                  { label: "Careers", to: "/careers" },
                  { label: "Contact", to: "/contact" },
                  { label: "Partners", to: "/partners" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <a key={link.label} href={link.to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Oriveo, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="/hipaa-notice" className="hover:text-gray-300 transition-colors">HIPAA Notice</a>
              <a href="/sla" className="hover:text-gray-300 transition-colors">SLA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
