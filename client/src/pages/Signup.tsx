import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, User, CreditCard, ArrowRight, ArrowLeft, Loader2, Sparkles, Stethoscope, PawPrint, HeartPulse, Brain, Tooth } from "lucide-react";
import { PROFESSIONS } from "@/data/professions";

const PROFESSION_ICONS: Record<string, any> = {
  Stethoscope, PawPrint, Tooth, Brain, HeartPulse,
};

export default function Signup() {
  const { signup: authSignup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    profession: "", specialty: "",
    clinicName: "", clinicSlug: "", plan: "starter",
  });

  const steps = [
    { num: 1, label: "Account", icon: User },
    { num: 2, label: "Profession", icon: Stethoscope },
    { num: 3, label: "Clinic", icon: Building2 },
    { num: 4, label: "Plan", icon: CreditCard },
  ];

  const autoSlug = (v: string) => setForm({ ...form, clinicName: v, clinicSlug: v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });

  const selectedProfession = PROFESSIONS.find(p => p.id === form.profession);

  const handleSignup = async () => {
    setLoading(true);
    try {
      await authSignup({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, profession: form.profession,
        specialty: form.specialty,
        clinicName: form.clinicName, clinicSlug: form.clinicSlug,
        role: "admin",
      });
      toast.success("Account created! Welcome to Oriveo.");
      navigate("/clinic");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-bold text-2xl shadow-lg shadow-primary/20">O</div>
          </div>
          <CardTitle className="text-2xl">Get started with Oriveo</CardTitle>
          <p className="text-sm text-gray-500 mt-1">AI-powered triage for your clinic</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-1">
            {steps.map((s) => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step >= s.num ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  <s.icon className="h-3 w-3" /> {s.label}
                </div>
                {s.num < 4 && <div className={`w-8 h-0.5 ${step > s.num ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Your Account</p>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" />
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Your Profession</p>
              <p className="text-xs text-gray-400 mb-2">Select your practice type — this tailors the platform for your specialty</p>
              <div className="grid gap-2">
                {PROFESSIONS.map((prof) => {
                  const Icon = PROFESSION_ICONS[prof.icon] || Stethoscope;
                  const isSelected = form.profession === prof.id;
                  return (
                    <button key={prof.id} type="button"
                      onClick={() => setForm({ ...form, profession: prof.id, specialty: "" })}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{prof.label}</p>
                        <p className="text-xs text-gray-500">{prof.description}</p>
                      </div>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><span className="text-xs">✓</span></div>}
                    </button>
                  );
                })}
              </div>
              {selectedProfession && selectedProfession.specialties.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Specialty (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfession.specialties.map((spec) => (
                      <button key={spec.id} type="button"
                        onClick={() => setForm({ ...form, specialty: spec.id })}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          form.specialty === spec.id
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {spec.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Your Clinic</p>
              <Input value={form.clinicName} onChange={e => autoSlug(e.target.value)} placeholder="Clinic name" />
              <div>
                <label className="text-xs text-gray-400">clinic-url.com/<strong>{form.clinicSlug || "your-clinic"}</strong></label>
                <Input value={form.clinicSlug} onChange={e => setForm({ ...form, clinicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="your-clinic" className="mt-1" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose a Plan</p>
              <p className="text-xs text-gray-400">Start free, upgrade anytime</p>
              {[
                { id: "starter", name: "Starter", price: "$99", features: ["5 users", "500 patients", "1,000 calls/mo"] },
                { id: "pro", name: "Pro", price: "$299", features: ["25 users", "5,000 patients", "10,000 calls/mo", "EHR integration"] },
                { id: "enterprise", name: "Enterprise", price: "Custom", features: ["Unlimited", "Everything"] },
              ].map(p => (
                <label key={p.id} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                  form.plan === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                }`}>
                  <input type="radio" name="plan" value={p.id} checked={form.plan === p.id} onChange={e => setForm({ ...form, plan: e.target.value })} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.plan === p.id ? "border-primary" : "border-gray-300"}`}>
                    {form.plan === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.features.join(" · ")}</p>
                  </div>
                  <p className="font-bold text-lg">{p.price}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1 flex-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1 flex-1"
                disabled={step === 1 && (!form.name || !form.email || !form.password) || step === 2 && !form.profession || step === 3 && (!form.clinicName || !form.clinicSlug)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSignup} disabled={loading} className="gap-1 flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Creating..." : "Create Your Account"}
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
