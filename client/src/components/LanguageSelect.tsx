import { SUPPORTED_LANGUAGES } from "@/config/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function LanguageSelect({ value, onChange, className = "" }: LanguageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
