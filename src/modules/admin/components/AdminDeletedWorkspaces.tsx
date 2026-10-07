import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import WorkspaceExportSheet from "@modules/workspace/components/WorkspaceExportSheet";
import {
  DeletedWorkspace,
  listDeletedWorkspaces,
  purgeDeletedWorkspace,
  restoreDeletedWorkspace,
} from "@modules/workspace/services/workspace.service";

interface Props {
  /** Bumped by the page after a deletion, to reload the list. */
  refreshKey: number;
  /** Called after a restore, so the page reloads the live workspaces. */
  onRestored: () => void;
}

/**
 * Every deleted workspace of the installation, waiting to be purged: a system admin can restore
 * it, take a copy, or erase it now instead of on its date.
 */
export default function AdminDeletedWorkspaces({ refreshKey, onRestored }: Props) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [items, setItems] = useState<DeletedWorkspace[]>([]);
  const [purging, setPurging] = useState<DeletedWorkspace | null>(null);
  const [exporting, setExporting] = useState<DeletedWorkspace | null>(null);

  const load = () => {
    listDeletedWorkspaces("all").then(setItems).catch(() => setItems([]));
  };
  useEffect(load, [refreshKey]);

  const restore = async (ws: DeletedWorkspace) => {
    try {
      await restoreDeletedWorkspace(ws.id);
      toast.success(t("workspaceDelete.restored"));
      load();
      onRestored();
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("workspaceDelete.restoreError"));
    }
  };

  const purge = async (ws: DeletedWorkspace) => {
    try {
      await purgeDeletedWorkspace(ws.id);
      toast.success(t("workspaceDelete.purged"));
      load();
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("workspaceDelete.purgeError"));
    } finally {
      setPurging(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      {purging && (
        <ConfirmModal
          title={t("workspaceDelete.purgeTitle")}
          message={t("workspaceDelete.purgeMessage").replace("{name}", purging.name)}
          confirmLabel={t("workspaceDelete.purgeConfirm")}
          danger
          onConfirm={() => purge(purging)}
          onCancel={() => setPurging(null)}
        />
      )}
      {exporting && (
        <WorkspaceExportSheet slug={exporting.slug} deletedId={exporting.id} mode="file" onClose={() => setExporting(null)} />
      )}

      <h3 className="text-base font-body-bold text-heading mb-1">{t("workspaceDelete.adminTitle")}</h3>
      <p className="text-sm text-muted mb-3">{t("workspaceDelete.adminIntro")}</p>
      <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-card bg-surface-hover">
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.slug")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("workspaceDelete.deletedBy")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("workspaceDelete.purgeDate")}</th>
              <th className="px-2 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((ws) => (
              <tr key={ws.id} className="border-b border-border-row">
                <td className="px-4 py-3 text-sm font-body-semibold text-heading">{ws.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{ws.slug}</td>
                <td className="px-4 py-3 text-sm text-muted">{ws.deletedBy ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted">{ws.purgeAt ? formatDate(ws.purgeAt) : "—"}</td>
                <td className="px-2 py-3">
                  <ActionMenu items={[
                    { label: t("workspaceDelete.restore"), onClick: () => restore(ws) },
                    { label: t("workspaceDelete.export"), onClick: () => setExporting(ws) },
                    { label: t("workspaceDelete.purgeNow"), onClick: () => setPurging(ws), danger: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
