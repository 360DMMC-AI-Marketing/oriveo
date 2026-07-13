import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";

await mongoose.connect("mongodb://localhost:27017/oriveo");

// Create org
let org = await Organization.findOne({ name: "Demo Clinic" });
if (!org) {
  org = await Organization.create({ name: "Demo Clinic", slug: "demo-clinic", isActive: true });
  console.log("Created org:", org._id);
}

// Create admin user
let admin = await User.findOne({ email: "anassamiri87@gmail.com" });
if (!admin) {
  admin = await User.create({
    name: "Dr. Anas Samiri",
    email: "anassamiri87@gmail.com",
    password: await bcrypt.hash("demo123", 12),
    role: "admin",
    organization: org._id,
    isActive: true,
  });
  console.log("Created admin:", admin._id);
}

// Create a patient
let patient = await Patient.findOne({ organization: org._id });
if (!patient) {
  patient = await Patient.create({
    name: "Sarah Johnson",
    phone: "+12025551234",
    email: "sarah.j@example.com",
    organization: org._id,
    createdBy: admin._id,
  });
  console.log("Created patient:", patient._id);
}

// Create a demo call with transcript and QA
const existing = await Call.findOne({ patient: patient._id, aiSeverityScore: 6 });
if (!existing) {
  const call = await Call.create({
    organization: org._id,
    patient: patient._id,
    startedBy: admin._id,
    direction: "outbound",
    status: "completed",
    duration: 187,
    patientResponded: true,
    aiSeverityScore: 6,
    language: "en",
    triageTier: 2,
    highestTier: 3,
    emergencyDetected: false,
    createdAt: new Date(),
    scheduledAt: new Date(Date.now() - 86400000),
    startedAt: new Date(Date.now() - 82800000),
    endedAt: new Date(Date.now() - 82700000),
    aiSummary: "Patient reported moderate lower back pain persisting for 5 days. No fever or numbness. Medication adherence is good. Follow-up appointment scheduled for next week. Patient expressed concern about recurring pain.",
    aiRecommendations: "1. Continue current medication regimen\n2. Schedule follow-up in 7 days\n3. Monitor for fever or radiating pain\n4. Light stretching as tolerated",
    transcript: [
      { question: "Hello, this is Oriveo calling from Demo Clinic. May I speak with Sarah?", answer: "Yes, this is her speaking.", timestamp: 0 },
      { question: "Hi Sarah, this is an automated check-in call from Dr. Samiri's office. How are you feeling today?", answer: "I'm okay, but my back has been hurting quite a bit this week.", timestamp: 3 },
      { question: "I'm sorry to hear that. On a scale of 0 to 10, how would you rate your pain right now?", answer: "About a 6. It's been around a 5 or 6 for the past few days.", timestamp: 12 },
      { question: "Where exactly is the pain located?", answer: "Lower back, right above my tailbone. It's a dull ache that gets sharp when I bend over.", timestamp: 22 },
      { question: "How long has this been going on?", answer: "About 5 days now. It started after I was doing some gardening over the weekend.", timestamp: 35 },
      { question: "Are you experiencing any numbness, tingling, or weakness in your legs?", answer: "No, nothing like that. Just the back pain.", timestamp: 48 },
      { question: "Have you had any fever, chills, or unexplained weight loss recently?", answer: "No fever or anything. I've been eating normally.", timestamp: 58 },
      { question: "Are you taking any medication for the pain?", answer: "I've been taking ibuprofen, 400mg every 6 hours. It helps a little.", timestamp: 70 },
      { question: "Have you had any previous back issues or injuries?", answer: "I had a minor strain about 2 years ago but it resolved on its own.", timestamp: 85 },
      { question: "Has the pain affected your daily activities or sleep?", answer: "Harder to sleep on my back. I had to take a couple days off work.", timestamp: 98 },
      { question: "Would you like us to schedule a follow-up appointment with Dr. Samiri?", answer: "Yes, please. Can we do sometime next week?", timestamp: 115 },
      { question: "We have Tuesday at 2:30 PM or Thursday at 10:00 AM. Which works?", answer: "Tuesday at 2:30 PM works perfect.", timestamp: 130 },
      { question: "You're all set for Tuesday at 2:30 PM. Is there anything else?", answer: "No, that's all. Thank you!", timestamp: 142 },
      { question: "Take care, Sarah. We'll see you on Tuesday. Call us if symptoms worsen.", answer: "Will do. Thanks, goodbye!", timestamp: 160 },
    ],
    qaScore: {
      overall: 87,
      accuracy: 92,
      empathy: 88,
      professionalism: 90,
      adherence: 85,
      resolution: 82,
      summary: "The AI agent demonstrated strong clinical accuracy, correctly identifying the need for follow-up care and assessing red flag symptoms. Empathy was well-demonstrated throughout. Professionalism maintained with appropriate greetings. Agent successfully scheduled follow-up and provided escalation instructions.",
      strengths: [
        "Thorough red flag assessment for back pain",
        "Appropriate pain scale evaluation",
        "Clear follow-up scheduling",
        "Good empathetic language throughout",
        "Proper escalation instructions provided",
      ],
      weaknesses: [
        "Could have asked about radiation of pain earlier",
        "Missed opportunity to discuss heat/ice therapy",
        "Slightly rushed closure at the end",
      ],
      scoredAt: new Date(),
    },
  });
  console.log("Created demo call:", call._id);
  console.log("Transcript entries:", call.transcript.length);
  console.log("QA Score:", call.qaScore.overall);
} else {
  console.log("Demo call already exists:", existing._id);
  console.log("Transcript entries:", existing.transcript.length);
  console.log("QA Score:", existing.qaScore?.overall);
}

await mongoose.disconnect();
console.log("Done!");
