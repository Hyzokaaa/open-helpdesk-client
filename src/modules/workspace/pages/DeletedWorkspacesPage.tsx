import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { DeletedWorkspace, listDeletedWorkspaces, restoreDeletedWorkspace } from "../services/workspace.service";

/**
 * The workspaces the user owns that were deleted and can still be restored, each with the day it
 * will be erased for good.
 */
export default function DeletedWorkspacesPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [items, setItems] = useState<DeletedWorkspace[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = () => {
    listDeletedWorkspaces().then(setItems).catch(() => setItems([]));
  };
  useEffect(load, []);

  const restore = async (ws: DeletedWorkspace) => {
    setRestoring(ws.id);
    try {
      const restored = await restoreDeletedWorkspace(ws.id);
      toast.success(t("workspaceDelete.restored"));
      // A full load, so the workspace is back in every list of the app
      window.location.assign(`/dashboard/workspaces/${restored.slug}`);
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("workspaceDelete.restoreError"));
      setRestoring(null);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-1">{t("workspaceDelete.listTitle")}</h2>
      <p className="text-sm text-muted mb-4">{t("workspaceDelete.listIntro")}</p>
      {items === null ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">{t("workspaceDelete.empty")}</p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg divide-y divide-border-row">
          {items.map((ws) => (
            <div key={ws.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-body-semibold text-heading truncate">{ws.name}</p>
                <p className="text-xs text-muted">
                  {t("workspaceDelete.purgeOn").replace("{date}", ws.purgeAt ? formatDate(ws.purgeAt) : "—")}
                </p>
              </div>
              <Button size="xs" loading={restoring === ws.id} disabled={!!restoring} onClick={() => restore(ws)}>
                {t("workspaceDelete.restore")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
