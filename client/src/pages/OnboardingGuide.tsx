import { useState } from "react";
import { BookOpen, Phone, Users, Megaphone, ShieldCheck, BarChart3, ClipboardList, Calendar, UserPlus, LayoutDashboard, Search, ChevronDown, ScrollText, Siren, Bell, PhoneForwarded, Eye, DollarSign, Building2, Mail } from "lucide-react";

const sections = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Command center — monitor active calls, patient stats, severity alerts, no-show tracking, and recent activity.",
    steps: [
      "View KPI cards at the top for quick stats on calls, patients, severity, no-show rate, and estimated savings.",
      "Check 'Needs Attention' for urgent/severe cases requiring immediate follow-up.",
      "Active Emergencies banner appears at the top when red-flag keywords are detected — click to call 911 or the clinic.",
      "Browse recent completed and upcoming scheduled calls below the cards.",
      "Click any card or link to dive deeper into a section.",
    ],
  },
  {
    icon: Phone,
    title: "Call Center",
    desc: "Unified page for making AI voice calls and scheduling batch campaigns in one place.",
    steps: [
      "Two tabs: 'Quick Call' to call a patient immediately, and 'Batch Schedule' to schedule calls for later.",
      "Quick Call: search or pick a patient, select a questionnaire, pick a language, then click Call.",
      "Batch Schedule: select multiple patients or a group, pick a date/time, and schedule all at once.",
      "Watch stats at the top showing active/scheduled/completed/failed call counts.",
      "Browser Test panel lets you test the AI voice agent from your computer without dialing a phone.",
    ],
  },
  {
    icon: Phone,
    title: "Inbound Calls",
    desc: "Manage incoming patient calls — view, triage, and track all inbound AI-powered checkup calls.",
    steps: [
      "Four tabs: All (every inbound call), Answered (patient responded), Unanswered (no response), Emergency (red flags detected).",
      "Each call shows direction badge (inbound/outbound), patient name, date, and status.",
      "Status badges include: completed, failed, in-progress, transferred (to human), and emergency-detected.",
      "Click any call to open Call Detail with the full transcript, AI assessment, and emergency action buttons.",
      "Inbound calls automatically detect language and run the same triage/red-flag engine as outbound calls.",
    ],
  },
  {
    icon: Users,
    title: "Patients",
    desc: "Manage patient records, medical history, contact info, DNC status, and send booking links.",
    steps: [
      "Click 'Add Patient' to create a new record with full medical details (name, phone, DOB, gender, blood type, address, insurance, etc.).",
      "Use the search bar to find patients by name or phone instantly.",
      "Click a patient to view their full detail page with call history, severity scores, and medical summary.",
      "Edit All button in Patient Detail toggles all fields editable — language, gender, blood type, DOB, insurance ID, address, diagnosis, conditions, allergies, medications, surgeries, emergency contact, and medical notes.",
      "Toggle Do Not Call (DNC) flag on a patient to opt them out of outbound calls.",
      "Send Booking Link button generates a magic link for the patient to self-schedule an appointment via SMS or email.",
    ],
  },
  {
    icon: Calendar,
    title: "Appointments",
    desc: "Schedule, reschedule, and manage patient appointments with status tracking and auto no-show detection.",
    steps: [
      "View appointments in list format grouped by date with filter tabs: All, Scheduled, Confirmed, Completed, Cancelled, No Show.",
      "Filter by date range and status using the search bar above the list.",
      "Click 'Schedule New Appointment' to book a visit, phone call, or video visit for a patient.",
      "Search for a patient by name to select them as the appointment subject.",
      "Click the edit icon on any appointment to change details, status, or notes.",
      "Auto No-Show Detection: appointments past their time by 15+ minutes are automatically marked as no-show.",
      "No-Show Rate and Estimated Savings cards on the Dashboard show the financial impact of AI reminders reducing missed appointments.",
    ],
  },
  {
    icon: Megaphone,
    title: "Campaigns",
    desc: "Schedule individual patient calls or launch mass batch campaigns with real-time monitoring.",
    steps: [
      "Use the 'Batch Campaigns' tab to call all patients at once with one click, using a selected questionnaire.",
      "Use 'Schedule Call' tab to pick a specific patient, date/time, and optional questionnaire for a single call.",
      "Monitor progress with real-time active/scheduled/completed/failed counts during a campaign.",
      "Review past campaigns and their success rates in campaign history.",
      "Campaigns respect DNC flags — opted-out patients are automatically excluded from batches.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Call Review",
    desc: "Browse recordings, triage flags, AI quality scores, and full transcripts for every call.",
    steps: [
      "View all completed calls with patient name, date, duration, and triage tier badge.",
      "Triage tier badges: Tier 0 (red — emergency), Tier 1 (orange — urgent), Tier 2 (yellow — concerning), Tier 3 (green — routine).",
      "Crisis Pathway badge appears when the 988 crisis script was triggered during a call.",
      "Click a call to see the full AI summary, transcript, QA scores, severity, and recommendations.",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & Monthly Report",
    desc: "Deep statistics, visual insights, call trends, QA scores, and monthly emailed reports.",
    steps: [
      "Top KPI cards show completion rate, answer rate, appointment conversion, average QA score, and average severity.",
      "Charts show call volume over time, outcome distribution pie chart, severity breakdown, and calls by patient.",
      "QA Score Breakdown shows accuracy, empathy, professionalism, adherence, and resolution scores per call.",
      "Monthly Report section at the bottom shows current-month summary with total calls, completed, avg severity, active patients.",
      "Click 'Email Report' to send the monthly summary to the clinic admin's email inbox.",
      "Monthly report is also automatically emailed on the 1st of each month at 9 AM.",
    ],
  },
  {
    icon: ClipboardList,
    title: "Templates",
    desc: "Medical questionnaire templates used by the AI during patient calls for consistent assessments.",
    steps: [
      "Browse pre-built templates categorized by condition (cardiology, diabetes, post-op, etc.).",
      "Use a template directly to create a call with predefined questions specific to the condition.",
      "Create custom questionnaires with your own questions and follow-up logic.",
      "AI can auto-generate questions based on a patient's condition and medical history.",
      "Templates ensure consistent and thorough patient assessments across all calls.",
    ],
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Documents, protocols, and context the AI uses to provide accurate answers during conversations.",
    steps: [
      "Add documents (protocols, FAQs, clinic guides) that the AI will reference in patient conversations.",
      "Content is automatically chunked into sections and embedded for semantic search by the AI.",
      "The AI combines knowledge base context with live conversation for relevant and accurate responses.",
      "Use it to ensure the AI speaks with your specific clinic knowledge and medical protocols.",
    ],
  },
  {
    icon: Eye,
    title: "Live Monitoring",
    desc: "Real-time supervisor dashboard to monitor active calls, transcripts, and patient emotions live.",
    steps: [
      "Available only for admin/doctor roles — click 'Live Monitoring' in the sidebar.",
      "See all active calls with patient name, duration, severity score, and emotion state.",
      "Each call card is color-coded by severity: green (low), amber (medium), red (high).",
      "Click a call to expand and view the live transcript streaming in real time as the AI talks to the patient.",
      "Transcript updates automatically via WebSocket — no page refresh needed.",
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Real-time in-app notifications for emergencies, call transfers, failed calls, and follow-up needs.",
    steps: [
      "Bell icon in the top-right corner of any page shows unread notification count.",
      "Click the bell to open the dropdown with the most recent notifications.",
      "Click 'View All' to open the full Notifications page with tabs: All, Unread, and by type.",
      "Notifications appear in real time via WebSocket — no manual refresh needed.",
      "Click any notification to navigate directly to the relevant call or patient.",
    ],
  },
  {
    icon: Siren,
    title: "Emergency Response",
    desc: "Dedicated emergency detection, 911/clinic outbound calling, and crisis lifeline scripts.",
    steps: [
      "AI automatically detects red-flag keywords during patient conversations (chest pain, suicide, bleeding, etc.).",
      "Tier 0 (emergency): AI plays the 911 script directing the patient to call emergency services, then stops the normal flow.",
      "Crisis keywords (suicide, self-harm): AI plays the 988 Suicide & Crisis Lifeline script.",
      "Active Emergencies banner appears on the Dashboard with each flagged patient.",
      "Admins and doctors can click '911' or 'Clinic' buttons to place an outbound emergency call directly.",
      "Patient Detail and Call Review show severity scores (1-10) and all flagged red flags.",
    ],
  },
  {
    icon: PhoneForwarded,
    title: "Call Transfer (Human Handoff)",
    desc: "Transfer an active AI call to a human operator when the AI needs to escalate.",
    steps: [
      "During an active AI call, staff can click 'Transfer to Human' in the Call Detail page.",
      "A modal appears to enter the transfer reason (e.g., 'Patient wants to speak to a doctor').",
      "The call is transferred via Twilio <Dial> to the configured human transfer number.",
      "The call status changes to 'transferred' and a notification is sent to relevant staff.",
      "The patient hears a 'Please hold' message while the transfer connects.",
    ],
  },
  {
    icon: DollarSign,
    title: "No-Show Detection & ROI",
    desc: "Automatically detect missed appointments and track the financial value of AI reminders.",
    steps: [
      "Auto No-Show Detection runs every 15 minutes and marks appointments 30+ minutes past their time as no-show.",
      "No-Show Rate card on Dashboard shows the percentage of no-shows out of valid appointments (excluding cancellations).",
      "Estimated Savings card calculates the projected savings from AI-driven reminders reducing no-shows at $200 per no-show.",
      "The No Show filter tab on the Appointments page shows all no-show appointments for review.",
    ],
  },
  {
    icon: Building2,
    title: "Settings",
    desc: "Company profile, API integrations, service credentials, and system configuration.",
    steps: [
      "Company Profile section lets you set practice name, phone number, and website URL.",
      "Use the 'Scrape & Auto-fill' button to automatically detect company info from your website URL.",
      "Configure API keys for Twilio (phone calls & SMS), Deepgram (speech recognition), ElevenLabs (voice), OpenAI (AI conversations).",
      "Each provider has a 'Test' button to verify the connection after saving your keys.",
      "Configure AWS S3 for cloud storage, Azure ACS for email, Slack for notifications, Sentry for error monitoring.",
      "Set up EHR integrations: athenahealth (OAuth2) or generic FHIR R4 endpoint.",
      "Security settings: JWT expiration time, PHI encryption key (64 hex chars).",
    ],
  },
  {
    icon: Mail,
    title: "Patient Portal & Reminders",
    desc: "Self-scheduling, appointment reminders, and monthly analytics emailed automatically.",
    steps: [
      "Staff generates a booking link from Patient Detail → 'Send Booking Link' → choose SMS or email.",
      "Patient receives a link that works for 7 days — no account needed, no login required.",
      "Patient opens the link, picks a date, sees available time slots (based on clinic working hours), and books instantly.",
      "Appointment is created with 'confirmed' status and the patient receives both SMS and email confirmation.",
      "Appointment Reminders run daily at 8 AM — patients with next-day appointments get SMS + email reminders.",
      "Monthly Analytics Report is automatically emailed to the clinic admin on the 1st of each month.",
    ],
  },
  {
    icon: UserPlus,
    title: "Users & Roles",
    desc: "Manage staff accounts, roles, permissions, and team invitations.",
    steps: [
      "View all staff members and their roles: admin, doctor, nurse, receptionist.",
      "Add new users by entering their email — an invite email with a temporary password is sent automatically.",
      "Edit user details, change roles, or deactivate accounts as needed.",
      "Roles control feature access: admin (full), doctor (medical records + signatures), nurse (patient data), receptionist (scheduling).",
      "Users can update their own profile (name, phone, specialty, language) from clinic settings.",
    ],
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    desc: "HIPAA-compliant audit trail tracking every PHI access and system change by user.",
    steps: [
      "Only admins can access the Audit Log — visible in the sidebar under Clinic.",
      "Every patient view, call access, setting change, and EHR sync is automatically logged with user, timestamp, and IP.",
      "Filter events by action type using the dropdown and select time range: 24h, 7 days, 30 days, or 90 days.",
      "Summary cards at the top show the most frequent event types for quick oversight.",
      "The log is immutable — entries cannot be deleted or modified, ensuring a reliable compliance record.",
      "Required for HIPAA compliance — demonstrates who accessed what patient data and when.",
    ],
  },
];

const quickLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Call Center", href: "/voice-agent" },
  { label: "Inbound Calls", href: "/inbound-calls" },
  { label: "Patients", href: "/patients" },
  { label: "Appointments", href: "/appointments" },
  { label: "Call Review", href: "/call-review" },
  { label: "Analytics", href: "/analytics" },
  { label: "Live Monitoring", href: "/live-monitoring" },
  { label: "Notifications", href: "/notifications" },
  { label: "Settings", href: "/clinic/settings" },
];

export default function OnboardingGuide() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase()) ||
      s.steps.some((step) => step.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Guide</h1>
            <p className="mt-1 text-sm text-gray-500">
              Everything you need to know to use Oriveo effectively
            </p>
          </div>
          <div className="hidden sm:flex gap-1 flex-wrap max-w-md justify-end">
            {quickLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/5">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="relative mt-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.title;

          return (
            <div key={section.title} className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setExpanded(isOpen ? null : section.title)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-xs text-gray-500 mt-px">{section.desc}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <ol className="space-y-2">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No sections match your search</p>
            <button onClick={() => setSearch("")} className="mt-1 text-sm text-primary hover:underline">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
