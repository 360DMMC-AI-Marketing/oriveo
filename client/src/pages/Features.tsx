import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Phone, Headphones, Radio, MessageSquare,
  Users, Calendar, FileText, Brain,
  BarChart3, Bell, Clock, Award,
  Shield, Globe, Cloud, Building2,
  ArrowRight,
} from "lucide-react";

const featureGroups = [
  {
    title: "AI Voice Communication",
    description: "Intelligent voice agents that handle both outbound and inbound calls with natural, human-like conversation.",
    features: [
      { icon: Phone, title: "Outbound AI Calling", description: "Deploy AI agents for appointment reminders, follow-ups, medication adherence, and surveys. Supports 10+ languages with automatic detection." },
      { icon: Headphones, title: "Inbound Call Triage", description: "24/7 AI-powered inbound call handling with intelligent patient identification, symptom triage, and severity assessment." },
      { icon: Radio, title: "Live Monitoring", description: "Real-time transcript streaming, live emotion detection, severity scoring, and supervisor intervention capabilities." },
      { icon: MessageSquare, title: "Human Handoff", description: "Seamless transfer to human staff with full conversation context, reason collection, and warm transfer audio." },
    ],
  },
  {
    title: "Clinical Workflow",
    description: "Streamline clinical operations with intelligent automation and comprehensive patient management tools.",
    features: [
      { icon: Users, title: "Patient Management", description: "Complete patient records with PHI-grade encryption, medical history, diagnoses, medications, allergies, and surgical history." },
      { icon: Calendar, title: "Smart Scheduling", description: "Patient self-service portal with one-click booking links, automated appointment reminders via SMS and email, and availability management." },
      { icon: FileText, title: "Clinical Documentation", description: "AI-generated clinical summaries, FHIR R4 export with SNOMED CT codes, and digital signature for medical reports." },
      { icon: Brain, title: "AI Quality Assurance", description: "Automated QA scoring per condition type, trend analysis, severity assessment, and comprehensive compliance reporting." },
    ],
  },
  {
    title: "Intelligence & Analytics",
    description: "Data-driven insights to optimize clinic performance, reduce no-shows, and improve patient outcomes.",
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
      { icon: Shield, title: "Enterprise Security", description: "HIPAA-compliant with AES-256-GCM encryption at rest, TLS in transit, JWT session management, RBAC, and comprehensive audit logging." },
      { icon: Building2, title: "Multi-Tenant Architecture", description: "Org-level isolation with scoped data access, subscription management, role-based permissions, and dedicated admin panel." },
      { icon: Globe, title: "Multi-Lingual Support", description: "Automatic language detection across 10 languages including English, Arabic, French, Spanish, German, and more." },
      { icon: Cloud, title: "Cloud Infrastructure", description: "Docker-based deployment, MongoDB Atlas, WebSocket real-time streaming, and horizontally scalable cloud architecture." },
    ],
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="relative overflow-hidden bg-gray-950 py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Everything You Need</span>
          <h1 className="mt-5 text-5xl font-bold text-white tracking-tight">Enterprise-Grade Features</h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Purpose-built for healthcare. From AI voice agents to enterprise security — Oriveo has everything you need to run a modern clinic.
          </p>
        </div>
      </section>

      {featureGroups.map((group, i) => (
        <section key={group.title} className={`py-24 ${i % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{group.title}</h2>
              <p className="mt-3 text-gray-500 text-lg leading-relaxed">{group.description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {group.features.map((f) => (
                <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-gray-950 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold text-white tracking-tight">Ready to get started?</h2>
          <p className="mt-5 text-gray-400 text-lg">Enterprise-grade. HIPAA compliant. Built for healthcare.</p>
          <Button size="lg" className="mt-8 h-13 px-9 shadow-lg shadow-primary/25" onClick={() => navigate("/contact")}>
            Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
