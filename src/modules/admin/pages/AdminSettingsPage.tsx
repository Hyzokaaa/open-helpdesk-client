import { ReactNode, useCallback } from "react";
import { useParams } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useMediaQuery from "@modules/app/hooks/useMediaQuery";
import SystemEmailPage from "@modules/settings/pages/SystemEmailPage";
import SettingsMenuLayout from "@modules/settings/components/SettingsMenuLayout";
import { MenuGroup } from "@modules/settings/components/SettingsMenuNav";
import PlatformMailboxSettings from "../components/PlatformMailboxSettings";
import WorkspaceCreationSettings from "../components/WorkspaceCreationSettings";
import AuditRetentionSettings from "@modules/audit-log/components/AuditRetentionSettings";
import { SYSTEM_SETTINGS_GROUPS, SYSTEM_SETTINGS_SECTIONS, SystemSettingsSectionId } from "../domain/system-settings-sections";

const BASE = "/dashboard/admin/settings";

const SECTION_TITLES: Record<SystemSettingsSectionId, string> = {
  "workspace-creation": "adminSettings.workspaceCreation",
  "email-sending": "adminSettings.emailSending",
  "email-receiving": "adminSettings.emailReceiving",
  "audit-retention": "auditRetention.title",
};

/** The installation's settings, with the same menu and a page per section as the workspace settings. */
export default function AdminSettingsPage() {
  const { section } = useParams();
  const { t } = useTranslation();
  const wide = useMediaQuery("(min-width: 768px)");
  const sectionTitle = useCallback((id: SystemSettingsSectionId) => t(SECTION_TITLES[id] as any), [t]);

  const groups: MenuGroup[] = SYSTEM_SETTINGS_GROUPS.map((id) => ({ id, title: t(`settingsNav.group.${id}` as any) }));

  const renderSection = (id: SystemSettingsSectionId): ReactNode => {
    switch (id) {
      case "workspace-creation":
        return <WorkspaceCreationSettings />;
      case "email-sending":
        return <SystemEmailPage embedded />;
      case "email-receiving":
        return <PlatformMailboxSettings />;
      case "audit-retention":
        return <AuditRetentionSettings />;
    }
  };

  return (
    <SettingsMenuLayout
      title={t("adminSettings.title")}
      subtitle={t("sidebar.administration")}
      sections={SYSTEM_SETTINGS_SECTIONS}
      groups={groups}
      sectionTitle={sectionTitle}
      requested={section}
      basePath={BASE}
      wide={wide}
      renderSection={renderSection}
      noAccess={null}
    />
  );
}
