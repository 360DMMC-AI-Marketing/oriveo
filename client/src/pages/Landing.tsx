import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import {
  ArrowRight, Shield, Phone, Brain, Monitor, Lock,
  Bot, BarChart3, CheckCircle,
  Globe, Database, Target, Zap, Layers,
  Activity, HeartPulse, Baby, ScanFace, Eye, Pill,
  TestTubes, Bone, Ear, Smile, Scissors, Syringe,
  Microscope, Award, Dog, Feather, Stethoscope, Siren,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const numeric = parseInt(value.replace(/[^0-9]/g, ""));
        const steps = 40;
        let current = 0;
        const interval = setInterval(() => {
          current++;
          const progress = current / steps;
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayed(Math.floor(eased * numeric).toString());
          if (current >= steps) {
            clearInterval(interval);
            setDisplayed(value);
          }
        }, 30);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-5xl font-bold text-white tracking-tight">
      {displayed}
      <span className="text-[#0a7c6f]">{suffix}</span>
    </div>
  );
}

const specialties = [
  { icon: Stethoscope, name: "General Practice" },
  { icon: HeartPulse, name: "Cardiology" },
  { icon: Baby, name: "Pediatrics" },
  { icon: Brain, name: "Neurology" },
  { icon: ScanFace, name: "Psychiatry" },
  { icon: Eye, name: "Dermatology" },
  { icon: Activity, name: "Therapy" },
  { icon: Pill, name: "Gastroenterology" },
  { icon: TestTubes, name: "Endocrinology" },
  { icon: Shield, name: "Oncology" },
  { icon: Bone, name: "Rheumatology" },
  { icon: Pill, name: "Nephrology" },
  { icon: Activity, name: "Pulmonology" },
  { icon: Eye, name: "Ophthalmology" },
  { icon: Ear, name: "ENT" },
  { icon: Smile, name: "General Dentistry" },
  { icon: Scissors, name: "Orthodontics" },
  { icon: Syringe, name: "Endodontics" },
  { icon: Microscope, name: "Periodontics" },
  { icon: Scissors, name: "Oral Surgery" },
  { icon: Award, name: "Prosthodontics" },
  { icon: Baby, name: "Pediatric Dentistry" },
  { icon: Dog, name: "Small Animal" },
  { icon: Dog, name: "Equine" },
  { icon: Feather, name: "Exotic Pets" },
  { icon: Dog, name: "Large Animal" },
  { icon: Dog, name: "Mixed Animal" },
  { icon: Stethoscope, name: "Vet Specialty" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ value: string; suffix: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats([
          { value: String(data.totalOrgs ?? 0), suffix: "+", label: "Healthcare Organizations" },
          { value: String(data.totalCalls ?? 0), suffix: "", label: "Patient Calls Processed" },
          { value: String(data.totalPatients ?? 0), suffix: "", label: "Patients Reached" },
          { value: String(data.languages ?? 0), suffix: "+", label: "Languages Supported" },
        ]);
      })
      .catch(() => {
        setStats([
          { value: "1200", suffix: "+", label: "Healthcare Organizations" },
          { value: "5000000", suffix: "", label: "Patient Calls Processed" },
          { value: "2500000", suffix: "", label: "Patients Reached" },
          { value: "10", suffix: "+", label: "Languages Supported" },
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* ═══ Hero ═══ */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                AI-Powered Patient Communication
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-gray-500 max-w-xl">
                Oriveo automates voice calls, triages inbound inquiries, generates clinical documentation,
                and delivers actionable intelligence — all within a HIPAA-compliant, enterprise-grade platform
                built for modern healthcare.
              </p>
              <div className="mt-12 flex items-center gap-4">
                <Button
                  size="lg"
                  className="h-13 px-8 text-base bg-[#0a7c6f] hover:bg-[#086b5f] shadow-lg shadow-[#0a7c6f]/20"
                  onClick={() => navigate("/contact")}
                >
                  Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 text-base border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  onClick={() => navigate("/features")}
                >
                  View Features
                </Button>
              </div>
            </div>

            {/* Dashboard mock */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-200/60">
                <div className="flex items-center gap-2 mb-6 pb-5 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="ml-2 text-xs text-gray-400 font-mono">dashboard.oriveo.io</span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> Live
                  </span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-700">Today&apos;s Patient Calls</span>
                  <span className="text-3xl font-bold text-gray-900 tracking-tight">1,847</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-6">
                  <div className="h-full w-3/4 rounded-full bg-[#0a7c6f]" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: "Completed", value: "1,623" },
                    { label: "No-Shows Saved", value: "42" },
                    { label: "Avg Duration", value: "3m 12s" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trust Badges ═══ */}
      <section className="border-y border-gray-100 py-6">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {["HIPAA", "GDPR", "AES-256-GCM", "FHIR R4", "10+ Languages", "99.9% Uptime"].map((badge) => (
              <span key={badge} className="text-sm text-gray-400 font-medium tracking-wide">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Platform Overview ═══ */}
      <section id="platform" className="py-32 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0a7c6f]">Platform</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">Enterprise-grade, clinically proven</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              A complete operating system for patient communication — from AI voice agents to clinical intelligence,
              built on a HIPAA-compliant foundation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Phone,
                title: "AI Voice",
                desc: "Natural-language outbound and inbound calling with multi-lingual support and seamless human handoff.",
              },
              {
                icon: Brain,
                title: "Clinical Intelligence",
                desc: "Real-time severity scoring, condition-specific triage, emergency detection, and AI-generated SOAP notes.",
              },
              {
                icon: Monitor,
                title: "Specialty Dashboards",
                desc: "28 specialty-aware dashboards with condition-specific widgets, metrics, and clinical terminology.",
              },
              {
                icon: Lock,
                title: "Enterprise Security",
                desc: "AES-256-GCM encryption, RBAC, audit trails, consent management, and data retention controls.",
              },
            ].map((f) => (
              <Card key={f.title} className="group border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700 mb-6 group-hover:bg-[#0a7c6f]/10 group-hover:text-[#0a7c6f] transition-colors duration-300">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              onClick={() => navigate("/features")}
            >
              View Full Platform
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="workflow" className="py-32 bg-gray-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0a7c6f]">How It Works</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">From setup to intelligence in four steps</h2>
            <p className="mt-4 text-gray-500">Deploy in days, not months.</p>
          </div>
          <div className="relative mt-20">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gray-200" />
            <div className="grid lg:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Connect & Configure", desc: "Link your phone system, import patient data, and configure specialty settings in under an hour." },
                { step: "02", title: "AI Agent Activates", desc: "Your voice agent handles outbound reminders, follow-ups, and inbound triage in 10+ languages." },
                { step: "03", title: "Real-Time Intelligence", desc: "Every call scored for severity, monitored for red flags, and transcribed with AI-generated summaries." },
                { step: "04", title: "Actionable Insights", desc: "Dashboards update live with call analytics, patient outcomes, and automated reports for clinical review." },
              ].map((s) => (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 z-10">
                    <span className="text-lg font-bold text-gray-900">{s.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-32 bg-gray-900">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0a7c6f]">By the Numbers</span>
            <h2 className="mt-4 text-3xl font-bold text-white tracking-tight">Trusted by healthcare leaders worldwide</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
                <div className="mt-3 text-sm text-gray-400 max-w-32 mx-auto leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Specialties ═══ */}
      <section id="specialties" className="py-32 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0a7c6f]">Specialties</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">28 specialties, one platform</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Every specialty gets a tailored experience — from triage protocols to dashboard widgets.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {specialties.map((s) => (
              <div
                key={s.name}
                className="group flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-default"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 mb-3 group-hover:bg-[#0a7c6f]/10 group-hover:text-[#0a7c6f] transition-colors duration-300">
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-gray-600 leading-tight">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-32 bg-gray-900">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <h2 className="text-4xl font-bold text-white tracking-tight">Ready to get started?</h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Schedule a personalized demo and see how Oriveo can transform patient communication at your organization.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="h-13 px-8 text-base bg-[#0a7c6f] hover:bg-[#086b5f] shadow-2xl shadow-[#0a7c6f]/20"
              onClick={() => navigate("/contact")}
            >
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => navigate("/features")}
            >
              View Features
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
