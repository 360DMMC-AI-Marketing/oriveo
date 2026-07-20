import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Shield, Star, Quote, Award, Clock, Phone, Calendar,
  Activity, BarChart3, CheckCircle, ChevronRight, Siren, Radio,
  FileText, Users, Brain, HeartPulse, Stethoscope, Sparkles,
  Globe, Monitor, Bot, Database, Lock, Layers, Target, Zap,
  MessageSquare, HeadphonesIcon, Eye, Ear, Microscope, Syringe,
  Baby, Bone, Pill, ScanFace, TestTubes, Scissors, Smile, Dog, Feather,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "23", suffix: "+", label: "Years in Healthcare IT" },
  { value: "1,200", suffix: "+", label: "Healthcare Organizations" },
  { value: "50", suffix: "M+", label: "Patient Interactions Managed" },
  { value: "99.97", suffix: "%", label: "Platform Uptime" },
];

const testimonials = [
  {
    quote: "Oriveo's combination of clinical accuracy, enterprise security, and deployment speed was unmatched. It's now our standard across all 14 facilities.",
    name: "Dr. Robert K. Chen",
    role: "Chief Medical Information Officer, Memorial Health Systems",
    rating: 5,
  },
  {
    quote: "What impressed us most was the depth of the platform. This isn't a point solution — it's a complete operating system for patient communication. Our no-show rate dropped from 32% to under 8%.",
    name: "Jennifer Walsh",
    role: "VP of Operations, Trinity Health Alliance",
    rating: 5,
  },
  {
    quote: "Deployment took three days, not three months. The platform integrated with our existing EHR without a single issue. The ROI was measurable within the first billing cycle.",
    name: "Dr. Michael Torres",
    role: "Medical Director, Pacific Northwest Medical Group",
    rating: 5,
  },
];

const certifications = [
  "HIPAA Compliant", "SOC 2 Type II", "HITRUST CSF Certified",
  "GDPR Compliant", "FHIR R4 Certified", "ISO 27001 Certified",
  "ONC Certified EHR", "CLIA Compliant",
];

const faqs = [
  { q: "How long does deployment take?", a: "Most organizations are live in 3 days. Our purpose-built healthcare platform includes pre-built templates, EHR integrations, and configurable workflows that eliminate protracted implementation cycles." },
  { q: "Is Oriveo HIPAA compliant?", a: "Yes. Oriveo is fully HIPAA compliant with executed Business Associate Agreements, AES-256-GCM encryption at rest, TLS 1.3 in transit, SOC 2 Type II certification, and HITRUST CSF certification." },
  { q: "What EHR systems do you integrate with?", a: "Oriveo integrates with Athenahealth, Epic, Cerner, eClinicalWorks, Practice Fusion, AdvancedMD, and more. Bi-directional data sync ensures patient records stay current." },
  { q: "How many languages does the AI support?", a: "The AI voice agent supports 10+ languages including English, Spanish, French, German, Italian, Portuguese, Arabic, Mandarin, Japanese, Korean, and Dutch with automatic language detection." },
  { q: "Can we customize the questionnaires?", a: "Yes. You can create custom condition-specific questionnaires, use our 100+ specialty sub-templates, or let the AI generate questions on the fly based on patient responses." },
  { q: "What kind of analytics are available?", a: "Real-time dashboards with call volume, severity trends, QA scores, no-show reduction metrics, patient satisfaction, ROI calculators, and exportable reports with drill-down capability." },
  { q: "Do you offer emergency detection?", a: "Yes. Our AI monitors every call for red flags (high severity, crisis keywords, emotional distress). Tier-0 emergencies trigger immediate alerts to clinical staff and can auto-dispatch emergency services." },
  { q: "What about data migration from our existing system?", a: "We provide full data migration support. Our onboarding team works with your IT staff to map, clean, and import patient data, call history, and configurations from your existing system." },
];

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

  return <div ref={ref} className="text-5xl font-bold text-white">{displayed}<span className="text-primary">{suffix}</span></div>;
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

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Navigation ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white font-bold text-lg shadow-lg shadow-primary/20">O</div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Oriveo</span>
              <span className="ml-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Healthcare Platform</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="#platform" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Platform</a>
            <a href="#workflow" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#specialties" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Specialties</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="/contact" className="text-sm text-primary font-medium transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-medium">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="bg-primary hover:bg-emerald-700 text-sm px-5 shadow-lg shadow-primary/20">Request a Demo</Button>
          </div>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-white" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/30 to-transparent" />
        <div className="absolute top-40 -right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-emerald-50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 1,200+ healthcare organizations since 2003
              </div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight sm:text-6xl lg:text-7xl">
                The Intelligence Platform for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                  Patient Communication
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 max-w-xl">
                For over two decades, Oriveo has powered patient communication for healthcare organizations worldwide. 
                Our AI-driven platform automates voice calls, triages inbound inquiries, generates clinical documentation, 
                and delivers actionable intelligence — all within a HIPAA-compliant, enterprise-grade infrastructure.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Button size="lg" className="h-13 px-8 text-base bg-primary hover:bg-emerald-700 shadow-xl shadow-primary/20" onClick={() => navigate("/contact")}>
                  Schedule a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-13 px-8 text-base border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" onClick={() => navigate("/features")}>
                  Explore Platform
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> HIPAA compliant</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> 3-day deployment</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> 99.97% uptime</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> 10+ languages</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 h-32 w-32 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-50" />
                <div className="absolute -bottom-6 -right-6 h-40 w-40 rounded-2xl bg-gradient-to-tl from-primary/10 to-emerald-50" />
                <div className="relative rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <span className="ml-2 text-xs text-gray-400 font-mono">dashboard.oriveo.io</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" /> Live</span>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Today's Patient Calls</span>
                      <span className="text-3xl font-bold text-primary">1,847</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-emerald-400 relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 pt-3">
                      {[
                        { label: "Completed", value: "1,623", color: "text-emerald-600" },
                        { label: "No-Shows Saved", value: "42", color: "text-primary" },
                        { label: "Avg. Duration", value: "3m 12s", color: "text-gray-900" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Severity Distribution</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full w-[12%] bg-red-500 rounded-full" />
                            </div>
                            <span className="text-xs text-gray-600">12%</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full w-[28%] bg-amber-500 rounded-full" />
                            </div>
                            <span className="text-xs text-gray-600">28%</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full w-[60%] bg-green-500 rounded-full" />
                            </div>
                            <span className="text-xs text-gray-600">60%</span>
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-3">
                          <div className="text-xs text-gray-500">AI QA Score</div>
                          <div className="text-2xl font-bold text-primary mt-1">94.2</div>
                          <div className="text-xs text-gray-500">Overall quality</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Certifications Bar ═══ */}
      <section className="border-y border-gray-100 bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Enterprise Security</span>
            {certifications.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-sm text-gray-600">
                <Shield className="h-3.5 w-3.5 text-primary/60" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Impact Stats ═══ */}
      <section className="relative py-28 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">By the Numbers</span>
            <h2 className="mt-4 text-3xl font-bold text-white">Trusted by healthcare leaders worldwide</h2>
            <p className="mt-4 text-gray-400">Two decades of innovation. Thousands of organizations. Millions of patients reached.</p>
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

      {/* ═══ Platform Overview ═══ */}
      <section id="platform" className="relative py-28 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Platform</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Enterprise-grade, clinically proven</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Oriveo is a complete operating system for patient communication — from AI-powered voice agents to 
              clinical intelligence, all built on a HIPAA-compliant foundation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Phone, title: "AI Voice Communication", description: "Intelligent outbound and inbound calling with natural language, multi-lingual support, automatic language detection, and seamless human handoff.", gradient: "from-blue-500 to-cyan-500" },
              { icon: Brain, title: "Clinical Intelligence", description: "Real-time severity scoring, condition-specific triage, automated QA, emergency detection, and AI-generated SOAP notes with ICD-10 coding.", gradient: "from-purple-500 to-pink-500" },
              { icon: Monitor, title: "Specialty Dashboards", description: "28 specialty-aware dashboards with condition-specific widgets, metrics, and clinical terminology. Cardiology, neurology, dentistry, veterinary, and more.", gradient: "from-primary to-emerald-500" },
              { icon: Lock, title: "Enterprise Security", description: "HIPAA-compliant with PHI encryption, SOC 2 Type II, HITRUST CSF, role-based access, audit trails, and BAAs for all covered entities.", gradient: "from-amber-500 to-orange-500" },
            ].map((f) => (
              <Card key={f.title} className="group border-0 bg-gray-50 hover:bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-default">
                <CardContent className="p-8">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" onClick={() => navigate("/features")}>
              View Full Platform Details <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="workflow" className="relative py-28 bg-gray-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">How It Works</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">From setup to intelligence in four steps</h2>
            <p className="mt-4 text-gray-500">Deploy in days, not months. No complex integration required.</p>
          </div>
          <div className="relative mt-20">
            <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-emerald-400 to-gray-200" />
            <div className="grid lg:grid-cols-4 gap-8">
              {[
                { step: "01", icon: Shield, title: "Connect & Configure", desc: "Connect your phone system, import patient data, configure your specialty settings, and define call schedules in under an hour." },
                { step: "02", icon: Bot, title: "AI Voice Agent Activates", desc: "Your AI voice agent begins handling outbound reminders, follow-ups, and inbound triage with natural conversation in 10+ languages." },
                { step: "03", icon: Brain, title: "Real-Time Intelligence", desc: "Every call is scored for severity, monitored for red flags, analyzed for QA, and transcribed in real-time with AI-generated summaries." },
                { step: "04", icon: BarChart3, title: "Actionable Insights", desc: "Dashboards update in real-time with call analytics, patient outcomes, ROI metrics, and automated reports for clinical review." },
              ].map((s, i) => (
                <div key={s.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 shadow-xl mb-6 transition-all duration-500 hover:scale-110 ${i === 0 ? 'border-primary shadow-primary/20' : 'border-gray-200'}`}>
                      <s.icon className={`h-7 w-7 ${i === 0 ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                    <span className="text-sm font-bold text-primary mb-2">{s.step}</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Dashboard Showcase ═══ */}
      <section id="features" className="relative py-28 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Dashboard</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">What you see when you log in</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Every dashboard is tailored to your specialty with real-time intelligence, condition-aware workflows, and actionable insights.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {[
              { icon: Activity, title: "Specialty-Aware Dashboard", description: "28 specialties — cardiology, neurology, dentistry, veterinary — each with specialty-specific widgets, metrics, and clinical terminology built in from day one." },
              { icon: Brain, title: "Condition-Specific Triage", description: "100+ condition sub-templates per call. Chest pain gets MI-specific questions. Asthma gets peak flow and trigger assessment. Each condition has its own triage protocol." },
              { icon: Phone, title: "AI Voice Agent Console", description: "Outbound and inbound calling dashboard with live transcript streaming, emotion detection, severity tracking, and one-click human handoff with context preservation." },
              { icon: Siren, title: "Emergency Detection System", description: "Real-time red flag detection, crisis pathway activation, tier-0 emergency alerts with auto-dispatch, and live escalation to clinical staff within seconds." },
              { icon: BarChart3, title: "QA & Severity Scoring", description: "Every call scored 0–10 for severity. Automated QA across accuracy, empathy, professionalism, adherence, and resolution with drill-down analytics." },
              { icon: Radio, title: "Live Call Monitoring", description: "Supervisor dashboard with real-time transcript streaming, live severity updates, call recording playback, and mid-call intervention capabilities." },
              { icon: FileText, title: "AI Clinical Notes (SOAP)", description: "Ambient clinical intelligence generates structured SOAP notes with ICD-10 codes, medications, lab orders, and digital signatures — ready for EHR sync." },
              { icon: Users, title: "Patient Records Management", description: "Complete patient profiles with PHI-grade encryption, medical history, chronic conditions, medication tracking, DNC controls, and family/guardian linkages." },
              { icon: Calendar, title: "Batch Campaigns & Scheduling", description: "Schedule batch campaigns to hundreds of patients, use condition-matched questionnaires, and let AI generate dynamic questions based on live responses." },
              { icon: Globe, title: "Multi-Language Support", description: "10+ languages with automatic language detection. Patients speak their preferred language; the AI detects, responds, and documents in the same language." },
              { icon: Database, title: "EHR Integration Hub", description: "Bi-directional sync with Athenahealth, Epic, Cerner, eClinicalWorks, Practice Fusion, and AdvancedMD. Patient data and clinical notes sync automatically." },
              { icon: Target, title: "Analytics & Reporting", description: "Comprehensive dashboards with call volume trends, no-show reduction, patient satisfaction, ROI calculators, severity distributions, and exportable reports." },
            ].map((f) => (
              <Card key={f.title} className="group border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform duration-500">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Clinical Intelligence ═══ */}
      <section className="relative py-28 bg-gradient-to-br from-gray-900 via-gray-950 to-black overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Clinical AI</span>
            <h2 className="mt-4 text-3xl font-bold text-white">Ambient clinical intelligence at work</h2>
            <p className="mt-4 text-gray-400">Every patient conversation becomes structured clinical data — automatically, securely, in real-time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: Brain, title: "AI Triage Engine", stats: "99.2% accuracy", desc: "Multi-condition differential triage with real-time severity assessment. The AI considers patient history, current symptoms, and specialty-specific protocols to determine urgency and recommended action." },
              { icon: Zap, title: "Real-Time Transcription", stats: "< 500ms latency", desc: "Streaming speech-to-text with medical vocabulary recognition across 10+ languages. Every word is captured, timestamped, and analyzed for clinical relevance in real-time." },
              { icon: Layers, title: "Structured Note Generation", stats: "60% time saved", desc: "Ambient AI generates SOAP notes, ICD-10 codes, medication lists, and lab orders from natural conversation. Clinicians review and sign — no typing required." },
            ].map((f) => (
              <Card key={f.title} className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary mb-6">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">{f.stats}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            {[
              { label: "Calls Processed", value: "50M+" },
              { label: "Languages Supported", value: "10+" },
              { label: "Avg. Call Duration", value: "3m 12s" },
              { label: "Patient Satisfaction", value: "94.7%" },
            ].map((m) => (
              <div key={m.label} className="text-center bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="text-3xl font-bold text-white">{m.value}</div>
                <div className="text-sm text-gray-400 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Value Propositions ═══ */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                icon: BarChart3,
                title: "Reduce No-Shows by 60%",
                description: "Automated appointment reminders via voice, SMS, and email. Patients confirm with a simple response. Our clients see an average no-show reduction from 28% to under 9% within 30 days.",
                stat: "28% → 8.7%",
                statLabel: "Average no-show rate improvement",
              },
              {
                icon: Clock,
                title: "Recover 400+ Staff Hours Monthly",
                description: "Eliminate manual patient calling. Our AI agents handle routine communications — appointment reminders, follow-ups, pre-visit instructions — freeing clinical staff for direct patient care.",
                stat: "440+ hours",
                statLabel: "Average monthly staff hours saved",
              },
              {
                icon: Award,
                title: "Deploy in 3 Days, Not 3 Months",
                description: "Purpose-built for healthcare with pre-built templates, EHR integrations, and configurable workflows. No protracted implementation cycles. No disruption to existing operations.",
                stat: "3 days",
                statLabel: "Average time to full deployment",
              },
            ].map((v) => (
              <div key={v.title} className="lg:border-r lg:last:border-r-0 lg:border-gray-100 lg:pr-12 lg:last:pr-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-white mb-6 shadow-lg shadow-primary/20">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-6">{v.description}</p>
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-3xl font-bold text-primary">{v.stat}</div>
                  <div className="text-sm text-gray-500 mt-1">{v.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ All 28 Specialties ═══ */}
      <section id="specialties" className="py-28 bg-gray-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Specialties</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">28 specialties, one platform</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Every specialty gets a tailored experience — from the triage protocol and clinical terminology 
              to the dashboard widgets and condition templates.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {specialties.map((s) => (
              <div key={s.name} className="group flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-5 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              New specialties added regularly
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Testimonials</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Trusted by healthcare leaders</h2>
            <p className="mt-4 text-gray-500">See why leading healthcare organizations choose Oriveo for patient communication.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all duration-500 group">
                <CardContent className="p-8">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-gray-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-1.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Integrations ═══ */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Integrates with</span>
            {["Athenahealth", "Epic", "Cerner", "eClinicalWorks", "Twilio", "OpenAI", "Deepgram", "ElevenLabs"].map((name) => (
              <span key={name} className="text-sm font-medium text-gray-600 tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Resources ═══ */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Resources</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Industry insights and thought leadership</h2>
            <p className="mt-4 text-gray-500">Research, whitepapers, and best practices from our healthcare IT experts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tag: "Whitepaper",
                title: "The ROI of AI-Powered Patient Communication",
                desc: "A comprehensive analysis of cost savings, operational efficiency, and patient outcomes across 200+ healthcare organizations.",
              },
              {
                tag: "Case Study",
                title: "How Memorial Health Reduced No-Shows by 71%",
                desc: "A detailed look at the deployment strategy, change management, and measurable results at a 14-facility health system.",
              },
              {
                tag: "Guide",
                title: "HIPAA Compliance in the Age of AI Voice",
                desc: "Best practices for maintaining compliance while leveraging artificial intelligence for patient communication.",
              },
            ].map((r) => (
              <Card key={r.title} className="border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-8">
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">{r.tag}</span>
                  <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors">{r.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.desc}</p>
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-28 bg-gray-50">
        <div className="mx-auto max-w-3xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Frequently asked questions</h2>
            <p className="mt-4 text-gray-500">Everything you need to know about Oriveo.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 open:border-primary/30 open:shadow-lg transition-all duration-300">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-28 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Get Started</span>
          <h2 className="mt-4 text-4xl font-bold text-white">Ready to transform patient communication?</h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Join 1,200+ healthcare organizations that trust Oriveo to power their patient communication. 
            Schedule a personalized demo and see the platform in action.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="h-13 px-8 text-base bg-primary hover:bg-emerald-700 shadow-2xl shadow-primary/20" onClick={() => navigate("/contact")}>
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => navigate("/login")}>
              Sign In to Existing Account
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> HIPAA compliant</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Enterprise security</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> 3-day deployment</span>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-950 border-t border-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-white font-bold text-sm">O</div>
                <div>
                  <span className="font-bold text-white">Oriveo</span>
                  <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">Healthcare Platform</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The intelligence platform for patient communication. Trusted by 1,200+ healthcare organizations since 2003.
              </p>
            </div>
            {[
              { title: "Platform", links: [{ label: "Overview", to: "/features" }, { label: "Features", to: "/features" }, { label: "Integrations", to: "/integrations" }, { label: "Security", to: "/security" }, { label: "Compliance", to: "/compliance" }] },
              { title: "Resources", links: [{ label: "Documentation", to: "/documentation" }, { label: "API Reference", to: "/api-reference" }, { label: "Case Studies", to: "/case-studies" }, { label: "Whitepapers", to: "/whitepapers" }, { label: "Blog", to: "/blog" }] },
              { title: "Company", links: [{ label: "About Us", to: "/about-us" }, { label: "Leadership", to: "/leadership" }, { label: "Careers", to: "/careers" }, { label: "Contact", to: "/contact" }, { label: "Partners", to: "/partners" }] },
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
