interface EmployeeAvatarProps {
  gender?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: string;
  className?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

function getAvatarConfig(gender?: string | null) {
  const normalized = (gender || "").trim().toLowerCase();

  if (normalized === "male") {
    return {
      label: "Male employee avatar",
      container: "bg-sky-100 border-sky-200 text-sky-600",
      badge: "♂",
    };
  }

  if (normalized === "female") {
    return {
      label: "Female employee avatar",
      container: "bg-pink-100 border-pink-200 text-pink-600",
      badge: "♀",
    };
  }

  return {
    label: "Employee avatar",
    container: "bg-slate-100 border-slate-200 text-slate-500",
    badge: "•",
  };
}

function EmployeeAvatar({ gender, size = "md", rounded = "rounded-xl", className = "" }: EmployeeAvatarProps) {
  const config = getAvatarConfig(gender);

  return (
    <div
      aria-label={config.label}
      className={`${sizeMap[size]} ${rounded} border flex items-center justify-center relative overflow-hidden ${config.container} ${className}`.trim()}
    >
      <svg className="w-[52%] h-[52%]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span className="absolute bottom-1 right-1 text-[10px] font-bold leading-none opacity-80">
        {config.badge}
      </span>
    </div>
  );
}

export default EmployeeAvatar;
