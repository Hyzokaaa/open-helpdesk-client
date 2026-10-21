import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import WorkspaceAuditRetentionSettings from "@modules/audit-log/components/WorkspaceAuditRetentionSettings";
import TicketReferenceSettings from "../components/TicketReferenceSettings";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import {
  WorkspaceDetail,
  getWorkspace,
  updateWorkspacePalette,
  listMembers,
  WorkspaceMember,
  ImportResult,
} from "../services/workspace.service";
import { PaletteContext } from "../context/PaletteProvider";
import PalettePicker from "../components/PalettePicker";
import MailboxSettings from "../components/MailboxSettings";
import WorkspaceEmailLanguageSettings from "../components/WorkspaceEmailLanguageSettings";
import EmailSenderSettings from "../components/EmailSenderSettings";
import SlaSettings from "../components/SlaSettings";
import ApiKeySettings from "../components/ApiKeySettings";
import WebhookSettings from "../components/WebhookSettings";
import CustomDomainSettings from "../components/CustomDomainSettings";
import PortalAccessSettings, { PortalStateBadge } from "../components/PortalAccessSettings";
import useConfig from "@modules/app/hooks/useConfig";
import BrandingSettings from "../components/BrandingSettings";
import WorkspaceAnalyticsSettings from "../components/WorkspaceAnalyticsSettings";
import WorkspaceGeneralSettings from "../components/WorkspaceGeneralSettings";
import WorkspaceDataMigrationSettings from "../components/WorkspaceDataMigrationSettings";
import WorkspaceDeleteSettings from "../components/WorkspaceDeleteSettings";
import SettingsMenuLayout from "@modules/settings/components/SettingsMenuLayout";
import { MenuGroup, SectionHint } from "@modules/settings/components/SettingsMenuNav";
import { RelatedLink } from "@modules/settings/components/SettingsMenuSearch";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import useMediaQuery from "@modules/app/hooks/useMediaQuery";
import { useLeaveGuard } from "@modules/app/hooks/useUnsavedChanges";
import { P } from "../domain/permissions";
import { SettingsGroupId, SettingsSectionId, visibleSettingsSections } from "../domain/settings-sections";

interface Props {
  /** Inside the admin panel: the workspace to show, and no URL of its own. */
  workspaceSlugProp?: string;
  onClose?: () => void;
}

const SECTION_TITLES: Record<SettingsSectionId, string> = {
  general: "workspaceSettings.general",
  mailboxes: "mailbox.title",
  "email-sender": "emailSender.title",
  "email-language": "workspaceEmailLanguage.title",
  "ticket-references": "ticketReference.title",
  sla: "workspaceSettings.sla",
  portal: "portalAccess.title",
  branding: "settingsNav.branding",
  "custom-domain": "customDomain.title",
  "api-keys": "apiKeys.title",
  webhooks: "webhooks.title",
  analytics: "workspaceAnalytics.title",
  "audit-retention": "auditRetention.title",
  "data-migration": "workspaceSettings.dataMigration",
  delete: "settingsNav.delete",
};

export default function WorkspaceSettingsPage({ workspaceSlugProp, onClose }: Props = {}) {
  const params = useParams();
  const embedded = !!workspaceSlugProp;
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const navigate = useNavigate();
  const confirmLeave = useLeaveGuard();
  const { user } = useUser();
  const { appUrl } = useConfig();
  const { t } = useTranslation();
  const { can } = usePermissions(workspaceSlug);
  const { setPalette } = useContext(PaletteContext);
  const { handlePlanLimitError, isFeatureLocked } = useExtensions();
  // The admin panel is narrow: there the list and the section take turns, as on a phone
  const wide = useMediaQuery("(min-width: 768px)") && !embedded;

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [customPaletteLocked, setCustomPaletteLocked] = useState(false);
  // Bumped after an import overwrote settings, so the sections holding their own copy remount
  const [importRound, setImportRound] = useState(0);
  const [embeddedSection, setEmbeddedSection] = useState<SettingsSectionId | undefined>();
  useEffect(() => {
    if (!workspaceSlug) return;
    Promise.all([getWorkspace(workspaceSlug), listMembers(workspaceSlug)])
      .then(([ws, m]) => {
        setWorkspace(ws);
        setMembers(m);
      })
      .finally(() => setLoading(false));
    isFeatureLocked("customPalette").then(setCustomPaletteLocked).catch(() => {});
  }, [workspaceSlug]);

  const base = `/dashboard/workspaces/${workspaceSlug}/settings`;
  const requested = embedded ? embeddedSection : params.section;
  const access = {
    isSystemAdmin: user?.isSystemAdmin ?? false,
    isOwner: workspace?.isOwner ?? false,
    canManageSettings: can(P.WORKSPACE_SETTINGS_MANAGE),
    canManageAnalytics: can(P.WORKSPACE_ANALYTICS_MANAGE),
  };
  const sectionTitle = useCallback((id: SettingsSectionId) => t(SECTION_TITLES[id] as any), [t]);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;
  if (!workspace) return null;

  const sections = visibleSettingsSections(access);
  // Older servers do not send these: the portal and the knowledge base were always open then
  const portalAccess = { portalEnabled: workspace.portalEnabled ?? true, publicKbEnabled: workspace.publicKbEnabled ?? true };
  const portalUrl = workspace.customDomain && workspace.customDomainVerified
    ? `https://${workspace.customDomain}/portal`
    : `${appUrl ?? window.location.origin}/portal/${workspace.slug}`;

  const handlePaletteChange = async (palette: string) => {
    try {
      await updateWorkspacePalette(workspace.slug, palette === "green" ? null : palette);
      setPalette(palette);
      setWorkspace({ ...workspace, palette: palette === "green" ? null : palette });
      toast.success(t("workspaceSettings.updated"));
    } catch (err: any) {
      if (handlePlanLimitError(err)) {
        setCustomPaletteLocked(true);
      } else if (!err?.handled) {
        toast.error(t("workspaceSettings.updateError"));
      }
    }
  };

  const handleImported = async (result: ImportResult) => {
    if (!result.settingsApplied?.length) return;
    try {
      const updated = await getWorkspace(workspace.slug);
      setWorkspace(updated);
      if (result.settingsApplied.includes("palette")) setPalette(updated.palette ?? "green");
      setImportRound((round) => round + 1);
    } catch { /* the import succeeded; a reload shows the new settings */ }
  };

  const hint = (id: SettingsSectionId): SectionHint | null => {
    if (id === "portal") {
      return portalAccess.portalEnabled
        ? { label: t("portalAccess.portalOpen"), tone: "on" }
        : { label: t("portalAccess.portalClosed"), tone: "off" };
    }
    if (id === "custom-domain" && workspace.customDomain) {
      return workspace.customDomainVerified
        ? { label: t("settingsNav.domainVerified"), tone: "on" }
        : { label: t("settingsNav.domainPending"), tone: "pending" };
    }
    return null;
  };

  const followLink = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    confirmLeave(() => navigate(path));
  };
  // A link inside a section to another one: the menu would not move the focus there, a plain jump will do
  const openSection = (id: SettingsSectionId) => confirmLeave(() => (embedded ? setEmbeddedSection(id) : navigate(`${base}/${id}`)));
  const membersPath = `/dashboard/workspaces/${workspace.slug}/members`;
  const emailRulesPath = `/dashboard/workspaces/${workspace.slug}/email-rules`;

  // Pages of their own in the sidebar that people look for among the settings: found by the search
  const related: RelatedLink[] = embedded ? [] : [
    ...(can(P.WORKSPACE_SETTINGS_MANAGE) ? [{ label: t("sidebar.emailRules"), path: emailRulesPath }] : []),
    ...(can(P.CUSTOM_FIELD_MANAGE) ? [{ label: t("sidebar.customFields"), path: `/dashboard/workspaces/${workspace.slug}/custom-fields` }] : []),
    ...(can(P.WORKSPACE_MEMBERS_VIEW) ? [{ label: t("sidebar.members"), path: membersPath }] : []),
  ];

  const renderSection = (id: SettingsSectionId): ReactNode => {
    const slug = workspace.slug;
    switch (id) {
      case "general":
        return (
          <WorkspaceGeneralSettings
            key={importRound}
            workspace={workspace}
            members={members}
            canEdit={access.isSystemAdmin}
            onUpdated={setWorkspace}
            membersLink={!embedded && can(P.WORKSPACE_MEMBERS_VIEW)
              ? <Link to={membersPath} onClick={(e) => followLink(e, membersPath)} className="text-primary hover:underline">{t("settingsNav.manageMembers")} →</Link>
              : null}
          />
        );
      case "mailboxes":
        return (
          <div className="space-y-4">
            <MailboxSettings slug={slug} />
            {!embedded && (
              <p className="text-xs text-muted border-t border-border-card pt-3">
                {t("settingsNav.emailRulesHint")}{" "}
                <Link to={emailRulesPath} onClick={(e) => followLink(e, emailRulesPath)} className="text-primary hover:underline">{t("sidebar.emailRules")} →</Link>
              </p>
            )}
          </div>
        );
      case "email-sender":
        return <EmailSenderSettings slug={slug} />;
      case "email-language":
        return <WorkspaceEmailLanguageSettings slug={slug} initial={workspace.defaultLanguage ?? null} />;
      case "ticket-references":
        return <TicketReferenceSettings slug={slug} workspaceName={workspace.name} />;
      case "sla":
        return <SlaSettings key={importRound} slug={slug} />;
      case "portal":
        return (
          <PortalAccessSettings
            slug={slug}
            access={portalAccess}
            portalUrl={portalUrl}
            onChange={(next) => setWorkspace({ ...workspace, ...next })}
          />
        );
      case "branding":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-body-semibold text-heading mb-2">{t("workspaceSettings.palette")}</h3>
              <PalettePicker value={workspace.palette} onChange={handlePaletteChange} customLocked={customPaletteLocked} />
            </div>
            <div className="border-t border-border-card pt-5">
              <h3 className="text-sm font-body-semibold text-heading mb-2">{t("branding.title")}</h3>
              <BrandingSettings
                key={importRound}
                slug={slug}
                appName={workspace.appName}
                appSubtitle={workspace.appSubtitle}
                logo={workspace.logo}
                icon={workspace.icon}
                onUpdate={(appName, appSubtitle, logo, icon) => setWorkspace({ ...workspace, appName, appSubtitle, logo, icon })}
              />
            </div>
          </div>
        );
      case "custom-domain":
        return (
          <CustomDomainSettings
            slug={slug}
            currentDomain={workspace.customDomain}
            verified={workspace.customDomainVerified}
            verificationToken={workspace.domainVerificationToken}
            failingSince={workspace.customDomainFailingSince}
            trusted={workspace.customDomainTrusted}
            cnameTarget={workspace.cnameTarget}
            portalAccess={portalAccess}
            canSkipVerification={access.isSystemAdmin}
            onUpdate={(d, v, token) => setWorkspace({ ...workspace, customDomain: d, customDomainVerified: v, domainVerificationToken: token })}
          />
        );
      case "api-keys":
        return <ApiKeySettings slug={slug} />;
      case "webhooks":
        return <WebhookSettings slug={slug} />;
      case "analytics":
        return <WorkspaceAnalyticsSettings key={importRound} slug={slug} />;
      case "audit-retention":
        return <WorkspaceAuditRetentionSettings slug={slug} />;
      case "data-migration":
        return <WorkspaceDataMigrationSettings slug={slug} onImported={handleImported} />;
      case "delete": {
        const canExport = sections.some((s) => s.id === "data-migration");
        return (
          <WorkspaceDeleteSettings
            slug={slug}
            workspaceName={workspace.name}
            exportHref={canExport && !embedded ? `${base}/data-migration` : undefined}
            onExport={canExport ? () => openSection("data-migration") : undefined}
            onDeleted={() => {
              if (onClose) onClose();
              // A full load, so the workspace leaves every list of the app
              else window.location.assign("/dashboard/settings/account");
            }}
          />
        );
      }
    }
  };

  const groups: MenuGroup[] = (["workspace", "email", "tickets", "portal", "integrations", "data", "danger"] as SettingsGroupId[]).map((id) => ({
    id,
    // General stands on its own at the top: the app sidebar already says this is the workspace
    title: id === "workspace" || id === "danger" ? undefined : t(`settingsNav.group.${id}` as any),
    danger: id === "danger",
  }));

  return (
    <SettingsMenuLayout
      title={t("sidebar.settings")}
      subtitle={workspace.name}
      sections={sections}
      groups={groups}
      sectionTitle={sectionTitle}
      requested={requested}
      basePath={embedded ? undefined : base}
      onChooseInPlace={setEmbeddedSection}
      wide={wide}
      renderSection={renderSection}
      sectionBadge={(id) => id === "portal"
        ? <PortalStateBadge on={portalAccess.portalEnabled} onLabel={t("portalAccess.portalOpen")} offLabel={t("portalAccess.portalClosed")} />
        : null}
      hint={hint}
      related={related}
      noAccess={<p className="text-sm text-muted text-center py-12">{t("workspaceSettings.noPermission")}</p>}
    />
  );
}
