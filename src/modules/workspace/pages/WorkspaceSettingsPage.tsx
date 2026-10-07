import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import CollapsibleSection from "@modules/app/modules/ui/components/CollapsibleSection/CollapsibleSection";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Textarea from "@modules/app/modules/ui/components/Textarea/Textarea";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import DeleteWorkspaceModal from "../components/DeleteWorkspaceModal";
import WorkspaceAuditRetentionSettings from "@modules/audit-log/components/WorkspaceAuditRetentionSettings";
import TicketReferenceSettings from "../components/TicketReferenceSettings";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import {
  WorkspaceDetail,
  getWorkspace,
  updateWorkspace,
  updateWorkspacePalette,
  deleteWorkspace,
  listMembers,
  WorkspaceMember,
  ImportResult,
  ImportSource,
} from "../services/workspace.service";
import { PaletteContext } from "../context/PaletteProvider";
import PalettePicker from "../components/PalettePicker";
import MailboxSettings from "../components/MailboxSettings";
import EmailSenderSettings from "../components/EmailSenderSettings";
import SlaSettings from "../components/SlaSettings";
import ApiKeySettings from "../components/ApiKeySettings";
import WebhookSettings from "../components/WebhookSettings";
import CustomDomainSettings from "../components/CustomDomainSettings";
import BrandingSettings from "../components/BrandingSettings";
import WorkspaceAnalyticsSettings from "../components/WorkspaceAnalyticsSettings";
import WorkspaceImportSheet from "../components/WorkspaceImportSheet";
import WorkspaceExportSheet, { ExportMode } from "../components/WorkspaceExportSheet";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { P } from "../domain/permissions";

interface Props {
  workspaceSlugProp?: string;
  onClose?: () => void;
}

export default function WorkspaceSettingsPage({ workspaceSlugProp, onClose }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const { can } = usePermissions(workspaceSlug);
  const { setPalette } = useContext(PaletteContext);
  const { handlePlanLimitError, isFeatureLocked } = useExtensions();

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customPaletteLocked, setCustomPaletteLocked] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode | null>(null);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  // Bumped after an import overwrote settings, so the sections holding their own copy remount
  const [importRound, setImportRound] = useState(0);
  const [importUrl, setImportUrl] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    Promise.all([getWorkspace(workspaceSlug), listMembers(workspaceSlug)])
      .then(([ws, m]) => {
        setWorkspace(ws);
        setName(ws.name);
        setDescription(ws.description);
        setMembers(m);
      })
      .finally(() => setLoading(false));
    isFeatureLocked("customPalette").then(setCustomPaletteLocked).catch(() => {});
  }, [workspaceSlug]);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;
  if (!workspace) return null;

  const isSystemAdmin = user?.isSystemAdmin ?? false;
  const canManageSettings = can(P.WORKSPACE_SETTINGS_MANAGE);
  const canManageAnalytics = can(P.WORKSPACE_ANALYTICS_MANAGE);
  const hasChanges = name !== workspace.name || description !== workspace.description;
  const nameValid = name.trim().length > 0;

  const handlePaletteChange = async (palette: string) => {
    if (!workspaceSlug) return;
    try {
      await updateWorkspacePalette(workspaceSlug, palette === "green" ? null : palette);
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

  const handleSave = async () => {
    if (!workspaceSlug || !nameValid) return;
    setSaving(true);
    try {
      await updateWorkspace(workspaceSlug, { name: name.trim(), description: description.trim() });
      toast.success(t("workspaceSettings.updated"));
      const updated = await getWorkspace(workspaceSlug);
      setWorkspace(updated);
    } catch {
      toast.error(t("workspaceSettings.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleImported = async (result: ImportResult) => {
    if (importSource?.kind === "url") setImportUrl("");
    if (!workspaceSlug || !result.settingsApplied?.length) return;
    try {
      const updated = await getWorkspace(workspaceSlug);
      setWorkspace(updated);
      setName(updated.name);
      setDescription(updated.description);
      if (result.settingsApplied.includes("palette")) setPalette(updated.palette ?? "green");
      setImportRound((round) => round + 1);
    } catch { /* the import succeeded; a reload shows the new settings */ }
  };

  const handleDelete = async (typedName: string) => {
    if (!workspaceSlug) return;
    setDeleting(true);
    try {
      await deleteWorkspace(workspaceSlug, typedName);
      toast.success(t("workspaceDelete.deleted"));
      if (onClose) onClose();
      // A full load, so the workspace leaves every list of the app
      else window.location.assign("/dashboard/settings/account");
    } catch (err) {
      const e = err as { handled?: boolean; message?: string };
      if (!e?.handled) toast.error(e?.message || t("workspaceSettings.deleteError"));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const adminCount = members.filter((m) => m.role === "admin").length;
  const agentCount = members.filter((m) => m.role === "agent").length;
  const userCount = members.filter((m) => m.role === "user").length;

  return (
    <div className="w-full max-w-3xl">
      {confirmDelete && (
        <DeleteWorkspaceModal
          workspaceName={workspace.name}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-body-bold text-heading">{workspace.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge label={workspace.slug} color="primary" size="xs" />
          <span className="text-xs text-muted">{members.length} {t("sidebar.members").toLowerCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {isSystemAdmin ? (
            <CollapsibleSection title={t("workspaceSettings.general")} defaultOpen>
              <div className="space-y-3">
                <FormInput label={t("workspaces.name")}>
                  <Input value={name} onChange={setName} size="sm" />
                </FormInput>
                <FormInput label={t("workspaces.description")}>
                  <Textarea value={description} onChange={setDescription} height={80} />
                </FormInput>
              </div>
              {hasChanges && (
                <div className="mt-4 flex justify-end">
                  <Button size="xs" color="primary" onClick={handleSave} disabled={!nameValid} loading={saving}>
                    {t("settings.save")}
                  </Button>
                </div>
              )}
            </CollapsibleSection>
          ) : !canManageSettings && !canManageAnalytics ? (
            <p className="text-sm text-muted text-center py-12">
              {t("workspaceSettings.noPermission")}
            </p>
          ) : null}

          {canManageSettings && (
            <CollapsibleSection title={t("mailbox.title")}>
              <MailboxSettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("emailSender.title")}>
              <EmailSenderSettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("ticketReference.title")}>
              <TicketReferenceSettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("workspaceSettings.sla")}>
              <SlaSettings key={importRound} slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("apiKeys.title")}>
              <ApiKeySettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("auditRetention.title")}>
              <WorkspaceAuditRetentionSettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("webhooks.title")}>
              <WebhookSettings slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("branding.title")}>
              <BrandingSettings
                key={importRound}
                slug={workspaceSlug!}
                appName={workspace.appName}
                appSubtitle={workspace.appSubtitle}
                logo={workspace.logo}
                icon={workspace.icon}
                onUpdate={(appName, appSubtitle, logo, icon) => setWorkspace({ ...workspace, appName, appSubtitle, logo, icon })}
              />
            </CollapsibleSection>
          )}

          {canManageAnalytics && (
            <CollapsibleSection title={t("workspaceAnalytics.title")}>
              <WorkspaceAnalyticsSettings key={importRound} slug={workspaceSlug!} />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("customDomain.title")}>
              <CustomDomainSettings
                slug={workspaceSlug!}
                currentDomain={workspace.customDomain}
                verified={workspace.customDomainVerified}
                verificationToken={workspace.domainVerificationToken}
                cnameTarget={workspace.cnameTarget}
                canSkipVerification={!!user?.isSystemAdmin}
                onUpdate={(d, v, t) => setWorkspace({ ...workspace, customDomain: d, customDomainVerified: v, domainVerificationToken: t })}
              />
            </CollapsibleSection>
          )}

          {canManageSettings && (
            <CollapsibleSection title={t("workspaceSettings.dataMigration")}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted mb-2">{t("workspaceSettings.exportDesc")}</p>
                  <div className="flex gap-2">
                  <Button size="xs" color="light" onClick={() => setExportMode("file")}>
                    {t("workspaceSettings.export")}
                  </Button>
                  <Button size="xs" color="light" onClick={() => setExportMode("url")}>
                    {t("workspaceSettings.exportUrl")}
                  </Button>
                  </div>
                </div>

                {exportMode && (
                  <WorkspaceExportSheet slug={workspaceSlug!} mode={exportMode} onClose={() => setExportMode(null)} />
                )}

                <hr className="border-border-row" />

                <div>
                  <p className="text-xs text-muted mb-2">{t("workspaceSettings.importDesc")}</p>
                  <input ref={importFileRef} type="file" accept=".ohd,.json" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) setImportSource({ kind: "file", file });
                  }} />
                  <div className="flex gap-2">
                    <Button size="xs" color="light" onClick={() => importFileRef.current?.click()}>
                      {t("workspaceSettings.import")}
                    </Button>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Input value={importUrl} onChange={setImportUrl} size="sm" placeholder={t("workspaceSettings.importUrlPlaceholder")} />
                    <Button size="xs" color="light" disabled={!importUrl.trim()} onClick={() => setImportSource({ kind: "url", url: importUrl.trim() })}>
                      {t("workspaceSettings.importUrl")}
                    </Button>
                  </div>
                  {importSource && (
                    <WorkspaceImportSheet
                      slug={workspaceSlug!}
                      source={importSource}
                      onClose={() => setImportSource(null)}
                      onImported={handleImported}
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("sidebar.members")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">{t("workspaceSettings.admins")}</span>
                <span className="text-body font-body-medium">{adminCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("workspaceSettings.agents")}</span>
                <span className="text-body font-body-medium">{agentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("workspaceSettings.users")}</span>
                <span className="text-body font-body-medium">{userCount}</span>
              </div>
            </div>
          </Card>

          {canManageSettings && (
            <Card className="p-4">
              <p className="text-xs text-subtle font-body-medium mb-2">
                {t("workspaceSettings.palette")}
              </p>
              <PalettePicker value={workspace.palette} onChange={handlePaletteChange} customLocked={customPaletteLocked} />
            </Card>
          )}

          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("workspaceSettings.info")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">{t("workspaceSettings.slug")}</span>
                <span className="text-body font-body-medium">{workspace.slug}</span>
              </div>
            </div>
          </Card>

          {(isSystemAdmin || workspace.isOwner) && (
            <CollapsibleSection
              title={t("workspaceSettings.dangerZone")}
              className="border-red-300 dark:border-red-900/50"
            >
              <p className="text-xs text-muted mb-3">
                {t("workspaceSettings.dangerDescription")}
              </p>
              <Button size="xs" color="danger" full onClick={() => setConfirmDelete(true)}>
                {t("workspaceSettings.deleteWorkspace")}
              </Button>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}
