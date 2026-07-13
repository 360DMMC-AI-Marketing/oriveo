import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const TOUR_KEY = "oriveo_tour_seen";

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      setShow(true);
    }
    const handler = () => {
      localStorage.removeItem(TOUR_KEY);
      setShow(true);
    };
    window.addEventListener("opencode-show-tour", handler);
    return () => window.removeEventListener("opencode-show-tour", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setShow(false);
  };

  const goToSettings = () => {
    dismiss();
    navigate("/clinic/settings");
  };

  // Don't show on the settings page itself or onboarding guide
  if (!show || location.pathname === "/clinic/settings") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 w-full max-w-lg shadow-2xl">
        <div className="h-2 w-full rounded-t-xl bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome to Oriveo!</h2>
              <p className="text-sm text-gray-500">Your AI-powered medical voice assistant</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            This is your clinic dashboard. From here you can manage patients, launch AI-powered voice calls,
            view analytics and reports, customize medical templates, and much more.
          </p>

          <div className="rounded-lg bg-gray-50 p-3 mb-5 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">Quick start:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use the sidebar to navigate between sections</li>
              <li>Click the voice command button to navigate hands-free</li>
              <li>Customize your clinic settings to get started</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={goToSettings} className="w-full">
              Go to Clinic Settings
            </Button>
            <Button variant="ghost" onClick={dismiss} className="text-sm text-gray-500">
              Skip, I'll explore on my own
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
