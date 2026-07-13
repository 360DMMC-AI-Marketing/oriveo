import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone, Mic, Activity, Shield, Users, Calendar, BarChart3,
  Brain, ArrowRight, HeadphonesIcon, MessageSquare,
  Globe, Clock, Award, Cloud, FileText, Bell, Radio,
  Building2
} from "lucide-react";

const featureGroups = [
  {
    title: "AI Voice Communication",
    description: "Intelligent voice agents that handle both outbound and inbound calls with natural conversation.",
    features: [
      { icon: Phone, title: "Outbound AI Calling", description: "Deploy AI agents for appointment reminders, follow-ups, medication adherence, and surveys. Supports 10+ languages with automatic detection." },
      { icon: HeadphonesIcon, title: "Inbound Call Triage", description: "24/7 AI-powered inbound call handling with intelligent patient identification, symptom triage, and severity assessment." },
      { icon: Radio, title: "Live Monitoring", description: "Real-time transcript streaming, live emotion detection, severity scoring, and supervisor intervention capabilities." },
      { icon: MessageSquare, title: "Human Handoff", description: "Seamless transfer to human staff with full conversation context, reason collection, and warm transfer audio." },
    ],
  },
  {
    title: "Clinical Workflow",
    description: "Streamline clinical operations with intelligent automation and comprehensive patient management.",
    features: [
      { icon: Users, title: "Patient Management", description: "Complete patient records with PHI-grade encryption, medical history, diagnoses, medications, allergies, and surgical history." },
      { icon: Calendar, title: "Smart Scheduling", description: "Patient self-service portal with one-click booking links, automated appointment reminders via SMS and email, and availability management." },
      { icon: FileText, title: "Clinical Documentation", description: "AI-generated clinical summaries, FHIR R4 export with SNOMED CT codes, and digital signature for medical reports." },
      { icon: Brain, title: "AI Quality Assurance", description: "Automated QA scoring per condition type, trend analysis, severity assessment, and comprehensive compliance reporting." },
    ],
  },
  {
    title: "Intelligence & Analytics",
    description: "Data-driven insights to optimize clinic performance and patient outcomes.",
    features: [
      { icon: BarChart3, title: "Advanced Analytics", description: "Monthly reports with call metrics, patient trends, staff performance, appointment statistics, and no-show ROI calculations." },
      { icon: Bell, title: "Smart Notifications", description: "Real-time alerts for emergencies, call completions, patient responses, and system events with in-app and email delivery." },
      { icon: Clock, title: "No-Show Detection", description: "Automated no-show detection every 15 minutes with ROI dashboard showing estimated savings at configurable cost per no-show." },
      { icon: Award, title: "Emergency Response", description: "Built-in emergency detection with instant 911 dialing, clinic emergency contacts, SMS alerts to staff, and audible alarms." },
    ],
  },
  {
    title: "Enterprise Platform",
    description: "Scalable, secure infrastructure built for healthcare organizations of any size.",
    features: [
      { icon: Shield, title: "Enterprise Security", description: "HIPAA-compliant with AES-256-GCM encryption at rest, TLS in transit, JWT session management, and comprehensive audit logging." },
      { icon: Building2, title: "Multi-Tenant Architecture", description: "Org-level isolation with scoped data access, subscription management, role-based permissions, and dedicated admin panel." },
      { icon: Globe, title: "Multi-Lingual Support", description: "Automatic language detection across 10 languages including English, Arabic, French, Spanish, German, and more." },
      { icon: Cloud, title: "Cloud Infrastructure", description: "Docker-based deployment, MongoDB Atlas, WebSocket real-time streaming, and scalable cloud architecture." },
    ],
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/20">O</div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Oriveo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/features" className="text-sm font-medium text-primary">Features</a>
            <a href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="shadow-lg shadow-primary/20 text-sm px-5">Request a Demo</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Everything You Need</span>
          <h1 className="mt-6 text-5xl font-bold text-white sm:text-6xl">Enterprise-Grade Features</h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Purpose-built for healthcare. From AI voice agents to enterprise security — Oriveo has everything you need to run a modern clinic.
          </p>
        </div>
      </section>

      {/* Feature Groups */}
      {featureGroups.map((group) => (
        <section key={group.title} className="py-24 even:bg-gray-50">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">{group.title}</h2>
              <p className="mt-4 text-lg text-gray-500">{group.description}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {group.features.map((f) => (
                <Card key={f.title} className="border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
                        <f.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-8 text-center">
          <h2 className="text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-6 text-lg text-gray-400">Try Oriveo free. No credit card required.</p>
          <Button size="lg" className="mt-10 h-14 px-10 text-base shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary to-primary-dark" onClick={() => navigate("/contact")}>
            Request a Demo <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm">O</div>
              <span className="font-bold text-gray-900">Oriveo</span>
            </div>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Oriveo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
