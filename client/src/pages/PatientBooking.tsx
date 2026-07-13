import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const API = "";

function apiGet(path: string) {
  return fetch(`/api/patient-portal${path}`).then((r) => r.json());
}

function apiPost(path: string, body: any) {
  return fetch(`/api/patient-portal${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
}

export default function PatientBooking() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<"loading" | "info" | "slots" | "confirm" | "done" | "error">("loading");
  const [patient, setPatient] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!token) { setStep("error"); setErrorMessage("Missing booking link"); return; }
    apiGet(`/booking-info/${token}`).then((data) => {
      if (data.patient && data.organization) {
        setPatient(data.patient);
        setOrganization(data.organization);
        setStep("info");
        const today = new Date();
        today.setDate(today.getDate() + 1);
        setSelectedDate(today.toISOString().split("T")[0]);
      } else {
        setStep("error");
        setErrorMessage(data.message || "Invalid or expired booking link");
      }
    }).catch(() => {
      setStep("error");
      setErrorMessage("Could not load booking info");
    });
  }, [token]);

  useEffect(() => {
    if (step !== "slots" || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    apiGet(`/booking-slots/${token}?date=${selectedDate}`).then((data) => {
      setSlots(data.slots || []);
      setLoadingSlots(false);
    }).catch(() => {
      setSlots([]);
      setLoadingSlots(false);
    });
  }, [selectedDate, step, token]);

  function handleContinue() {
    if (selectedDate) setStep("slots");
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    const data = await apiPost("/book", { token, date: selectedDate, time: selectedSlot });
    if (data.appointment) {
      setStep("done");
    } else {
      setErrorMessage(data.message || "Booking failed");
      setBooking(false);
    }
  }

  function getNext7Days() {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading booking info...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Clock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">Booking Link Invalid</h2>
          <p className="mt-1 text-sm text-gray-500">{errorMessage || "This link may have expired or already been used."}</p>
          <p className="mt-4 text-xs text-gray-400">Please contact the clinic for a new booking link.</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">Appointment Booked!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your appointment has been confirmed for <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>.
          </p>
          <p className="mt-2 text-xs text-gray-400">You will receive a confirmation via SMS and/or email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white text-lg font-bold">
            O
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">{organization?.name || "Clinic"}</h1>
          <p className="text-sm text-gray-500">Book or reschedule your appointment</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {step === "info" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {patient?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{patient?.name}</h2>
                  <p className="text-sm text-gray-500">
                    {organization?.name} &middot; Select a date to begin
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Pick a date</label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {getNext7Days().slice(0, 7).map((d) => {
                    const dateStr = d.toISOString().split("T")[0];
                    const selected = selectedDate === dateStr;
                    return (
                      <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                        className={`rounded-lg border p-2 text-center text-xs transition-colors ${selected ? "border-primary bg-primary/5 text-primary font-semibold" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        <span className="block text-[10px] text-gray-400">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                        <span className="block text-sm font-medium">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleContinue} disabled={!selectedDate}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                See Available Times
              </button>
            </div>
          )}

          {step === "slots" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("info")} className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </h2>
                  <p className="text-sm text-gray-500">Choose an available time slot</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {loadingSlots ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-sm text-gray-400">
                    No available slots for this date. Try another day.
                  </div>
                ) : (
                  slots.map((slot: any) => {
                    const sel = selectedSlot === slot.time;
                    return (
                      <button key={slot.time} onClick={() => setSelectedSlot(slot.time)}
                        className={`rounded-lg border p-3 text-center transition-colors ${sel ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300"}`}>
                        <Clock className={`mx-auto h-4 w-4 ${sel ? "text-primary" : "text-gray-400"}`} />
                        <span className={`mt-1 block text-sm font-medium ${sel ? "text-primary" : "text-gray-700"}`}>{slot.time}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedSlot && (
                <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedDate} at {selectedSlot}</p>
                    <p className="text-xs text-gray-500">Appointment type: In-person</p>
                  </div>
                  <button onClick={handleBook} disabled={booking}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                    {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Powered by Oriveo &middot; Medical Voice Assistant Platform
        </p>
      </div>
    </div>
  );
}
