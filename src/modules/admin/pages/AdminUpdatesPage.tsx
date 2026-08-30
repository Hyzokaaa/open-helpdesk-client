import useTranslation from "@modules/app/i18n/useTranslation";
import SystemVersionInfo from "../components/SystemVersionInfo";

export default function AdminUpdatesPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-6">
        {t("sidebar.adminUpdates")}
      </h2>
      <SystemVersionInfo />
    </div>
  );
}
