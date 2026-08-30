import CollapsibleSection from "@modules/app/modules/ui/components/CollapsibleSection/CollapsibleSection";
import useTranslation from "@modules/app/i18n/useTranslation";
import SystemEmailPage from "@modules/settings/pages/SystemEmailPage";
import PlatformMailboxSettings from "../components/PlatformMailboxSettings";
import SystemVersionInfo from "../components/SystemVersionInfo";

export default function AdminSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-6">
        {t("adminSettings.title")}
      </h2>

      <div className="space-y-4">
        <CollapsibleSection title={t("adminSettings.version")} defaultOpen>
          <SystemVersionInfo />
        </CollapsibleSection>

        <CollapsibleSection title={t("adminSettings.emailSending")}>
          <SystemEmailPage embedded />
        </CollapsibleSection>

        <CollapsibleSection title={t("adminSettings.emailReceiving")}>
          <PlatformMailboxSettings />
        </CollapsibleSection>
      </div>
    </div>
  );
}
