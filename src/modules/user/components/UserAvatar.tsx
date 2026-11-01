import clsx from "clsx";
import { blobs } from "openblobs";
import { Openblob } from "openblobs/react";
import { avatarSource } from "../domain/avatar-source";

interface UserAvatarProps {
  avatarUrl?: string | null;
  /** Seeds the generated avatar shown when there is no photo. */
  userId?: string | null;
  firstName?: string;
  lastName?: string;
  /** Someone of the workspace team: their generated avatar wears the headset. */
  team?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-16 h-16 text-lg",
};

const iconSizes = { xs: 10, sm: 12, md: 16, lg: 28 };

// The same blob with a headset: everything else stays, so the person is still recognisable
const teamBlobs = blobs.with({ top: "headset" });

export default function UserAvatar({ avatarUrl, userId, firstName, lastName, team, size = "md", className }: UserAvatarProps) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const source = avatarSource({ avatarUrl, userId, firstName, lastName });

  if (source.kind === "photo") {
    return (
      <img
        src={source.url}
        alt={name}
        className={clsx("rounded-full object-cover shrink-0", sizeClasses[size], className)}
      />
    );
  }

  if (source.kind === "blob") {
    return <Openblob seed={source.seed} design={team ? teamBlobs : undefined} title={name || undefined} className={clsx("rounded-full shrink-0", sizeClasses[size], className)} />;
  }

  const iconSize = iconSizes[size];

  return (
    <div
      className={clsx(
        "rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {source.initials ? (
        <span className="font-body-bold text-primary">{source.initials}</span>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  );
}
