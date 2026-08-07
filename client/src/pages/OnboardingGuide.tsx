import { useState } from "react";
import {
  LayoutDashboard, Radio, BarChart3, FileText, Phone, ShieldCheck,
  Users, CircleUserRound, Calendar, CalendarDays, ClipboardList, Home,
  FlaskConical, Pill, BookOpen, Building2, Building, Settings, ScrollText,
  Lock, User, Command, MessageSquare, Bell, Globe, Heart, Siren,
  PhoneForwarded, DollarSign, Clock, Search, ChevronDown, ArrowRight, HelpCircle,
} from "lucide-react";

interface Section {
  icon: React.ElementType;
  title: string;
  desc: string;
  href?: string;
  steps: string[];
}

const sections: Section[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Command center — KPIs, urgent cases, active emergencies, and recent activity. Widgets adapt to your clinic type (human, dental, veterinary).",
    href: "/dashboard",
    steps: [
      "KPI cards at the top show today's numbers: patients, appointments, average severity, AI assessments and follow-ups — plus specialty widgets that change with your clinic type (human, dental, vet).",
      "Check 'Needs Attention' for urgent or severe cases that require immediate follow-up.",
      "The 'Active Emergencies' banner appears at the top when red-flag keywords are detected in a call — click it to act.",
      "Browse recent completed and upcoming scheduled calls below the cards.",
      "The compliance badge in the header shows audit status — click to open the full HIPAA Audit Log.",
      "Click any card or link to dive deeper into a section.",
    ],
  },
  {
    icon: Radio,
    title: "Command Center",
    desc: "A live, TV-style monitoring wall for active calls, QA scores and room status. Available to admin and doctor roles.",
    href: "/command-center",
    steps: [
      "Shows a live view of what's happening across the clinic — active calls, alerts and severity in real time.",
      "Severity is color-coded: Low (green), Medium (amber), High (red) for instant triage at a glance.",
      "The QA scores view lists the latest scored calls and their quality ratings (empty until calls are reviewed).",
      "The rooms view shows room status for large clinics.",
      "Updates automatically — designed as a wall display for your team.",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Deep statistics, visual insights, call trends, QA scores, and the monthly emailed report.",
    href: "/analytics",
    steps: [
      "Top KPI cards show completion rate, answer rate, appointment conversion, average QA score, and average severity.",
      "Charts show call volume over time, outcome distribution pie chart, severity breakdown, and calls by patient.",
      "QA Score Breakdown shows accuracy, empathy, professionalism, adherence, and resolution scores per call.",
      "The Monthly Report section shows the current month's totals — click 'Email Report' to send it to the clinic admin.",
      "The monthly report is also automatically emailed on the 1st of each month at 9 AM.",
    ],
  },
  {
    icon: FileText,
    title: "Reports",
    desc: "Generate, print and share clinical reports, with electronic signature capture. Available to admin, doctor, nurse and receptionist roles.",
    href: "/reports",
    steps: [
      "Choose filters to build a report for a patient or a date range.",
      "Capture an electronic signature by drawing on the signature pad.",
      "Download the report as a file or print it directly.",
      "Share or export reports for patients, referrals or records.",
    ],
  },
  {
    icon: Phone,
    title: "Call Center",
    desc: "One place for AI voice calls — quick calls, scheduled batches, live calls and history. Inbound calls and live monitoring now live here too.",
    href: "/voice-agent",
    steps: [
      "Four tabs: Quick Call, Batch Schedule, Live Calls and Call History.",
      "Quick Call: pick or search a patient, choose a questionnaire, select a language, then press Call.",
      "Batch Schedule: select multiple patients or a group, pick a date/time and launch a campaign. Patients opted out via Do Not Call are skipped automatically.",
      "Live Calls: watch in-progress calls with live transcript, emotion and severity — this is where 'Live Monitoring' lives now.",
      "Call History: review past outbound and inbound calls.",
      "The Browser Test panel lets you try the AI voice agent from your computer without dialing a phone.",
      "Supported languages: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Arabic and Hindi.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Call Review",
    desc: "Recordings, AI quality scores, transcripts and triage results for every call.",
    href: "/call-review",
    steps: [
      "Three tabs: Recordings, Quality Scores and Transcript.",
      "Recordings: search calls by patient, view the call detail, or download the recording.",
      "Quality Scores: average overall plus per-call scores (accuracy, empathy, professionalism, adherence, resolution), with severity and triage tier chips.",
      "Triage tier chips: Tier 0 (red — emergency), Tier 1 (amber — urgent), Tier 2 (blue — concerning), Tier 3 (green — routine).",
      "A 'CRISIS' badge appears when the 988 crisis pathway was triggered during a call.",
      "Transcript shows the full question/answer log of completed AI calls.",
    ],
  },
  {
    icon: Users,
    title: "Patients",
    desc: "Patient records, medical history, contact info, DNC status, consent tracking, and data privacy tools.",
    href: "/patients",
    steps: [
      "'Add Patient' creates a human or pet record (pet mode is auto-enabled for veterinary clinics) with full medical details.",
      "'Add Group' lets you manage multiple patients together as a group — families, facilities or cohorts.",
      "Use the search bar to find patients by name or phone instantly; voice input is available in the search bar.",
      "Set a per-patient language so AI calls speak to them in their preferred language.",
      "Toggle the Do Not Call (DNC) flag to opt a patient out of outbound calls.",
      "Click a patient to open their full detail page.",
    ],
  },
  {
    icon: CircleUserRound,
    title: "Patient Detail",
    desc: "The complete record for one patient — history, documents, vitals, visits, reports, clinical data and voice biomarkers.",
    href: "/patients",
    steps: [
      "Tabs: Summary, Medical History, Documents, Vitals, Visits, Reports, Clinical and Voice Biomarkers.",
      "'Edit All' makes every field editable: contact info, insurance, diagnosis, conditions, allergies, medications, surgeries, emergency contact and notes.",
      "'Send Booking Link' generates a magic link (valid 7 days) for the patient to self-schedule via SMS or email — no account needed.",
      "Consent Management tracks grants/revocations for phone, email, SMS, recording, telehealth and data processing.",
      "'Export Patient Data' downloads structured JSON with all records, calls, notes, appointments, vitals and consent history for portability.",
      "'Permanently Delete' runs the right-to-erasure workflow and removes the patient and all associated data (admin only).",
    ],
  },
  {
    icon: Calendar,
    title: "Appointments",
    desc: "Schedule, reschedule and track appointments with status tracking and automatic no-show detection.",
    href: "/appointments",
    steps: [
      "Filter tabs: All, Scheduled, Confirmed, In Progress, Completed, Cancelled and No Show.",
      "Filter by date range and status using the controls above the list.",
      "'Schedule New Appointment' books a visit, phone call, or video visit for a patient.",
      "Search for a patient by name when booking; use the edit icon on any appointment to change details, status or notes.",
      "Auto No-Show Detection marks scheduled/confirmed appointments that are 30+ minutes past their time as no-show automatically.",
      "No-Show Rate and Estimated Savings cards on the Dashboard show the financial impact of AI reminders reducing missed appointments.",
    ],
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    desc: "A calendar view of appointments and scheduled AI calls, with recurring reminders.",
    href: "/calendar",
    steps: [
      "See all scheduled calls and appointments laid out on a calendar.",
      "Add a call with patient, questionnaire, time and language.",
      "Set recurring monthly reminders and next-appointment follow-ups.",
      "Edit existing scheduled calls and per-patient instructions.",
    ],
  },
  {
    icon: ClipboardList,
    title: "Templates & Forms",
    desc: "Medical questionnaires used by the AI during calls — pick one, customize it, or generate your own.",
    href: "/templates",
    steps: [
      "Tabs: Medical, Veterinary and Dental (your clinic type shows the relevant ones), plus Saved.",
      "Each template card shows the condition, category, severity badge and question count, with expandable question previews.",
      "'Customize' lets you edit, add, remove and reorder questions in any template.",
      "'Create New' builds a questionnaire from scratch with question types (Open, Scale 1-10, Yes/No) and follow-up prompts.",
      "'AI Generate Questions' creates a full questionnaire from a condition description.",
      "Templates keep assessments consistent and thorough across all patient calls.",
    ],
  },
  {
    icon: Home,
    title: "Home Care (Patient Care)",
    desc: "Care plans and home visits — tasks, medications, vital tracking and geo check-in for patients receiving care at home.",
    href: "/care/home-care",
    steps: [
      "Two tabs: Visits and Plans.",
      "Plans: create care plans with status (active / paused / completed / cancelled), tasks, medications and emergency contacts per patient.",
      "Visits: schedule home visits with status (scheduled / in-progress / completed / cancelled).",
      "Nurses check in with location (geo check-in) and record vitals, SOAP notes and billable codes during a visit.",
      "Caregivers get their own view of the patients assigned to them.",
      "Family members can follow a patient's care through a secure family link.",
    ],
  },
  {
    icon: FlaskConical,
    title: "Lab Results",
    desc: "Structured lab panels with auto-detected abnormal values — and photo scanning with AI extraction.",
    href: "/care/labs",
    steps: [
      "'Add Result' builds a structured panel (General, CBC, CMP, Lipid Panel, HbA1c, Thyroid, Urinalysis, Coagulation, Vitamins) with tests, values, units and reference ranges.",
      "Values outside the reference range are flagged automatically: normal / high / low / critical / pending.",
      "Statuses track a result from ordered → collected → in-progress → completed.",
      "'Scan' photographs a paper lab report with the camera — the AI reads it and fills the form for you. If it can't read the photo, you fill it in manually.",
      "The scanned photo is saved and attached to the lab result.",
      "The FHIR button exports any result as a copyable FHIR bundle.",
    ],
  },
  {
    icon: Pill,
    title: "Prescriptions",
    desc: "Write, sign, print and renew prescriptions — with photo scanning and AI extraction.",
    href: "/care/prescriptions",
    steps: [
      "'Write Rx' creates a prescription with medication, dosage, route, frequency, quantity and refills.",
      "Prescriptions start unsigned — 'Sign' applies the prescriber's signature.",
      "'Mark Filled' updates the pharmacy status and 'Renew' extends an active prescription.",
      "'Scan' photographs a paper prescription — the AI extracts the medication and directions for review before saving.",
      "The scanned photo is saved and attached to the prescription.",
      "Print a clean prescription from the card's print button (admin/doctor only).",
    ],
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Documents and context the AI voice agent uses to answer accurately during patient conversations.",
    href: "/knowledge-base",
    steps: [
      "'Add Document' stores protocols, FAQs and clinic guides, with an optional document ID.",
      "Content is automatically chunked and embedded for semantic + keyword search.",
      "The AI combines knowledge base context with the live conversation for relevant, accurate answers.",
      "Use it to make the AI speak with your specific clinic knowledge and protocols.",
    ],
  },
  {
    icon: Building2,
    title: "Operations (Team & Facilities)",
    desc: "Manage your team and clinic rooms in one place.",
    href: "/clinic/operations",
    steps: [
      "Team tab (admin): view all staff and their roles — admin, doctor, nurse, receptionist — with role icons per department.",
      "Invite new team members by email — an invite with a temporary password is sent automatically.",
      "Edit user details, change roles or deactivate accounts.",
      "Rooms tab (large clinics only): set up exam rooms, consultation, procedure, operating, imaging/lab, recovery, waiting, telehealth and other spaces.",
      "Track each room's status (available / occupied) at a glance.",
    ],
  },
  {
    icon: Building,
    title: "Clinic Dashboard",
    desc: "Your clinic's overview — plan, included features and business hours.",
    href: "/clinic",
    steps: [
      "See your current plan (Starter / Pro / Enterprise) and the limits it includes — team members, patients, calls per month, support level.",
      "Business Hours section: toggle hours on, set your timezone, and set open/close times per day.",
      "Choose after-hours behavior: 'Take a message' or 'Transfer to number', with an optional custom closed message.",
      "Click 'Save Hours' to apply your schedule.",
    ],
  },
  {
    icon: Settings,
    title: "Settings",
    desc: "Company profile, API integrations, security settings and data governance. Admin only.",
    href: "/clinic/settings",
    steps: [
      "Company Profile: set practice name, phone number and website — use 'Scrape & Auto-fill' to detect info from your website URL.",
      "Configure provider keys: OpenAI (AI conversations), Deepgram (speech recognition), ElevenLabs (text-to-speech voice), Twilio (phone calls & SMS) — each has a Test button to verify the connection.",
      "Add AWS S3 for cloud storage and EHR integrations (athenahealth OAuth2 or a generic FHIR R4 endpoint).",
      "Security settings: JWT expiration time and the PHI encryption key (64 hex characters).",
      "Data Retention: configure how long recordings, documents and audit logs are kept before automatic cleanup.",
    ],
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    desc: "Immutable HIPAA/GDPR audit trail tracking every PHI access and system change by user.",
    href: "/audit-log",
    steps: [
      "Admin only — found in the sidebar under Organization.",
      "Every patient view, call access, setting change, consent action and EHR sync is logged with user, timestamp and IP.",
      "Filter events by action type and time range: 24 hours, 7 days, 30 days or 90 days.",
      "Summary cards at the top show the most frequent event types for quick oversight.",
      "The log is immutable — entries can't be deleted or modified, and old entries are pruned per your retention settings.",
    ],
  },
  {
    icon: Lock,
    title: "Compliance & Data Privacy",
    desc: "HIPAA and GDPR features across the product — consent, erasure, portability, encryption and retention.",
    steps: [
      "Consent Management: grant or revoke patient consent per channel (phone, email, SMS, recording, telehealth, data processing) from the Patient Detail page.",
      "Every consent action is timestamped with the user's IP and stored permanently in the audit trail.",
      "Right to Erasure: admins can delete a patient and all associated data (calls, records, notes, documents, appointments, vitals, audit logs) with one action.",
      "Data Portability: export a patient's complete data as structured JSON — usable for EHR migration or patient requests.",
      "Data Retention: recordings, documents and audit logs older than the configured period are purged automatically.",
      "PHI Encryption: sensitive patient fields (name, phone, email, address, emergency contact, insurance ID, notes) are encrypted at rest with AES-256-GCM.",
      "Role-based access: admin, doctor, nurse, receptionist, caregiver, staff and user roles control what each person can see, scoped per organization.",
      "Accessibility: skip-to-content navigation, ARIA landmarks, focus indicators, screen-reader labels and keyboard-operable controls.",
    ],
  },
  {
    icon: User,
    title: "My Profile",
    desc: "Your personal information, availability, password and security settings.",
    href: "/my-profile",
    steps: [
      "Personal Information: update your name and phone (email and role are read-only) and save changes.",
      "My Availability: set per-day hours, appointment slot duration and buffer time (overrides clinic defaults).",
      "Change Password: enter your current and new password to rotate it.",
      "Two-Factor Authentication: enable 2FA for your account from the security card.",
    ],
  },
  {
    icon: Command,
    title: "Command Palette (Ctrl+K)",
    desc: "Jump between any page instantly with the keyboard.",
    steps: [
      "Press Ctrl+K (or Cmd+K) anywhere, or click the search button in the navbar.",
      "Type to filter pages: Dashboard, Patients, Appointments, Call Center, Call Review, Analytics, Reports, Templates, Command Center, Knowledge Base and more.",
      "Admins also see Operations, Audit Log and Clinic Settings.",
      "The Account section covers My Profile, Notifications and the Onboarding Guide.",
    ],
  },
  {
    icon: MessageSquare,
    title: "Clinical Assistant",
    desc: "AI decision support — ask clinical questions from anywhere in the app.",
    steps: [
      "Open it from the 'Clinical Assistant' button in the navbar.",
      "Ask about clinical guidelines, symptoms, medications or treatment protocols.",
      "Answers include source references drawn from the medical knowledge base.",
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Real-time alerts for emergencies, calls, follow-ups and system events.",
    href: "/notifications",
    steps: [
      "The bell icon in the navbar shows your unread notification count.",
      "Tabs: All, Unread and Emergency.",
      "Filter by type: emergency, high severity, inbound call, call completed, call failed, follow-up, reports and system.",
      "'Mark all read' clears them, and individual items can be deleted.",
      "Click any notification to navigate directly to the relevant call or patient.",
      "Delivered live via WebSocket — no manual refresh needed.",
    ],
  },
  {
    icon: Globe,
    title: "Patient Portal",
    desc: "Self-service portal where patients see appointments, lab results and prescriptions.",
    href: "/patient-portal",
    steps: [
      "Staff enable the portal account from Patient Detail — the patient logs in at /patient-portal with their email and the password you set.",
      "Patients sign in separately with their own credentials.",
      "Tabs: Overview, Appointments, Lab Results and Prescriptions.",
      "Overview cards show the next appointment, lab results and active prescriptions.",
      "Patients can view appointment statuses, lab values with reference ranges and status flags, and prescription details.",
      "Patients can change their password from the header.",
      "Self-scheduling: 'Send Booking Link' from Patient Detail gives a 7-day link to book without an account.",
    ],
  },
  {
    icon: Heart,
    title: "Family Portal",
    desc: "A secure link for family members to follow a loved one's home care progress.",
    steps: [
      "Generated per care plan and shared with the family.",
      "Shows the care plan, status, caregiver, medications and care tasks with checkmarks.",
      "Recent visits show date, status, caregiver, vitals (BP, HR, SpO2, temperature, weight) and notes.",
      "If the link is invalid or expired, it shows 'Link unavailable'.",
    ],
  },
  {
    icon: Siren,
    title: "Emergency Response",
    desc: "Automatic red-flag detection with 911 and crisis-lifeline scripts built in.",
    steps: [
      "The AI detects red-flag keywords during conversations — chest pain, suicide, bleeding and more.",
      "Tier 0 (emergency): the AI plays the 911 script directing the patient to emergency services, then stops the normal flow.",
      "Crisis keywords (suicide, self-harm) trigger the 988 Suicide & Crisis Lifeline script.",
      "The Dashboard shows an 'Active Emergencies' banner for every flagged patient.",
      "Admins and doctors can click '911' or 'Clinic' to place an outbound emergency call directly.",
      "Patient Detail and Call Review show severity scores (1-10) and all flagged red flags.",
    ],
  },
  {
    icon: PhoneForwarded,
    title: "Call Transfer (Human Handoff)",
    desc: "Hand an active AI call to a human operator when the AI needs to escalate.",
    steps: [
      "During an active call, click 'Transfer to Human' on the Call Detail page.",
      "A modal asks for the transfer reason (e.g., 'Patient wants to speak to a doctor').",
      "The call is transferred via Twilio to the configured human transfer number.",
      "The call status changes to 'transferred' and staff are notified.",
      "The patient hears a 'Please hold' message while the transfer connects.",
    ],
  },
  {
    icon: DollarSign,
    title: "No-Show Detection & ROI",
    desc: "Automatic missed-appointment detection and tracking of the financial value of AI reminders.",
    steps: [
      "The no-show checker runs every 15 minutes and marks scheduled/confirmed appointments 30+ minutes past their time as no-show.",
      "The No-Show Rate card on the Dashboard shows the percentage of no-shows out of valid appointments.",
      "Estimated Savings projects savings from AI-driven reminders at $200 per prevented no-show.",
      "The Appointments page has a No Show filter to review flagged appointments.",
    ],
  },
  {
    icon: Clock,
    title: "Business Hours & After-Hours",
    desc: "Define when the AI should answer, take messages, or transfer calls.",
    steps: [
      "Set hours in the Clinic Dashboard (Business Hours section) or Clinic Settings.",
      "Toggle hours on, set your timezone, and set open/close times for each day of the week.",
      "The AI answers calls 24/7 by default — after-hours behavior is controlled below.",
      "After-hours options: 'Take a message' (AI collects info and logs a callback request) or 'Transfer to number' (forward to an on-call line).",
      "Optionally set a custom closed message callers hear during after-hours.",
    ],
  },
];

const quickLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "Call Center", href: "/voice-agent" },
  { label: "Patients", href: "/patients" },
  { label: "Appointments", href: "/appointments" },
  { label: "Home Care", href: "/care/home-care" },
  { label: "Lab Results", href: "/care/labs" },
  { label: "Prescriptions", href: "/care/prescriptions" },
  { label: "Operations", href: "/clinic/operations" },
  { label: "Reports", href: "/reports" },
  { label: "My Profile", href: "/my-profile" },
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
              Everything you need to know to use Oriveo — every feature explained step by step
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
                  {section.href && (
                    <a
                      href={section.href}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open {section.title} <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
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
