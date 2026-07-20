import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, ArrowRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

const pages: Record<string, { title: string; subtitle: string; body: string[] }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How Oriveo handles and protects your data",
    body: [
      "Oriveo, Inc. (\"Oriveo,\" \"we,\" \"us,\" or \"our\") is committed to protecting the privacy and security of protected health information (PHI) and personally identifiable information (PII) in accordance with HIPAA, GDPR, and applicable data protection regulations.",
      "Information We Collect: We collect patient information necessary for healthcare communication, including name, phone number, medical history, clinical notes, and call recordings. This data is collected solely for the purpose of facilitating AI-powered patient communication and clinical documentation.",
      "How We Use Your Information: call handling and transcription, AI-powered clinical note generation, appointment reminders and follow-ups, quality assurance and compliance monitoring, analytics and platform improvement.",
      "Data Protection: All data is encrypted at rest using AES-256-GCM and in transit using TLS 1.3. We maintain SOC 2 Type II certification, HITRUST CSF certification, and conduct regular third-party security audits.",
      "Data Retention: Call recordings and transcripts are retained per your organization's data retention policy. Patient records are retained for the duration of the clinical relationship plus any applicable statutory retention period.",
      "Your Rights: You have the right to access, correct, export, or delete your data. Requests can be submitted to privacy@oriveo.io. We respond to all requests within 30 days as required by HIPAA.",
      "Contact: For privacy-related inquiries, contact our Privacy Officer at privacy@oriveo.io or (555) 123-4567.",
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    subtitle: "Terms governing the use of the Oriveo platform",
    body: [
      "These Terms of Service (\"Terms\") govern your organization's use of the Oriveo healthcare communication platform. By using Oriveo, you agree to these Terms.",
      "Service Description: Oriveo provides an AI-powered voice communication platform for healthcare organizations, including automated outbound calling, inbound call triage, clinical documentation, analytics, and related services.",
      "Account Responsibility: Your organization is responsible for maintaining the confidentiality of account credentials and for all activities under your account. You agree to notify us immediately of any unauthorized use.",
      "HIPAA Compliance: Oriveo enters into Business Associate Agreements (BAAs) with all covered entities. We implement appropriate safeguards to protect PHI as required by HIPAA Security Rule (45 CFR § 164.300-318).",
      "Service Level Agreement: Oriveo guarantees 99.9% platform uptime, excluding scheduled maintenance. Credits are issued for downtime exceeding monthly thresholds per your service tier.",
      "Payment Terms: Fees are billed monthly in advance based on your selected plan. Late payments may result in service suspension after a 15-day grace period. All fees are non-refundable except as specified in your agreement.",
      "Termination: Either party may terminate with 30 days written notice. Upon termination, your data will be exported and provided within 30 days, after which it will be permanently deleted per our data retention policy.",
    ],
  },
  "hipaa-notice": {
    title: "HIPAA Notice of Privacy Practices",
    subtitle: "How medical information about you may be used and disclosed",
    body: [
      "This Notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.",
      "Your Protected Health Information (PHI): Oriveo may use and disclose your PHI for treatment, payment, and healthcare operations purposes. This includes sharing information with healthcare providers, insurance companies, and as required by law.",
      "Uses and Disclosures: We may use PHI to facilitate AI-powered clinical documentation, communicate appointment reminders via voice/SMS/email, coordinate follow-up care, and comply with legal and regulatory requirements.",
      "Your Rights Under HIPAA: You have the right to request restrictions on certain uses and disclosures, receive confidential communications, inspect and copy your PHI, request amendments to your PHI, receive an accounting of disclosures, and request a paper copy of this Notice.",
      "We Are Required By Law to: maintain the privacy of your PHI, provide this Notice of our legal duties and privacy practices, and notify you in the event of a breach of your unsecured PHI.",
      "Changes to This Notice: We reserve the right to change this Notice. Revised versions will be posted on our website and made available at your request.",
      "Complaints: If you believe your privacy rights have been violated, you may file a complaint with us or with the Secretary of Health and Human Services. You will not be penalized for filing a complaint.",
    ],
  },
  sla: {
    title: "Service Level Agreement",
    subtitle: "Oriveo platform performance guarantees",
    body: [
      "This Service Level Agreement (\"SLA\") governs the performance commitments for the Oriveo platform.",
      "Uptime Guarantee: Oriveo guarantees 99.9% monthly uptime for the platform, excluding scheduled maintenance windows (Sundays 2:00 AM – 4:00 AM EST). Uptime is measured on a monthly basis across all platform services.",
      "Service Credits: If monthly uptime falls below 99.9%, you are eligible for service credits: 99.0%–99.9% = 5% credit, 95.0%–98.9% = 10% credit, below 95.0% = 25% credit. Credits are applied to the following month's invoice.",
      "Response Times: Critical incidents (platform down) — 15-minute response, 1-hour resolution target. High severity (major feature degradation) — 30-minute response, 4-hour resolution. Medium severity (minor feature issue) — 2-hour response, next business day resolution.",
      "Exclusions: SLA does not cover downtime caused by: scheduled maintenance, third-party service failures (Twilio, OpenAI, Deepgram), customer-side network issues, force majeure events, or API rate limiting due to excessive usage.",
      "Reporting: Submit SLA credit requests within 5 business days of the incident. Include incident timestamps and impact description. Credits are the sole remedy for SLA breaches.",
    ],
  },
  documentation: {
    title: "Documentation",
    subtitle: "Guides, references, and resources for the Oriveo platform",
    body: [
      "Welcome to the Oriveo documentation hub. Here you'll find comprehensive guides, API references, integration tutorials, and best practices for deploying and managing the Oriveo healthcare communication platform.",
      "Getting Started: Begin with our Quick Start Guide to set up your clinic, configure your AI voice agent, and run your first patient call in under 30 minutes.",
      "Platform Guides: Learn how to configure specialty-aware dashboards, create custom condition-specific questionnaires, set up batch call campaigns, and manage patient records.",
      "Integration Guides: Step-by-step instructions for EHR integration (Athenahealth, Epic, Cerner), Twilio phone number configuration, and custom API workflows.",
      "Security & Compliance: Detailed documentation on HIPAA compliance configuration, data encryption, audit logging, and role-based access control setup.",
      "All documentation is available at docs.oriveo.io. For additional support, contact our team at support@oriveo.io.",
    ],
  },
  "api-reference": {
    title: "API Reference",
    subtitle: "REST API documentation for the Oriveo platform",
    body: [
      "The Oriveo API enables programmatic access to the platform's core capabilities, including patient management, call orchestration, questionnaire management, and data export.",
      "Authentication: All API requests require a JWT bearer token obtained via the /api/auth/login endpoint. Tokens expire after 24 hours. Include the token in the Authorization header: Bearer <token>.",
      "Base URL: All API endpoints are available at https://api.oriveo.io/v1. Rate limiting applies at 1,000 requests per minute per organization.",
      "Key Endpoints: POST /api/voice/outbound — initiate an outbound call, GET /api/calls — retrieve call history, POST /api/questionnaires — create a questionnaire, GET /api/patients — list patients, POST /api/batch/start — launch a batch campaign.",
      "WebSocket Events: Real-time events are available at wss://api.oriveo.io/ws. Events include call:transcript, call:severity, call:status, and call:emergency.",
      "SDKs: Official SDKs are available for Node.js, Python, and Java. For detailed endpoint documentation, interactive API explorer, and code samples, visit docs.oriveo.io/api.",
    ],
  },
  "case-studies": {
    title: "Case Studies",
    subtitle: "Real results from healthcare organizations using Oriveo",
    body: [
      "Memorial Health Systems — 14-facility health system reduced no-shows by 71% across all facilities within 60 days of deployment. AI voice agents handled 94% of routine follow-up calls, freeing 440+ staff hours monthly.",
      "Pacific Northwest Medical Group — Multi-specialty clinic with 45 providers deployed Oriveo's condition-aware calling across cardiology, endocrinology, and pulmonology departments. Patient satisfaction scores improved by 32%.",
      "Trinity Health Alliance — Large hospital network implemented Oriveo for post-discharge follow-up calls. Readmission rates dropped by 18% within the first quarter, and the platform paid for itself in under 90 days.",
      "For detailed case studies and ROI analysis, contact our team for a personalized consultation.",
    ],
  },
  whitepapers: {
    title: "Whitepapers",
    subtitle: "Research and insights from healthcare IT experts",
    body: [
      "The ROI of AI-Powered Patient Communication — A comprehensive analysis of cost savings, operational efficiency, and patient outcomes across 200+ healthcare organizations using AI voice communication.",
      "HIPAA Compliance in the Age of AI Voice — Best practices for maintaining compliance while leveraging artificial intelligence for patient communication, covering encryption, audit trails, and BAAs.",
      "Reducing No-Shows with Intelligent Automation — A data-driven approach to appointment adherence using AI voice, SMS, and email reminders with intelligent rescheduling.",
      "The Future of Clinical Documentation — How ambient clinical intelligence and AI-generated SOAP notes are transforming physician workflow and reducing documentation burden.",
      "Access the full library at resources.oriveo.io or contact us for printed copies.",
    ],
  },
  blog: {
    title: "Blog",
    subtitle: "Industry insights, product updates, and best practices",
    body: [
      "Welcome to the Oriveo blog. Stay updated with the latest in healthcare AI, patient communication technology, clinical workflow automation, and regulatory compliance.",
      "Latest Posts: How Condition-Aware AI Is Changing Triage — Our new condition detection engine automatically identifies patient conditions from speech and loads specialty-specific questions in real time.",
      "The Shift to Ambient Clinical Intelligence — Why AI-generated SOAP notes are becoming the standard for forward-thinking healthcare organizations, reducing documentation time by 60%.",
      "Multi-Language Voice AI in Healthcare — How Oriveo's 10+ language support with automatic detection is breaking down language barriers in patient communication.",
      "Subscribe to our newsletter for weekly updates, or visit blog.oriveo.io for the full archive.",
    ],
  },
  "about-us": {
    title: "About Us",
    subtitle: "Oriveo's mission, team, and history",
    body: [
      "Founded in 2003, Oriveo has been at the forefront of healthcare communication technology for over two decades. Our mission is to transform patient communication through intelligent automation, making healthcare more accessible, efficient, and compassionate.",
      "Our team combines deep expertise in healthcare IT, artificial intelligence, voice technology, and enterprise security. We serve over 1,200 healthcare organizations, from small private practices to large multi-facility health systems.",
      "Our platform processes over 50 million patient interactions annually, with 99.97% platform uptime. We maintain HIPAA compliance, SOC 2 Type II certification, and HITRUST CSF certification.",
      "Headquartered in San Francisco, CA, our team is distributed across North America and Europe. We are backed by leading healthcare and technology investors.",
      "For partnership inquiries, media requests, or general questions, contact us at hello@oriveo.io.",
    ],
  },
  leadership: {
    title: "Leadership",
    subtitle: "The team behind Oriveo",
    body: [
      "Dr. Sarah Chen, CEO & Co-Founder — Former Chief Medical Information Officer at Stanford Health Care. Board-certified internist with 20+ years in healthcare IT. PhD in Biomedical Informatics from MIT.",
      "James Mitchell, CTO & Co-Founder — Previously led voice AI engineering at Amazon Alexa. 15+ years in speech recognition and natural language processing. MS in Computer Science from Carnegie Mellon.",
      "Dr. Robert K. Patel, Chief Medical Officer — Practicing cardiologist and healthcare technology advisor. Former CMIO at Memorial Health Systems. Leads clinical validation and AI accuracy initiatives.",
      "Maria Gonzalez, Chief Operating Officer — 25 years in healthcare operations management. Former VP of Operations at Kaiser Permanente. Oversees platform deployment, customer success, and support.",
      "David Park, Chief Information Security Officer — CISSP, CISM certified. Former security director at Epic Systems. Leads HIPAA compliance, SOC 2 audits, and enterprise security architecture.",
    ],
  },
  careers: {
    title: "Careers",
    subtitle: "Join the team transforming healthcare communication",
    body: [
      "At Oriveo, we're building the future of healthcare communication. We're looking for passionate individuals who want to make a meaningful impact on patient care through technology.",
      "Open Positions: Senior Software Engineer (Voice/AI) — Build and scale our real-time voice processing pipeline. Experience with WebRTC, Deepgram, and Node.js required. Remote (US/EU).",
      "Clinical AI Specialist — Work with our medical team to train and validate condition detection models. Clinical background (MD, RN, or PA) with ML experience preferred. San Francisco, CA.",
      "Cloud Infrastructure Engineer — Manage our Docker/Kubernetes infrastructure across 3 regions. Terraform experience required. Remote (US).",
      "Customer Success Manager — Guide healthcare organizations through deployment and adoption. Healthcare IT experience required. Remote (US).",
      "Apply by sending your resume and cover letter to careers@oriveo.io. Oriveo is an equal opportunity employer committed to diversity and inclusion.",
    ],
  },
  partners: {
    title: "Partners",
    subtitle: "Collaborate with Oriveo to deliver better patient communication",
    body: [
      "Oriveo's partner ecosystem includes EHR vendors, healthcare IT consultants, system integrators, and technology providers. Together, we deliver comprehensive patient communication solutions.",
      "Technology Partners: Twilio (telephony infrastructure), OpenAI (language models), Deepgram (speech-to-text), MongoDB (data platform), ElevenLabs (voice synthesis).",
      "EHR Integration Partners: Athenahealth, Epic, Cerner, eClinicalWorks, Practice Fusion, AdvancedMD. Certified integrations with bi-directional data sync.",
      "Consulting Partners: Accenture Healthcare, Deloitte Health, Cognizant — helping healthcare organizations design, deploy, and optimize AI-powered patient communication workflows.",
      "Interested in becoming a partner? Contact our partnerships team at partners@oriveo.io for more information about our partner program, certification process, and joint go-to-market opportunities.",
    ],
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connect Oriveo with your existing healthcare stack",
    body: [
      "Oriveo integrates with leading EHR systems, telephony providers, and analytics platforms to provide a seamless healthcare communication experience.",
      "EHR Integrations: Bi-directional integration with Athenahealth, Epic, Cerner, eClinicalWorks, Practice Fusion, and AdvancedMD. Patient data syncs automatically, and clinical notes are written back to the EHR.",
      "Telephony: Twilio-powered voice infrastructure with local, toll-free, and international numbers. Automatic failover, call recording, and real-time transcription.",
      "AI & Analytics: OpenAI for clinical language understanding, Deepgram for speech recognition, ElevenLabs for natural voice synthesis. All AI services are HIPAA-compliant with BAAs in place.",
      "API & Webhooks: REST API for custom integrations, WebSocket events for real-time data streaming, and webhooks for call status, transcript delivery, and emergency alerts.",
      "For detailed integration guides and technical documentation, visit docs.oriveo.io or contact our solutions engineering team.",
    ],
  },
  security: {
    title: "Security",
    subtitle: "Enterprise-grade security for healthcare data",
    body: [
      "Oriveo maintains a comprehensive security program designed to protect patient data and meet the rigorous requirements of healthcare regulations worldwide.",
      "Encryption: All data is encrypted at rest using AES-256-GCM with automatic key rotation. Data in transit is protected by TLS 1.3. Call recordings and transcripts are encrypted end-to-end.",
      "Compliance Certifications: HIPAA compliant with executed BAAs, SOC 2 Type II certified (audit available upon request), HITRUST CSF certified, GDPR compliant for EU patients.",
      "Access Control: Role-based access control (RBAC) with granular permissions per user. Multi-factor authentication (MFA) required for all administrative accounts. Comprehensive audit logging of all access and actions.",
      "Infrastructure: Hosted on AWS with multi-region redundancy. Network segmentation, WAF, DDoS protection, and 24/7 security monitoring. Regular penetration testing and vulnerability assessments by third-party firms.",
      "Data Privacy: Strict data segregation between organizations. Automatic data purging per retention policies. Annual employee security training and background checks for all staff with data access.",
    ],
  },
  compliance: {
    title: "Compliance",
    subtitle: "Regulatory compliance and certifications",
    body: [
      "Oriveo is designed and operated in compliance with major healthcare regulations and standards worldwide.",
      "HIPAA: We execute Business Associate Agreements (BAAs) with all covered entities. Our platform implements all required administrative, physical, and technical safeguards per HIPAA Security Rule (45 CFR § 164.300-318).",
      "SOC 2 Type II: Independently audited annually for security, availability, and confidentiality. Our SOC 2 report is available to enterprise customers under NDA.",
      "HITRUST CSF: Certified at the Moderate level, demonstrating our commitment to information protection and compliance with healthcare industry standards.",
      "GDPR: For EU patients, we comply with General Data Protection Regulation requirements including data processing agreements, right to erasure, data portability, and breach notification within 72 hours.",
      "FHIR R4: Our clinical data export supports HL7 FHIR Release 4 with standard resources for patient, observation, condition, and clinical note exchange.",
      "ONC Certification: Our clinical documentation module meets ONC 2015 Edition certification requirements for electronic health record technology.",
    ],
  },
};

export default function StaticPage() {
  const { page } = useParams();
  const navigate = useNavigate();
  const content = page ? pages[page] : null;

  if (!content) return <NotFound />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
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

      <div className="flex-1 max-w-3xl mx-auto w-full px-8 py-16">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
            <p className="text-gray-500">{content.subtitle}</p>
          </div>
        </div>
        <div className="mt-10 space-y-6">
          {content.body.map((paragraph, i) => (
            <p key={i} className="text-gray-600 leading-relaxed">{paragraph}</p>
          ))}
        </div>
      </div>

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

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Page not found</h1>
        <p className="text-gray-500 mt-2">This page does not exist.</p>
        <a href="/" className="mt-6 inline-block text-primary hover:underline">Go home</a>
      </div>
    </div>
  );
}
