export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "zh", label: "Chinese (Mandarin)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ur", label: "Urdu" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "fi", label: "Finnish" },
  { code: "nb", label: "Norwegian" },
  { code: "cs", label: "Czech" },
  { code: "ro", label: "Romanian" },
  { code: "uk", label: "Ukrainian" },
  { code: "el", label: "Greek" },
  { code: "he", label: "Hebrew" },
];

export function getLanguageLabel(code: string) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code.toUpperCase();
}
