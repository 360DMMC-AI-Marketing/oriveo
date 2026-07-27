import { useState, useEffect, useRef, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  action?: ReactNode;
  accentColor?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  icon,
  defaultOpen = true,
  badge,
  action,
  accentColor = "var(--color-primary)",
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard-sections");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (id in parsed) return !parsed[id];
      }
    } catch {}
    return defaultOpen;
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>(isOpen ? "auto" : "0px");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard-sections");
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[id] = !isOpen;
      localStorage.setItem("dashboard-sections", JSON.stringify(parsed));
    } catch {}
  }, [isOpen, id]);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight + "px");
      const timer = setTimeout(() => setHeight("auto"), 200);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight + "px");
      requestAnimationFrame(() => setHeight("0px"));
    }
  }, [isOpen]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => {
          if (isOpen && contentRef.current) {
            setHeight(contentRef.current.scrollHeight + "px");
            requestAnimationFrame(() => setHeight("0px"));
          }
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
        style={{ borderLeft: `3px solid ${accentColor}` }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentColor + "12" }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {badge}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {action && (
            <span onClick={(e) => e.stopPropagation()}>{action}</span>
          )}
          <ChevronRight
            className="h-4 w-4 text-gray-400 transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>
      <div
        style={{
          maxHeight: height,
          transition: "max-height 200ms ease-out",
          overflow: "hidden",
        }}
      >
        <div ref={contentRef} className="border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
