import useTranslation from "@modules/app/i18n/useTranslation";
import { channelName, sourceDetails, type SignupMethod, type SignupSourceInfo } from "../domain/signup-origin";

interface Props {
  method: SignupMethod | null;
  source: SignupSourceInfo | null;
  createdAt: string | null;
}

/** Where a user came from and how their account was created, for the system's user list. */
export default function SignupOrigin({ method, source, createdAt }: Props) {
  const { t, tEnum, lang } = useTranslation();

  const channel = source ? channelName(source.channel) ?? t("admin.signup.direct") : null;
  const how = method ? tEnum("signupMethod", method) : null;
  const date = createdAt ? new Date(createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : null;
  const details = source ? sourceDetails(source) : [];

  if (!channel && !how && !date) return <span className="text-sm text-muted">—</span>;

  return (
    <div className="min-w-0" title={details.length ? details.join("\n") : undefined}>
      <span className="text-sm text-heading block truncate">{channel ?? how ?? date}</span>
      <span className="text-exs text-muted block truncate">
        {[channel ? how : null, channel || how ? date : null].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}
