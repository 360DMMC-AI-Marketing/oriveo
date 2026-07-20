type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark";
};

const sizes = { sm: 28, md: 36, lg: 44, xl: 56 };

export default function Logo({ size = "md", showText = true, variant = "dark" }: LogoProps) {
  const px = sizes[size];
  const textColor = variant === "dark" ? "text-gray-900" : "text-white";

  return (
    <div className="flex items-center gap-3">
      <svg width={px} height={px} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a7c6f" />
            <stop offset="100%" stopColor="#065f54" />
          </linearGradient>
          <linearGradient id="logo-accent" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0a7c6f" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="43" height="43" rx="10" fill="url(#logo-bg)" />
        <rect x="0.5" y="0.5" width="43" height="43" rx="10" stroke="url(#logo-accent)" strokeWidth="0.5" />
        <path
          d="M22 9C20.5 9 19 10 19 11.5V19H13C11.5 19 10 20.5 10 22C10 23.5 11.5 25 13 25H19V32.5C19 34 20.5 35 22 35C23.5 35 25 34 25 32.5V25H31C32.5 25 34 23.5 34 22C34 20.5 32.5 19 31 19H25V11.5C25 10 23.5 9 22 9Z"
          fill="white"
        />
        <path d="M14 22L19 22L21 18L23 26L25 20L27 22L30 22" stroke="#0a7c6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && (
        <div>
          <div className={`text-base font-bold tracking-tight ${textColor}`} style={{ fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.2 }}>
            Oriveo
          </div>
          <div className={`text-[10px] font-medium uppercase tracking-[0.15em] ${variant === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            Healthcare Platform
          </div>
        </div>
      )}
    </div>
  );
}
