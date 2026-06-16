import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  message: string;
}

export default function PlanGate({ message }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <p className="text-sm text-muted text-center">{message}</p>
      <Link
        to="/dashboard/settings/billing"
        className="text-sm text-white bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-lg font-body-semibold transition-colors"
      >
        {t("planLimit.upgradeToUnlock")}
      </Link>
    </div>
  );
}
