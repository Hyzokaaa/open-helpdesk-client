import clsx from "clsx";

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-16 h-16 text-lg",
};

const iconSizes = { sm: 12, md: 16, lg: 28 };

export default function UserAvatar({ avatarUrl, firstName, lastName, size = "md", className }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName ?? ""} ${lastName ?? ""}`.trim()}
        className={clsx("rounded-full object-cover shrink-0", sizeClasses[size], className)}
      />
    );
  }

  const initials = ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
  const iconSize = iconSizes[size];

  return (
    <div
      className={clsx(
        "rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {initials !== "?" ? (
        <span className="font-body-bold text-primary">{initials}</span>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  );
}
