# AI Voice Calling Agent - Setup Guide

Your Oriveo/Statvox project already has a **complete AI voice calling system** built in. This guide explains how to configure and use it.

## Architecture

```
User's Phone <-> Twilio <-> Your Server (WebSocket) <-> Deepgram (STT) <-> OpenAI GPT (AI) <-> ElevenLabs (TTS)
                                                                                          <-> MongoDB (Storage)
```

## 1. Get API Keys

| Service | Purpose | Where to Get | Free Tier |
|---------|---------|-------------|-----------|
| **Twilio** | Make/receive phone calls | https://twilio.com/try-twilio | Pay as you go (~$1/month per number) |
| **OpenAI** | AI conversation intelligence | https://platform.openai.com/api-keys | $5 free credit |
| **Deepgram** | Speech-to-text (transcription) | https://console.deepgram.com/ | $200 free credit |
| **ElevenLabs** | Text-to-speech (realistic voice) | https://elevenlabs.io/app/settings/api-keys | 10,000 free characters/month |

## 2. Configure `.env`

Edit `server/.env` and fill in:

```env
# Required - AI Conversation
OPENAI_API_KEY=sk-...

# Required - Speech Recognition
DEEPGRAM_API_KEY=...

# Required - Voice Synthesis
ELEVENLABS_API_KEY=...

# Required - Phone Calls
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Your server's public URL (for Twilio webhooks)
SERVER_URL=https://your-server.com  # or http://localhost:5000 for testing
```

## 3. Setup Twilio Webhook

1. Go to https://console.twilio.com/us1/develop/phone-numbers
2. Click your phone number
3. Under "Voice Configuration", set:
   - **When a call comes in**: Webhook → `https://YOUR_SERVER/api/twilio/inbound`
   - **HTTP Method**: POST
4. Set your Status Callback URL:
   - `https://YOUR_SERVER/api/voice/twilio/status`

For local testing, use **ngrok**: `ngrok http 5000` and use the ngrok URL as `SERVER_URL`.

## 4. Start the System

### Option A: Start everything
```powershell
# Start MongoDB (if not running)
docker run -d -p 27017:27017 mongo:7

# Start server
cd server
node index.js

# Start client (separate terminal)
cd client
npx vite
```

### Option B: Use the start script
```powershell
.\start.ps1
```

## 5. Make Your First Call

1. Open the app at `http://localhost:5173`
2. Sign up / Login
3. Add a patient (with a real phone number)
4. Go to **Call Center → Quick Call**
5. Search for the patient, click **Call**

The AI agent will:
- Call the patient's phone
- Greet them by name
- Ask screening questions
- Save the full transcript
- Score call quality (QA)

## 6. Inbound Calls

When a patient calls your Twilio number:
1. Twilio sends the call to `/api/twilio/inbound`
2. The AI answers: "Hello, you've reached [Practice Name]..."
3. Patient identifies themselves
4. The AI matches them in the system
5. AI conducts a health checkup/interview
6. Full transcript saved

## 7. Using the General-Purpose Agent

By default, the AI uses a **medical assistant** persona. I added a **general-purpose** option.

To use the general agent, add `type: "general"` when creating the VoiceAgent:

```js
const agent = createVoiceAgent({
  type: "general",  // instead of medical
  // ... other options
});
```

## 8. User Phone Number Configuration

Users can set their phone number in their profile via:
- **UI**: Settings → Profile → Phone
- **API**: `PUT /api/auth/profile` with `{ "phone": "+1234567890" }`

## 9. Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/outbound` | POST | Start an outbound AI call |
| `/api/voice/twilio/incoming` | POST | Twilio inbound webhook |
| `/api/voice/twilio/status` | POST | Twilio call status callback |
| `/api/calls` | GET | List all calls |
| `/api/calls/active` | GET | List active calls |
| `/api/calls/:id` | GET | Get call details + transcript |
| `/api/auth/profile` | PUT | Update user profile (phone) |

## 10. Services Already Built

- **Voice Agent** (`services/voiceAgent.js`) - AI conversation with triage, emotions, multilingual
- **Media Stream** (`services/mediaStream.js`) - Real-time audio via WebSocket
- **Call Scheduler** (`services/callScheduler.js`) - Retry logic, quiet hours
- **Batch Calling** (`services/patientVoiceAgent.js`) - Automated call campaigns
- **Knowledge Base** (`services/knowledgeBase.js`) - RAG for AI context
- **Browser Voice** (`services/browserVoice.js`) - In-browser voice testing
- **QA Scoring** (`services/qaScoring.js`) - Automated call quality scoring
- **FHIR Integration** - EHR system sync
