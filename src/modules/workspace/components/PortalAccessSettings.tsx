import { useState } from "react";
import { toast } from "react-toastify";
import Switch from "@modules/app/modules/ui/components/Switch/Switch";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { rememberPortalAccess } from "@modules/portal/hooks/usePortalAccess";
import type { TranslationKey } from "@modules/app/i18n/translations";
import { updatePortalAccess, type PortalAccess } from "../services/workspace.service";

interface Props {
  slug: string;
  access: PortalAccess;
  /** Where the portal is reached: the custom domain, or the installation's /portal/<slug> */
  portalUrl: string;
  onChange: (access: PortalAccess) => void;
}

/** "Open" / "Sign-in required": the state in words, never only in colour */
export function PortalStateBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return on ? (
    <span className="text-exs font-body-semibold px-2 py-0.5 rounded-full bg-primary-badge-bg text-primary-badge-text">{onLabel}</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-exs font-body-semibold px-2 py-0.5 rounded-full bg-surface-disabled text-secondary">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
      {offLabel}
    </span>
  );
}

/**
 * What people can do without signing in: the portal (open and follow tickets) and, on its own,
 * reading the published knowledge base. Each switch saves when pressed; only closing the portal
 * asks first, since links already sent stop working.
 */
export default function PortalAccessSettings({ slug, access, portalUrl, onChange }: Props) {
  const { t } = useTranslation();
  const { updateDomainWorkspaceAccess } = useConfig();
  const [saving, setSaving] = useState<keyof PortalAccess | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const save = async (change: Partial<PortalAccess>, key: keyof PortalAccess, message: string) => {
    setSaving(key);
    try {
      const saved = await updatePortalAccess(slug, change);
      // This tab's portal pages and sign-in follow at once, without a reload
      rememberPortalAccess(slug, saved);
      updateDomainWorkspaceAccess(slug, saved);
      onChange(saved);
      toast.success(message);
    } catch {
      toast.error(t("portalAccess.saveError"));
    } finally {
      setSaving(null);
    }
  };

  const togglePortal = (open: boolean) => {
    if (!open) {
      setConfirmClose(true);
      return;
    }
    save({ portalEnabled: true }, "portalEnabled", t("portalAccess.opened"));
  };

  const toggleKb = (isPublic: boolean) =>
    save({ publicKbEnabled: isPublic }, "publicKbEnabled", t(isPublic ? "portalAccess.kbMadePublic" : "portalAccess.kbMadePrivate"));

  const url = (href: string) => <code className="text-exs text-primary bg-primary/5 px-1 py-0.5 rounded break-all">{href}</code>;
  const withUrl = (key: TranslationKey, href: string) => {
    const [before, after] = t(key).split("{url}");
    return <>{before}{url(href)}{after}</>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div id="portal-access-portal" className="flex flex-wrap items-center gap-2 text-sm font-body-medium text-heading">
            {t("portalAccess.portal")}
            <PortalStateBadge on={access.portalEnabled} onLabel={t("portalAccess.portalOpen")} offLabel={t("portalAccess.portalClosed")} />
          </div>
          <p id="portal-access-portal-desc" className="text-xs text-muted mt-1 leading-snug">
            {withUrl(access.portalEnabled ? "portalAccess.portalOpenDesc" : "portalAccess.portalClosedDesc", portalUrl)}
          </p>
        </div>
        <Switch
          checked={access.portalEnabled}
          onChange={togglePortal}
          labelledBy="portal-access-portal"
          describedBy="portal-access-portal-desc"
          busy={saving === "portalEnabled"}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div id="portal-access-kb" className="flex flex-wrap items-center gap-2 text-sm font-body-medium text-heading">
            {t("portalAccess.kb")}
            <PortalStateBadge on={access.publicKbEnabled} onLabel={t("portalAccess.kbPublic")} offLabel={t("portalAccess.kbPrivate")} />
          </div>
          <p id="portal-access-kb-desc" className="text-xs text-muted mt-1 leading-snug">
            {access.publicKbEnabled ? withUrl("portalAccess.kbPublicDesc", `${portalUrl}/kb`) : t("portalAccess.kbPrivateDesc")}
          </p>
        </div>
        <Switch
          checked={access.publicKbEnabled}
          onChange={toggleKb}
          labelledBy="portal-access-kb"
          describedBy="portal-access-kb-desc"
          busy={saving === "publicKbEnabled"}
        />
      </div>

      {!access.portalEnabled && (
        <p className="text-xs text-body bg-surface-hover rounded-lg px-3 py-2">
          {t(access.publicKbEnabled ? "portalAccess.kbOnlyNote" : "portalAccess.nothingPublicNote")}
        </p>
      )}
      <p className="text-xs text-muted">{t("portalAccess.emailUnchanged")}</p>

      {confirmClose && (
        <ConfirmModal
          title={t("portalAccess.confirmTitle")}
          message=""
          confirmLabel={t("portalAccess.confirmButton")}
          cancelLabel={t("common.cancel")}
          danger
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => {
            setConfirmClose(false);
            save({ portalEnabled: false }, "portalEnabled", t("portalAccess.closed"));
          }}
        >
          <ul className="list-disc pl-5 space-y-1.5">
            <li>{t("portalAccess.confirmSignIn")}</li>
            <li>{t("portalAccess.confirmLinks")}</li>
            <li>{t("portalAccess.confirmWidget")}</li>
            <li>{t("portalAccess.confirmEmail")}</li>
          </ul>
          <p className="mt-3">{t("portalAccess.confirmReopen")}</p>
        </ConfirmModal>
      )}
    </div>
  );
}
